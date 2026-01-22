import { spawn } from 'child_process';
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
      const cliProcess = spawn(this.cliPath, args, {
        cwd: options.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Close stdin immediately - we pass prompt via args, not stdin
      cliProcess.stdin.end();

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | undefined;

      // Set timeout if specified
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          cliProcess.kill();
          reject(new Error('CLI process timed out'));
        }, options.timeout);
      }

      // Collect stdout
      cliProcess.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      // Collect stderr
      cliProcess.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      // Handle process completion
      cliProcess.on('close', (code) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        try {
          // Parse the JSON result from stdout regardless of exit code
          // Claude Code CLI outputs valid JSON even when authentication fails
          const events = JSON.parse(stdout.trim());
          const parsed = Array.isArray(events)
            ? (events.find((e: { type: string }) => e.type === 'result') as CLIResultEvent)
            : (events as CLIResultEvent);

          if (!parsed || parsed.type !== 'result') {
            if (code !== 0) {
              reject(new Error(`CLI process failed with exit code ${code}: ${stderr}`));
            } else {
              reject(new Error('No result event found in CLI output'));
            }
            return;
          }

          const result: CLIResult = {
            type: 'result',
            subtype: parsed.subtype,
            result: parsed.result,
            sessionId: parsed.session_id,
            totalCostUsd: parsed.total_cost_usd,
            durationMs: parsed.duration_ms,
            usage: parsed.usage
              ? {
                  inputTokens: parsed.usage.input_tokens,
                  outputTokens: parsed.usage.output_tokens,
                  cacheCreationInputTokens: parsed.usage.cache_creation_input_tokens,
                  cacheReadInputTokens: parsed.usage.cache_read_input_tokens,
                }
              : { inputTokens: 0, outputTokens: 0 },
            structuredOutput: parsed.structured_output,
          };

          resolve(result);
        } catch (error) {
          if (code !== 0) {
            reject(new Error(`CLI process failed with exit code ${code}: ${stderr || error}`));
          } else {
            reject(new Error(`Failed to parse CLI output: ${error}`));
          }
        }
      });

      cliProcess.on('error', (error) => {
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
    const cliProcess = spawn(this.cliPath, args, {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Close stdin immediately - we pass prompt via args, not stdin
    cliProcess.stdin.end();

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

    cliProcess.stdout.on('data', stdoutHandler);
    cliProcess.stderr.on('data', stderrHandler);
    cliProcess.on('error', errorHandler);
    cliProcess.on('close', closeHandler);

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
              streamQueue.push(event);
            }
          }

          // Yield all remaining queued events before finishing
          while (streamQueue.length > 0) {
            const event = streamQueue.shift()!;
            yield event;
          }

          // Check for errors
          if (errors.length > 0) {
            throw errors[0];
          }

          // Note: Don't reject on non-zero exit code for streaming
          // The Claude Code CLI returns valid event streams even with exit code 1 (e.g., auth errors)
          // All events have already been yielded, including any error information in the result event

          break;
        }

        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } finally {
      // Clean up listeners
      cliProcess.stdout.off('data', stdoutHandler);
      cliProcess.stderr.off('data', stderrHandler);
      cliProcess.off('error', errorHandler);
      cliProcess.off('close', closeHandler);

      // Kill process if still running
      if (!processEnded) {
        cliProcess.kill();
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
