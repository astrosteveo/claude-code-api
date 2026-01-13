import winston from 'winston';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/**
 * Creates a Winston logger instance
 * @param level Log level (error, warn, info, debug)
 * @param logFile Path to log file
 * @returns Winston logger instance
 */
export function createLogger(level: string, logFile: string): winston.Logger {
  // Ensure log directory exists
  const logDir = dirname(logFile);
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  // Create logger with console and file transports
  const logger = winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DDTHH:mm:ss',
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      // Console transport with colorized output
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, ...meta }) =>
              `${timestamp} [${level}]: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta) : ''
              }`
          )
        ),
      }),
      // File transport with JSON format
      new winston.transports.File({
        filename: logFile,
      }),
    ],
  });

  return logger;
}
