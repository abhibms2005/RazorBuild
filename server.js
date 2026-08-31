import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from './src/routes/api.js';
import webhookRoutes from './src/routes/webhooks.js';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(express.json());

// CORS Configuration
// Allow requests from frontend and localhost for development
const corsOptions = {
  origin: [FRONTEND_ORIGIN, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', apiRoutes);
app.use('/webhooks', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Revenue Recovery API server is running on port ${PORT}`);
  console.log(`📡 CORS enabled for origin: ${FRONTEND_ORIGIN}`);
  console.log(`🗄️  Connected to Supabase`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health           - Server health check`);
  console.log(`  GET  /api/health-db    - Database connection check`);
  console.log(`  GET  /api/summary      - Payment statistics`);
  console.log(`  GET  /api/records      - All payment records`);
  console.log(`  GET  /api/audit        - Audit log entries`);
  console.log(`  POST /api/run-batch    - Trigger recovery batch`);
  console.log(`  POST /webhooks/payment - Payment webhooks\n`);
});
