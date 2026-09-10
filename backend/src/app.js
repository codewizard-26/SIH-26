import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env.js';
import healthRoutes from './modules/health/health.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows images to be displayed in frontend
  })
);

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploaded images
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// Mount API Routes
app.use('/api/health', healthRoutes);

// Root route for quick verification
app.get('/', (req, res) => {
  res.json({
    message: 'SIH26034 - Legal Metrology Packaged Commodity Compliance API',
    documentation: '/api/health',
    version: '1.0.0',
  });
});

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
