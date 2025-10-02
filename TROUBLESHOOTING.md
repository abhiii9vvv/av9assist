# 🔧 Deployment Issues - Troubleshooting Guide

## Common Issues & Fixes

### Issue 1: "Failed to register" or Loading Forever
**Cause:** MongoDB connection timeout

**Fix:**
1. Go to MongoDB Atlas: https://cloud.mongodb.com/
2. Click **Network Access** (left sidebar)
3. Make sure **0.0.0.0/0** is in the IP whitelist
4. If not, click **Add IP Address** → **Allow Access from Anywhere**
5. Click **Confirm**

---

### Issue 2: "MONGODB_URI is not set"
**Cause:** Environment variable not added to Vercel

**Fix:**
1. Go to: https://vercel.com/abhiii9vvv/av9assist/settings/environment-variables
2. Check if `MONGODB_URI` exists
3. If not, add it:
   - Key: `MONGODB_URI`
   - Value: Your connection string
   - Environment: **Production**
4. Click **Save**

---

### Issue 3: "Authentication failed"
**Cause:** Wrong password in connection string

**Fix:**
1. Go to MongoDB Atlas → **Database Access**
2. Edit your user or create a new one
3. Click **Edit Password** → **Autogenerate Secure Password**
4. Copy the password
5. Update your connection string in Vercel with the new password

---

### Issue 4: Deployment succeeds but app doesn't work
**Cause:** Vercel needs to redeploy after adding environment variables

**Fix:**
1. Go to: https://vercel.com/abhiii9vvv/av9assist
2. Click **Deployments** tab
3. Click the **"..."** menu on latest deployment
4. Click **Redeploy**
5. Wait 2-3 minutes

---

## ✅ Quick Checklist

Before testing, make sure:
- [ ] MongoDB cluster is created
- [ ] Database user is created with password
- [ ] Network Access allows 0.0.0.0/0 (anywhere)
- [ ] `MONGODB_URI` is added to Vercel Environment Variables
- [ ] Vercel has redeployed after adding the variable
- [ ] Connection string has the correct password (no `<password>` placeholder)

---

## 🔍 How to Check Logs

### Vercel Runtime Logs:
1. Go to: https://vercel.com/abhiii9vvv/av9assist
2. Click **Deployments** → Latest deployment
3. Click **Runtime Logs**
4. Look for errors with ❌

### What to look for:
- ✅ "Connected to MongoDB" = Good!
- ❌ "MONGODB_URI environment variable is not set" = Add env var
- ❌ "Authentication failed" = Check password
- ❌ "Network timeout" = Check Network Access in MongoDB

---

## 🚀 Test Deployment

Once everything is set up:
1. Visit: https://av9assist.vercel.app
2. Enter email: `test@example.com`
3. Should see success message ✅
4. Check MongoDB Atlas → **Browse Collections** → should see the user!

---

## 💡 Still Not Working?

**Option 1: Test locally first**
```bash
npm run dev
```
If it works locally but not on Vercel, it's an environment variable issue.

**Option 2: Check MongoDB Atlas**
- Database → Browse Collections → av9assist → users
- Should see registered users here

**Option 3: Try a fresh deployment**
- Vercel → Deployments → Redeploy (force rebuild)

---

## 🆘 Emergency Fallback

If MongoDB is still having issues, we can switch to:
- **Supabase** (PostgreSQL, very easy)
- **Firebase Firestore** (NoSQL, instant setup)
- **Upstash Redis** (simplest option)

Let me know which you prefer!
