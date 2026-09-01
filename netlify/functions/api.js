import serverless from 'serverless-http';
import app from '../../src/app.js';

/**
 * Netlify Function handler for the Express app
 * Routes all /api/* and /webhooks/* requests to the Express app
 * This is the entry point for production deployment
 */
const handler = serverless(app);

export { handler };
