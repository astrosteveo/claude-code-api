import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionService } from '../../src/services/SessionService.js';
import { SessionStore } from '../../src/infrastructure/SessionStore.js';
import { CLIExecutor } from '../../src/infrastructure/CLIExecutor.js';
import { RequestQueue } from '../../src/infrastructure/RequestQueue.js';
import type { Session } from '../../src/types/session.js';
import type { QueryRequest } from '../../src/types/api.js';
import type { CLIResult, CLIStreamEvent } from '../../src/types/cli.js';

// Mock dependencies
vi.mock('../../src/infrastructure/SessionStore.js');
vi.mock('../../src/infrastructure/CLIExecutor.js');
vi.mock('../../src/infrastructure/RequestQueue.js');

describe('SessionService', () => {
  let service: SessionService;
  let mockStore: {
    initialize: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    createWithDefaults: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    exists: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };
  let mockExecutor: {
    execute: ReturnType<typeof vi.fn>;
    executeStream: ReturnType<typeof vi.fn>;
    checkHealth: ReturnType<typeof vi.fn>;
  };
  let mockQueue: {
    enqueue: ReturnType<typeof vi.fn>;
    getQueueLength: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mocks
    mockStore = {
      initialize: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined),
      createWithDefaults: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockExecutor = {
      execute: vi.fn(),
      executeStream: vi.fn(),
      checkHealth: vi.fn(),
    };

    mockQueue = {
      enqueue: vi.fn(),
      getQueueLength: vi.fn(),
      clear: vi.fn(),
    };

    // Mock constructors
    (SessionStore as any).mockImplementation(() => mockStore);
    (CLIExecutor as any).mockImplementation(() => mockExecutor);
    (RequestQueue as any).mockImplementation(() => mockQueue);

    // Create service
    service = new SessionService('/tmp/test.db', '/usr/bin/claude');
  });

  describe('Session CRUD Operations', () => {
    describe('createSession()', () => {
      it('should generate UUID if no ID provided', async () => {
        // Arrange
        const mockSession: Session = {
          id: 'generated-uuid',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 0,
          totalCostUsd: 0,
        };

        mockStore.createWithDefaults.mockResolvedValue(mockSession);

        // Act
        const result = await service.createSession();

        // Assert
        expect(mockStore.createWithDefaults).toHaveBeenCalledWith({});
        expect(result.id).toBe('generated-uuid');
      });

      it('should save session to SessionStore', async () => {
        // Arrange
        const mockSession: Session = {
          id: 'test-id',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 0,
          totalCostUsd: 0,
        };

        mockStore.createWithDefaults.mockResolvedValue(mockSession);

        // Act
        await service.createSession();

        // Assert
        expect(mockStore.createWithDefaults).toHaveBeenCalled();
      });

      it('should return Session object', async () => {
        // Arrange
        const mockSession: Session = {
          id: 'test-id',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 0,
          totalCostUsd: 0,
        };

        mockStore.createWithDefaults.mockResolvedValue(mockSession);

        // Act
        const result = await service.createSession();

        // Assert
        expect(result).toEqual(mockSession);
      });

      it('should accept custom session ID', async () => {
        // Arrange
        const customId = 'custom-session-id';
        const mockSession: Session = {
          id: customId,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 0,
          totalCostUsd: 0,
        };

        mockStore.createWithDefaults.mockResolvedValue(mockSession);

        // Act
        const result = await service.createSession({ id: customId });

        // Assert
        expect(mockStore.createWithDefaults).toHaveBeenCalledWith({ id: customId });
        expect(result.id).toBe(customId);
      });
    });

    describe('getSession()', () => {
      it('should retrieve session from SessionStore', async () => {
        // Arrange
        const mockSession: Session = {
          id: 'test-id',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 5,
          totalCostUsd: 0.05,
        };

        mockStore.findById.mockResolvedValue(mockSession);

        // Act
        const result = await service.getSession('test-id');

        // Assert
        expect(mockStore.findById).toHaveBeenCalledWith('test-id');
        expect(result).toEqual(mockSession);
      });

      it('should return null for non-existent session', async () => {
        // Arrange
        mockStore.findById.mockResolvedValue(null);

        // Act
        const result = await service.getSession('non-existent');

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('listSessions()', () => {
      it('should retrieve all sessions from SessionStore', async () => {
        // Arrange
        const mockSessions: Session[] = [
          {
            id: 'session-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            messageCount: 2,
            totalCostUsd: 0.02,
          },
          {
            id: 'session-2',
            createdAt: '2024-01-02T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
            messageCount: 3,
            totalCostUsd: 0.03,
          },
        ];

        mockStore.findAll.mockResolvedValue(mockSessions);

        // Act
        const result = await service.listSessions();

        // Assert
        expect(mockStore.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockSessions);
      });
    });

    describe('deleteSession()', () => {
      it('should remove session from SessionStore', async () => {
        // Arrange
        mockStore.exists.mockResolvedValue(true);

        // Act
        await service.deleteSession('test-id');

        // Assert
        expect(mockStore.delete).toHaveBeenCalledWith('test-id');
      });

      it('should clear queue for session', async () => {
        // Arrange
        mockStore.exists.mockResolvedValue(true);

        // Act
        await service.deleteSession('test-id');

        // Assert
        expect(mockQueue.clear).toHaveBeenCalledWith('test-id');
      });

      it('should throw error if session does not exist', async () => {
        // Arrange
        mockStore.exists.mockResolvedValue(false);

        // Act & Assert
        await expect(service.deleteSession('non-existent')).rejects.toThrow('Session not found');
      });
    });

    describe('forkSession()', () => {
      it('should create new session from existing one', async () => {
        // Arrange
        const sourceSession: Session = {
          id: 'source-id',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 5,
          totalCostUsd: 0.05,
          metadata: { tag: 'original' },
        };

        const newSession: Session = {
          id: 'fork-id',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          messageCount: 0,
          totalCostUsd: 0,
          metadata: { forkedFrom: 'source-id', tag: 'original' },
        };

        mockStore.findById.mockResolvedValue(sourceSession);
        mockStore.createWithDefaults.mockResolvedValue(newSession);

        // Act
        const result = await service.forkSession('source-id');

        // Assert
        expect(mockStore.findById).toHaveBeenCalledWith('source-id');
        expect(result.metadata?.forkedFrom).toBe('source-id');
      });

      it('should throw error if source session does not exist', async () => {
        // Arrange
        mockStore.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(service.forkSession('non-existent')).rejects.toThrow(
          'Source session not found'
        );
      });
    });
  });

  describe('Message Operations', () => {
    describe('sendMessage()', () => {
      it('should enqueue request for session', async () => {
        // Arrange
        const request: QueryRequest = {
          prompt: 'test',
        };

        mockStore.findById.mockResolvedValue({ id: 'test-session', messageCount: 0 });

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

        mockQueue.enqueue.mockImplementation((sessionId, task) => task());
        mockExecutor.execute.mockResolvedValue(mockResult);

        // Act
        await service.sendMessage('test-session', request);

        // Assert
        expect(mockQueue.enqueue).toHaveBeenCalledWith('test-session', expect.any(Function));
      });

      it('should throw error if session does not exist', async () => {
        // Arrange
        mockStore.exists.mockResolvedValue(false);

        // Act & Assert
        await expect(service.sendMessage('non-existent', { prompt: 'test' })).rejects.toThrow(
          'Session not found'
        );
      });

      it('should execute CLI with session-id', async () => {
        // Arrange
        const request: QueryRequest = {
          prompt: 'test',
        };

        mockStore.findById.mockResolvedValue({ id: 'test-session', messageCount: 0 });

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

        mockQueue.enqueue.mockImplementation((sessionId, task) => task());
        mockExecutor.execute.mockResolvedValue(mockResult);

        // Act
        await service.sendMessage('test-session', request);

        // Assert
        expect(mockExecutor.execute).toHaveBeenCalledWith(
          expect.arrayContaining(['--session-id', 'test-session'])
        );
      });

      it('should update session metadata after execution', async () => {
        // Arrange
        const request: QueryRequest = {
          prompt: 'test',
        };

        mockStore.exists.mockResolvedValue(true);

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

        mockQueue.enqueue.mockImplementation((sessionId, task) => task());
        mockExecutor.execute.mockResolvedValue(mockResult);
        mockStore.findById.mockResolvedValue({
          id: 'test-session',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 0,
          totalCostUsd: 0,
        });

        // Act
        await service.sendMessage('test-session', request);

        // Assert
        expect(mockStore.update).toHaveBeenCalled();
      });

      it('should increment message_count', async () => {
        // Arrange
        const request: QueryRequest = {
          prompt: 'test',
        };

        mockStore.exists.mockResolvedValue(true);

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

        mockQueue.enqueue.mockImplementation((sessionId, task) => task());
        mockExecutor.execute.mockResolvedValue(mockResult);
        mockStore.findById.mockResolvedValue({
          id: 'test-session',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 5,
          totalCostUsd: 0.05,
        });

        // Act
        await service.sendMessage('test-session', request);

        // Assert
        expect(mockStore.update).toHaveBeenCalledWith(
          'test-session',
          expect.objectContaining({
            messageCount: 6,
          })
        );
      });

      it('should accumulate total_cost_usd', async () => {
        // Arrange
        const request: QueryRequest = {
          prompt: 'test',
        };

        mockStore.exists.mockResolvedValue(true);

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

        mockQueue.enqueue.mockImplementation((sessionId, task) => task());
        mockExecutor.execute.mockResolvedValue(mockResult);
        mockStore.findById.mockResolvedValue({
          id: 'test-session',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 5,
          totalCostUsd: 0.05,
        });

        // Act
        await service.sendMessage('test-session', request);

        // Assert
        expect(mockStore.update).toHaveBeenCalledWith(
          'test-session',
          expect.objectContaining({
            totalCostUsd: 0.06,
          })
        );
      });
    });

    describe('streamMessage()', () => {
      it('should enqueue streaming request', async () => {
        // Arrange
        const request: QueryRequest = {
          prompt: 'test',
        };

        mockStore.exists.mockResolvedValue(true);

        async function* mockGenerator() {
          yield {
            type: 'result',
            subtype: 'success',
            is_error: false,
            duration_ms: 100,
            duration_api_ms: 90,
            num_turns: 1,
            result: 'response',
            session_id: 'test-session',
            total_cost_usd: 0.01,
            usage: {
              input_tokens: 10,
              output_tokens: 20,
            },
            uuid: 'test-uuid',
          } as CLIStreamEvent;
        }

        mockQueue.enqueue.mockImplementation((sessionId, task) => task());
        mockExecutor.executeStream.mockReturnValue(mockGenerator());
        mockStore.findById.mockResolvedValue({
          id: 'test-session',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 0,
          totalCostUsd: 0,
        });

        // Act
        const stream = service.streamMessage('test-session', request);

        // Consume stream
        for await (const event of stream) {
          // Just consume
        }

        // Assert
        expect(mockQueue.enqueue).toHaveBeenCalledWith('test-session', expect.any(Function));
      });

      it('should yield events from stream', async () => {
        // Arrange
        const request: QueryRequest = {
          prompt: 'test',
        };

        mockStore.exists.mockResolvedValue(true);

        const mockEvents: CLIStreamEvent[] = [
          {
            type: 'system',
            subtype: 'init',
            session_id: 'test-session',
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
            session_id: 'test-session',
            total_cost_usd: 0.01,
            usage: {
              input_tokens: 10,
              output_tokens: 20,
            },
            uuid: 'test-uuid',
          },
        ];

        async function* mockGenerator() {
          for (const event of mockEvents) {
            yield event;
          }
        }

        mockQueue.enqueue.mockImplementation((sessionId, task) => task());
        mockExecutor.executeStream.mockReturnValue(mockGenerator());
        mockStore.findById.mockResolvedValue({
          id: 'test-session',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 0,
          totalCostUsd: 0,
        });

        // Act
        const stream = service.streamMessage('test-session', request);
        const events: CLIStreamEvent[] = [];

        for await (const event of stream) {
          events.push(event);
        }

        // Assert
        expect(events).toEqual(mockEvents);
      });

      it('should update session metadata after streaming completes', async () => {
        // Arrange
        const request: QueryRequest = {
          prompt: 'test',
        };

        mockStore.exists.mockResolvedValue(true);

        async function* mockGenerator() {
          yield {
            type: 'result',
            subtype: 'success',
            is_error: false,
            duration_ms: 100,
            duration_api_ms: 90,
            num_turns: 1,
            result: 'response',
            session_id: 'test-session',
            total_cost_usd: 0.01,
            usage: {
              input_tokens: 10,
              output_tokens: 20,
            },
            uuid: 'test-uuid',
          } as CLIStreamEvent;
        }

        mockQueue.enqueue.mockImplementation((sessionId, task) => task());
        mockExecutor.executeStream.mockReturnValue(mockGenerator());
        mockStore.findById.mockResolvedValue({
          id: 'test-session',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messageCount: 0,
          totalCostUsd: 0,
        });

        // Act
        const stream = service.streamMessage('test-session', request);

        // Consume stream
        for await (const event of stream) {
          // Just consume
        }

        // Assert
        expect(mockStore.update).toHaveBeenCalled();
      });
    });
  });
});
