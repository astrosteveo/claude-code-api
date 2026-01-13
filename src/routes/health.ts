import { Router, type Request, type Response } from 'express';
import { CLIExecutor } from '../infrastructure/CLIExecutor.js';
import { loadConfig } from '../config/index.js';

const router = Router();

/**
 * GET /health - Simple health check
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /info - Detailed system information
 */
router.get('/info', async (_req: Request, res: Response) => {
  try {
    // Load configuration
    const config = loadConfig();

    // Check CLI availability
    const executor = new CLIExecutor();
    const cliHealth = await executor.checkHealth();

    res.json({
      version: '1.0.0', // TODO: Read from package.json
      cli: {
        available: cliHealth.available,
        version: cliHealth.version,
        error: cliHealth.error,
      },
      config: {
        dbPath: config.database.path,
        port: config.server.port,
        logLevel: config.logging.level,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve system information',
      },
    });
  }
});

export default router;
