# Netlify Functions Migration Guide

## Overview

The revenue-recovery-api backend has been migrated from a standalone Express server to **Netlify Functions**, allowing it to deploy as part of the same Netlify site as the frontend (`razorbuild2026.netlify.app`).

### Key Benefits
- ✅ **Unified deployment** - Frontend and backend deploy together
- ✅ **No separate server costs** - Functions run on Netlify's infrastructure
- ✅ **Transparent API routing** - `/api/*` calls work from frontend without changes
- ✅ **Automatic scaling** - Netlify handles concurrent requests
- ✅ **Built-in monitoring** - Netlify dashboard shows function execution

### Architecture Changes

**Before:**
```
Frontend (Netlify)
         ↓ (fetch to api.example.com or localhost:3000)
Backend Server (separate host: Render, Railway, Heroku, etc.)
         ↓ (queries)
Supabase
```

**After:**
```
Frontend + Backend Functions (all on Netlify)
         ↓ (fetch to /api/*, internally routed)
Netlify Functions (same deployment)
         ↓ (queries)
Supabase
```

## Directory Structure

```
d:\Razorpay/
├── netlify/
│   └── functions/
│       └── api.js              ← Netlify Function handler (wraps Express app)
├── src/
│   ├── app.js                  ← Express app definition (exported, no listen)
│   ├── routes/
│   │   ├── api.js
│   │   └── webhooks.js
│   ├── services/
│   │   ├── supabaseClient.js
│   │   ├── dataStore.js
│   │   └── recoveryEngine.js
│   └── scripts/
├── server.js                   ← Thin wrapper (local dev only, calls app.listen)
├── netlify.toml                ← Netlify configuration with redirects
└── package.json
```

## How It Works

### Local Development

**Traditional setup** (separate Express server):
```bash
# Terminal 1: Frontend
npm run dev          # Vite dev server on http://localhost:5173

# Terminal 2: Backend
npm run server       # Express on http://localhost:3000
```

**With Netlify Functions** (recommended):
```bash
# Single command runs both frontend and function emulator:
npm run dev:all      # Vite + Netlify dev (port 8888)
```

When you run `npm run dev:all`, Netlify CLI:
1. Starts Vite dev server (port 3000, or next available)
2. Starts Netlify Functions emulator (port 8888)
3. Applies redirects: `/api/*` → `/.netlify/functions/api/:splat`
4. Your `fetch('/api/summary')` calls work transparently

### Production Deployment

1. Push to git
2. Netlify detects changes and runs:
   ```
   npm run build       # Build frontend (TypeScript, Vite)
   netlify deploy      # Deploy functions + frontend
   ```
3. Functions are live at `https://razorbuild2026.netlify.app/api/*`
4. Frontend and functions share the same origin (no CORS issues)

## Configuration

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"   # Where functions live
  node_version = "18.17.0"

# Redirect /api/* calls to the function
[[redirects]]
from = "/api/*"
to = "/.netlify/functions/api/:splat"
status = 200

# Redirect webhooks to the same function
[[redirects]]
from = "/webhooks/*"
to = "/.netlify/functions/api/webhooks/:splat"
status = 200

# SPA fallback for React Router
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

### netlify/functions/api.js

```javascript
import serverless from 'serverless-http';
import app from '../../src/app.js';

// Wraps the Express app to run as a Netlify Function
const handler = serverless(app);
export { handler };
```

The `serverless-http` package converts Express middleware/routes into Netlify Function handlers automatically.

### src/app.js

Contains all Express configuration:
- Middleware (CORS, JSON parsing, logging)
- Routes (api, webhooks)
- Error handling
- **Does NOT call `app.listen()`** — that's only in `server.js` for local dev

## Environment Variables

### In .env (local development)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
FRONTEND_ORIGIN=http://localhost:5173
```

### In Netlify Dashboard (production)

Set these in **Site settings → Environment variables**:

```
SUPABASE_URL              = https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key_here
FRONTEND_ORIGIN           = https://razorbuild2026.netlify.app
```

**Important:** Netlify Functions read from Netlify's environment system, NOT from `.env` files (which are git-ignored). You must set them in the Netlify dashboard.

## Execution Limits

Netlify Functions have timeout limits (varies by plan):

| Plan | Timeout | Max Payload |
|------|---------|------------|
| Free | 10 seconds | 6 MB |
| Pro | 26 seconds | 6 MB |
| Enterprise | Custom | Custom |

**Our batch processing**: With ~11-60 payment records, we should easily complete well under 10 seconds (mostly Supabase query time, not local compute).

If you later scale to thousands of records per batch, you may hit the timeout. Plan accordingly or break into smaller batches.

## Testing Locally

### Option 1: Traditional (separate servers)

```bash
# Terminal 1: Frontend only
npm run dev

# Terminal 2: Backend server
npm run server

# Frontend at http://localhost:5173
# Backend at http://localhost:3000
```

### Option 2: Netlify Functions emulator (recommended)

```bash
npm run dev:all
# Runs both frontend and function emulator together
# Frontend at http://localhost:3000 (or shown in output)
# Functions emulated locally
# Redirects applied: /api/* → function
```

To use Option 2, you need netlify-cli installed. If it had installation issues, try:

```bash
npm install -D netlify-cli
# or use npx if not installed globally
npx netlify dev
```

### Testing API Endpoints

After starting dev server(s):

```bash
# Health check
curl http://localhost:3000/api/health-db

# Summary
curl http://localhost:3000/api/summary

# Batch run
curl -X POST http://localhost:3000/api/run-batch
```

Replace `localhost:3000` with the port shown when you run `npm run dev:all`.

## Webhook Handling

Webhooks (e.g., from Razorpay) need **raw request body** for HMAC signature verification.

### Current Status
- ✅ Raw body available in Netlify Functions via `serverless-http`
- ✅ Webhook route accepts JSON payloads
- ⚠️ HMAC verification **not yet implemented** (commented in [src/routes/webhooks.js](src/routes/webhooks.js#L20))

### To Enable Razorpay Webhook Verification

1. Get `RAZORPAY_WEBHOOK_SECRET` from Razorpay dashboard
2. Set it in Netlify environment variables
3. Uncomment the verification code in `src/routes/webhooks.js`
4. Redeploy

Example (currently commented):
```javascript
const crypto = require('crypto');
const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(req.rawBody)  // raw body available via serverless-http
  .digest('hex');

if (expectedSignature !== razorpaySignature) {
  return res.status(401).json({ status: 'error', message: 'Invalid signature' });
}
```

## Deployment Checklist

- [ ] **Local Testing**
  ```bash
  npm run dev:all
  curl http://localhost:3000/api/summary
  ```

- [ ] **Environment Variables**
  - [ ] Add all variables to Netlify dashboard (not .env!)
  - [ ] Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  - [ ] Set FRONTEND_ORIGIN to your Netlify domain

- [ ] **Build Configuration**
  - [ ] Confirm `npm run build` works locally
  - [ ] Check that `dist/` folder is generated
  - [ ] netlify.toml has correct `publish = "dist"`

- [ ] **API Routes**
  - [ ] Test GET /api/health-db from deployed site
  - [ ] Test GET /api/summary from deployed site
  - [ ] Test POST /api/run-batch from deployed site

- [ ] **Webhook Verification** (if using webhooks)
  - [ ] Test webhook endpoint signature verification
  - [ ] Monitor logs for any validation failures

- [ ] **Production URL**
  - [ ] https://razorbuild2026.netlify.app/api/health-db returns ok
  - [ ] Frontend can call /api/* endpoints without CORS errors

## Migration from Express to Netlify Functions

### What Changed
- ✅ `server.js` is now a thin wrapper (local dev only)
- ✅ `src/app.js` contains Express setup (new file)
- ✅ `netlify/functions/api.js` is the production handler (new file)
- ✅ Business logic (dataStore.js, recoveryEngine.js) unchanged
- ✅ Routes unchanged (just refactored import path)

### What Stayed the Same
- ✅ All API endpoints work identically
- ✅ Database queries via Supabase
- ✅ Batch processing logic
- ✅ Frontend fetch() calls (no changes needed!)

### No Breaking Changes
Your frontend's `fetch('/api/summary')` calls work exactly the same in development and production.

## Troubleshooting

### "Cannot find module serverless-http"
```bash
npm install serverless-http
```

### netlify-cli installation fails on Windows
```bash
# Try installing without postinstall script
npm install -D netlify-cli --ignore-scripts
# or use npx without global install
npx netlify dev
```

### `npm run dev:all` command not recognized
Netlify CLI might not be installed. Try:
```bash
npm install -D netlify-cli
# or
npx netlify dev
```

### Webhooks not receiving requests
1. Check webhook URL is correct: `https://razorbuild2026.netlify.app/webhooks/payment`
2. Verify netlify.toml redirect: `[[redirects]] from = "/webhooks/*"`
3. Check Netlify logs for any errors

### CORS errors in production
1. Verify FRONTEND_ORIGIN is set in Netlify environment
2. Check that it matches your site URL (should be auto-detected)
3. Confirm CORS middleware includes localhost for testing

### Batch timeout (>10 seconds on free tier)
1. Reduce batch size if processing thousands of records
2. Split into smaller jobs
3. Upgrade to Pro plan (26 second timeout)
4. Consider scheduled jobs instead of manual trigger

## Next Steps

1. **Local testing**: Run `npm run dev:all` and test endpoints
2. **Netlify setup**: Connect your Git repo to Netlify (if not already)
3. **Environment variables**: Add secrets in Netlify dashboard
4. **Deploy**: Push to git, Netlify auto-deploys
5. **Verify**: Test production endpoints
6. **Webhooks**: Enable and test Razorpay webhook verification

## Resources

- [Netlify Functions docs](https://docs.netlify.com/functions/overview/)
- [serverless-http docs](https://github.com/dougmoscrop/serverless-http)
- [Netlify CLI docs](https://cli.netlify.com/)
- [CORS in Netlify Functions](https://docs.netlify.com/functions/overview/#headers)
