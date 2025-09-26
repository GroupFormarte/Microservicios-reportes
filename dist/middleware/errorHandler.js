"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.createError = void 0;
const logger_1 = require("../utils/logger");
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    // Log error details
    logger_1.logger.error('Error occurred', {
        message: err.message,
        stack: err.stack,
        statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    // Prepare error response
    const errorResponse = {
        success: false,
        error: message
    };
    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.data = {
            stack: err.stack
        };
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
