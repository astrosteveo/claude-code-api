import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  validateQueryRequest,
  validateCreateSessionRequest,
  validateSendMessageRequest,
} from '../../src/middleware/validation.js';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  describe('validateQueryRequest', () => {
    it('should pass valid QueryRequest', () => {
      // Arrange
      mockReq.body = {
        prompt: 'test prompt',
        model: 'claude-sonnet-3-5',
        tools: ['Read', 'Write'],
      };

      // Act
      validateQueryRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 400 for missing prompt', () => {
      // Arrange
      mockReq.body = {
        model: 'claude-sonnet-3-5',
      };

      // Act
      validateQueryRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('prompt'),
      }));
    });

    it('should return 400 for invalid model type', () => {
      // Arrange
      mockReq.body = {
        prompt: 'test',
        model: 123, // Should be string
      };

      // Act
      validateQueryRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('model'),
      }));
    });

    it('should return 400 for invalid tools type', () => {
      // Arrange
      mockReq.body = {
        prompt: 'test',
        tools: 'Read,Write', // Should be array
      };

      // Act
      validateQueryRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('tools'),
      }));
    });

    it('should allow optional fields to be undefined', () => {
      // Arrange
      mockReq.body = {
        prompt: 'test',
        // All other fields optional
      };

      // Act
      validateQueryRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should sanitize prompt to prevent injection', () => {
      // Arrange
      const dangerousPrompt = 'test<script>alert("xss")</script>';
      mockReq.body = {
        prompt: dangerousPrompt,
      };

      // Act
      validateQueryRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      // Prompt should be sanitized in body
      expect(mockReq.body.prompt).not.toContain('<script>');
    });

    it('should pass with all valid optional fields', () => {
      // Arrange
      mockReq.body = {
        prompt: 'test',
        model: 'claude-sonnet-3-5',
        agent: 'test-agent',
        systemPrompt: 'You are helpful',
        tools: ['Read'],
        allowedTools: ['Read', 'Write'],
        disallowedTools: ['Bash'],
        maxBudgetUsd: 1.0,
        jsonSchema: { type: 'object' },
      };

      // Act
      validateQueryRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('validateCreateSessionRequest', () => {
    it('should pass with no body', () => {
      // Arrange
      mockReq.body = {};

      // Act
      validateCreateSessionRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass with custom session ID', () => {
      // Arrange
      mockReq.body = {
        sessionId: 'custom-session-id',
      };

      // Act
      validateCreateSessionRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass with metadata', () => {
      // Arrange
      mockReq.body = {
        metadata: {
          tag: 'test',
          user: 'user-123',
        },
      };

      // Act
      validateCreateSessionRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 400 for invalid sessionId type', () => {
      // Arrange
      mockReq.body = {
        sessionId: 123, // Should be string
      };

      // Act
      validateCreateSessionRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('sessionId'),
      }));
    });
  });

  describe('validateSendMessageRequest', () => {
    it('should pass valid SendMessageRequest', () => {
      // Arrange
      mockReq.body = {
        prompt: 'test prompt',
      };

      // Act
      validateSendMessageRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 400 for missing prompt', () => {
      // Arrange
      mockReq.body = {};

      // Act
      validateSendMessageRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('prompt'),
      }));
    });

    it('should pass with optional model', () => {
      // Arrange
      mockReq.body = {
        prompt: 'test',
        model: 'claude-opus-4',
      };

      // Act
      validateSendMessageRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should sanitize prompt in message request', () => {
      // Arrange
      const dangerousPrompt = 'test<img src=x onerror=alert(1)>';
      mockReq.body = {
        prompt: dangerousPrompt,
      };

      // Act
      validateSendMessageRequest(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body.prompt).not.toContain('<img');
    });
  });
});
