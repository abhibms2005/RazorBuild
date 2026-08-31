# Quick Start Guide - Revenue Recovery Backend

## 🚀 Get Started in 5 Minutes

### Step 1: Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Supabase credentials:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
# FRONTEND_ORIGIN=https://razorbuild2026.netlify.app
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Seed Database with Test Data
```bash
npm run seed
# Output: Generated 11 payment records (includes 1 malformed for testing)
```

### Step 4: Start the Server
```bash
npm run server
# Output: 🚀 Revenue Recovery API server is running on port 3000
```

### Step 5: Test the API
```bash
# In another terminal:
curl http://localhost:3000/api/summary
curl http://localhost:3000/api/records
curl http://localhost:3000/api/health-db
```

## 📝 Common Commands

```bash
# Development
npm run server              # Start backend server
npm run seed               # Reset database with test data
npm run run-batch          # Process payments through recovery engine

# Production
PORT=5000 npm run server   # Run on different port
```

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Server status |
| GET | `/api/health-db` | Database connection check |
| GET | `/api/summary` | Payment statistics |
| GET | `/api/records` | All payment records |
| GET | `/api/audit` | Audit log entries |
| POST | `/api/run-batch` | Trigger batch processing |

## 🗄️ Database Integration

All data is stored in Supabase PostgreSQL tables:
- `payments` - Payment records
- `recovery_history` - Recovery action history
- `audit_log` - Operation audit trail

Data is queried and updated in real-time through Supabase client.

## 📚 Learn More

- [Full Migration Guide](./BACKEND_MIGRATION.md)
- [Completion Summary](./MIGRATION_COMPLETE.md)
- [Supabase Docs](https://supabase.com/docs)

## 🆘 Troubleshooting

**Server won't start?**
- Check PORT is not in use
- Verify .env file exists and has SUPABASE_URL

**API returns 503 error?**
- Run `curl http://localhost:3000/api/health-db`
- Verify Supabase credentials in .env

**Data not appearing?**
- Run `npm run seed` to populate database
- Check Supabase project is active

## 🚀 Deploy to Production

1. Push code to Git repository
2. Set environment variables on your hosting platform
3. Deploy using your platform's deployment method
4. Verify with: `curl https://your-domain.com/api/health-db`

That's it! Your revenue recovery backend is ready to go.
