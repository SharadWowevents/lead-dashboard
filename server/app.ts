import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.ts';
import dataRoutes from './routes/dataRoutes.ts';
import { isPrismaConnected } from './db.ts';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger in development
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.includes('login')) {
        const duration = Date.now() - start;
        console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Health and status endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'Centralized Lead Ingestion & Admin Dashboard',
      timestamp: new Date().toISOString(),
      database: {
        orm: 'Prisma 6',
        provider: 'mysql',
        connected: isPrismaConnected,
        mode: isPrismaConnected ? 'MySQL Database' : 'Mock/In-Memory Preview DB',
      },
    });
  });

  // Data routes (mounted at /api)
  // Handles:
  // - POST /api/ingest
  // - GET /api/data (JWT protected, ?siteName=...)
  // - GET /api/sites (JWT protected)
  // - DELETE /api/data/:id (JWT protected)
  app.use('/api', dataRoutes);

  // Auth routes (mounted at /api/auth and aliases)
  // Handles:
  // - POST /api/auth/login
  // - POST /api/auth/change-password
  // - GET /api/auth/me
  app.use('/api/auth', authRoutes);

  // Direct root aliases as requested by user prompt specifications:
  // - POST /login
  // - POST /change-password
  // - POST /api/login
  // - POST /api/change-password
  // - POST /api/data/ingest
  app.use('/api', authRoutes);
  app.use('/', authRoutes);
  app.use('/api/data', dataRoutes);

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Unhandled Server Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  });

  return app;
}

export default createApp;
