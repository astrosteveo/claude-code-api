import { Router, type Request, type Response, type NextFunction } from 'express';
import { SessionService } from '../services/SessionService.js';
import { ErrorCode } from '../types/errors.js';
import { loadConfig } from '../config/index.js';

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

export default router;
