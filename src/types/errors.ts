/**
 * Custom error codes for API responses
 */
export enum ErrorCode {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  CLI_ERROR = 'CLI_ERROR',
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Base API error class
 */
export class APIError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Session not found error (404)
 */
export class SessionNotFoundError extends APIError {
  constructor(sessionId: string) {
    super(ErrorCode.SESSION_NOT_FOUND, `Session '${sessionId}' not found`, 404);
    this.name = 'SessionNotFoundError';
  }
}

/**
 * Invalid request error (400)
 */
export class InvalidRequestError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.INVALID_REQUEST, message, 400, details);
    this.name = 'InvalidRequestError';
  }
}

/**
 * CLI execution error (500)
 */
export class CLIError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.CLI_ERROR, message, 500, details);
    this.name = 'CLIError';
  }
}

/**
 * CLI not found error (503)
 */
export class CLINotFoundError extends APIError {
  constructor() {
    super(ErrorCode.CLI_NOT_FOUND, 'Claude CLI not found or not installed', 503);
    this.name = 'CLINotFoundError';
  }
}

/**
 * Timeout error (500)
 */
export class TimeoutError extends APIError {
  constructor(message: string = 'Request timed out') {
    super(ErrorCode.TIMEOUT, message, 500);
    this.name = 'TimeoutError';
  }
}
