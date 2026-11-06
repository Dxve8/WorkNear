/**
 * Request logging middleware
 * Logs all HTTP requests with timing information
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request info
  const logRequest = () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Format log message
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`;
    
    // Log based on status code
    if (statusCode >= 500) {
      console.error(logMessage);
    } else if (statusCode >= 400) {
      console.warn(logMessage);
    } else if (process.env.LOG_LEVEL === 'debug') {
      console.log(logMessage);
    }
  };

  // Hook into response.end to log after response is sent
  const originalEnd = res.end;
  res.end = function(...args) {
    logRequest();
    originalEnd.apply(res, args);
  };

  next();
};

module.exports = requestLogger;
