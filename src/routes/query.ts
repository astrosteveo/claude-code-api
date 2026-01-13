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
    try {
      const service = getQueryService();
      const request: QueryRequest = req.body;

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Execute streaming query
      for await (const event of service.executeStream(request)) {
        // Send event as SSE
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      // Close the stream
      res.end();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
