/**
 * WorkNear Express Application Entry
 * Configures global security middleware, body parsers, static uploads,
 * rate limiters, modular API routes, health checks, and global error handling.
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Custom Middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Modular Route Handlers
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const businessRoutes = require('./routes/businessRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const savedRoutes = require('./routes/savedRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const isDev = process.env.NODE_ENV !== 'production';

// ============================================================================
// Security & Headers
// ============================================================================

// Helmet with relaxed CORP so uploaded images/avatars load cross-origin
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration for local development and deployed frontend (including Vercel)
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        configuredOrigins.includes('*') ||
        configuredOrigins.includes(cleanOrigin) ||
        /\.vercel\.app$/.test(cleanOrigin) ||
        cleanOrigin.startsWith('http://localhost:') ||
        cleanOrigin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// ============================================================================
// Request Parsing & Static Assets
// ============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static user uploads (business logos, profile photos, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================================
// Logging & Monitoring
// ============================================================================

if (isDev) {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// ============================================================================
// Rate Limiting
// ============================================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 300 : 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// API Route Registrations
// ============================================================================

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/workers', apiLimiter, workerRoutes);
app.use('/api/business', apiLimiter, businessRoutes);
app.use('/api/jobs', apiLimiter, jobRoutes);
app.use('/api/applications', apiLimiter, applicationRoutes);
app.use('/api/saved', apiLimiter, savedRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/reports', apiLimiter, reportRoutes);

// Health check endpoint for uptime monitoring & load balancers
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'WorkNear API is running', version: '1.0.0' });
});

// 404 fallback for unmatched API endpoints
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
