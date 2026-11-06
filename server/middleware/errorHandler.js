/**
 * Centralized Error Handling & Diagnostics Middleware
 * Captures, formats, logs, and transforms operational and validation exceptions
 * into standardized, client-friendly JSON error payloads.
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
const ERROR_LOG = path.join(LOG_DIR, 'error.log');

// Ensure diagnostic log directory is initialized
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ============================================================================
// Internal Logging Utilities
// ============================================================================

/**
 * Append formatted exception telemetry to the server error log
 * @param {Object} errorInfo - Contextual error metadata
 */
const logErrorToFile = (errorInfo) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      ...errorInfo,
    });
    fs.appendFileSync(ERROR_LOG, logEntry + '\n');
  } catch (err) {
    console.error('Failed to append to error log:', err);
  }
};

/**
 * Extract structured audit information from incoming request and exception
 * @param {Error} err - Captured Error object
 * @param {Object} req - Express request object
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Structured error metadata
 */
const formatErrorInfo = (err, req, statusCode) => {
  return {
    statusCode,
    message: err.message,
    name: err.name,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
    ip: req.ip,
    stack: err.stack,
  };
};

// ============================================================================
// Main Error Handling Middleware
// ============================================================================

/**
 * Express error-handling middleware interface
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // 1. Mongoose invalid ObjectId / CastError
  if (err.name === 'CastError') {
    message = 'Invalid resource ID';
    statusCode = 400;
  }

  // 2. Mongoose unique constraint violation (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `${field} already exists`;
    statusCode = 400;
  }

  // 3. Mongoose schema validation failure
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 400;
  }

  // 4. JWT format and expiry handling
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Session has expired. Please sign in again.';
    statusCode = 401;
  }

  // Record 5xx errors or all errors when in debug mode
  if (statusCode >= 500 || process.env.LOG_LEVEL === 'debug') {
    const errorInfo = formatErrorInfo(err, req, statusCode);
    logErrorToFile(errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.error(`[${statusCode}] ${err.name}: ${message}`);
      console.error('URL:', req.originalUrl);
      if (err.stack) console.error('Stack:', err.stack.split('\n').slice(0, 5).join('\n'));
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
