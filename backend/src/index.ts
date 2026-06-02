import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

// Load environment variables
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});

// Initialize Express app
const app: Express = express();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Supabase credentials not found in environment variables');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

/**
 * Middleware: CORS
 * Use a function origin checker so we can safely return the request origin
 * when it's in our allowlist. This avoids returning '*' when credentials=true.
 */
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://student-public.vercel.app',
  'https://student-public-zcw-nav-eaze.vercel.app',
  'https://student-public-5mz52dpkk-zcw-nav-eaze.vercel.app',
  'https://slot-booking-red.vercel.app',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()) : []),
].filter(Boolean));

const corsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    // Allow non-browser requests (curl, server-to-server) when origin is undefined
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/**
 * Middleware: JSON parsing
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Middleware: Request logging
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({
    method: req.method,
    path: req.path,
    query: req.query,
  });
  next();
});

/**
 * Routes
 */

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// Readiness endpoint includes a lightweight database check.
app.get('/api/ready', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('users')
      .select('id', { head: true, count: 'exact' })
      .limit(1);

    if (error) {
      logger.error({ error: error.message }, 'Readiness check failed');
      return res.status(503).json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        database: 'unavailable',
      });
    }

    return res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      database: 'ok',
    });
  } catch (error) {
    logger.error(error, 'Readiness check exception');
    return res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      database: 'unavailable',
    });
  }
});

import authRouter from './routes/auth';
import batchesRouter from './routes/batches';
import bookingsRouter from './routes/bookings';
import exportsRouter from './routes/exports';
import importsRouter from './routes/imports';
import auditLogsRouter from './routes/audit-logs';

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/batches', batchesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/exports', exportsRouter);
app.use('/api/imports', importsRouter);
app.use('/api/audit-logs', auditLogsRouter);

// Fallback placeholders for other APIs until implemented
app.use('/api/venues', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Venue routes not yet implemented' });
});
app.use('/api/audit', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Audit routes not yet implemented' });
});

/**
 * Error handling middleware
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err, 'Unhandled error');
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

/**
 * Start server execution safely context-aware
 */
if (require.main === module && process.env.NODE_ENV !== 'production') {
  const PORT = process.env.BACKEND_PORT || 3001;
  const server = app.listen(PORT, () => {
    logger.info(`Backend server running locally at http://localhost:${PORT}`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal(error, 'Uncaught exception');
});

export default app;