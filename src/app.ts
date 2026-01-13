import express, { type Express } from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.js';
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

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
