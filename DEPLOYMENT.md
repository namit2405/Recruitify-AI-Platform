# 🚀 Deployment Guide

## Architecture
- **Frontend**: Vercel (React)
- **Backend**: Render (Django + Channels)
- **Database**: Render PostgreSQL
- **Redis**: Render Redis (for Django Channels)

---

## 📦 PART 1: Deploy Backend to Render

### Prerequisites
- GitHub account
- Render account (free tier available)

### Step 1: Prepare Environment Variables

Create a `.env.production` file (DON'T commit this):

```env
# Django
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=.onrender.com,.vercel.app
SITE_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app

# Database (Render will provide this)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis (Render will provide this)
REDIS_URL=redis://host:6379

# Email (Gmail)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Groq API
GROQ_API_KEY=your-groq-api-key

# Agora (Video calling)
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-certificate

# Google OAuth (for Calendar)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 2: Update Django Settings

Add to `backend/recruitify_backend/settings.py`:

```python
import dj_database_url

# Production settings
if not DEBUG:
    # Database
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=600
        )
    }
    
    # Redis for Channels
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                "hosts": [os.environ.get('REDIS_URL', 'redis://localhost:6379')],
            },
        },
    }
    
    # Security
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    
    # Static files
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### Step 3: Update requirements.txt

Add these packages:

```bash
cd backend
pip install dj-database-url whitenoise gunicorn psycopg2-binary
pip freeze > requirements.txt
```

### Step 4: Deploy to Render

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin master
   ```

2. **Create Render Account**: https://render.com

3. **Create PostgreSQL Database**:
   - Dashboard → New → PostgreSQL
   - Name: `recruitify-db`
   - Plan: Free
   - Copy the **Internal Database URL**

4. **Create Redis Instance**:
   - Dashboard → New → Redis
   - Name: `recruitify-redis`
   - Plan: Free
   - Copy the **Internal Redis URL**

5. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect your GitHub repository
   - Settings:
     - **Name**: `recruitify-backend`
     - **Region**: Oregon (US West)
     - **Branch**: `master`
     - **Root Directory**: `backend`
     - **Runtime**: Python 3
     - **Build Command**: `./build.sh`
     - **Start Command**: `daphne -b 0.0.0.0 -p $PORT recruitify_backend.asgi:application`

6. **Add Environment Variables**:
   ```
   SECRET_KEY=<generate-random-string>
   DEBUG=False
   ALLOWED_HOSTS=.onrender.com,.vercel.app
   DATABASE_URL=<from-step-3>
   REDIS_URL=<from-step-4>
   EMAIL_HOST_USER=<your-email>
   EMAIL_HOST_PASSWORD=<your-app-password>
   GROQ_API_KEY=<your-groq-key>
   AGORA_APP_ID=<your-agora-id>
   AGORA_APP_CERTIFICATE=<your-agora-cert>
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-secret>
   FRONTEND_URL=https://your-app.vercel.app
   SITE_URL=https://recruitify-backend.onrender.com
   ```

7. **Deploy**: Click "Create Web Service"

8. **Wait for deployment** (5-10 minutes)

9. **Your backend URL**: `https://recruitify-backend.onrender.com`

---

## 🎨 PART 2: Deploy Frontend to Vercel

### Step 1: Update Frontend API URL

Update `frontend/src/lib/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://recruitify-backend.onrender.com/api'
    : 'http://localhost:8000/api');

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 
  (import.meta.env.PROD 
    ? 'wss://recruitify-backend.onrender.com/ws'
    : 'ws://localhost:8000/ws');
```

### Step 2: Create Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://recruitify-backend.onrender.com/api",
    "VITE_WS_URL": "wss://recruitify-backend.onrender.com/ws"
  }
}
```

### Step 3: Update Frontend Environment

Create `frontend/.env.production`:

```env
VITE_API_URL=https://recruitify-backend.onrender.com/api
VITE_WS_URL=wss://recruitify-backend.onrender.com/ws
```

### Step 4: Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

**Option B: Using Vercel Dashboard**

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_API_URL=https://recruitify-backend.onrender.com/api
   VITE_WS_URL=wss://recruitify-backend.onrender.com/ws
   ```
6. Click "Deploy"

7. **Your frontend URL**: `https://your-app.vercel.app`

---

## 🔧 PART 3: Final Configuration

### Update Backend CORS Settings

In `backend/recruitify_backend/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    'https://your-app.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
]

CSRF_TRUSTED_ORIGINS = [
    'https://your-app.vercel.app',
    'https://recruitify-backend.onrender.com',
]

ALLOWED_HOSTS = [
    'recruitify-backend.onrender.com',
    '.vercel.app',
    'localhost',
    '127.0.0.1',
]
```

### Update Google OAuth Redirect URIs

1. Go to Google Cloud Console
2. Update OAuth 2.0 Client:
   - Authorized redirect URIs:
     - `https://your-app.vercel.app/auth/callback`
     - `https://recruitify-backend.onrender.com/video-call/google/callback`

### Redeploy Backend

```bash
git add .
git commit -m "Update CORS and allowed hosts"
git push origin master
```

Render will auto-deploy.

---

## ✅ Testing Deployment

### Test Backend
```bash
curl https://recruitify-backend.onrender.com/api/health/
```

### Test Frontend
Visit: `https://your-app.vercel.app`

### Test WebSocket
Open browser console on frontend:
```javascript
const ws = new WebSocket('wss://recruitify-backend.onrender.com/ws/notifications/');
ws.onopen = () => console.log('Connected!');
```

---

## 📊 Monitoring

### Render Dashboard
- View logs: Dashboard → Service → Logs
- Monitor metrics: CPU, Memory, Requests

### Vercel Dashboard
- View deployments: Dashboard → Project → Deployments
- Analytics: Dashboard → Project → Analytics

---

## 🐛 Common Issues

### Issue 1: Static Files Not Loading
**Solution**: Run `python manage.py collectstatic` in build command

### Issue 2: Database Connection Error
**Solution**: Check DATABASE_URL environment variable

### Issue 3: WebSocket Connection Failed
**Solution**: 
- Ensure using `wss://` (not `ws://`)
- Check ALLOWED_HOSTS includes Render domain

### Issue 4: CORS Errors
**Solution**: Update CORS_ALLOWED_ORIGINS with Vercel URL

### Issue 5: 502 Bad Gateway
**Solution**: 
- Check Render logs
- Ensure daphne is running on correct port
- Verify Redis connection

---

## 💰 Cost Breakdown

### Free Tier Limits

**Render (Free)**:
- ✅ 750 hours/month web service
- ✅ PostgreSQL (90 days, then sleeps)
- ✅ Redis (25MB)
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ Cold start: 30-60 seconds

**Vercel (Free)**:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ No cold starts

### Paid Plans (Optional)

**Render**:
- Starter: $7/month (no sleep, faster)
- PostgreSQL: $7/month (persistent)
- Redis: $10/month (100MB)

**Vercel**:
- Pro: $20/month (more bandwidth, analytics)

---

## 🚀 Custom Domain (Optional)

### Add Custom Domain to Vercel
1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain: `recruitify.com`
3. Update DNS records (Vercel provides instructions)

### Add Custom Domain to Render
1. Render Dashboard → Service → Settings → Custom Domain
2. Add: `api.recruitify.com`
3. Update DNS CNAME record

---

## 📝 Environment Variables Checklist

### Backend (Render)
- [ ] SECRET_KEY
- [ ] DEBUG=False
- [ ] DATABASE_URL
- [ ] REDIS_URL
- [ ] ALLOWED_HOSTS
- [ ] EMAIL_HOST_USER
- [ ] EMAIL_HOST_PASSWORD
- [ ] GROQ_API_KEY
- [ ] AGORA_APP_ID
- [ ] AGORA_APP_CERTIFICATE
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] FRONTEND_URL

### Frontend (Vercel)
- [ ] VITE_API_URL
- [ ] VITE_WS_URL

---

## 🎉 Success!

Your app is now live:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://recruitify-backend.onrender.com
- **Admin**: https://recruitify-backend.onrender.com/admin

Share your live demo on LinkedIn! 🚀
