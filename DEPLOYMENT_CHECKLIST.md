# 🚀 Quick Deployment Checklist

## Before You Start
- [ ] GitHub repository is up to date
- [ ] All sensitive data is in .gitignore
- [ ] You have Groq API key
- [ ] You have Agora credentials (for video)
- [ ] You have Google OAuth credentials

---

## Backend Deployment (Render) - 15 minutes

### 1. Create Render Account
- [ ] Sign up at https://render.com
- [ ] Verify email

### 2. Create Database
- [ ] New → PostgreSQL
- [ ] Name: `recruitify-db`
- [ ] Region: Oregon
- [ ] Plan: Free
- [ ] **Copy Internal Database URL**

### 3. Create Redis
- [ ] New → Redis
- [ ] Name: `recruitify-redis`
- [ ] Plan: Free
- [ ] **Copy Internal Redis URL**

### 4. Create Web Service
- [ ] New → Web Service
- [ ] Connect GitHub repo
- [ ] Root Directory: `backend`
- [ ] Build Command: `./build.sh`
- [ ] Start Command: `daphne -b 0.0.0.0 -p $PORT recruitify_backend.asgi:application`

### 5. Add Environment Variables
```
SECRET_KEY=<generate-random-50-char-string>
DEBUG=False
DATABASE_URL=<from-step-2>
REDIS_URL=<from-step-3>
ALLOWED_HOSTS=.onrender.com,.vercel.app
EMAIL_HOST_USER=<your-gmail>
EMAIL_HOST_PASSWORD=<gmail-app-password>
GROQ_API_KEY=<your-groq-key>
AGORA_APP_ID=<your-agora-id>
AGORA_APP_CERTIFICATE=<your-agora-cert>
GOOGLE_CLIENT_ID=<your-google-id>
GOOGLE_CLIENT_SECRET=<your-google-secret>
```

### 6. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait 5-10 minutes
- [ ] **Copy your backend URL**: `https://recruitify-backend-xxxx.onrender.com`

---

## Frontend Deployment (Vercel) - 10 minutes

### 1. Update API URLs
- [ ] Open `frontend/src/lib/api.js`
- [ ] Update `API_BASE_URL` to use your Render backend URL
- [ ] Update `WS_BASE_URL` to use `wss://` version

### 2. Create Vercel Account
- [ ] Sign up at https://vercel.com
- [ ] Connect GitHub

### 3. Import Project
- [ ] New Project → Import Git Repository
- [ ] Select your repo
- [ ] Framework: Vite
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`

### 4. Add Environment Variables
```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_WS_URL=wss://your-backend.onrender.com/ws
```

### 5. Deploy
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes
- [ ] **Copy your frontend URL**: `https://your-app.vercel.app`

---

## Final Configuration - 5 minutes

### 1. Update Backend CORS
- [ ] Add Vercel URL to `CORS_ALLOWED_ORIGINS` in settings.py
- [ ] Add Vercel URL to `CSRF_TRUSTED_ORIGINS`
- [ ] Commit and push (Render auto-deploys)

### 2. Update Google OAuth
- [ ] Google Cloud Console → Credentials
- [ ] Add redirect URI: `https://your-app.vercel.app/auth/callback`
- [ ] Add redirect URI: `https://your-backend.onrender.com/video-call/google/callback`

### 3. Test Everything
- [ ] Visit frontend URL
- [ ] Try to register/login
- [ ] Test AI analysis
- [ ] Test chat (WebSocket)
- [ ] Test notifications

---

## 🎉 You're Live!

**Frontend**: https://your-app.vercel.app
**Backend**: https://your-backend.onrender.com
**Admin Panel**: https://your-backend.onrender.com/admin

---

## ⚠️ Important Notes

### Free Tier Limitations:
- **Render**: Backend sleeps after 15 min inactivity (30-60s cold start)
- **PostgreSQL**: Free for 90 days, then needs upgrade
- **Redis**: 25MB limit

### To Keep Backend Awake:
Use a service like **UptimeRobot** or **Cron-job.org** to ping your backend every 10 minutes:
```
https://your-backend.onrender.com/api/health/
```

### Upgrade Recommendations:
- Render Starter ($7/mo): No sleep, faster performance
- PostgreSQL ($7/mo): Persistent database
- Redis ($10/mo): More memory

---

## 🐛 Troubleshooting

### Backend won't start?
- Check Render logs
- Verify all environment variables are set
- Ensure `build.sh` has execute permissions

### Frontend can't connect to backend?
- Check CORS settings
- Verify API URL in environment variables
- Check browser console for errors

### WebSocket not working?
- Use `wss://` (not `ws://`)
- Check ALLOWED_HOSTS includes Render domain
- Verify Redis is running

### Database errors?
- Check DATABASE_URL is correct
- Run migrations: `python manage.py migrate`
- Check Render database logs

---

## 📱 Share Your Project

Once deployed, update your LinkedIn post with:
- ✅ Live demo link
- ✅ GitHub repository
- ✅ Screenshots/GIF
- ✅ Tech stack details

**Example**:
```
🚀 Excited to share my AI-powered recruitment platform!

🔗 Live Demo: https://your-app.vercel.app
💻 GitHub: https://github.com/namit2405/Recruitify-AI-Platform

Built with Django, React, and AI. Check it out!
```

Good luck! 🎉
