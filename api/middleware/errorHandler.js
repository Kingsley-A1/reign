/**
 * REIGN API - Error Handling Middleware
 * Provides consistent error responses across the API
 */

const logger = require('../lib/logger');

/**
 * Custom API Error class
 */
class APIError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Common error factory methods
 */
const errors = {
    badRequest: (message = 'Bad request') => new APIError(message, 400, 'BAD_REQUEST'),
    unauthorized: (message = 'Unauthorized') => new APIError(message, 401, 'UNAUTHORIZED'),
    forbidden: (message = 'Forbidden') => new APIError(message, 403, 'FORBIDDEN'),
    notFound: (message = 'Resource not found') => new APIError(message, 404, 'NOT_FOUND'),
    conflict: (message = 'Resource conflict') => new APIError(message, 409, 'CONFLICT'),
    tooManyRequests: (message = 'Too many requests') => new APIError(message, 429, 'RATE_LIMITED'),
    internal: (message = 'Internal server error') => new APIError(message, 500, 'INTERNAL_ERROR'),
    serviceUnavailable: (message = 'Service unavailable') => new APIError(message, 503, 'SERVICE_UNAVAILABLE')
};

/**
 * 404 Not Found handler
 * Place before error handler to catch undefined routes
 */
const notFoundHandler = (req, res, next) => {
    const error = errors.notFound(`Cannot ${req.method} ${req.originalUrl}`);
    next(error);
};

/**
 * Global error handler middleware
 * Provides consistent error response format
 */
const errorHandler = (err, req, res, next) => {
    // Default values
    let statusCode = err.statusCode || 500;
    let code = err.code || 'INTERNAL_ERROR';
    let message = err.message || 'An unexpected error occurred';
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid authentication token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Authentication token has expired';
    } else if (err.code === '23505') {
        // PostgreSQL/CockroachDB unique violation
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with this value already exists';
    } else if (err.code === '23503') {
        // PostgreSQL/CockroachDB foreign key violation
        statusCode = 400;
        code = 'INVALID_REFERENCE';
        message = 'Referenced record does not exist';
    } else if (err.type === 'entity.too.large') {
        statusCode = 413;
        code = 'PAYLOAD_TOO_LARGE';
        message = 'Request payload is too large';
    }

    // Log error (don't log 4xx client errors at error level)
    if (statusCode >= 500) {
        logger.error({
            err,
            req: {
                method: req.method,
                url: req.originalUrl,
                userId: req.user?.id
            }
        }, `Server error: ${message}`);
    } else {
        logger.warn({
            code,
            url: req.originalUrl,
            userId: req.user?.id
        }, `Client error: ${message}`);
    }

    // Build response
    const response = {
        success: false,
        error: message,
        code
    };

    // Add details in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.details = err.details || undefined;
    }

    // Add request ID if available
    if (req.id) {
        response.requestId = req.id;
    }

    res.status(statusCode).json(response);
};

/**
 * Async handler wrapper
 * Catches async errors and passes to error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    APIError,
    errors,
    notFoundHandler,
    errorHandler,
    asyncHandler
};
