import { Router, type Request, type Response, type NextFunction } from 'express';
import { QueryService } from '../services/QueryService.js';
import { validateQueryRequest } from '../middleware/validation.js';
import type { QueryRequest } from '../types/api.js';

const router = Router();

// Initialize QueryService
let queryService: QueryService | null = null;

function getQueryService(): QueryService {
  if (!queryService) {
    queryService = new QueryService();
  }
  return queryService;
}

/**
 * POST /query - Execute blocking query
 */
router.post(
  '/query',
  validateQueryRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = getQueryService();
      const request: QueryRequest = req.body;

      // Execute query
      const result = await service.execute(request);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /query/stream - Execute streaming query with SSE
 */
router.post(
  '/query/stream',
  validateQueryRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    const service = getQueryService();
    const request: QueryRequest = req.body;

    // Track if headers have been sent (streaming started)
    let streamingStarted = false;
    let clientDisconnected = false;

    // Handle client disconnect to stop streaming (listen on response, not request)
    res.on('close', () => {
      clientDisconnected = true;
    });

    try {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
      res.flushHeaders(); // Send headers immediately to establish SSE connection
      streamingStarted = true;

      // Execute streaming query
      for await (const event of service.executeStream(request)) {
        if (clientDisconnected) {
          break; // Stop streaming if client disconnected
        }
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        // Flush after each event for real-time streaming
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
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
