// Error handling middleware
import { MulterError } from "multer";

const errorHandler = (err, req, res, next) => {
  // Log error details (consider using a proper logger in production)
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle Multer-specific errors
  if (err instanceof MulterError) {
    const multerErrors = {
      'LIMIT_FILE_SIZE': 'File size exceeds 50MB limit',
      'LIMIT_FILE_COUNT': 'Too many files uploaded',
      'LIMIT_FIELD_KEY': 'Field name too long',
      'LIMIT_FIELD_VALUE': 'Field value too long',
      'LIMIT_FIELD_COUNT': 'Too many fields',
      'LIMIT_UNEXPECTED_FILE': 'Unexpected field'
    };

    const message = multerErrors[err.code] || 'File upload error';
    return res.status(400).json({
      error: message,
      code: err.code
    });
  }

  // Handle custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details })
    });
  }

  // Handle validation errors (if using a validation library)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors
    });
  }

  // Handle other known errors
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }

  // Fallback for unknown errors (don't expose stack trace in production)
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
};

export default errorHandler;
