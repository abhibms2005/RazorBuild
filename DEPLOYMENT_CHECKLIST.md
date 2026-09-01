# Production Deployment Checklist

**Status:** [ ] Complete  
**Date Started:** _______________  
**Date Completed:** _______________  
**Deployed By:** _______________  

---

## Pre-Deployment (LOCAL)

### Code Quality
- [ ] Run `npm run build` successfully (no errors)
- [ ] Run `npm run server` and verify starts without errors
- [ ] No console errors or warnings

### API Testing
- [ ] `curl http://localhost:3000/api/health-db` → 200 ok
- [ ] `curl http://localhost:3000/api/summary` → Returns statistics
- [ ] `curl http://localhost:3000/api/records` → Returns payment array
- [ ] `curl http://localhost:3000/api/audit` → Returns audit log
- [ ] `curl -X POST http://localhost:3000/api/run-batch` → Processes batch
- [ ] Browser console at localhost:5173 → No CORS errors
- [ ] Database seed works: `npm run seed`
- [ ] Batch processing works: `npm run run-batch`

### Git Preparation
- [ ] All changes committed: `git status` shows clean working directory
- [ ] Branch is main/production: `git branch` shows correct branch
- [ ] Latest changes pushed: `git log` shows your commits
- [ ] No uncommitted changes: `git status` is clean

---

## Netlify Dashboard Setup

### Environment Variables
Navigate to: **Netlify Dashboard → Site settings → Environment variables**

- [ ] Add `SUPABASE_URL`
  - Value: `https://your-project.supabase.co`
  - ⚠️ Do NOT include `/rest/v1` path
  
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY`
  - Value: [Paste from Supabase dashboard]
  - Mark as Secret: ✅ Yes
  
- [ ] Add `FRONTEND_ORIGIN`
  - Value: `https://razorbuild2026.netlify.app`
  - ⚠️ Must match your Netlify domain
  
- [ ] Add `RAZORPAY_WEBHOOK_SECRET` (if using webhooks)
  - Value: [Paste from Razorpay dashboard]
  - Mark as Secret: ✅ Yes
  - (Optional, can be added later)

**After adding environment variables:**
- [ ] Click "Save" button (if present)
- [ ] Dashboard shows all variables listed
- [ ] Critical variables are marked as Secret (🔒)

### Configuration Verification
- [ ] `netlify.toml` exists in repo root
- [ ] `netlify.toml` contains `[build]` section
- [ ] `functions = "netlify/functions"` in [build]
- [ ] `publish = "dist"` in [build]
- [ ] `[[redirects]]` sections for `/api/*` and `/webhooks/*`

---

## Deployment

### Execute Deployment

**Option 1: Push to Git (Recommended)**
```bash
# In terminal
git add .
git commit -m "Deploy Phase 2: Netlify Functions migration"
git push origin main

# Watch deployment in Netlify Dashboard
```

- [ ] Push completes without errors
- [ ] Netlify Dashboard shows deployment in progress
- [ ] Build log shows no errors

**Option 2: Direct Netlify CLI (if available)**
```bash
netlify deploy --prod
```

- [ ] Deployment succeeds
- [ ] Production URL shown in output

### Monitor Build

In **Netlify Dashboard → Deployments tab:**

- [ ] Build starts automatically (after git push)
- [ ] Build log shows:
  - `npm run build` executing
  - No TypeScript errors
  - No missing dependencies
  - Functions bundling successfully
- [ ] Deployment completes (green checkmark)
- [ ] New deploy shows in list with timestamp
- [ ] Build time: 1-3 minutes (normal)

**If build fails:**
- [ ] Check build log for specific error
- [ ] Common issues: Missing env vars, TypeScript errors
- [ ] See [Troubleshooting](#troubleshooting) section below

---

## Post-Deployment Verification (PRODUCTION)

### Basic Health Check
```bash
curl https://razorbuild2026.netlify.app/api/health-db
```

- [ ] Returns HTTP 200 ok
- [ ] Response includes: `{status: "ok", message: "...", paymentCount: ...}`
- [ ] paymentCount is a number > 0 (e.g., 11)

### API Endpoints
```bash
curl https://razorbuild2026.netlify.app/api/summary
```

- [ ] Returns HTTP 200 ok
- [ ] Response includes: `{byStatus: {...}, totalAmount: ...}`

```bash
curl https://razorbuild2026.netlify.app/api/records
```

- [ ] Returns HTTP 200 ok
- [ ] Response is an array of payment objects

```bash
curl https://razorbuild2026.netlify.app/api/audit
```

- [ ] Returns HTTP 200 ok
- [ ] Response is an array of audit entries (can be empty)

```bash
curl -X POST https://razorbuild2026.netlify.app/api/run-batch
```

- [ ] Returns HTTP 200 ok
- [ ] Response includes: `{status: "success", summary: {...}}`
- [ ] Completes in <10 seconds

### Frontend Verification
- [ ] Visit https://razorbuild2026.netlify.app in browser
- [ ] Frontend loads without errors
- [ ] Browser console (F12) shows no errors
- [ ] Try fetching data:
  ```javascript
  fetch('/api/summary').then(r => r.json()).then(console.log)
  ```
- [ ] Should return valid data without CORS errors

### Function Logs
In **Netlify Dashboard → Functions → api:**

- [ ] Function invocations showing up
- [ ] No error messages in logs
- [ ] Response times reasonable (100-500ms typical)
- [ ] Cold start observable (first call slower)

---

## Smoke Tests (Comprehensive)

### Database Connection
- [ ] Health check confirms database connected
- [ ] Payment count > 0
- [ ] No authentication errors

### Data Retrieval
- [ ] Summary returns valid statistics
- [ ] Records endpoint returns payment array
- [ ] Audit endpoint returns audit log
- [ ] All responses are valid JSON

### Operations
- [ ] Batch processing can be triggered via POST
- [ ] Processing completes without timeout
- [ ] Results are consistent with test data

### Error Handling
- [ ] Invalid endpoint returns 404
- [ ] Malformed JSON request returns 400
- [ ] Missing required fields handled gracefully

---

## Rollback Plan (If Issues)

If deployment has critical issues:

```bash
# Option 1: Revert in Git
git revert <commit-hash>
git push

# Option 2: Rollback in Netlify Dashboard
# Netlify → Deployments → Find previous successful deploy → Publish
```

- [ ] Revert commit created (if using git revert)
- [ ] Previous version deployed
- [ ] Verify previous version working
- [ ] Investigate issue before re-deploying

---

## Performance Baseline

Record these metrics for future comparison:

| Metric | Value | Notes |
|--------|-------|-------|
| Build time | ___ min | From push to deploy |
| Cold start | ___ ms | First function invocation |
| Warm latency | ___ ms | Subsequent invocations |
| Batch time | ___ s | POST /api/run-batch |
| Error rate | ___ % | Should be 0% |

---

## Post-Deployment Tasks

### Immediate (First Day)
- [ ] Monitor Netlify Functions dashboard for errors
- [ ] Monitor response times and invocation count
- [ ] Test batch processing with production data (if available)
- [ ] Verify webhook endpoint accessible (POST /webhooks/payment)
- [ ] Confirm frontend data loading works

### Short Term (First Week)
- [ ] Implement webhook signature verification (if using Razorpay)
- [ ] Test with real Razorpay webhook events
- [ ] Monitor performance under production load
- [ ] Check error logs daily for issues

### Medium Term (First Month)
- [ ] Review analytics and usage patterns
- [ ] Optimize queries if needed
- [ ] Plan for scaling if batch size increases
- [ ] Document any production adjustments

---

## Troubleshooting

### Build Fails with "Module not found"
**Error:** `Cannot find module '@supabase/supabase-js'`

**Solution:**
1. Check netlify.toml has correct build command
2. Run `npm install` locally to verify dependencies
3. Ensure package.json is committed
4. Re-trigger build from Netlify dashboard

### Endpoints Return 503 Service Unavailable
**Symptom:** `/api/health-db` returns 503

**Causes & Solutions:**
1. **Missing environment variables:**
   - Check Netlify Dashboard → Environment variables
   - Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
   - Redeploy after adding variables

2. **Wrong variable values:**
   - Verify SUPABASE_URL matches actual Supabase project
   - Check SUPABASE_SERVICE_ROLE_KEY hasn't expired
   - Test values locally first

3. **Network connectivity:**
   - Check Netlify Functions can reach Supabase
   - Verify Supabase IP whitelist (if using)

### CORS Errors in Browser
**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Check FRONTEND_ORIGIN in Netlify environment variables
2. Must match your site URL exactly: `https://razorbuild2026.netlify.app`
3. Redeploy after fixing
4. Clear browser cache (Ctrl+Shift+Del)

### Function Times Out
**Error:** `Function execution timeout` (after 10+ seconds)

**Solution:**
1. Check batch size in `npm run run-batch`
2. For small batches (<100): Should complete in <5 seconds
3. For large batches: Consider upgrading to Pro tier (26s limit)
4. Monitor execution time in Netlify dashboard

### Cannot Find netlify.toml
**Error:** During build or deployment

**Solution:**
1. Verify netlify.toml exists in repo root
2. Git add and commit file
3. Push changes
4. Re-trigger deploy

---

## Success Indicators

### ✅ Deployment Successful When:
- Build completes without errors
- No 503 errors on health check
- All endpoints return 200 ok
- Frontend loads without CORS errors
- Batch processing completes in <10 seconds
- No errors in Netlify function logs

### 🔴 Issues If:
- Build fails with error
- Health check returns 503
- Database connection fails
- CORS errors in browser console
- Batch processing times out
- Functions show error logs

---

## Sign-Off

**Deployment Owner:** _______________  
**Verified By:** _______________  
**Date:** _______________  
**Status:** [ ] Successful [ ] Failed (see rollback plan)  

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

**Need Help?** See:
- [PHASE_2_COMPLETION.md](./PHASE_2_COMPLETION.md) - Full completion summary
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing procedures & troubleshooting
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick reference guide

**Last Updated:** September 1, 2026
