# 🔍 Vercel Deployment Troubleshooting Guide

## Issue: "All AI services are currently unavailable"

This happens when environment variables are not properly configured in Vercel.

---

## ✅ Step-by-Step Fix:

### 1. **Check Environment Variables on Vercel**

Visit this diagnostic endpoint on your deployed site:
```
https://your-site.vercel.app/api/env-check
```

You should see something like:
```json
{
  "GOOGLE_API_KEY": "AIzaSyBGvi...",
  "GOOGLE_API_KEY_2": "AIzaSyCCN4...",
  "GOOGLE_MODEL": "gemini-2.5-flash",
  "SAMBANOVA_API_KEY": "754cb146-2...",
  "OPENROUTER_API_KEY": "sk-or-v1-d...",
  "PROVIDERS_ORDER": "gemini,sambanova,openrouter",
  "NODE_ENV": "production"
}
```

**If you see `❌ NOT SET`**, the variables are missing!

---

### 2. **Add Environment Variables in Vercel Dashboard**

1. Go to: https://vercel.com/dashboard
2. Select your project: **av9assist**
3. Go to: **Settings** → **Environment Variables**
4. Add these variables (copy from `.env.local`):

```bash
# Required Variables:
GOOGLE_API_KEY=AIzaSyBGviJ9TaBp9k7QmKthlW_q8j8V_aq7OP4
GOOGLE_API_KEY_2=AIzaSyCCN4sEZUi8Y7zDNWWgcSaoub-oJnWrQIA
GOOGLE_MODEL=gemini-2.5-flash

SAMBANOVA_API_KEY=754cb146-2b0a-44e8-9bc6-e1ad7db33ded
SAMBANOVA_MODEL=Llama-4-Maverick-17B-128E-Instruct

OPENROUTER_API_KEY=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
OPENROUTER_MODEL=meta-llama/llama-3.3-8b-instruct:free

PROVIDERS_ORDER=gemini,sambanova,openrouter
```

**Important Settings:**
- ✅ Check **Production**
- ✅ Check **Preview**
- ✅ Check **Development** (optional)

---

### 3. **Redeploy After Adding Variables**

After adding environment variables:

1. Go to: **Deployments**
2. Find the latest deployment
3. Click **⋯** (three dots)
4. Click **Redeploy**

Or simply push a new commit:
```bash
git commit --allow-empty -m "trigger redeploy"
git push
```

---

### 4. **Verify It's Working**

After redeployment:

1. Visit: `https://your-site.vercel.app/api/env-check`
2. Confirm all variables show values (not ❌ NOT SET)
3. Test the chat: `https://your-site.vercel.app/chat`
4. Try sending a message - should work now! ✅

---

## 🔧 Common Issues:

### Issue 1: Variables Still Not Working
**Solution:** Make sure you clicked **Save** after adding each variable, then redeploy.

### Issue 2: Some Keys Work, Others Don't
**Solution:** Check for typos in variable names. They must match exactly:
- `GOOGLE_API_KEY` (not `GOOGLE_API_KEYS` or `GOOGLEAPIKEY`)
- `GOOGLE_API_KEY_2` (not `GOOGLE_API_KEY2`)

### Issue 3: Works Locally But Not on Vercel
**Solution:** This is the classic environment variable issue. Local uses `.env.local`, Vercel needs them in dashboard.

---

## 🎯 Quick Checklist:

- [ ] Opened Vercel Dashboard
- [ ] Went to Settings → Environment Variables
- [ ] Added all 8 required variables
- [ ] Checked Production + Preview
- [ ] Clicked Save for each variable
- [ ] Redeployed the project
- [ ] Checked `/api/env-check` endpoint
- [ ] Tested chat functionality

---

## 🚀 After Everything Works:

**Delete the diagnostic endpoint** (for security):
```bash
rm app/api/env-check/route.jsx
git add .
git commit -m "remove env-check diagnostic endpoint"
git push
```

---

## 📝 Note:

Never commit `.env.local` to GitHub! It's in `.gitignore` for security. Always set environment variables in Vercel dashboard for production deployments.
