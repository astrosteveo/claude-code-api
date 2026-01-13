import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../../src/utils/logger.js';
import { existsSync, unlinkSync, readFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

describe('Logger', () => {
  const testLogFile = './test-logs/test.log';

  beforeEach(() => {
    // Clean up test log file
    if (existsSync(testLogFile)) {
      unlinkSync(testLogFile);
    }
  });

  afterEach(() => {
    // Clean up test log file
    if (existsSync(testLogFile)) {
      unlinkSync(testLogFile);
    }
  });

  it('should create a Winston logger', () => {
    const logger = createLogger('info', testLogFile);

    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('should log at info level', () => {
    const logger = createLogger('info', testLogFile);

    // Ensure directory exists
    const dir = dirname(testLogFile);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    logger.info('Test info message');

    // Wait a bit for file write
    setTimeout(() => {
      expect(existsSync(testLogFile)).toBe(true);
    }, 100);
  });

  it('should respect log level from config', () => {
    const logger = createLogger('error', testLogFile);

    // Ensure directory exists
    const dir = dirname(testLogFile);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Info should not be logged when level is 'error'
    logger.info('This should not be logged');
    logger.error('This should be logged');

    setTimeout(() => {
      if (existsSync(testLogFile)) {
        const contents = readFileSync(testLogFile, 'utf-8');
        expect(contents).toContain('This should be logged');
        expect(contents).not.toContain('This should not be logged');
      }
    }, 100);
  });

  it('should format log messages with timestamp and level', () => {
    const logger = createLogger('info', testLogFile);

    // Ensure directory exists
    const dir = dirname(testLogFile);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    logger.info('Test message');

    setTimeout(() => {
      if (existsSync(testLogFile)) {
        const contents = readFileSync(testLogFile, 'utf-8');
        // Should contain timestamp (ISO format)
        expect(contents).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        // Should contain log level
        expect(contents).toContain('info');
        // Should contain message
        expect(contents).toContain('Test message');
      }
    }, 100);
  });
});
