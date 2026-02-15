/**
 * Express Application
 * Configures and exports the Express app for use in server and tests
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import ticketRoutes from './routes/ticketRoutes';

const app: Application = express();

/**
 * Middleware Configuration
 */

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * Routes
 */

// Health check endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Customer Support System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      tickets: '/tickets',
      import: '/tickets/import',
      autoClassify: '/tickets/:id/auto-classify'
    }
  });
});

// API routes
app.use('/tickets', ticketRoutes);

/**
 * Error Handling Middleware
 */

// 404 handler - must be after all routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    details: [
      {
        field: 'path',
        message: `Route ${req.method} ${req.path} not found`
      }
    ]
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: [
      {
        field: 'server',
        message: 'An unexpected error occurred'
      }
    ]
  });
});

export default app;
