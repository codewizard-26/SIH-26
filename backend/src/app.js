import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env.js';
import healthRoutes from './modules/health/health.routes.js';
import productRoutes from './modules/products/product.routes.js';
import inspectionRoutes from './modules/inspections/inspection.routes.js';
import ruleRoutes from './modules/rules/rule.routes.js';
import sampleRoutes from './modules/samples/samples.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows uploaded images to be displayed in frontend
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile, curl, etc.) or any local dev origin
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin) || origin === env.CORS_ORIGIN) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static uploaded images
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/samples', sampleRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'SIH26034 - Legal Metrology Packaged Commodity Compliance API',
    version: '1.0.0',
    documentation: {
      health: '/api/health',
      products: '/api/products',
      inspections: '/api/inspections',
      rules: '/api/rules',
      samples: '/api/samples',
      metrics: '/api/inspections/dashboard/metrics',
    },
  });
});

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
