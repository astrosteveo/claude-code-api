import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app.js';
import type { CLIResult, CLIStreamEvent } from '../../src/types/cli.js';

// Mock CLIExecutor to avoid real CLI calls
vi.mock('../../src/infrastructure/CLIExecutor.js', () => {
  return {
    CLIExecutor: vi.fn().mockImplementation(() => {
      return {
        execute: vi.fn().mockResolvedValue({
          output: 'Mocked session message response',
          totalCostUsd: 0.002,
          inputTokens: 15,
          outputTokens: 30,
        } as CLIResult),
        executeStream: vi.fn().mockImplementation(async function* () {
          yield { type: 'text', text: 'Hello' } as CLIStreamEvent;
          yield { type: 'text', text: ' from' } as CLIStreamEvent;
          yield { type: 'text', text: ' session' } as CLIStreamEvent;
          yield {
            type: 'result',
            output: 'Hello from session',
            total_cost_usd: 0.003,
            input_tokens: 20,
            output_tokens: 40,
          } as any;
        }),
        checkHealth: vi.fn().mockResolvedValue({
          available: true,
          version: '1.0.0',
        }),
      };
    }),
  };
});

describe('Session Message Routes', () => {
  let app: Express;
  let testSessionId: string;

  beforeAll(async () => {
    // Use in-memory database for tests
    process.env.DB_PATH = ':memory:';
    app = createApp();

    // Create a test session to use for message tests
    const response = await request(app)
      .post('/api/v1/sessions')
      .send({ id: 'test-message-session' });
    testSessionId = response.body.id;
  });

  afterAll(() => {
    delete process.env.DB_PATH;
  });

  describe('POST /api/v1/sessions/:id/messages (Blocking)', () => {
    it('should send message and return 200 with result', async () => {
      // Arrange
      const messageRequest = {
        prompt: 'Hello, Claude!',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/sessions/${testSessionId}/messages`)
        .send(messageRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('output');
      expect(response.body).toHaveProperty('totalCostUsd');
      expect(typeof response.body.output).toBe('string');
    });

    it('should return 404 for non-existent session', async () => {
      // Arrange
      const messageRequest = {
        prompt: 'Hello!',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/sessions/non-existent-session/messages')
        .send(messageRequest);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });

    it('should return 400 for missing prompt', async () => {
      // Arrange
      const invalidRequest = {
        model: 'haiku',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/sessions/${testSessionId}/messages`)
        .send(invalidRequest);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should return 400 for empty prompt', async () => {
      // Arrange
      const invalidRequest = {
        prompt: '',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/sessions/${testSessionId}/messages`)
        .send(invalidRequest);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should pass CLI options in request', async () => {
      // Arrange
      const messageRequest = {
        prompt: 'Test with options',
        model: 'opus',
        maxBudgetUsd: 1.0,
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/sessions/${testSessionId}/messages`)
        .send(messageRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('output');
    });
  });

  describe('POST /api/v1/sessions/:id/messages/stream (Streaming)', () => {
    it('should return SSE headers', async () => {
      // Arrange
      const messageRequest = {
        prompt: 'Stream test',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/sessions/${testSessionId}/messages/stream`)
        .send(messageRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    it('should stream events successfully', async () => {
      // Arrange
      const messageRequest = {
        prompt: 'Stream message',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/sessions/${testSessionId}/messages/stream`)
        .send(messageRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.body).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      // Arrange
      const messageRequest = {
        prompt: 'Stream test',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/sessions/non-existent-session/messages/stream')
        .send(messageRequest);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });

    it('should return 400 for missing prompt in stream', async () => {
      // Arrange
      const invalidRequest = {
        model: 'haiku',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/sessions/${testSessionId}/messages/stream`)
        .send(invalidRequest);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });
  });
});
