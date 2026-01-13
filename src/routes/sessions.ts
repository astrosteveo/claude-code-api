import { Router, type Request, type Response, type NextFunction } from 'express';
import { SessionService } from '../services/SessionService.js';
import { ErrorCode } from '../types/errors.js';
import { loadConfig } from '../config/index.js';
import { validateSendMessageRequest } from '../middleware/validation.js';
import type { QueryRequest } from '../types/api.js';

const router = Router();

// Initialize dependencies
// Note: In production, these should be injected via DI container
let sessionService: SessionService | null = null;

async function getSessionService(): Promise<SessionService> {
  if (!sessionService) {
    const config = loadConfig();
    sessionService = new SessionService(config.database.path);
    await sessionService.initialize();
  }
  return sessionService;
}

/**
 * POST /sessions - Create a new session
 */
router.post('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await getSessionService();
    const { id, metadata } = req.body;

    const session = await service.createSession({ id, metadata });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /sessions - List all sessions
 */
router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await getSessionService();
    const sessions = await service.listSessions();

    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /sessions/:id - Get session by ID
 */
router.get('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await getSessionService();
    const { id } = req.params;

    const session = await service.getSession(id);

    if (!session) {
      const error = new Error(`Session not found: ${id}`) as any;
      error.code = ErrorCode.SESSION_NOT_FOUND;
      error.statusCode = 404;
      throw error;
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /sessions/:id - Delete session by ID
 */
router.delete('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await getSessionService();
    const { id } = req.params;

    // Check if session exists before attempting delete
    const session = await service.getSession(id);
    if (!session) {
      const error = new Error(`Session not found: ${id}`) as any;
      error.code = ErrorCode.SESSION_NOT_FOUND;
      error.statusCode = 404;
      throw error;
    }

    await service.deleteSession(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /sessions/:id/messages - Send message to session (blocking)
 */
router.post(
  '/sessions/:id/messages',
  validateSendMessageRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = await getSessionService();
      const { id } = req.params;
      const request: QueryRequest = req.body;

      // Check if session exists
      const session = await service.getSession(id);
      if (!session) {
        const error = new Error(`Session not found: ${id}`) as any;
        error.code = ErrorCode.SESSION_NOT_FOUND;
        error.statusCode = 404;
        throw error;
      }

      // Send message and get result
      const result = await service.sendMessage(id, request);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /sessions/:id/messages/stream - Send message to session (streaming)
 */
router.post(
  '/sessions/:id/messages/stream',
  validateSendMessageRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const request: QueryRequest = req.body;

    // Track if headers have been sent (streaming started)
    let streamingStarted = false;
    let clientDisconnected = false;

    // Handle client disconnect to stop streaming
    req.on('close', () => {
      clientDisconnected = true;
    });

    try {
      const service = await getSessionService();

      // Check if session exists
      const session = await service.getSession(id);
      if (!session) {
        const error = new Error(`Session not found: ${id}`) as any;
        error.code = ErrorCode.SESSION_NOT_FOUND;
        error.statusCode = 404;
        throw error;
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      streamingStarted = true;

      // Stream message events
      for await (const event of service.streamMessage(id, request)) {
        if (clientDisconnected) {
          break; // Stop streaming if client disconnected
        }
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      res.end();
    } catch (error) {
      if (streamingStarted) {
        // Send error as SSE event since headers already sent
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
        res.end();
      } else {
        // Headers not sent yet, use normal error handling
        next(error);
      }
    }
  }
);

export default router;
