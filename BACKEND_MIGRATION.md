# Revenue Recovery Backend Migration - Supabase

## Overview
This document describes the migration of the revenue-recovery-api backend from file-backed JSON data storage to Supabase (PostgreSQL) database.

## Architecture Changes

### Before (File-Based)
- Payments data: `data/synthetic_payments.json`
- Recovery history: Embedded in payment records
- Audit logs: `data/audit_log.jsonl`
- Single point of failure, limited scalability

### After (Supabase)
- Payments data: `payments` table (Supabase)
- Recovery history: `recovery_history` table with foreign key to payments
- Audit logs: `audit_log` table
- Cloud-based, scalable, with built-in backups and replication

## Database Schema (Existing Supabase Tables)

### payments
- `id` (text, primary key)
- `amount` (numeric/integer)
- `status` (text: pending, partial, recovered)
- `created_at` (timestamp)
- Related: `recovery_history` (one-to-many)

### recovery_history
- `id` (bigint, auto-generated primary key)
- `payment_id` (text, foreign key to payments)
- `action` (text: initial_recovery_attempt, second_recovery_attempt, escalated_recovery)
- `ts` (timestamp)

### audit_log
- `id` (bigint, auto-generated primary key)
- `action` (text)
- `ts` (timestamp)

## Installation & Setup

### 1. Environment Configuration
```bash
# Copy and update .env with your Supabase credentials
cp .env.example .env

# Required environment variables:
# PORT=3000
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
# FRONTEND_ORIGIN=https://razorbuild2026.netlify.app
```

### 2. Install Dependencies
```bash
npm install
```

## Running the Backend

### Development Server
```bash
npm run server
# Server runs on http://localhost:3000
```

### Generate Synthetic Data
```bash
npm run seed
# Clears all existing data and inserts 11 test payment records
# Includes 1 deliberately malformed record (missing amount) for testing error handling
```

### Run Recovery Batch
```bash
npm run run-batch
# Processes all payments through the recovery engine
# Inserts recovery actions into recovery_history table
# Logs all actions to audit_log table
```

## API Endpoints

### Health & Status
- **GET /health** - Server health check
- **GET /api/health-db** - Database connection verification
  - Returns: `{ status: "ok", message: "...", paymentCount: N }`

### Payment Operations
- **GET /api/summary** - Payment statistics
  - Returns: Count by status, total amount, recovery rates
- **GET /api/records** - All payment records with recovery history
  - Returns: Array of payment objects with nested recovery_history arrays
- **POST /api/run-batch** - Trigger recovery batch processing
  - Returns: Summary of batch results and updated payment state

### Audit & Logging
- **GET /api/audit** - Retrieve audit log entries
  - Returns: Array of audit entries with timestamps and actions

### Webhooks
- **POST /webhooks/payment** - Payment event webhooks
  - Supports: `payment.updated`, `recovery.completed` events

## Service Architecture

### Core Services

#### `src/services/supabaseClient.js`
- Single Supabase client instance exported for use throughout the app
- Configures authentication with service role key (server-side only)
- Error handling for missing environment variables

#### `src/services/dataStore.js`
- Data access layer implementing the same function signatures as before
- All functions now backed by Supabase queries instead of file I/O
- Functions:
  - `loadPayments()` - Fetch all payments with recovery history
  - `upsertPayment(record)` - Insert or update payment + recovery history
  - `appendAudit(entry)` - Add audit log entry
  - `loadAudit()` - Fetch all audit entries
  - `resetAudit()` - Clear audit log (used before batch runs)

#### `src/services/recoveryEngine.js`
- Business logic for analyzing payments and determining recovery actions
- Functions:
  - `processBatch(payments, callbacks)` - Main batch processing logic
  - `analyzePayment(payment)` - Determine if recovery action is needed

### Routes

#### `src/routes/api.js`
- All API endpoints for payment operations and batch processing
- Implements database operations using dataStore functions
- Error handling and JSON responses

#### `src/routes/webhooks.js`
- Webhook receiver for external payment system events
- Supports payment update and recovery completion events

### Scripts

#### `src/scripts/generateSyntheticData.js`
- Clears payments, recovery_history, and audit_log tables
- Generates 10 well-formed test payment records + 1 malformed record
- Inserts directly into Supabase (not to JSON files)

#### `src/scripts/runRecoveryBatch.js`
- CLI script to run batch processing
- Loads payments, processes through engine, writes results back
- Prints summary metrics to console

## Error Handling

### Database Errors
- All database operations include try-catch blocks
- Errors are logged to console and rethrown to calling code
- Calling code (routes, scripts) can handle errors appropriately

### Malformed Records
- Records with missing `amount` field are detected and skipped
- They are logged to audit_log with action: `malformed_record_detected`
- Batch processing continues for other records

### Audit Log Errors
- If audit logging fails, errors are caught and logged but don't block main operations
- This ensures payment processing continues even if audit logging has issues

## Deployment

### Using Procfile (Render, Railway, Heroku)
```bash
# server.js is configured to read PORT from process.env.PORT
# Procfile specifies: web: node server.js
# Deploy to your hosting platform and set environment variables
```

### Environment Variables for Deployment
Set these on your deployment platform:
- `PORT` - Port to listen on (usually set by platform, default 3000)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep as secret environment variable)
- `FRONTEND_ORIGIN` - Your frontend URL for CORS
- `NODE_ENV` - Optional, for production/development mode

### CORS Configuration
- Configured to allow requests from frontend domain specified in FRONTEND_ORIGIN env var
- Also allows localhost for development
- Add additional origins as needed in `server.js` corsOptions

## Testing Verification Checklist

✅ **Seed Data Generation**
- `npm run seed` clears all tables and inserts test data
- All 11 payments inserted (including 1 malformed)
- Database ready for batch processing

✅ **Batch Processing**
- `npm run run-batch` processes all payments
- Recovery actions generated for eligible payments
- Malformed records gracefully skipped
- Results written back to Supabase
- Audit log entries created for all actions

✅ **API Endpoints**
- `GET /api/health-db` returns database connection status
- `GET /api/summary` returns live statistics from database
- `GET /api/records` returns all payment records with recovery history
- `GET /api/audit` returns audit log entries
- `POST /api/run-batch` triggers batch processing via API

✅ **Real-time Database Queries**
- All API endpoints query Supabase live (not cached)
- Data reflects current state after batch runs
- Recovery history properly linked to payments

## Migration Notes

### Data Model Differences
- Payment records now stored with auto-incrementing database IDs
- Recovery history has separate table with proper foreign keys
- Audit log has auto-incrementing IDs and proper indexing

### Function Signatures
- All public functions maintain same signatures as before
- No changes needed in calling code (routes, etc.)
- Internal implementation completely changed to use Supabase

### Performance Considerations
- Queries include nested selects for related data (recovery_history)
- Large datasets can be paginated by adding .range() to queries if needed
- Database connections pooled through Supabase client

## Troubleshooting

### "SUPABASE_URL not found" Error
- Ensure .env file has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Never commit .env to git (use .env.example template instead)

### Database Connection Fails
- Verify Supabase credentials in .env are correct
- Check that Supabase project is active and accessible
- Use `GET /api/health-db` endpoint to test connection

### Malformed Records Not Processing
- This is expected behavior - records with missing amount are skipped
- Check audit log to see malformed_record_detected actions
- This is required for testing error handling

### Recovery History Not Saving
- Verify recovery_history table exists in Supabase
- Check that records have valid payment_id values
- Look for insert errors in batch run output

## Next Steps

1. Deploy to your hosting platform (Render, Railway, Heroku, etc.)
2. Set environment variables on deployment platform
3. Verify health endpoint works: `https://your-domain.com/api/health-db`
4. Test batch runs via API: `POST https://your-domain.com/api/run-batch`
5. Monitor audit logs for any issues
6. Consider setting up automatic batch runs via scheduled jobs/cron
