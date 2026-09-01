import 'dotenv/config';
import app from './src/app.js';

// Local development server only
// In production, the app runs as a Netlify Function (netlify/functions/api.js)
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

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
