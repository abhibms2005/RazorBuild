const serverless = require('serverless-http');
const app = require('../../src/app.js');

/**
 * Netlify Function handler for the Express app
 * Routes all /api/* and /webhooks/* requests to the Express app
 * This is the entry point for production deployment
 */
const handler = serverless(app);

module.exports = { handler };
