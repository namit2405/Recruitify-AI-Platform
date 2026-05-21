# 🚀 Vercel Frontend Deployment Guide

## Method 1: Using Vercel Dashboard (EASIEST) ⭐

### Step 1: Go to Vercel
Visit: https://vercel.com

### Step 2: Sign Up / Login
- Sign up with GitHub (recommended)
- Authorize Vercel to access your repositories

### Step 3: Import Project
1. Click **"Add New..."** → **"Project"**
2. Select your repository: `Recruitify-AI-Platform`
3. Click **"Import"**

### Step 4: Configure Build Settings

**IMPORTANT: Set Root Directory!**

```
Framework Preset: Vite
Root Directory: frontend  ← IMPORTANT!
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 5: Add Environment Variables

Click **"Environment Variables"** and add:

```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_WS_URL=wss://your-backend.onrender.com/ws
```

**Replace `your-backend.onrender.com` with your actual Render backend URL!**

### Step 6: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. ✅ Your app is live!

---

## Method 2: Using Vercel CLI (ADVANCED)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Deploy from Frontend Directory

```bash
cd frontend
vercel --prod
```

### Step 4: Follow Prompts

```
? Set up and deploy "~/Recruitify-AI-Platform/frontend"? Y
? Which scope? Your Name
? Link to existing project? N
? What's your project's name? recruitify-frontend
? In which directory is your code located? ./
? Want to override the settings? N
```

### Step 5: Add Environment Variables

```bash
vercel env add VITE_API_URL production
# Enter: https://your-backend.onrender.com/api

vercel env add VITE_WS_URL production
# Enter: wss://your-backend.onrender.com/ws
```

### Step 6: Redeploy

```bash
vercel --prod
```

---

## 🔧 Troubleshooting

### Error: "No such file or directory: frontend"

**Solution**: Set Root Directory to `frontend` in Vercel dashboard:
1. Project Settings → General
2. Root Directory: `frontend`
3. Save and redeploy

### Error: "VITE_API_URL is not defined"

**Solution**: Add environment variables:
1. Project Settings → Environment Variables
2. Add `VITE_API_URL` and `VITE_WS_URL`
3. Redeploy

### Error: "Failed to compile"

**Solution**: Check build logs for specific error
- Usually missing dependencies
- Run `npm install` locally first
- Check `package.json` is correct

### Error: "404 on page refresh"

**Solution**: Already fixed with `vercel.json` rewrites
- All routes redirect to `/index.html`
- React Router handles client-side routing

---

## ✅ Verification

After deployment:

### 1. Check Deployment URL
```
https://your-app.vercel.app
```

### 2. Test Pages
- [ ] Homepage loads
- [ ] Login page works
- [ ] Registration works
- [ ] Dashboard loads (after login)

### 3. Check API Connection
Open browser console (F12) and check for:
- ✅ No CORS errors
- ✅ API requests going to Render backend
- ✅ WebSocket connection established

### 4. Test Features
- [ ] Login/Register
- [ ] AI resume analysis
- [ ] Real-time chat
- [ ] Notifications
- [ ] File uploads

---

## 🔗 Update Backend CORS

After getting your Vercel URL, update backend:

### In Render Dashboard:

Add environment variable:
```
FRONTEND_URL=https://your-app.vercel.app
```

### Or update `backend/recruitify_backend/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    'https://your-app.vercel.app',
    'http://localhost:5173',
]

CSRF_TRUSTED_ORIGINS = [
    'https://your-app.vercel.app',
    'https://your-backend.onrender.com',
]
```

Commit and push to trigger Render redeploy.

---

## 🎯 Custom Domain (Optional)

### Add Custom Domain:

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `recruitify.com`
3. Update DNS records (Vercel provides instructions)
4. Wait for DNS propagation (5-60 minutes)
5. ✅ Your app is live on custom domain!

---

## 📊 Monitoring

### Vercel Dashboard:

- **Deployments**: See all deployments and logs
- **Analytics**: Page views, performance
- **Logs**: Runtime logs and errors
- **Speed Insights**: Performance metrics

---

## 💰 Pricing

### Free Tier Includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ No cold starts
- ✅ Preview deployments

### Pro Plan ($20/month):
- More bandwidth
- Advanced analytics
- Team collaboration
- Priority support

---

## 🚀 Success!

Your frontend is now live at:
```
https://your-app.vercel.app
```

Share it on LinkedIn! 🎉
