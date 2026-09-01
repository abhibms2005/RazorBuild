# Quick Reference Guide

## Development Commands

```bash
# Install dependencies
npm install

# Local development (separate frontend + backend)
npm run dev              # Terminal 1: Frontend (http://localhost:5173)
npm run server           # Terminal 2: Backend (http://localhost:3000)

# Local development (unified, with Netlify Functions emulator)
npm run dev:all          # Frontend + Functions on http://localhost:3000

# Production build
npm run build            # Generates dist/ + netlify/functions/

# Database operations
npm run seed             # Populate Supabase with test data
npm run run-batch        # Process payments through recovery engine
```

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/health-db` | Database connection status & payment count |

### Payment Data

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/summary` | Aggregated payment statistics |
| GET | `/api/records` | All payments with recovery history |
| GET | `/api/audit` | Audit log entries |

### Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/run-batch` | Trigger payment recovery batch processing |
| POST | `/webhooks/payment` | Webhook receiver for payment events |

## Environment Variables

Required in `.env` for local development:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
FRONTEND_ORIGIN=http://localhost:5173
```

For production (set in Netlify Dashboard → Site settings → Environment variables):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
FRONTEND_ORIGIN=https://razorbuild2026.netlify.app
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret  # Optional
```

## Project Structure

```
d:\Razorpay/
├── src/
│   ├── app.js                          # Express app configuration
│   ├── components/                     # React components
│   ├── pages/                          # Page components
│   ├── services/
│   │   ├── supabaseClient.js          # Supabase client instance
│   │   ├── dataStore.js               # Data access layer
│   │   └── recoveryEngine.js          # Recovery business logic
│   ├── routes/
│   │   ├── api.js                     # API routes
│   │   └── webhooks.js                # Webhook routes
│   └── scripts/
│       ├── generateSyntheticData.js   # Database seeding
│       └── runRecoveryBatch.js        # CLI batch processing
│
├── netlify/
│   └── functions/
│       └── api.js                      # Netlify Function handler
│
├── server.js                           # Local dev server wrapper
├── netlify.toml                        # Netlify configuration
├── vite.config.ts                      # Vite configuration
├── package.json                        # Dependencies & scripts
└── index.html                          # HTML entry point
```

## Common Tasks

### Add a New API Endpoint

1. **Define the route** in `src/routes/api.js`:
```javascript
router.get('/my-endpoint', (req, res) => {
  // Your logic here
  res.json({ data: 'value' });
});
```

2. **Restart server** or save (auto-reload in dev)

3. **Test it**:
```bash
curl http://localhost:3000/api/my-endpoint
```

### Access Database

All database access goes through `src/services/dataStore.js`:

```javascript
import { loadPayments, upsertPayment, appendAudit } from './services/dataStore.js';

// Load all payments with recovery history
const payments = await loadPayments();

// Update a payment
await upsertPayment({
  id: 'pay_xxx',
  status: 'recovered',
  recovery_history: [{ action: 'initial_contact', ts: new Date() }]
});

// Add audit log entry
await appendAudit({ action: 'batch_run_completed', ts: new Date() });
```

### Process Payments with Recovery Engine

```javascript
import { processBatch } from './services/recoveryEngine.js';

const payments = await loadPayments();
await processBatch(payments, { appendAudit });
```

The recovery engine:
- Analyzes each payment
- Determines recovery actions (initial → second → escalated)
- Generates recovery history entries
- Logs actions to audit log
- Skips malformed records gracefully

### Debug Locally

**Option 1: VS Code Debugger**
```bash
# In VS Code, press F5 or use Run menu
# Breakpoints work in all .js files
```

**Option 2: Console Logging**
```javascript
console.log('Debug info:', value);  // Shows in terminal
```

**Option 3: Browser DevTools**
- For frontend React code
- Open DevTools: F12 or Ctrl+Shift+I
- Network tab shows API calls

## Deployment

### Prerequisites

- Git repository connected to Netlify
- Environment variables set in Netlify Dashboard
- `netlify.toml` configured with functions path
- `npm run build` succeeds locally

### Deploy

```bash
# Verify locally first
npm run build

# Commit and push
git add .
git commit -m "Feature or fix description"
git push

# Netlify automatically:
# 1. Pulls latest code
# 2. Runs npm run build
# 3. Deploys frontend to dist/
# 4. Deploys functions from netlify/functions/
# 5. Applies redirects from netlify.toml
```

### Monitor Deployment

- Netlify Dashboard → Deployments tab
- Check build log for errors
- Visit https://razorbuild2026.netlify.app to verify

### After Deployment

```bash
# Verify endpoints
curl https://razorbuild2026.netlify.app/api/health-db

# Check function logs
# Netlify Dashboard → Functions → api → Logs
```

## Troubleshooting

### Issue: "Cannot find module" error

```
Error: Cannot find module './services/dataStore.js'
```

**Solution:**
- Ensure file exists at that path
- Check path is relative from the importing file
- Verify file has `export default` or `export { name }`

### Issue: CORS error in browser

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**
- **Local dev:** Ensure `FRONTEND_ORIGIN=http://localhost:5173` in .env
- **Production:** Check `FRONTEND_ORIGIN` in Netlify environment variables
- **If using traditional server:** Make sure `npm run server` is running (not functions)

### Issue: Database connection fails

```
Error: SUPABASE_URL is not configured
```

**Solutions:**
- Check `.env` file exists
- Verify SUPABASE_URL is set correctly (no /rest/v1 path)
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- For production: Check Netlify Dashboard environment variables

### Issue: Batch processing timeout

```
Error: Function timeout after 10 seconds
```

**Solutions:**
- Reduce batch size (if processing huge dataset)
- Optimize queries in `dataStore.js`
- Upgrade to Netlify Pro tier (26 second limit)
- Check network/database performance

### Issue: Cannot start server

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :3000
kill -9 <PID>
```

## Performance Tips

### API Response Times (Expected)

| Endpoint | Local | Production |
|----------|-------|------------|
| `/api/health-db` | <10ms | 50-100ms |
| `/api/summary` | <50ms | 100-200ms |
| `/api/records` | <100ms | 200-500ms |
| `POST /api/run-batch` | <3s | 2-5s |

### Optimize Slow Queries

1. Check `dataStore.js` for query logic
2. Use `.select()` to fetch only needed columns
3. Add `.limit()` if processing huge datasets
4. Profile with Netlify analytics

## Resources

- [NETLIFY_FUNCTIONS_GUIDE.md](./NETLIFY_FUNCTIONS_GUIDE.md) - Full architecture
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing procedures
- [NETLIFY_MIGRATION_SUMMARY.md](./NETLIFY_MIGRATION_SUMMARY.md) - Migration details
- [Supabase Docs](https://supabase.com/docs)
- [Express.js Docs](https://expressjs.com/)
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)

---

**Last Updated:** September 1, 2026  
**Status:** ✅ Production Ready
