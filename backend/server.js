const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'traceayur-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Initialize Fabric network connection
const FabricClient = require('./fabric/connect');
const AuthMapper = require('./middleware/authMapper');
const fabricClient = new FabricClient();
const authMapper = new AuthMapper();

// Initialize test users and fabric connection
async function initializeServices() {
  try {
    // Initialize test users
    authMapper.initializeTestUsers();
    
    // Initialize Fabric wallet and connection
    const walletInitialized = await fabricClient.initWallet();
    if (walletInitialized) {
      const connected = await fabricClient.connect();
      if (connected) {
        logger.info('Fabric client connected successfully');
        // Start listening for blockchain events
        await fabricClient.listenForEvents();
      }
    }
  } catch (error) {
    logger.error('Failed to initialize services:', error);
  }
}

// Make fabric client and auth mapper available to routes
app.locals.fabricClient = fabricClient;
app.locals.authMapper = authMapper;
app.locals.io = io;
app.locals.logger = logger;

// Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const blockchainRoutes = require('./routes/blockchain');
const collectorRoutes = require('./routes/collector');
const qualityRoutes = require('./routes/quality');
const dashboardRoutes = require('./routes/dashboard');
const integrationRoutes = require('./routes/integration');
const provenanceRoutes = require('./routes/provenance');
const vendorRoutes = require('./routes/vendor');
const warehouseRoutes = require('./routes/warehouse');

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', provenanceRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/collector', collectorRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/warehouse', warehouseRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('joinRoom', (room) => {
    socket.join(room);
    logger.info(`Client ${socket.id} joined room: ${room}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize services after server starts
  await initializeServices();
});

module.exports = app;
