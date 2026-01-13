import express, { type Express } from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.js';
import sessionsRoutes from './routes/sessions.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/v1', healthRoutes);
  app.use('/api/v1', sessionsRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
