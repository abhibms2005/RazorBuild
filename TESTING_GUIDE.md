# Testing Guide - Netlify Functions Backend

This guide covers testing the Netlify Functions backend both locally and after deployment.

## Prerequisites

- Node.js 18+ installed
- `.env` file configured with Supabase credentials
- Supabase project set up with tables: `payments`, `recovery_history`, `audit_log`

## Local Testing

### Option 1: Traditional Server (Separate Frontend & Backend)

Best for quick iteration on backend logic only.

```bash
# Terminal 1: Start frontend
npm run dev                  # Vite dev server on http://localhost:5173

# Terminal 2: Start backend server
npm run server              # Express server on http://localhost:3000
```

**Frontend URL:** http://localhost:5173
**Backend URL:** http://localhost:3000

**API calls in frontend:**
```javascript
// Needs explicit port
fetch('http://localhost:3000/api/summary')
```

### Option 2: Netlify Functions Emulator (Recommended)

Simulates production environment with redirects applied.

```bash
# Single command runs frontend + function emulator
npm run dev:all
```

This command:
1. Starts Vite dev server
2. Starts Netlify Functions emulator (port 8888 by default)
3. Applies `/api/*` redirects to the function
4. Shows URLs in terminal output

**Frontend URL:** http://localhost:3000 (or shown in output)
**Backend:** Emulated via function redirects

**API calls in frontend:**
```javascript
// Just /api/... — works because of redirects
fetch('/api/summary')
```

If `netlify-cli` installation had issues, try:
```bash
npx netlify dev
```

## API Testing

### Using curl / PowerShell

#### Health Check
```bash
curl http://localhost:3000/api/health-db
```

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/health-db" -UseBasicParsing
$response.Content | ConvertFrom-Json | Format-List
```

#### Summary Statistics
```bash
curl http://localhost:3000/api/summary
```

#### All Payment Records
```bash
curl http://localhost:3000/api/records
```

#### Audit Log
```bash
curl http://localhost:3000/api/audit
```

#### Run Batch Processing
```bash
curl -X POST http://localhost:3000/api/run-batch
```

### Using JavaScript/Fetch

```javascript
// Test from browser console or Node.js

// Health check
fetch('/api/health-db')
  .then(r => r.json())
  .then(d => console.log(d));

// Summary
fetch('/api/summary')
  .then(r => r.json())
  .then(d => console.log(d.summary));

// Batch run
fetch('/api/run-batch', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log(d.summary));
```

## Pre-Deployment Testing Checklist

### 1. Local Setup
- [ ] `.env` file exists with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- [ ] `npm install` completed successfully
- [ ] No TypeScript errors: `npm run build` succeeds

### 2. Traditional Server Testing
```bash
npm run server
```

In another terminal:
```bash
curl http://localhost:3000/api/health-db
# Should return: { "status": "ok", "message": "...", "paymentCount": N }

curl http://localhost:3000/api/summary
# Should return payment statistics

curl -X POST http://localhost:3000/api/run-batch
# Should trigger batch processing
```

- [ ] Server starts without errors
- [ ] `/api/health-db` returns 200 ok
- [ ] `/api/summary` returns statistics
- [ ] `/api/records` returns payment array
- [ ] `/api/audit` returns audit log
- [ ] `POST /api/run-batch` completes successfully

### 3. Netlify Functions Testing (if netlify-cli available)

```bash
npm run dev:all
# or
npx netlify dev
```

In browser or another terminal:
```bash
# Note: Port number will be shown (usually 8888 or 3000)
curl http://localhost:8888/api/health-db
curl http://localhost:8888/api/summary
curl -X POST http://localhost:8888/api/run-batch
```

- [ ] Frontend loads (http://localhost:XXXX)
- [ ] Redirects work: `/api/*` calls succeed
- [ ] `/api/health-db` returns ok
- [ ] `/api/summary` returns statistics
- [ ] Batch processing works via POST
- [ ] No CORS errors in console

### 4. Seed & Batch Testing

Test the full workflow:

```bash
# Populate database with test data
npm run seed
# Output: Generated 11 payments, 1 malformed record

# Process payments through recovery engine
npm run run-batch
# Output: Summary of processing results
```

- [ ] `npm run seed` completes successfully
- [ ] `npm run run-batch` processes all records
- [ ] Malformed record is skipped gracefully
- [ ] Recovery actions are generated
- [ ] Audit log entries are created
- [ ] `/api/records` shows updated payments

### 5. CORS Testing

With `npm run dev:all` running, test CORS from the browser:

```javascript
// In browser console at http://localhost:XXXX

fetch('/api/summary')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Should see response, NOT CORS error
```

- [ ] No CORS errors in browser console
- [ ] Response received successfully

## Production Deployment Testing

### After Deploying to Netlify

#### 1. Test Endpoints on Production URL

```bash
DOMAIN=razorbuild2026.netlify.app

# Health check
curl https://$DOMAIN/api/health-db

# Summary
curl https://$DOMAIN/api/summary

# Batch run
curl -X POST https://$DOMAIN/api/run-batch
```

#### 2. Browser Console Testing

Navigate to https://razorbuild2026.netlify.app and test in browser console:

```javascript
// All these should work without CORS issues
fetch('/api/health-db').then(r => r.json()).then(console.log);
fetch('/api/summary').then(r => r.json()).then(console.log);
fetch('/api/records').then(r => r.json()).then(console.log);
fetch('/api/audit').then(r => r.json()).then(console.log);
fetch('/api/run-batch', { method: 'POST' }).then(r => r.json()).then(console.log);
```

#### 3. Check Netlify Logs

In Netlify Dashboard → Functions → `api`:
- Look for any execution errors
- Check response times
- Verify cold start behavior

#### 4. Environment Variables Verification

In Netlify Dashboard → Site settings → Environment variables:
- [ ] SUPABASE_URL is set
- [ ] SUPABASE_SERVICE_ROLE_KEY is set (marked as secret)
- [ ] FRONTEND_ORIGIN is set to production URL

If environment variables are wrong or missing, functions will fail silently.

### Production Verification Checklist

- [ ] `https://razorbuild2026.netlify.app/api/health-db` returns 200 ok
- [ ] Status is "ok" and paymentCount > 0
- [ ] `/api/summary` returns payment statistics
- [ ] `/api/records` returns all payment records
- [ ] `/api/audit` returns audit log entries
- [ ] `POST /api/run-batch` completes in < 10 seconds
- [ ] No error logs in Netlify Functions dashboard
- [ ] Frontend can fetch from `/api/*` without CORS errors

### Testing Specific Scenarios

#### Cold Start Latency
First request to function after deployment may be slow (cold start).
```bash
# Time the first request
time curl https://razorbuild2026.netlify.app/api/health-db
# Typical: 1-3 seconds on first call, <100ms on subsequent calls
```

#### Batch Processing Performance
With production data:
```bash
# Monitor execution time in Netlify dashboard
curl -X POST https://razorbuild2026.netlify.app/api/run-batch
# Should complete within 10 seconds (free tier limit)
```

#### Webhook Endpoint Verification
Test webhook endpoint is accessible:
```bash
# Should return 400 (no valid payload)
curl -X POST https://razorbuild2026.netlify.app/webhooks/payment
```

- [ ] Returns error but is reachable
- [ ] Not returning 404
- [ ] No permission errors

## Debugging Tips

### Viewing Netlify Function Logs

```bash
# Install Netlify CLI globally (if not already)
npm install -g netlify-cli

# Stream logs while testing
netlify functions:invoke api --debug

# Or in Netlify Dashboard → Functions → api → Logs
```

### Local Function Invocation

```bash
# Test function locally (if netlify-cli works)
netlify functions:invoke api --queryStringParameters="test=1"
```

### Common Issues

#### Functions time out (>10 seconds)
- **Symptom:** Batch processing fails with timeout
- **Solution:** Reduce batch size or upgrade Netlify plan
- **Check:** Verify batch size in `npm run run-batch`

#### CORS errors in production
- **Symptom:** Browser console shows "No 'Access-Control-Allow-Origin' header"
- **Solution:** Check FRONTEND_ORIGIN environment variable in Netlify dashboard
- **Verification:** Should match your site URL

#### Database connection failures
- **Symptom:** `/api/health-db` returns 503
- **Solution:** Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify env
- **Check:** Test locally first with `npm run server`

#### Function not found (404)
- **Symptom:** `/api/*` returns 404
- **Solution:** Check netlify.toml redirects are correct
- **Verification:** `[[redirects]] from = "/api/*"` should exist

## Automated Testing (Optional)

You can add automated tests to catch regressions:

```bash
# Example: Test all endpoints
npm run test:api

# Would need to add test scripts to package.json
```

See [Testing Guide](./TESTING_SETUP.md) for setup instructions.

## Success Indicators

✅ **Local Dev Success:**
- `npm run server` starts without errors
- All `/api/*` endpoints respond with valid JSON
- `npm run run-batch` completes successfully

✅ **Netlify Dev Success:**
- `npm run dev:all` runs both frontend and functions
- Frontend loads and can call `/api/*` endpoints
- Redirects are working (check network tab)

✅ **Production Success:**
- Deployed site responds to `/api/*` calls
- Netlify dashboard shows function invocations
- No errors in function logs
- Response times acceptable (<2s typical)

---

If you encounter issues not covered here, check the [NETLIFY_FUNCTIONS_GUIDE.md](./NETLIFY_FUNCTIONS_GUIDE.md) for more details on architecture and configuration.
