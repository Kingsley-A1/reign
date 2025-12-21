# Reign - Backend Management Handbook

## 📋 Table of Contents

1. [Current Architecture](#current-architecture)
2. [Critical Production Issues](#critical-production-issues)
3. [Database Implementation Plan](#database-implementation-plan)
4. [Security Hardening](#security-hardening)
5. [Deployment Guide](#deployment-guide)
6. [API Reference](#api-reference)
7. [Environment Variables](#environment-variables)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Cost Estimation](#cost-estimation)

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     REIGN ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Frontend (PWA)          Backend API           Storage      │
│   ─────────────          ───────────           ─────────     │
│                                                              │
│   ┌──────────┐          ┌──────────┐          ┌──────────┐  │
│   │ index.   │   HTTP   │ Express  │   S3     │ Cloudflare│ │
│   │ html     │ ───────► │ server.js│ ───────► │ R2        │ │
│   │ queen.   │          │ :3001    │          │           │ │
│   │ html     │          └──────────┘          └──────────┘  │
│   │ admin.   │               │                              │
│   │ html     │               ▼                              │
│   └──────────┘          ┌──────────┐                        │
│                         │ In-Memory│  ⚠️ DATA LOST ON       │
│                         │ Map()    │     SERVER RESTART!    │
│                         └──────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Current Tech Stack

| Component | Technology | Status |
|-----------|------------|--------|
| Server | Express.js | ✅ Working |
| Auth | JWT + bcrypt | ✅ Working |
| Storage | Cloudflare R2 | ✅ Configured |
| User Store | **In-Memory Map()** | ⚠️ CRITICAL |
| Rate Limiting | express-rate-limit | ✅ Working |
| File Upload | multer | ✅ Working |

---

## Critical Production Issues

### 🚨 CRITICAL #1: In-Memory User Storage

**Problem:** Users are stored in a JavaScript `Map()` in memory. When the server restarts, ALL USER DATA IS LOST.

**Location:** `api/lib/auth.js`, line 14

```javascript
// In-memory user store (replace with R2 storage in production)
const users = new Map();
```

**Impact:**
- Users lose accounts on every server restart
- Cannot scale horizontally (no shared state)
- No data persistence

**Solution:** Implement PostgreSQL or MongoDB database

---

### 🚨 CRITICAL #2: Fallback JWT Secret

**Problem:** JWT uses an insecure fallback secret if not configured.

**Location:** `api/lib/auth.js`, line 10

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-not-for-production';
```

**Impact:**
- Anyone can forge authentication tokens
- Complete security bypass

**Solution:** Always set `JWT_SECRET` in production with a 256-bit random string

---

### ⚠️ HIGH #3: CORS Wide Open in Development

**Problem:** All origins allowed in development mode.

**Location:** `api/server.js`, lines 44-45

```javascript
const corsOptions = process.env.NODE_ENV === 'development'
    ? { origin: true, credentials: true }
```

**Solution:** Always run `NODE_ENV=production` in production

---

### ⚠️ HIGH #4: No HTTPS Enforcement

**Problem:** No SSL/TLS configuration in the server.

**Solution:** Use a reverse proxy (Nginx, Caddy) or platform with automatic SSL (Railway, Render)

---

## Database Implementation Plan

### CockroachDB Serverless (Selected Choice)

**Why CockroachDB Serverless?**
- ✅ PostgreSQL-compatible (uses standard `pg` driver)
- ✅ 10GB free storage (vs 500MB on most alternatives)
- ✅ 50M Request Units/month free
- ✅ Scales to zero when idle (no cost)
- ✅ Built-in high availability (3x replication)
- ✅ JSONB fully supported for app data storage

---

### 🔐 What You Need from CockroachDB Dashboard

Before implementation, get these from [cockroachlabs.cloud](https://cockroachlabs.cloud):

| Item | Where to Find | Example |
|------|---------------|---------|
| **Connection String** | Cluster → Connect → Connection String | `postgresql://username:password@host:26257/defaultdb?sslmode=verify-full` |
| **Database Name** | Usually `defaultdb` or create custom | `reign_db` |
| **CA Certificate** | Cluster → Connect → Download CA Cert | `cc-ca.crt` file |
| **Cluster ID** | Shown in dashboard URL | `free-tier14.aws-us-east-1` |

---

### Step 1: Install Dependencies

```bash
cd api
npm install pg
```

> Note: CockroachDB uses the standard PostgreSQL `pg` driver. No special packages needed!

---

### Step 2: Create Database Schema

Run this SQL in the CockroachDB SQL shell (Console → SQL):

```sql
-- =============================================
-- REIGN DATABASE SCHEMA FOR COCKROACHDB
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email STRING(255) UNIQUE NOT NULL,
    password_hash STRING(255) NOT NULL,
    name STRING(255) NOT NULL,
    avatar_url STRING,
    initials STRING(2),
    role STRING(50) DEFAULT 'user',
    status STRING(50) DEFAULT 'active',
    streak INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User app data (JSONB blob for sync)
CREATE TABLE IF NOT EXISTS user_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    last_sync TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Sessions table (for refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token STRING(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_token (refresh_token)
);

-- Audit log (for admin tracking)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action STRING(100) NOT NULL,
    details JSONB,
    ip_address STRING(45),  -- Supports IPv6
    created_at TIMESTAMPTZ DEFAULT now(),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_created (created_at DESC)
);

-- Announcements (admin broadcasts)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title STRING(255) NOT NULL,
    message STRING NOT NULL,
    target STRING(50) DEFAULT 'all',
    is_active BOOL DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    INDEX idx_announcements_active (is_active, created_at DESC)
);

-- Primary indexes (CockroachDB creates these automatically for PRIMARY KEY)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_data_user ON user_data(user_id);
```

---

### Step 3: Environment Configuration

Add to `api/.env`:

```env
# ===========================================
# COCKROACHDB SERVERLESS CONFIGURATION
# ===========================================

# Connection string from CockroachDB dashboard
# Format: postgresql://USER:PASSWORD@HOST:26257/DATABASE?sslmode=verify-full
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full

# For production, always use verify-full SSL mode
DATABASE_SSL_MODE=verify-full

# Connection pool settings (optimized for serverless)
DATABASE_POOL_MAX=10
DATABASE_POOL_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=10000
```

---

### Step 4: Create Database Connection Module

Create new file `api/lib/database.js`:

```javascript
/**
 * CockroachDB Serverless Connection Module
 * Handles connection pooling and query execution
 */

const { Pool } = require('pg');

// Connection pool configuration for CockroachDB Serverless
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: true  // CockroachDB requires SSL
    },
    max: parseInt(process.env.DATABASE_POOL_MAX) || 10,
    idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT) || 10000
});

// Log connection status
pool.on('connect', () => {
    console.log('✅ Connected to CockroachDB');
});

pool.on('error', (err) => {
    console.error('❌ CockroachDB connection error:', err.message);
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Query executed in ${duration}ms`);
        }
        
        return result;
    } catch (error) {
        console.error('Query error:', error.message);
        throw error;
    }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>}
 */
async function getClient() {
    return pool.connect();
}

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
async function testConnection() {
    try {
        const result = await query('SELECT now() as current_time');
        console.log('✅ Database connection test passed:', result.rows[0].current_time);
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        return false;
    }
}

/**
 * Close all connections (for graceful shutdown)
 */
async function close() {
    await pool.end();
    console.log('Database pool closed');
}

module.exports = {
    query,
    getClient,
    testConnection,
    close,
    pool
};
```

---

### Step 5: Update auth.js for Database

Replace in-memory Map with database calls in `api/lib/auth.js`:

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;

// Validate JWT_SECRET is set
if (!JWT_SECRET || JWT_SECRET.includes('fallback')) {
    console.error('⚠️  WARNING: JWT_SECRET not properly configured!');
}

/**
 * Create a new user
 */
async function createUser(userData) {
    const { name, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const result = await db.query(
        `INSERT INTO users (email, password_hash, name, initials) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, name, avatar_url, initials, role, status, streak, created_at`,
        [email.toLowerCase().trim(), hashedPassword, name.trim(), initials]
    );

    return result.rows[0];
}

/**
 * Find user by email
 */
async function findUserByEmail(email) {
    const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase().trim()]
    );
    return result.rows[0] || null;
}

/**
 * Find user by ID
 */
async function findUserById(id) {
    const result = await db.query(
        'SELECT id, email, name, avatar_url, initials, role, status, streak, created_at FROM users WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
}

/**
 * Update user profile
 */
async function updateUser(id, updates) {
    const { name, avatar_url } = updates;
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : undefined;
    
    const result = await db.query(
        `UPDATE users 
         SET name = COALESCE($1, name), 
             avatar_url = COALESCE($2, avatar_url),
             initials = COALESCE($3, initials),
             updated_at = now()
         WHERE id = $4
         RETURNING id, email, name, avatar_url, initials, role, status, streak, created_at`,
        [name, avatar_url, initials, id]
    );
    
    return result.rows[0];
}

/**
 * Verify password
 */
async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email,
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Get all users (admin)
 */
async function getAllUsers() {
    const result = await db.query(
        `SELECT id, email, name, avatar_url, initials, role, status, streak, created_at, updated_at 
         FROM users 
         ORDER BY created_at DESC`
    );
    return result.rows;
}

/**
 * Log audit event
 */
async function logAudit(userId, action, details, ipAddress) {
    await db.query(
        `INSERT INTO audit_log (user_id, action, details, ip_address) 
         VALUES ($1, $2, $3, $4)`,
        [userId, action, JSON.stringify(details), ipAddress]
    );
}

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    updateUser,
    verifyPassword,
    generateToken,
    verifyToken,
    getAllUsers,
    logAudit
};
```

---

### Step 6: Update Sync Module for Database

Update `api/routes/sync.js` to use database:

```javascript
const db = require('../lib/database');

/**
 * Get user data from database
 */
async function getUserData(userId) {
    const result = await db.query(
        'SELECT data, last_sync FROM user_data WHERE user_id = $1',
        [userId]
    );
    return result.rows[0] || null;
}

/**
 * Save user data to database
 */
async function saveUserData(userId, data) {
    const result = await db.query(
        `INSERT INTO user_data (user_id, data, last_sync) 
         VALUES ($1, $2, now())
         ON CONFLICT (user_id) 
         DO UPDATE SET data = $2, last_sync = now()
         RETURNING id, last_sync`,
        [userId, JSON.stringify(data)]
    );
    return result.rows[0];
}
```

---

### CockroachDB Free Tier Limits

| Resource | Free Allowance | REIGN Usage Estimate |
|----------|---------------|----------------------|
| Storage | **10 GB** | ~50MB for 1000 users |
| Request Units | **50M RUs/month** | ~3K RUs/user/month |
| Connections | Unlimited | ~10 concurrent max |
| Regions | 1 | Sufficient |

**Estimated capacity: 16,000+ active users on free tier!**

---

### Alternative: MongoDB (If Needed)

**Pros:** Flexible schema, JSON-like documents, easy to start

```bash
npm install mongoose
```

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    avatar: String,
    role: { type: String, default: 'user' },
    appData: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});
```

---

## Security Hardening

### Checklist Before Production

| Item | Priority | Status |
|------|----------|--------|
| Set strong JWT_SECRET (256-bit) | 🔴 CRITICAL | ❌ |
| Use HTTPS only | 🔴 CRITICAL | ❌ |
| Set NODE_ENV=production | 🔴 CRITICAL | ❌ |
| Configure CORS whitelist | 🟡 HIGH | ✅ |
| Rate limiting enabled | 🟡 HIGH | ✅ |
| Password hashing (bcrypt) | 🟡 HIGH | ✅ |
| Input validation | 🟡 HIGH | ✅ |
| Helmet.js for headers | 🟡 HIGH | ❌ |
| SQL injection prevention | 🟡 HIGH | N/A |
| Admin role verification | 🟢 MEDIUM | ❌ |

### Generate Secure JWT Secret

```bash
# Generate 256-bit random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Add Helmet.js

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## Deployment Guide

### Option 1: Railway (Recommended)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
cd api
railway init

# 4. Add PostgreSQL
railway add postgresql

# 5. Set environment variables
railway variables set JWT_SECRET=your-secret
railway variables set NODE_ENV=production

# 6. Deploy
railway up
```

### Option 2: Render

1. Connect GitHub repository
2. Create Web Service from `api` directory
3. Set environment variables
4. Add PostgreSQL database
5. Deploy

### Option 3: VPS (DigitalOcean, Linode)

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Install PM2
npm install -g pm2

# 4. Clone repo
git clone https://github.com/Kingsley-A1/personal.git
cd personal/api

# 5. Install dependencies
npm install

# 6. Configure environment
cp .env.example .env
nano .env  # Edit with real values

# 7. Start with PM2
pm2 start server.js --name reign-api
pm2 save
pm2 startup
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/avatar` | Upload avatar |

### Data Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sync` | Download user data |
| POST | `/api/sync` | Upload user data |

### Admin (To Implement)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/:id` | Get user details |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/analytics` | Platform stats |
| POST | `/api/admin/announce` | Send announcement |

---

## Environment Variables

### Required for Production

```env
# Server
NODE_ENV=production
PORT=3001

# Security (REQUIRED!)
JWT_SECRET=your-256-bit-random-secret-here

# Database (REQUIRED!)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Cloudflare R2 (Optional, for file storage)
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=reign-storage

# Frontend URL (for CORS)
FRONTEND_URL=https://your-domain.com
```

### Generate .env for Production

```bash
cat << EOF > .env.production
NODE_ENV=production
PORT=3001
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
DATABASE_URL=your-database-url-here
FRONTEND_URL=https://your-domain.com
EOF
```

---

## Monitoring & Logging

### Recommended Tools

| Tool | Purpose | Free Tier |
|------|---------|-----------|
| **UptimeRobot** | Uptime monitoring | 50 monitors |
| **Sentry** | Error tracking | 5K errors/month |
| **Logtail** | Log aggregation | 1GB/month |
| **Grafana Cloud** | Metrics | 10K series |

### Basic Logging

```bash
npm install pino pino-http
```

```javascript
const pino = require('pino-http')();
app.use(pino);
```

### PM2 Logs

```bash
pm2 logs reign-api
pm2 logs reign-api --lines 100
```

---

## Backup & Recovery

### Database Backups

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20241214.sql
```

### Automated Backups (Supabase/Railway)

Both platforms offer automatic daily backups in their dashboards.

### R2 Backup Strategy

1. Enable versioning in R2 bucket settings
2. Set retention policy for 30 days
3. Consider cross-region replication for disaster recovery

---

## Cost Estimation

### Minimal Production Setup (Free)

| Service | Cost | Purpose |
|---------|------|---------|
| Render/Railway | Free | API hosting |
| Supabase | Free | PostgreSQL |
| Cloudflare R2 | Free (10GB) | File storage |
| UptimeRobot | Free | Monitoring |
| **Total** | **$0/month** | |

### Recommended Production Setup

| Service | Cost | Purpose |
|---------|------|---------|
| Railway Pro | $20/month | API + DB |
| Cloudflare R2 | ~$5/month | Storage |
| Sentry | Free | Error tracking |
| **Total** | **~$25/month** | |

### Scale-Up Costs (1000+ users)

| Service | Cost | Purpose |
|---------|------|---------|
| Railway/Render Pro | $50/month | Scaled API |
| Supabase Pro | $25/month | Managed DB |
| Cloudflare R2 | ~$15/month | More storage |
| **Total** | **~$90/month** | |

---

## Implementation Priority

### Phase 1: Critical (Do First)

1. [ ] Set up PostgreSQL database
2. [ ] Migrate from in-memory Map to database
3. [ ] Set strong JWT_SECRET
4. [ ] Configure HTTPS

### Phase 2: Security

5. [ ] Add Helmet.js
6. [ ] Implement admin role checks
7. [ ] Add audit logging
8. [ ] Set up error tracking (Sentry)

### Phase 3: Features

9. [ ] Implement admin API endpoints
10. [ ] Add real-time updates (WebSockets)
11. [ ] Email notifications
12. [ ] Password reset flow

### Phase 4: Operations

13. [ ] Set up monitoring
14. [ ] Configure automated backups
15. [ ] Load testing
16. [ ] Performance optimization

---

## Quick Reference Commands

```bash
# Start development server
cd api && npm start

# Run with watch mode
npm run dev

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test API health
curl http://localhost:3001/api/health

# View PM2 logs
pm2 logs reign-api

# Restart PM2 process
pm2 restart reign-api
```

---

## Support

For issues:
1. Check this handbook
2. Review server logs: `pm2 logs`
3. Test health endpoint: `/api/health`
4. Open GitHub issue

---

*Last updated: December 2024*
*Version: 2.0*
