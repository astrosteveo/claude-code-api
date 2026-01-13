import { spawn, type ChildProcess } from 'child_process';
import { parseStreamLine } from '../utils/streamParser.js';
import type { CLIResult, CLIStreamEvent, CLIResultEvent } from '../types/cli.js';

/**
 * Options for CLI execution
 */
export interface CLIExecuteOptions {
  timeout?: number;
  cwd?: string;
}

/**
 * Health check result
 */
export interface CLIHealthResult {
  available: boolean;
  version?: string;
  error?: string;
}

/**
 * CLIExecutor spawns and manages claude CLI processes
 */
export class CLIExecutor {
  constructor(private cliPath: string = 'claude') {}

  /**
   * Execute CLI command and return result (blocking)
   */
  async execute(args: string[], options: CLIExecuteOptions = {}): Promise<CLIResult> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.cliPath, args, {
        cwd: options.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | undefined;

      // Set timeout if specified
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          process.kill();
          reject(new Error('CLI process timed out'));
        }, options.timeout);
      }

      // Collect stdout
      process.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      // Collect stderr
      process.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      // Handle process completion
      process.on('close', (code) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (code !== 0) {
          reject(new Error(`CLI process failed with exit code ${code}: ${stderr}`));
          return;
        }

        try {
          // Parse the JSON result from stdout
          const parsed = JSON.parse(stdout.trim()) as CLIResultEvent;

          const result: CLIResult = {
            type: 'result',
            subtype: parsed.subtype,
            result: parsed.result,
            sessionId: parsed.session_id,
            totalCostUsd: parsed.total_cost_usd,
            durationMs: parsed.duration_ms,
            usage: {
              inputTokens: parsed.usage.input_tokens,
              outputTokens: parsed.usage.output_tokens,
              cacheCreationInputTokens: parsed.usage.cache_creation_input_tokens,
              cacheReadInputTokens: parsed.usage.cache_read_input_tokens,
            },
            structuredOutput: parsed.structured_output,
          };

          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse CLI output: ${error}`));
        }
      });

      process.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        reject(error);
      });
    });
  }

  /**
   * Execute CLI command and yield streaming events
   */
  async *executeStream(args: string[], options: CLIExecuteOptions = {}): AsyncGenerator<CLIStreamEvent> {
    const process = spawn(this.cliPath, args, {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let buffer = '';
    let stderr = '';
    const errors: Error[] = [];

    // Handle stdout - yield parsed events
    const stdoutHandler = (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          const event = parseStreamLine(line);
          if (event) {
            streamQueue.push(event);
          }
        }
      }
    };

    // Handle stderr
    const stderrHandler = (chunk: Buffer) => {
      stderr += chunk.toString();
    };

    // Handle process error
    const errorHandler = (error: Error) => {
      errors.push(error);
    };

    // Handle process close
    let closeCode: number | null = null;
    const closeHandler = (code: number) => {
      closeCode = code;
    };

    // Queue for streaming events
    const streamQueue: CLIStreamEvent[] = [];
    let processEnded = false;

    process.stdout.on('data', stdoutHandler);
    process.stderr.on('data', stderrHandler);
    process.on('error', errorHandler);
    process.on('close', closeHandler);

    try {
      // Yield events as they arrive
      while (!processEnded) {
        // Yield all queued events
        while (streamQueue.length > 0) {
          const event = streamQueue.shift()!;
          yield event;
        }

        // Check if process has ended
        if (closeCode !== null) {
          processEnded = true;

          // Process any remaining buffer
          if (buffer.trim()) {
            const event = parseStreamLine(buffer);
            if (event) {
              yield event;
            }
          }

          // Check for errors
          if (errors.length > 0) {
            throw errors[0];
          }

          if (closeCode !== 0) {
            throw new Error(`CLI process failed with exit code ${closeCode}: ${stderr}`);
          }

          break;
        }

        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } finally {
      // Clean up listeners
      process.stdout.off('data', stdoutHandler);
      process.stderr.off('data', stderrHandler);
      process.off('error', errorHandler);
      process.off('close', closeHandler);

      // Kill process if still running
      if (!processEnded) {
        process.kill();
      }
    }
  }

  /**
   * Check if CLI is available and get version
   */
  async checkHealth(): Promise<CLIHealthResult> {
    return new Promise((resolve) => {
      const process = spawn(this.cliPath, ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';

      process.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({
            available: true,
            version: stdout.trim(),
          });
        } else {
          resolve({
            available: false,
            error: 'CLI returned non-zero exit code',
          });
        }
      });

      process.on('error', (error) => {
        resolve({
          available: false,
          error: error.message,
        });
      });
    });
  }
}
