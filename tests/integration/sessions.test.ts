import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app.js';

describe('Session Routes - CRUD', () => {
  let app: Express;

  beforeAll(() => {
    // Set environment variable to use in-memory database for tests
    process.env.DB_PATH = ':memory:';
    // Create app with in-memory database for tests
    app = createApp();
  });

  beforeEach(async () => {
    // Note: Can't easily reset in-memory DB with current singleton pattern
    // This is a known limitation - tests will share state
  });

  afterAll(async () => {
    // Cleanup environment variable
    delete process.env.DB_PATH;
  });

  describe('POST /api/v1/sessions', () => {
    it('should create session and return 201', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/sessions')
        .send({});

      // Debug
      if (response.status !== 201) {
        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
      }

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body.messageCount).toBe(0);
      expect(response.body.totalCostUsd).toBe(0);
    });

    it('should create session with custom ID', async () => {
      // Arrange
      const customId = 'my-custom-session-id';

      // Act
      const response = await request(app)
        .post('/api/v1/sessions')
        .send({ id: customId });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.id).toBe(customId);
    });

    it('should create session with metadata', async () => {
      // Arrange
      const metadata = { name: 'Test Session', tags: ['test'] };

      // Act
      const response = await request(app)
        .post('/api/v1/sessions')
        .send({ metadata });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.metadata).toEqual(metadata);
    });
  });

  describe('GET /api/v1/sessions', () => {
    it('should return array of sessions', async () => {
      // Act
      const response = await request(app).get('/api/v1/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Note: May contain sessions from previous tests due to shared in-memory DB
    });

    it('should return all sessions including newly created ones', async () => {
      // Arrange - get initial count
      const initialResponse = await request(app).get('/api/v1/sessions');
      const initialCount = initialResponse.body.length;

      // Create some sessions
      await request(app).post('/api/v1/sessions').send({ id: 'session-1' });
      await request(app).post('/api/v1/sessions').send({ id: 'session-2' });

      // Act
      const response = await request(app).get('/api/v1/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(initialCount + 2);
      expect(response.body[0]).toHaveProperty('id');
    });
  });

  describe('GET /api/v1/sessions/:id', () => {
    it('should return session by ID', async () => {
      // Arrange - create a session
      const createResponse = await request(app)
        .post('/api/v1/sessions')
        .send({ id: 'test-session' });
      const sessionId = createResponse.body.id;

      // Act
      const response = await request(app).get(`/api/v1/sessions/${sessionId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(sessionId);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 404 for non-existent session', async () => {
      // Act
      const response = await request(app).get('/api/v1/sessions/does-not-exist');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/sessions/:id', () => {
    it('should delete session and return 204', async () => {
      // Arrange - create a session
      const createResponse = await request(app)
        .post('/api/v1/sessions')
        .send({ id: 'delete-test' });
      const sessionId = createResponse.body.id;

      // Act
      const response = await request(app).delete(`/api/v1/sessions/${sessionId}`);

      // Assert
      expect(response.status).toBe(204);

      // Verify it's actually deleted
      const getResponse = await request(app).get(`/api/v1/sessions/${sessionId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent session', async () => {
      // Act
      const response = await request(app).delete('/api/v1/sessions/does-not-exist');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });
  });
});
