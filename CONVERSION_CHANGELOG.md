# ESM to CommonJS Conversion Changelog

**Date:** December 2024  
**Reason:** Fix production crash "TypeError - Router.use() requires a middleware function but got a Object"  
**Root Cause:** Netlify's esbuild bundler compiles ESM to CommonJS for AWS Lambda, causing `export default X` → `{default: X}` mismatch

---

## Summary
✅ **10 backend files successfully converted from ESM to CommonJS**  
✅ **package.json updated: `"type": "module"` → `"type": "commonjs"`**  
✅ **All `import` statements replaced with `require()`**  
✅ **All `export default` statements replaced with `module.exports`**  
✅ **All `export function/async function` replaced with function definitions + named exports**

---

## File-by-File Conversion Report

### 1. **src/services/supabaseClient.js** ✅
**Lines Changed:** 1-16 (entire file)

**Before (ESM):**
```javascript
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
...
export default supabase;
```

**After (CommonJS):**
```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
...
module.exports = supabase;
```

**Key Changes:**
- `import 'dotenv/config'` → `require('dotenv').config()`
- `import { createClient }` → `const { createClient } = require()`
- `export default supabase` → `module.exports = supabase`

---

### 2. **src/services/dataStore.js** ✅
**Lines Changed:** 1 + 5 function exports + end-of-file module.exports

**Before (ESM - 5 named exports):**
```javascript
import supabase from './supabaseClient.js';

export async function loadPayments() { ... }
export async function upsertPayment(record) { ... }
export async function appendAudit(entry) { ... }
export async function loadAudit() { ... }
export async function resetAudit() { ... }
```

**After (CommonJS):**
```javascript
const supabase = require('./supabaseClient.js');

async function loadPayments() { ... }
async function upsertPayment(record) { ... }
async function appendAudit(entry) { ... }
async function loadAudit() { ... }
async function resetAudit() { ... }

module.exports = {
  loadPayments,
  upsertPayment,
  appendAudit,
  loadAudit,
  resetAudit
};
```

**Key Changes:**
- `import supabase` → `const supabase = require()`
- Removed `export` keyword from all 5 functions
- Added `module.exports` object at end-of-file with all named exports

---

### 3. **src/services/recoveryEngine.js** ✅
**Lines Changed:** 1 function export + end-of-file module.exports

**Before (ESM):**
```javascript
export async function processBatch(payments, { appendAudit }) { ... }
function analyzePayment(payment) { ... }
```

**After (CommonJS):**
```javascript
async function processBatch(payments, { appendAudit }) { ... }
function analyzePayment(payment) { ... }

module.exports = {
  processBatch
};
```

**Key Changes:**
- Removed `export` keyword from `processBatch`
- Added `module.exports` object with named export
- `analyzePayment` remains internal (not exported)

---

### 4. **src/routes/api.js** ✅
**Lines Changed:** 1-4 (imports) + line 189 (export)

**Before (ESM):**
```javascript
import express from 'express';
import * as dataStore from '../services/dataStore.js';
import { processBatch } from '../services/recoveryEngine.js';
import supabase from '../services/supabaseClient.js';

const router = express.Router();
...
export default router;
```

**After (CommonJS):**
```javascript
const express = require('express');
const dataStore = require('../services/dataStore.js');
const { processBatch } = require('../services/recoveryEngine.js');
const supabase = require('../services/supabaseClient.js');

const router = express.Router();
...
module.exports = router;
```

**Key Changes:**
- All 4 `import` statements → `require()`
- `import * as dataStore` → `const dataStore = require()` (works with named exports object)
- `import { processBatch }` → `const { processBatch } = require()`
- `import supabase` → `const supabase = require()`
- `export default router` → `module.exports = router`

---

### 5. **src/routes/webhooks.js** ✅
**Lines Changed:** 1-2 (imports) + line 101 (export)

**Before (ESM):**
```javascript
import express from 'express';
import * as dataStore from '../services/dataStore.js';

const router = express.Router();
...
export default router;
```

**After (CommonJS):**
```javascript
const express = require('express');
const dataStore = require('../services/dataStore.js');

const router = express.Router();
...
module.exports = router;
```

**Key Changes:**
- `import express` → `const express = require()`
- `import * as dataStore` → `const dataStore = require()`
- `export default router` → `module.exports = router`

---

### 6. **src/app.js** ✅
**Lines Changed:** 1-28 (imports + validation), line 86 (export)

**Before (ESM - with workarounds):**
```javascript
import 'dotenv/config';
import express from 'express';
import corsModule from 'cors';
import * as apiRoutesModule from './routes/api.js';
import * as webhookRoutesModule from './routes/webhooks.js';

const cors = corsModule && corsModule.default ? corsModule.default : corsModule;
const apiRoutes = apiRoutesModule.default;
const webhookRoutes = webhookRoutesModule.default;

if (!apiRoutes || typeof apiRoutes !== 'function') {
  throw new Error(`Invalid apiRoutes import...`);
}
if (!webhookRoutes || typeof webhookRoutes !== 'function') {
  throw new Error(`Invalid webhookRoutes import...`);
}

const app = express();
...
export default app;
```

**After (CommonJS - clean):**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api.js');
const webhookRoutes = require('./routes/webhooks.js');

const app = express();
...
module.exports = app;
```

**Key Changes:**
- `import 'dotenv/config'` → `require('dotenv').config()`
- All 4 module imports → direct `require()` statements
- **Removed all validation checks** - no longer needed because CommonJS doesn't have interop issues
- Routes now imported directly as router objects (no `.default` workaround)
- `export default app` → `module.exports = app`

---

### 7. **netlify/functions/api.js** ✅
**Lines Changed:** 1-2 (imports) + line 11 (export)

**Before (ESM):**
```javascript
import serverless from 'serverless-http';
import app from '../../src/app.js';
...
export { handler };
```

**After (CommonJS):**
```javascript
const serverless = require('serverless-http');
const app = require('../../src/app.js');
...
module.exports = { handler };
```

**Key Changes:**
- `import serverless` → `const serverless = require()`
- `import app` → `const app = require()`
- `export { handler }` → `module.exports = { handler }`

---

### 8. **server.js** ✅
**Lines Changed:** 1-2 (imports)

**Before (ESM):**
```javascript
import 'dotenv/config';
import app from './src/app.js';
```

**After (CommonJS):**
```javascript
require('dotenv').config();
const app = require('./src/app.js');
```

**Key Changes:**
- `import 'dotenv/config'` → `require('dotenv').config()`
- `import app` → `const app = require()`

---

### 9. **src/scripts/generateSyntheticData.js** ✅
**Lines Changed:** 1-2 (imports)

**Before (ESM):**
```javascript
import 'dotenv/config';
import supabase from '../services/supabaseClient.js';
```

**After (CommonJS):**
```javascript
require('dotenv').config();
const supabase = require('../services/supabaseClient.js');
```

**Key Changes:**
- `import 'dotenv/config'` → `require('dotenv').config()`
- `import supabase` → `const supabase = require()`

---

### 10. **src/scripts/runRecoveryBatch.js** ✅
**Lines Changed:** 1-3 (imports)

**Before (ESM):**
```javascript
import 'dotenv/config';
import * as dataStore from '../services/dataStore.js';
import { processBatch } from '../services/recoveryEngine.js';
```

**After (CommonJS):**
```javascript
require('dotenv').config();
const dataStore = require('../services/dataStore.js');
const { processBatch } = require('../services/recoveryEngine.js');
```

**Key Changes:**
- `import 'dotenv/config'` → `require('dotenv').config()`
- `import * as dataStore` → `const dataStore = require()`
- `import { processBatch }` → `const { processBatch } = require()`

---

### 11. **src/scripts/checkSchema.js** ✅
**Lines Changed:** 1-2 (imports)

**Before (ESM):**
```javascript
import 'dotenv/config';
import supabase from '../services/supabaseClient.js';
```

**After (CommonJS):**
```javascript
require('dotenv').config();
const supabase = require('../services/supabaseClient.js');
```

**Key Changes:**
- `import 'dotenv/config'` → `require('dotenv').config()`
- `import supabase` → `const supabase = require()`

---

### 12. **package.json** ✅
**Line Changed:** 4

**Before:**
```json
  "type": "module",
```

**After:**
```json
  "type": "commonjs",
```

**Critical Change:**
- This setting forces all `.js` files to use CommonJS syntax instead of ESM
- Enables Node.js native support for `require()` and `module.exports`
- Required for Netlify Functions bundler compatibility

---

## Validation Results

### ✅ ESM Syntax Verification
- Grep search for `^import |^export` across all backend files: **0 matches** ✓
- All 10 backend files verified clean of ESM syntax ✓

### ✅ Local Testing
- `npm run server` starts successfully ✓
- All endpoints respond correctly:
  - `GET /api/health-db` → Returns `{status: ok, paymentCount: 11}` ✓
  - `GET /api/summary` → Returns statistics ✓
  - `GET /api/records` → Returns payment array ✓
  - `GET /api/audit` → Returns audit log ✓
  - `POST /api/run-batch` → Completes successfully ✓

### ⚡ Production Readiness
- CommonJS is compatible with Netlify's esbuild bundler ✓
- No more `export default router` → `{default: router}` mismatch ✓
- Express middleware registration will work correctly ✓
- No `Router.use() requires a middleware function` errors expected ✓

---

## Why This Fix Works

**Problem:** Netlify's bundler compiles ESM source to CommonJS for AWS Lambda
- ESM: `export default router` 
- Bundled to CommonJS: `{default: router}` (object, not function)
- Express crash: `app.use(middleware)` expects function, got object

**Solution:** Pure CommonJS throughout
- Source: `module.exports = router` (function)
- Bundled: `module.exports = router` (same - no interop)
- Express happy: `app.use(middleware)` receives function ✓

---

## Post-Deployment Checklist

- [ ] Build succeeds on Netlify CI/CD
- [ ] Deploy to production
- [ ] Test: `GET https://razorbuild2026.netlify.app/api/health-db`
- [ ] Verify no "Router.use() requires a middleware function" errors
- [ ] Monitor Netlify Functions logs for any issues
- [ ] All 5 endpoints responding correctly in production

