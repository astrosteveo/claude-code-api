import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';
import yaml from 'js-yaml';
import type { Config } from '../types/config.js';

/**
 * Detect Claude CLI path using `which claude`
 * Falls back to 'claude' if not found (relies on PATH)
 */
function detectCliPath(): string {
  try {
    const result = execSync('which claude', { encoding: 'utf8' });
    return result.trim();
  } catch {
    return 'claude';
  }
}

const DEFAULT_CONFIG: Config = {
  server: {
    port: 3000,
  },
  database: {
    path: './data/sessions.db',
  },
  cli: {
    path: detectCliPath(),
    timeout: 120000,
    defaultModel: 'sonnet',
  },
  queue: {
    maxConcurrentPerSession: 1,
  },
  logging: {
    level: 'info',
    file: './logs/api.log',
  },
};

export function loadConfig(): Config {
  // Start with default config
  let config: Config = { ...DEFAULT_CONFIG };

  // Try to load config.yaml
  try {
    const configPath = resolve(process.cwd(), 'config.yaml');
    const fileContents = readFileSync(configPath, 'utf8');
    const yamlConfig = yaml.load(fileContents) as Partial<Config>;

    // Merge YAML config with defaults
    config = {
      server: { ...config.server, ...yamlConfig.server },
      database: { ...config.database, ...yamlConfig.database },
      cli: { ...config.cli, ...yamlConfig.cli },
      queue: { ...config.queue, ...yamlConfig.queue },
      logging: { ...config.logging, ...yamlConfig.logging },
    };
  } catch (error) {
    // If config.yaml doesn't exist or is invalid, use defaults
    // In a real app, you might want to log this
  }

  // Override with environment variables
  if (process.env.PORT) {
    config.server.port = parseInt(process.env.PORT, 10);
  }

  if (process.env.DB_PATH) {
    config.database.path = process.env.DB_PATH;
  }

  if (process.env.CLAUDE_CODE_PATH) {
    config.cli.path = process.env.CLAUDE_CODE_PATH;
  }

  if (process.env.CLI_TIMEOUT) {
    config.cli.timeout = parseInt(process.env.CLI_TIMEOUT, 10);
  }

  if (process.env.DEFAULT_MODEL) {
    config.cli.defaultModel = process.env.DEFAULT_MODEL;
  }

  if (process.env.LOG_LEVEL) {
    config.logging.level = process.env.LOG_LEVEL;
  }

  if (process.env.LOG_FILE) {
    config.logging.file = process.env.LOG_FILE;
  }

  return config;
}
