import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app.js';

describe('Health Routes', () => {
  let app: Express;

  beforeAll(() => {
    // Create app without starting server
    app = createApp();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 with status', async () => {
      // Act
      const response = await request(app).get('/api/v1/health');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    it('should include timestamp', async () => {
      // Act
      const response = await request(app).get('/api/v1/health');

      // Assert
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });
  });

  describe('GET /api/v1/info', () => {
    it('should return API version', async () => {
      // Act
      const response = await request(app).get('/api/v1/info');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('version');
      expect(typeof response.body.version).toBe('string');
    });

    it('should return CLI availability status', async () => {
      // Act
      const response = await request(app).get('/api/v1/info');

      // Assert
      expect(response.body).toHaveProperty('cli');
      expect(response.body.cli).toHaveProperty('available');
      expect(typeof response.body.cli.available).toBe('boolean');
    });

    it('should return CLI version if available', async () => {
      // Act
      const response = await request(app).get('/api/v1/info');

      // Assert
      expect(response.body).toHaveProperty('cli');
      // If CLI is available, should have version
      if (response.body.cli.available) {
        expect(response.body.cli).toHaveProperty('version');
      }
    });

    it('should return configuration info', async () => {
      // Act
      const response = await request(app).get('/api/v1/info');

      // Assert
      expect(response.body).toHaveProperty('config');
      expect(response.body.config).toHaveProperty('dbPath');
    });
  });
});
