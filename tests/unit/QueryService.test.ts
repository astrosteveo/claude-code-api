import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryService } from '../../src/services/QueryService.js';
import { CLIExecutor } from '../../src/infrastructure/CLIExecutor.js';
import type { QueryRequest } from '../../src/types/api.js';
import type { CLIResult, CLIStreamEvent } from '../../src/types/cli.js';

// Mock CLIExecutor
vi.mock('../../src/infrastructure/CLIExecutor.js', () => ({
  CLIExecutor: vi.fn(),
}));

describe('QueryService', () => {
  let service: QueryService;
  let mockExecutor: {
    execute: ReturnType<typeof vi.fn>;
    executeStream: ReturnType<typeof vi.fn>;
    checkHealth: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock executor
    mockExecutor = {
      execute: vi.fn(),
      executeStream: vi.fn(),
      checkHealth: vi.fn(),
    };

    // Mock the CLIExecutor constructor to return our mock
    (CLIExecutor as any).mockImplementation(() => mockExecutor);

    // Create service
    service = new QueryService('/usr/bin/claude');
  });

  describe('execute() - Blocking execution', () => {
    it('should build CLI args from request', async () => {
      // Arrange
      const request: QueryRequest = {
        prompt: 'test prompt',
        model: 'claude-sonnet-3-5',
        tools: ['Read', 'Write'],
        maxBudgetUsd: 1.0,
      };

      const mockResult: CLIResult = {
        type: 'result',
        subtype: 'success',
        result: 'response',
        sessionId: 'test-session',
        totalCostUsd: 0.01,
        durationMs: 100,
        usage: {
          inputTokens: 10,
          outputTokens: 20,
        },
      };

      mockExecutor.execute.mockResolvedValue(mockResult);

      // Act
      await service.execute(request);

      // Assert
      expect(mockExecutor.execute).toHaveBeenCalledWith(
        expect.arrayContaining([
          '-p',
          '--output-format',
          'json',
          '--model',
          'claude-sonnet-3-5',
          '--tools',
          'Read',
          'Write',
          '--max-budget-usd',
          '1',
          'test prompt',
        ])
      );
    });

    it('should call CLIExecutor.execute()', async () => {
      // Arrange
      const request: QueryRequest = {
        prompt: 'test',
      };

      const mockResult: CLIResult = {
        type: 'result',
        subtype: 'success',
        result: 'response',
        sessionId: 'test-session',
        totalCostUsd: 0.01,
        durationMs: 100,
        usage: {
          inputTokens: 10,
          outputTokens: 20,
        },
      };

      mockExecutor.execute.mockResolvedValue(mockResult);

      // Act
      await service.execute(request);

      // Assert
      expect(mockExecutor.execute).toHaveBeenCalled();
    });

    it('should return CLIResult', async () => {
      // Arrange
      const request: QueryRequest = {
        prompt: 'test',
      };

      const mockResult: CLIResult = {
        type: 'result',
        subtype: 'success',
        result: 'test response',
        sessionId: 'test-session',
        totalCostUsd: 0.05,
        durationMs: 500,
        usage: {
          inputTokens: 50,
          outputTokens: 100,
        },
      };

      mockExecutor.execute.mockResolvedValue(mockResult);

      // Act
      const result = await service.execute(request);

      // Assert
      expect(result).toEqual(mockResult);
    });

    it('should throw error if CLI fails', async () => {
      // Arrange
      const request: QueryRequest = {
        prompt: 'test',
      };

      mockExecutor.execute.mockRejectedValue(new Error('CLI execution failed'));

      // Act & Assert
      await expect(service.execute(request)).rejects.toThrow('CLI execution failed');
    });
  });

  describe('executeStream() - Streaming execution', () => {
    it('should yield events from CLIExecutor.executeStream()', async () => {
      // Arrange
      const request: QueryRequest = {
        prompt: 'test',
      };

      const mockEvents: CLIStreamEvent[] = [
        {
          type: 'system',
          subtype: 'init',
          session_id: 'test',
          model: 'claude-sonnet-3-5',
          cwd: '/test',
          tools: [],
          mcp_servers: [],
          permissionMode: 'allow',
          slash_commands: [],
          apiKeySource: 'env',
          claude_code_version: '1.0.0',
          output_style: 'stream',
          agents: [],
          skills: [],
          plugins: [],
          uuid: 'test-uuid',
        },
        {
          type: 'result',
          subtype: 'success',
          is_error: false,
          duration_ms: 100,
          duration_api_ms: 90,
          num_turns: 1,
          result: 'response',
          session_id: 'test',
          total_cost_usd: 0.01,
          usage: {
            input_tokens: 10,
            output_tokens: 20,
          },
          uuid: 'test-uuid',
        },
      ];

      // Mock async generator
      async function* mockGenerator() {
        for (const event of mockEvents) {
          yield event;
        }
      }

      mockExecutor.executeStream.mockReturnValue(mockGenerator());

      // Act
      const stream = service.executeStream(request);
      const events: CLIStreamEvent[] = [];

      for await (const event of stream) {
        events.push(event);
      }

      // Assert
      expect(events).toEqual(mockEvents);
      expect(mockExecutor.executeStream).toHaveBeenCalled();
    });

    it('should handle CLI errors', async () => {
      // Arrange
      const request: QueryRequest = {
        prompt: 'test',
      };

      // Mock async generator that throws
      async function* mockGenerator() {
        yield {
          type: 'system',
          subtype: 'init',
          session_id: 'test',
          model: 'claude-sonnet-3-5',
        } as CLIStreamEvent;
        throw new Error('Stream failed');
      }

      mockExecutor.executeStream.mockReturnValue(mockGenerator());

      // Act & Assert
      const stream = service.executeStream(request);

      await expect(async () => {
        for await (const event of stream) {
          // Consume stream
        }
      }).rejects.toThrow('Stream failed');
    });

    it('should build CLI args with stream-json format', async () => {
      // Arrange
      const request: QueryRequest = {
        prompt: 'test',
        model: 'claude-sonnet-3-5',
      };

      async function* mockGenerator() {
        yield {
          type: 'result',
          subtype: 'success',
        } as CLIStreamEvent;
      }

      mockExecutor.executeStream.mockReturnValue(mockGenerator());

      // Act
      const stream = service.executeStream(request);

      // Consume stream
      for await (const event of stream) {
        // Just consume
      }

      // Assert
      expect(mockExecutor.executeStream).toHaveBeenCalledWith(
        expect.arrayContaining([
          '-p',
          '--output-format',
          'stream-json',
          '--model',
          'claude-sonnet-3-5',
          'test',
        ])
      );
    });
  });
});
