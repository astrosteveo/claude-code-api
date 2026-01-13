import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../../src/config/index.js';

describe('Configuration Loading', () => {
  // Save original env
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load default configuration from config.yaml', () => {
    const config = loadConfig();

    expect(config).toBeDefined();
    expect(config.server.port).toBe(3000);
    expect(config.database.path).toBe('./data/sessions.db');
    expect(config.cli.timeout).toBe(120000);
    expect(config.cli.defaultModel).toBe('sonnet');
    expect(config.queue.maxConcurrentPerSession).toBe(1);
    expect(config.logging.level).toBe('info');
    expect(config.logging.file).toBe('./logs/api.log');
  });

  it('should override config with environment variables', () => {
    process.env.PORT = '4000';
    process.env.DB_PATH = '/custom/path/db.sqlite';
    process.env.CLI_TIMEOUT = '60000';
    process.env.DEFAULT_MODEL = 'opus';
    process.env.LOG_LEVEL = 'debug';

    const config = loadConfig();

    expect(config.server.port).toBe(4000);
    expect(config.database.path).toBe('/custom/path/db.sqlite');
    expect(config.cli.timeout).toBe(60000);
    expect(config.cli.defaultModel).toBe('opus');
    expect(config.logging.level).toBe('debug');
  });

  it('should return typed configuration object', () => {
    const config = loadConfig();

    // Type assertions
    expect(typeof config.server.port).toBe('number');
    expect(typeof config.database.path).toBe('string');
    expect(typeof config.cli.timeout).toBe('number');
    expect(typeof config.cli.defaultModel).toBe('string');
    expect(typeof config.queue.maxConcurrentPerSession).toBe('number');
    expect(typeof config.logging.level).toBe('string');
    expect(typeof config.logging.file).toBe('string');
  });
});
