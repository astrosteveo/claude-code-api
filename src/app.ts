import express, { type Express } from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.js';
import sessionsRoutes from './routes/sessions.js';
import queryRoutes from './routes/query.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Configure CORS with allowed origins from environment
  // Default to localhost only for security; set ALLOWED_ORIGINS for production
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json());

  // Routes
  app.use('/api/v1', healthRoutes);
  app.use('/api/v1', sessionsRoutes);
  app.use('/api/v1', queryRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
