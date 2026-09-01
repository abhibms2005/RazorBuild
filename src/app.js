import 'dotenv/config';
import express from 'express';
import corsModule from 'cors';
// Explicitly import the router instances to avoid bundler issues
// Netlify's bundler can sometimes misinterpret ESM imports
import * as apiRoutesModule from './routes/api.js';
import * as webhookRoutesModule from './routes/webhooks.js';

// Ensure cors is the function, not a module
const cors = corsModule && corsModule.default ? corsModule.default : corsModule;

const apiRoutes = apiRoutesModule.default;
const webhookRoutes = webhookRoutesModule.default;

// Verify routes are valid before using them
// Express Routers are functions, so check for that
if (!apiRoutes || typeof apiRoutes !== 'function') {
  console.error('apiRoutes type:', typeof apiRoutes);
  console.error('apiRoutes value:', JSON.stringify(apiRoutes, null, 2).substring(0, 200));
  throw new Error(`Invalid apiRoutes import: expected Express Router function, got ${typeof apiRoutes}`);
}
if (!webhookRoutes || typeof webhookRoutes !== 'function') {
  console.error('webhookRoutes type:', typeof webhookRoutes);
  console.error('webhookRoutes value:', JSON.stringify(webhookRoutes, null, 2).substring(0, 200));
  throw new Error(`Invalid webhookRoutes import: expected Express Router function, got ${typeof webhookRoutes}`);
}

const app = express();

// Get configuration from environment
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS Configuration
// Allow requests from frontend and localhost for development
const corsOptions = {
  origin: [FRONTEND_ORIGIN, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:8888'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature']
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

export default app;
