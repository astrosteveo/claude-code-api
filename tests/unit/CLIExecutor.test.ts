import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CLIExecutor } from '../../src/infrastructure/CLIExecutor.js';
import type { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('CLIExecutor', () => {
  let executor: CLIExecutor;
  let mockSpawn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { spawn } = await import('child_process');
    mockSpawn = spawn as ReturnType<typeof vi.fn>;
    mockSpawn.mockClear();
    executor = new CLIExecutor('/usr/bin/claude');
  });

  describe('execute() - Blocking execution', () => {
    it('should spawn claude process with correct args', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      const args = ['--output-format=json', 'test prompt'];

      // Act
      const promise = executor.execute(args);

      // Simulate successful execution
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'result',
        subtype: 'success',
        result: 'test response',
        session_id: 'test-session',
        total_cost_usd: 0.001,
        duration_ms: 100,
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
      })));
      mockProcess.emit('close', 0);

      await promise;

      // Assert
      expect(mockSpawn).toHaveBeenCalledWith('/usr/bin/claude', args, expect.any(Object));
    });

    it('should parse JSON output and return CLIResult', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      const expectedResult = {
        type: 'result',
        subtype: 'success',
        result: 'test response',
        session_id: 'test-session',
        total_cost_usd: 0.001,
        duration_ms: 100,
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
      };

      // Act
      const promise = executor.execute(['--output-format=json', 'test']);

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(expectedResult)));
      mockProcess.emit('close', 0);

      const result = await promise;

      // Assert
      expect(result).toEqual({
        type: 'result',
        subtype: 'success',
        result: 'test response',
        sessionId: 'test-session',
        totalCostUsd: 0.001,
        durationMs: 100,
        usage: {
          inputTokens: 10,
          outputTokens: 20,
        },
      });
    });

    it('should return CLIResult with structured output', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      const resultWithStructured = {
        type: 'result',
        subtype: 'success',
        result: 'test',
        session_id: 'test',
        total_cost_usd: 0.001,
        duration_ms: 100,
        usage: { input_tokens: 10, output_tokens: 20 },
        structured_output: { foo: 'bar' },
      };

      // Act
      const promise = executor.execute(['--output-format=json', 'test']);

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(resultWithStructured)));
      mockProcess.emit('close', 0);

      const result = await promise;

      // Assert
      expect(result.structuredOutput).toEqual({ foo: 'bar' });
    });

    it('should throw error on non-zero exit code', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      // Act
      const promise = executor.execute(['--output-format=json', 'test']);

      mockProcess.stderr.emit('data', Buffer.from('CLI error'));
      mockProcess.emit('close', 1);

      // Assert
      await expect(promise).rejects.toThrow('CLI process failed with exit code 1');
    });

    it('should throw error on process timeout', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      // Act
      const promise = executor.execute(['--output-format=json', 'test'], { timeout: 100 });

      // Don't emit close event - let it timeout

      // Assert
      await expect(promise).rejects.toThrow('CLI process timed out');
    }, 10000);

    it('should capture stderr output', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      const expectedResult = {
        type: 'result',
        subtype: 'success',
        result: 'test',
        session_id: 'test',
        total_cost_usd: 0.001,
        duration_ms: 100,
        usage: { input_tokens: 10, output_tokens: 20 },
      };

      // Act
      const promise = executor.execute(['--output-format=json', 'test']);

      mockProcess.stderr.emit('data', Buffer.from('Warning: something'));
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(expectedResult)));
      mockProcess.emit('close', 0);

      const result = await promise;

      // Assert - should succeed despite stderr
      expect(result.type).toBe('result');
    });
  });

  describe('executeStream() - Streaming execution', () => {
    it('should yield parsed events from stdout', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      const initEvent = {
        type: 'system',
        subtype: 'init',
        session_id: 'test',
        model: 'claude-sonnet-3-5',
      };

      const resultEvent = {
        type: 'result',
        subtype: 'success',
        result: 'test',
        session_id: 'test',
        total_cost_usd: 0.001,
        duration_ms: 100,
        usage: { input_tokens: 10, output_tokens: 20 },
      };

      // Act
      const stream = executor.executeStream(['--output-format=stream-json', 'test']);
      const events: any[] = [];

      const collectPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      // Simulate streaming events
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(initEvent) + '\n'));
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(resultEvent) + '\n'));
      mockProcess.emit('close', 0);

      await collectPromise;

      // Assert
      expect(events).toHaveLength(2);
      expect(events[0]).toEqual(initEvent);
      expect(events[1]).toEqual(resultEvent);
    });

    it('should handle process errors in stream', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      // Act
      const stream = executor.executeStream(['--output-format=stream-json', 'test']);

      const collectPromise = (async () => {
        const events: any[] = [];
        try {
          for await (const event of stream) {
            events.push(event);
          }
        } catch (error) {
          return error;
        }
      })();

      mockProcess.emit('error', new Error('Process failed'));
      mockProcess.emit('close', 1); // Emit close to end the loop

      const error = await collectPromise;

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Process failed');
    });

    it('should handle non-zero exit code in stream', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      // Act
      const stream = executor.executeStream(['--output-format=stream-json', 'test']);

      const collectPromise = (async () => {
        const events: any[] = [];
        try {
          for await (const event of stream) {
            events.push(event);
          }
        } catch (error) {
          return error;
        }
      })();

      mockProcess.stderr.emit('data', Buffer.from('Error occurred'));
      mockProcess.emit('close', 1);

      const error = await collectPromise;

      // Assert
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('checkHealth()', () => {
    it('should return available=true if CLI exists', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      // Act
      const promise = executor.checkHealth();

      mockProcess.stdout.emit('data', Buffer.from('claude version 1.0.0\n'));
      mockProcess.emit('close', 0);

      const result = await promise;

      // Assert
      expect(result.available).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith('/usr/bin/claude', ['--version'], expect.any(Object));
    });

    it('should return available=false if CLI is missing', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      // Act
      const promise = executor.checkHealth();

      mockProcess.emit('error', new Error('ENOENT'));

      const result = await promise;

      // Assert
      expect(result.available).toBe(false);
    });

    it('should return version string from --version', async () => {
      // Arrange
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      // Act
      const promise = executor.checkHealth();

      mockProcess.stdout.emit('data', Buffer.from('claude version 1.2.3\n'));
      mockProcess.emit('close', 0);

      const result = await promise;

      // Assert
      expect(result.version).toBe('claude version 1.2.3');
    });
  });
});

/**
 * Helper to create a mock ChildProcess
 */
function createMockProcess(): ChildProcess {
  const mockProcess = new EventEmitter() as ChildProcess;
  mockProcess.stdout = new EventEmitter() as any;
  mockProcess.stderr = new EventEmitter() as any;
  mockProcess.stdin = {
    write: vi.fn(),
    end: vi.fn(),
  } as any;
  mockProcess.kill = vi.fn();
  return mockProcess;
}
