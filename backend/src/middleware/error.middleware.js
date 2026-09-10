import { ZodError } from 'zod';
import { errorResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return errorResponse(res, 'VALIDATION_ERROR', 'Input validation failed', formattedErrors, 400);
  }

  if (err.name === 'MulterError') {
    return errorResponse(res, 'UPLOAD_ERROR', err.message, [], 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  return errorResponse(res, code, message, process.env.NODE_ENV === 'development' ? err.stack : null, statusCode);
};

export const notFoundHandler = (req, res) => {
  return errorResponse(res, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`, [], 404);
};
