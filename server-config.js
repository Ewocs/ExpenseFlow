// Server Configuration Modules
// Modular functions for server setup and configuration

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const socketAuth = require('./middleware/socketAuth');
const CronJobs = require('./services/cronJobs');
const aiService = require('./services/aiService');
const currencyService = require('./services/currencyService');
const internationalizationService = require('./services/internationalizationService');
const taxService = require('./services/taxService');
const collaborationService = require('./services/collaborationService');
const auditComplianceService = require('./services/auditComplianceService');
const advancedAnalyticsService = require('./services/advancedAnalyticsService');
const fraudDetectionService = require('./services/fraudDetectionService');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput, mongoSanitizeMiddleware } = require('./middleware/sanitization');
const securityMonitor = require('./services/securityMonitor');
require('dotenv').config();

// ========================
// CORS Configuration Module
// ========================

/**
 * Configure CORS settings with strict validation
 */
function configureCORS() {
  return {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Define allowed origins with strict validation
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.FRONTEND_URL
      ].filter(Boolean);

      // Additional security: validate origin format
      try {
        const url = new URL(origin);
        // Only allow http/https protocols
        if (!['http:', 'https:'].includes(url.protocol)) {
          return callback(new Error('Invalid protocol'));
        }
        // Prevent localhost in production
        if (process.env.NODE_ENV === 'production' && url.hostname === 'localhost') {
          return callback(new Error('Localhost not allowed in production'));
        }
      } catch (error) {
        return callback(new Error('Invalid origin format'));
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
  };
}

// ========================
// Security Configuration Module
// ========================

/**
 * Configure Helmet security headers
 */
function configureHelmet() {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com"
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'"
        ],
        connectSrc: [
          "'self'",
          "http://localhost:3000",
          "https://api.github.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:"
        ]
      }
    },
    crossOriginEmbedderPolicy: false
  };
}

// ========================
// Security Logging Module
// ========================

/**
 * Configure security logging middleware
 */
function configureSecurityLogging() {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
      // Log failed requests
      if (res.statusCode >= 400) {
        securityMonitor.logSecurityEvent(req, 'suspicious_activity', {
          statusCode: res.statusCode,
          response: typeof data === 'string' ? data.substring(0, 200) : 'Non-string response'
        });
      }
      originalSend.call(this, data);
    };
    next();
  };
}

// ========================
// Database Initialization Module
// ========================

/**
 * Initialize database connection and services
 */
async function initializeDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Initialize cron jobs after DB connection
    CronJobs.init();
    console.log('Email cron jobs initialized');

    // Initialize AI service
    aiService.init();
    console.log('AI service initialized');

    // Initialize currency service
    currencyService.init();
    console.log('Currency service initialized');

    // Initialize internationalization service
    internationalizationService.init();
    console.log('Internationalization service initialized');

    // Initialize tax service
    taxService.init();
    console.log('Tax service initialized');

    // Initialize audit compliance service
    auditComplianceService.init();
    console.log('Audit compliance service initialized');

    // Initialize advanced analytics service
    advancedAnalyticsService.init();
    console.log('Advanced analytics service initialized');

    // Initialize fraud detection service
    fraudDetectionService.init();
    console.log('Fraud detection service initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// ========================
// Socket.IO Configuration Module
// ========================

/**
 * Configure Socket.IO connection handling
 */
function configureSocketIO(io) {
  // Socket.IO authentication
  io.use(socketAuth);

  // Socket.IO connection handling
  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.name} connected`);

    // Join user-specific room
    socket.join(`user_${socket.userId}`);

    // Join workspace rooms
    try {
      const workspaces = await collaborationService.getUserWorkspaces(socket.userId);
      workspaces.forEach(workspace => {
        socket.join(`workspace_${workspace._id}`);
      });
    } catch (error) {
      console.error('Error joining workspace rooms:', error);
    }

    // Handle sync requests
    socket.on('sync_request', async (data) => {
      try {
        // Process sync queue for this user
        const SyncQueue = require('./models/SyncQueue');
        const pendingSync = await SyncQueue.find({
          user: socket.userId,
          processed: false
        }).sort({ createdAt: 1 });

        socket.emit('sync_data', pendingSync);
      } catch (error) {
        socket.emit('sync_error', { error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
    });
  });
}

// ========================
// Route Configuration Module
// ========================

/**
 * Configure all application routes
 */
function configureRoutes(app, io) {
  // Make io available to the routes
  app.set('io', io);

  // Set io instance in notification service
  const notificationService = require('./services/notificationService');
  notificationService.setIo(io);

  // Auth routes with rate limiting
  app.use('/api/auth', require('./middleware/rateLimiter').authLimiter, require('./routes/auth'));
  app.use('/api/expenses', require('./middleware/rateLimiter').expenseLimiter, require('./routes/expenses'));
  app.use('/api/sync', require('./routes/sync'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/receipts', require('./middleware/rateLimiter').uploadLimiter, require('./routes/receipts'));
  app.use('/api/budgets', require('./routes/budgets'));
  app.use('/api/goals', require('./routes/goals'));
  app.use('/api/analytics', require('./routes/analytics'));
  app.use('/api/currency', require('./routes/currency'));
  app.use('/api/groups', require('./routes/groups'));
  app.use('/api/splits', require('./routes/splits'));
  app.use('/api/workspaces', require('./routes/workspaces'));
  app.use('/api/insights', require('./routes/insights'));

  // Root route to serve the UI
  app.get('/', (req, res) => {
    res.sendFile(require('path').join(__dirname, 'public', 'index.html'));
  });
}

// ========================
// Server Initialization Module
// ========================

/**
 * Initialize and start the server
 */
async function initializeServer() {
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: configureCORS()
  });

  const PORT = process.env.PORT || 3000;

  // Security middleware
  app.use(helmet(configureHelmet()));

  // CORS configuration
  app.use(cors(configureCORS()));

  // Rate limiting
  app.use(generalLimiter);

  // Input sanitization
  app.use(mongoSanitizeMiddleware);
  app.use(sanitizeInput);

  // Security monitoring
  app.use(securityMonitor.blockSuspiciousIPs());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static files
  app.use(express.static('public'));

  // Security logging middleware
  app.use(configureSecurityLogging());

  // Initialize database and services
  await initializeDatabase();

  // Configure Socket.IO
  configureSocketIO(io);

  // Configure routes
  configureRoutes(app, io);

  // Start server
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Security features enabled: Rate limiting, Input sanitization, Security headers');
  });

  return { app, server, io };
}

// Export modules for use
module.exports = {
  configureCORS,
  configureHelmet,
  configureSecurityLogging,
  initializeDatabase,
  configureSocketIO,
  configureRoutes,
  initializeServer
};