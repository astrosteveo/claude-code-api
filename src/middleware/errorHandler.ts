import type { Request, Response, NextFunction } from 'express';
import { APIError, ErrorCode } from '../types/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Error response structure
 */
interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Express error handler middleware
 * Catches all errors and returns structured JSON responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Request error', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
  });

  // Handle APIError instances
  if (err instanceof APIError) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err.details) {
      response.error.details = err.details;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle generic errors
  const response: ErrorResponse = {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: err.message || 'Internal server error',
    },
  };

  res.status(500).json(response);
}
