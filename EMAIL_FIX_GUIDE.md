# 🔧 Email Sending Issues - Quick Fix Guide

## Issue: "0 sent, 3 failed" on Vercel

This means emails are trying to send but failing. Here's how to fix:

---

## ✅ **Checklist:**

### **1. MongoDB Connection**
Go to: https://vercel.com/abhiii9vvv/av9assist/settings/environment-variables

**Check if this exists:**
- ✅ `MONGODB_URI` = `mongodb+srv://gyanutiwari758_db_user:p8rsRnPZKDATYudO@av9assist...`

**If NOT set:**
```
Key: MONGODB_URI
Value: mongodb+srv://gyanutiwari758_db_user:p8rsRnPZKDATYudO@av9assist.catdgyz.mongodb.net/?retryWrites=true&w=majority&appName=av9assist
Environment: Production
```

---

### **2. Email Credentials**
**Check if these exist:**
- ✅ `GMAIL_USER` = `avassist9@gmail.com`
- ✅ `GMAIL_APP_PASSWORD` = `kfosqaqrumwtyekb`

**If NOT set, add them:**
```
Key: GMAIL_USER
Value: avassist9@gmail.com
Environment: Production

Key: GMAIL_APP_PASSWORD  
Value: kfosqaqrumwtyekb
Environment: Production
```

---

### **3. App URL**
**Check if this exists:**
- ✅ `NEXT_PUBLIC_APP_URL` = `https://av9assist.vercel.app`

**If NOT set:**
```
Key: NEXT_PUBLIC_APP_URL
Value: https://av9assist.vercel.app
Environment: Production
```

---

## 🔍 **How to Check Vercel Logs:**

1. Go to: https://vercel.com/abhiii9vvv/av9assist/deployments
2. Click latest deployment
3. Click **Runtime Logs**
4. Look for errors:
   - ❌ "MONGODB_URI environment variable is not set"
   - ❌ "Gmail credentials not configured"
   - ❌ "Failed to connect to MongoDB"

---

## 🚀 **After Setting Variables:**

1. Vercel will auto-redeploy (2-3 minutes)
2. Or manually redeploy:
   - Go to Deployments
   - Click "..." on latest
   - Click "Redeploy"

---

## 🧪 **Test Email Manually:**

Once env vars are set, test via API:

```bash
# Test single email
curl -X POST https://av9assist.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "email": "test@example.com"
  }'

# Should return: {"success": true, "message": "Email sent successfully"}
```

---

## 📊 **Current Environment Variables Needed:**

| Variable | Value | Status |
|----------|-------|--------|
| `MONGODB_URI` | Connection string | ❓ Check |
| `GMAIL_USER` | avassist9@gmail.com | ❓ Check |
| `GMAIL_APP_PASSWORD` | kfosqaqrumwtyekb | ❓ Check |
| `NEXT_PUBLIC_APP_URL` | https://av9assist.vercel.app | ❓ Check |
| `ADMIN_KEY` | 10729 | ❓ Check (for admin dashboard) |

---

## 💡 **Most Common Issues:**

### **Issue 1: MongoDB Not Connected**
```
Error: MONGODB_URI environment variable is not set
Fix: Add MONGODB_URI to Vercel env vars
```

### **Issue 2: Gmail Credentials Missing**
```
Error: Gmail credentials not configured
Fix: Add GMAIL_USER and GMAIL_APP_PASSWORD
```

### **Issue 3: Network Access Not Allowed**
```
Error: Network timeout / Authentication failed
Fix: Go to MongoDB Atlas → Network Access → Allow 0.0.0.0/0
```

---

## ✅ **Once Fixed:**

You should see in Vercel logs:
```
✅ Connected to MongoDB
✅ User saved to database: email@example.com (NEW)
🎉 New user registered: email@example.com - Welcome email queued
✅ Email sent successfully
```

---

## 🆘 **Still Not Working?**

Send me the exact error from Vercel Runtime Logs and I'll help fix it!
