import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import {
  SessionNotFoundError,
  InvalidRequestError,
  CLIError,
  CLINotFoundError,
  TimeoutError,
  ErrorCode,
} from '../../src/types/errors.js';

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe('errorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn();

    mockReq = {
      method: 'GET',
      url: '/test',
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  it('should catch errors and return structured response', () => {
    // Arrange
    const error = new Error('Test error');

    // Act
    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(statusMock).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Object),
      })
    );
  });

  it('should map SESSION_NOT_FOUND to 404', () => {
    // Arrange
    const error = new SessionNotFoundError('test-session');

    // Act
    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.SESSION_NOT_FOUND,
        }),
      })
    );
  });

  it('should map INVALID_REQUEST to 400', () => {
    // Arrange
    const error = new InvalidRequestError('Invalid prompt');

    // Act
    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.INVALID_REQUEST,
        }),
      })
    );
  });

  it('should map CLI_ERROR to 500', () => {
    // Arrange
    const error = new CLIError('CLI execution failed');

    // Act
    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.CLI_ERROR,
        }),
      })
    );
  });

  it('should map CLI_NOT_FOUND to 503', () => {
    // Arrange
    const error = new CLINotFoundError();

    // Act
    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(statusMock).toHaveBeenCalledWith(503);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.CLI_NOT_FOUND,
        }),
      })
    );
  });

  it('should map TIMEOUT to 500', () => {
    // Arrange
    const error = new TimeoutError('Request timed out');

    // Act
    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.TIMEOUT,
        }),
      })
    );
  });

  it('should include error code in response', () => {
    // Arrange
    const error = new SessionNotFoundError('test-session');

    // Act
    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.SESSION_NOT_FOUND,
        }),
      })
    );
  });

  it('should include error message in response', () => {
    // Arrange
    const error = new SessionNotFoundError('test-session');

    // Act
    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: "Session 'test-session' not found",
        }),
      })
    );
  });

  it('should handle generic errors with 500 status', () => {
    // Arrange
    const error = new Error('Unexpected error');

    // Act
    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Unexpected error',
        }),
      })
    );
  });
});
