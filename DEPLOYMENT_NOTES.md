# 🚀 Deployment Notes for av9Assist

## ⚠️ IMPORTANT: Vercel File System Limitation

### Current Issue
The app currently uses **file-based storage** (`data/users.json`) which **DOES NOT WORK** on Vercel's serverless platform!

### Why Users Aren't Being Saved on Vercel:
- ❌ Vercel uses **serverless functions** - each request runs in an isolated container
- ❌ File writes (`fs.writeFile`) are **temporary** and lost after the function execution
- ❌ The `data/` folder is **ephemeral** - resets with each deployment
- ❌ Multiple regions = multiple isolated file systems

### Symptoms:
1. ✅ Registration works locally (localhost)
2. ❌ Users don't appear in admin dashboard on Vercel
3. ❌ Data disappears after serverless function timeout
4. ❌ Each API call sees a fresh/empty `users.json`

---

## 🔧 Solutions (Choose One)

### Option 1: Use Vercel Postgres (Recommended) 
**Free tier: 256 MB storage, 60 hours compute**

```bash
# Install Vercel Postgres
npm install @vercel/postgres

# Create database in Vercel Dashboard:
# 1. Go to your project on Vercel
# 2. Storage tab → Create Database → Postgres
# 3. Copy connection string to .env
```

**Update `app/api/users/route.jsx`:**
```javascript
import { sql } from '@vercel/postgres'

// Create table (run once)
await sql`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    visit_count INTEGER DEFAULT 1,
    email_preferences JSONB DEFAULT '{"updates": true, "tips": true, "engagement": true, "daily": true}'
  )
`

// Insert user
await sql`
  INSERT INTO users (email)
  VALUES (${email})
  ON CONFLICT (email)
  DO UPDATE SET last_active = NOW(), visit_count = users.visit_count + 1
`
```

---

### Option 2: Use Vercel KV (Redis)
**Free tier: 256 MB storage, 30 KB request size**

```bash
npm install @vercel/kv
```

```javascript
import { kv } from '@vercel/kv'

// Save user
await kv.set(`user:${email}`, {
  email,
  joinedAt: new Date().toISOString(),
  lastActive: new Date().toISOString(),
  visitCount: 1
})

// Get all users
const keys = await kv.keys('user:*')
const users = await Promise.all(keys.map(k => kv.get(k)))
```

---

### Option 3: Use MongoDB Atlas (Recommended for Scale)
**Free tier: 512 MB storage**

```bash
npm install mongodb
```

```javascript
import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGODB_URI)
const db = client.db('av9assist')

// Insert user
await db.collection('users').updateOne(
  { email },
  { 
    $set: { lastActive: new Date() },
    $setOnInsert: { 
      email, 
      joinedAt: new Date(),
      visitCount: 1,
      emailPreferences: { updates: true, tips: true, engagement: true, daily: true }
    },
    $inc: { visitCount: 1 }
  },
  { upsert: true }
)
```

---

### Option 4: Use Supabase (Easy Setup)
**Free tier: 500 MB database, 2 GB bandwidth**

```bash
npm install @supabase/supabase-js
```

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Insert user
const { data, error } = await supabase
  .from('users')
  .upsert({
    email,
    last_active: new Date().toISOString(),
    visit_count: 1
  })
```

---

## 🛠️ Temporary Workaround (For Testing Only)

If you need to test quickly without a database:

### Use Vercel Environment Variables
Store users as a JSON string in environment variable (NOT RECOMMENDED for production):

```bash
# In Vercel Dashboard → Settings → Environment Variables
USERS_DATA='[]'
```

This is **NOT scalable** and has size limits (4KB), but works for quick testing.

---

## 📊 Recommended Setup for Production

**Best Architecture:**
```
Frontend (Vercel) → Next.js API Routes → Vercel Postgres
                                      ↓
                                    Gmail SMTP (for emails)
```

**Why Vercel Postgres?**
- ✅ Integrated with Vercel (no external setup)
- ✅ Automatic scaling
- ✅ Built-in connection pooling
- ✅ Free tier sufficient for MVP
- ✅ Easy migration path to paid tier

---

## 🚀 Quick Migration Guide

1. **Create Vercel Postgres Database:**
   ```bash
   # In Vercel Dashboard
   Storage → Create Database → Postgres
   ```

2. **Install Package:**
   ```bash
   npm install @vercel/postgres
   ```

3. **Create Migration Script:**
   ```javascript
   // scripts/migrate-to-postgres.js
   import { sql } from '@vercel/postgres'
   import fs from 'fs'

   const users = JSON.parse(fs.readFileSync('data/users.json', 'utf-8'))

   for (const user of users) {
     await sql`
       INSERT INTO users (email, joined_at, last_active, visit_count, email_preferences)
       VALUES (${user.email}, ${user.joinedAt}, ${user.lastActive}, ${user.visitCount}, ${JSON.stringify(user.emailPreferences)})
     `
   }
   ```

4. **Update API Routes** (see examples above)

5. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "Migrate to Vercel Postgres"
   git push
   ```

---

## 🐛 Current Debugging

Check Vercel logs to see if users are being registered:
```bash
vercel logs <deployment-url>
```

Look for:
- ✅ `📝 User registration attempt: email@example.com`
- ✅ `🆕 New user registration: email@example.com`
- ✅ `💾 Users data saved. Total users: X`

If you see these logs but users still don't persist, **it confirms the file system issue**.

---

## 📝 Current Status

- ✅ Email validation working
- ✅ Registration API working (locally)
- ✅ Welcome emails sending
- ❌ Data persistence on Vercel (needs database)
- ✅ Admin dashboard UI ready
- ⚠️ Using temporary file storage (not production-ready)

**Next Step:** Implement one of the database solutions above!

---

Last Updated: October 2, 2025
