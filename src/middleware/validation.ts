import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { InvalidRequestError } from '../types/errors.js';

// Note: HTML sanitization is intentionally NOT applied to prompts.
// The CLI is invoked via spawn() with an args array (not shell interpolation),
// so command injection is not possible. Sanitizing would corrupt valid user
// input like code snippets containing <, >, quotes, etc.

/**
 * Zod schema for QueryRequest
 */
const QueryRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional(),
  agent: z.string().optional(),
  agents: z.record(z.unknown()).optional(),
  systemPrompt: z.string().optional(),
  appendSystemPrompt: z.string().optional(),
  tools: z.array(z.string()).optional(),
  allowedTools: z.array(z.string()).optional(),
  disallowedTools: z.array(z.string()).optional(),
  permissionMode: z.string().optional(),
  jsonSchema: z.record(z.unknown()).optional(),
  maxBudgetUsd: z.number().optional(),
  addDirs: z.array(z.string()).optional(),
  mcpConfig: z.array(z.record(z.unknown())).optional(),
  pluginDirs: z.array(z.string()).optional(),
  betas: z.array(z.string()).optional(),
  fallbackModel: z.string().optional(),
  verbose: z.boolean().optional(),
  settingSources: z.array(z.string()).optional(),
  settings: z.union([z.string(), z.record(z.unknown())]).optional(),
  strictMcpConfig: z.boolean().optional(),
  disableSlashCommands: z.boolean().optional(),
  forkSession: z.boolean().optional(),
});

/**
 * Zod schema for CreateSessionRequest
 */
const CreateSessionRequestSchema = z.object({
  sessionId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Zod schema for SendMessageRequest
 */
const SendMessageRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional(),
  agent: z.string().optional(),
  agents: z.record(z.unknown()).optional(),
  systemPrompt: z.string().optional(),
  appendSystemPrompt: z.string().optional(),
  tools: z.array(z.string()).optional(),
  allowedTools: z.array(z.string()).optional(),
  disallowedTools: z.array(z.string()).optional(),
  permissionMode: z.string().optional(),
  jsonSchema: z.record(z.unknown()).optional(),
  maxBudgetUsd: z.number().optional(),
  addDirs: z.array(z.string()).optional(),
  mcpConfig: z.array(z.record(z.unknown())).optional(),
  pluginDirs: z.array(z.string()).optional(),
  betas: z.array(z.string()).optional(),
  fallbackModel: z.string().optional(),
  verbose: z.boolean().optional(),
  settingSources: z.array(z.string()).optional(),
  settings: z.union([z.string(), z.record(z.unknown())]).optional(),
  strictMcpConfig: z.boolean().optional(),
  disableSlashCommands: z.boolean().optional(),
});

/**
 * Validate and sanitize QueryRequest
 */
export function validateQueryRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Validate with Zod
    const validated = QueryRequestSchema.parse(req.body);

    // Update body with validated data
    req.body = validated;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      next(new InvalidRequestError(`Validation failed: ${message}`, { errors: error.errors }));
    } else {
      next(error);
    }
  }
}

/**
 * Validate CreateSessionRequest
 */
export function validateCreateSessionRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Validate with Zod
    const validated = CreateSessionRequestSchema.parse(req.body);

    // Update body with validated data
    req.body = validated;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      next(new InvalidRequestError(`Validation failed: ${message}`, { errors: error.errors }));
    } else {
      next(error);
    }
  }
}

/**
 * Validate and sanitize SendMessageRequest
 */
export function validateSendMessageRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Validate with Zod
    const validated = SendMessageRequestSchema.parse(req.body);

    // Update body with validated data
    req.body = validated;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      next(new InvalidRequestError(`Validation failed: ${message}`, { errors: error.errors }));
    } else {
      next(error);
    }
  }
}
