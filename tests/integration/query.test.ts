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
          output: 'Mocked CLI response',
          totalCostUsd: 0.001,
          inputTokens: 10,
          outputTokens: 20,
        } as CLIResult),
        executeStream: vi.fn().mockImplementation(async function* () {
          yield { type: 'text', text: 'Mocked' } as CLIStreamEvent;
          yield { type: 'text', text: ' streaming' } as CLIStreamEvent;
          yield { type: 'text', text: ' response' } as CLIStreamEvent;
          yield {
            type: 'result',
            output: 'Mocked streaming response',
            total_cost_usd: 0.002,
            input_tokens: 15,
            output_tokens: 25,
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

describe('Query Routes', () => {
  let app: Express;

  beforeAll(() => {
    // Use in-memory database for tests
    process.env.DB_PATH = ':memory:';
    app = createApp();
  });

  afterAll(() => {
    delete process.env.DB_PATH;
  });

  describe('POST /api/v1/query', () => {
    it('should execute query and return 200 with result', async () => {
      // Arrange
      const queryRequest = {
        prompt: 'What is 2+2?',
        model: 'haiku',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/query')
        .send(queryRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('output');
      expect(response.body).toHaveProperty('totalCostUsd');
      expect(typeof response.body.output).toBe('string');
      expect(typeof response.body.totalCostUsd).toBe('number');
    });

    it('should return 400 for missing prompt', async () => {
      // Arrange
      const invalidRequest = {
        model: 'haiku',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/query')
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
        .post('/api/v1/query')
        .send(invalidRequest);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should pass CLI options to QueryService', async () => {
      // Arrange
      const queryRequest = {
        prompt: 'Test prompt',
        model: 'opus',
        maxBudgetUsd: 0.5,
        verbose: true,
      };

      // Act
      const response = await request(app)
        .post('/api/v1/query')
        .send(queryRequest);

      // Assert
      expect(response.status).toBe(200);
      // Response should contain result from CLI execution
      expect(response.body).toHaveProperty('output');
    });
  });

  describe('POST /api/v1/query/stream', () => {
    it('should return SSE headers', async () => {
      // Arrange
      const queryRequest = {
        prompt: 'Test streaming query',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/query/stream')
        .send(queryRequest);

      // Assert
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    it('should send SSE events', async () => {
      // Arrange
      const queryRequest = {
        prompt: 'Test streaming',
      };

      // Act - Start streaming request
      const response = await request(app)
        .post('/api/v1/query/stream')
        .send(queryRequest);

      // Assert
      expect(response.status).toBe(200);
      // Verify SSE content type header is set
      expect(response.headers['content-type']).toContain('text/event-stream');
      // Response should have some body content (streamed data)
      expect(response.body).toBeDefined();
    });

    it('should return 400 for missing prompt in stream', async () => {
      // Arrange
      const invalidRequest = {
        model: 'haiku',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/query/stream')
        .send(invalidRequest);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });
  });
});
