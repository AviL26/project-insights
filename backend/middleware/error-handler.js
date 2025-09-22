const fs = require('fs');
const path = require('path');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// Error logger
class ErrorLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(error, req = null, level = 'error') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      ...(req && {
        request: {
          method: req.method,
          url: req.url,
          headers: this.sanitizeHeaders(req.headers),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id,
          body: this.sanitizeBody(req.body)
        }
      })
    };

    // Write to file
    const logFile = path.join(this.logDir, `${level}-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${timestamp}] ${level.toUpperCase()}:`, error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    }
  }

  sanitizeHeaders(headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
    const sanitized = { ...body };
    
    const sanitizeObject = (obj) => {
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }
}

const errorLogger = new ErrorLogger();

// Database error handler
const handleDatabaseError = (error) => {
  console.error('Database error details:', error);
  
  // SQLite specific errors
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new ValidationError('Duplicate entry found', [{
      field: 'unique_constraint',
      message: 'This value already exists'
    }]);
  }
  
  if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return new ValidationError('Invalid reference', [{
      field: 'foreign_key',
      message: 'Referenced record does not exist'
    }]);
  }
  
  if (error.code === 'SQLITE_CONSTRAINT_CHECK') {
    return new ValidationError('Data validation failed', [{
      field: 'check_constraint',
      message: 'Value does not meet requirements'
    }]);
  }
  
  if (error.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    return new ValidationError('Required field missing', [{
      field: 'required_field',
      message: 'This field is required'
    }]);
  }
  
  if (error.code === 'SQLITE_BUSY') {
    return new DatabaseError('Database is temporarily busy, please try again');
  }
  
  if (error.code === 'SQLITE_LOCKED') {
    return new DatabaseError('Database is locked, please try again');
  }
  
  return new DatabaseError('Database operation failed', error);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
const globalErrorHandler = (error, req, res, next) => {
  let err = error;
  
  // Handle different types of errors
  if (error.code && error.code.startsWith('SQLITE_')) {
    err = handleDatabaseError(error);
  }
  
  // Handle JSON parsing errors
  if (error.type === 'entity.parse.failed') {
    err = new ValidationError('Invalid JSON format');
  }
  
  // Handle request timeout
  if (error.code === 'TIMEOUT') {
    err = new AppError('Request timeout', 408, 'TIMEOUT');
  }
  
  // Default to operational error if not specified
  if (!err.isOperational) {
    err = new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
  }
  
  // Log error
  errorLogger.log(err, req, err.statusCode >= 500 ? 'error' : 'warn');
  
  // Send error response
  const errorResponse = {
    success: false,
    message: err.message,
    code: err.code,
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: err.originalError
    })
  };
  
  res.status(err.statusCode || 500).json(errorResponse);
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};

// Request timeout middleware
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      const error = new AppError('Request timeout', 408, 'TIMEOUT');
      next(error);
    }, timeout);
    
    res.on('finish', () => {
      clearTimeout(timer);
    });
    
    res.on('close', () => {
      clearTimeout(timer);
    });
    
    next();
  };
};

// Rate limiting error
const rateLimitHandler = (req, res, next) => {
  const error = new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  next(error);
};

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return next(new ValidationError('Validation failed', validationErrors));
    }
    
    next();
  };
};

// Error monitoring (for production)
const errorMonitoring = {
  reportError: (error, context = {}) => {
    // In production, this could send to error tracking services
    // like Sentry, Bugsnag, or custom monitoring
    
    const errorData = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      context
    };
    
    // For now, just log to console in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Error reported to monitoring:', errorData);
    }
    
    // TODO: Implement actual error reporting service
    // await errorService.report(errorData);
  }
};

// Health check for error handling system
const healthCheck = {
  checkErrorHandling: () => {
    try {
      // Test log directory access
      fs.accessSync(errorLogger.logDir, fs.constants.W_OK);
      return { status: 'healthy', message: 'Error handling system operational' };
    } catch (error) {
      return { status: 'unhealthy', message: 'Error handling system issues', error: error.message };
    }
  }
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  DatabaseError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  
  // Middleware
  globalErrorHandler,
  notFoundHandler,
  timeoutHandler,
  rateLimitHandler,
  validateRequest,
  asyncHandler,
  
  // Utilities
  errorLogger,
  errorMonitoring,
  healthCheck,
  handleDatabaseError
};