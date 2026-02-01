# 🚀 Quick Deployment Checklist

Follow these steps to deploy your app to the cloud.

---

## ✅ Pre-Deployment Checklist

### Backend Preparation
- [x] Added `gunicorn` to `requirements.txt`
- [x] Created `Procfile` for deployment
- [x] Updated `app.py` for gunicorn compatibility
- [x] Created `.gitignore` to protect sensitive files
- [x] Created `.env.example` template

### Mobile App Preparation
- [x] Created environment configuration (`src/config/environment.js`)
- [x] Updated API client to use config

---

## 📝 Deployment Steps

### Part 1: MongoDB Atlas (Database)

1. **Create MongoDB Atlas Account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up (it's free)

2. **Create Cluster**
   - Choose FREE M0 tier
   - Select region closest to you
   - Name: `CompilerGamified`

3. **Create Database User**
   - Go to: Database Access → Add New User
   - Username: `dbuser` (or your choice)
   - Generate and SAVE password
   - Privilege: Read and write to any database

4. **Allow Network Access**
   - Go to: Network Access → Add IP Address
   - Allow Access from Anywhere (0.0.0.0/0)

5. **Get Connection String**
   - Go to: Database → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your actual password
   - Add database name: `/compiler_gamified`
   
   **Final format:**
   ```
   mongodb+srv://dbuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/compiler_gamified?retryWrites=true&w=majority
   ```
   
   **SAVE THIS!** You'll need it for Render.

---

### Part 2: Render.com (Backend Hosting)

1. **Create Render Account**
   - Go to: https://render.com
   - Sign up with GitHub

2. **Push Code to GitHub**
   ```bash
   cd E:\Mini_Project
   git init
   git add .
   git commit -m "Prepare for deployment"
   
   # Create repo on GitHub, then:
   git remote add origin YOUR_GITHUB_REPO_URL
   git branch -M main
   git push -u origin main
   ```

3. **Create Web Service**
   - Render Dashboard → New + → Web Service
   - Connect your GitHub repo
   - **Configuration:**
     - Name: `compiler-gamified-backend`
     - Region: Pick closest
     - Branch: `main`
     - Root Directory: `backend`
     - Runtime: `Python 3`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `gunicorn app:app`
     - Instance Type: **Free**

4. **Add Environment Variables**
   Click "Advanced" and add these:
   
   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | Your connection string from MongoDB Atlas |
   | `MONGODB_DB` | `compiler_gamified` |
   | `JWT_SECRET` | Generate: `openssl rand -hex 32` |
   | `ALLOW_ADMIN_REG` | `true` |
   | `PYTHON_VERSION` | `3.11.0` |

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - You'll get a URL like: `https://compiler-gamified-backend.onrender.com`

6. **Test Backend**
   Visit: `https://your-app-name.onrender.com/api/health`
   
   Should return: `{"status": "ok"}`

---

### Part 3: Update Mobile App

1. **Update Environment Config**
   
   Open: `E:\Mini_Project\mobile\src\config\environment.js`
   
   Update the production URL:
   ```javascript
   production: {
     API_URL: 'https://your-actual-app-name.onrender.com/api',
   },
   ```

2. **Switch to Production**
   
   In same file, change:
   ```javascript
   const CURRENT_ENV = 'production'; // Changed from 'development'
   ```

3. **Commit Changes**
   ```bash
   cd E:\Mini_Project\mobile
   git add src/config/environment.js
   git commit -m "Update to production backend"
   git push
   ```

4. **Rebuild Mobile App**
   ```bash
   eas build --platform android --profile preview
   ```
   
   Wait for build to complete (~5-15 minutes)

5. **Download APK**
   - You'll get a download link when done
   - Download and install on your device

---

## 🧪 Testing

### Test Backend
```bash
# Health check
curl https://your-app-name.onrender.com/api/health

# Register test user
curl -X POST https://your-app-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "password123",
    "role": "student"
  }'
```

### Test Mobile App
1. Install new APK on device
2. Open app
3. Register/Login
4. Everything should work from cloud! ✨

---

## 📊 Monitoring

### Render Logs
- Dashboard → Your Service → Logs tab
- Real-time logs of your backend

### MongoDB Atlas
- Dashboard → Cluster → Collections
- View your data in real-time

---

## 🔄 Making Updates

After deployment, to update your app:

```bash
# Update backend code
cd E:\Mini_Project\backend
# Make your changes
git add .
git commit -m "Update description"
git push

# Render auto-deploys! 🎉
```

For mobile updates:
```bash
# Update mobile code
cd E:\Mini_Project\mobile
# Make your changes
git add .
git commit -m "Update description"
git push

# Rebuild
eas build --platform android --profile preview
```

---

## 🆘 Common Issues

### Backend not deploying?
- Check Render logs for errors
- Verify all environment variables are set
- Ensure `requirements.txt` is complete

### Mobile app can't connect?
- Verify production URL in `environment.js`
- Make sure `CURRENT_ENV = 'production'`
- Rebuild app after config changes
- Check Render backend is actually running

### Database connection fails?
- Double-check MongoDB connection string
- Ensure password doesn't have special characters that need escaping
- Verify Network Access allows 0.0.0.0/0

---

## 💰 Cost Summary

- **MongoDB Atlas**: FREE (M0 tier)
- **Render.com**: FREE (with cold starts) or $7/month (no cold starts)
- **Expo EAS Build**: FREE (limited builds) or $29/month (unlimited)
- **Total**: **$0** (free tier) or ~$36/month (all paid)

---

## ✨ You're Done!

Your app is now:
- ✅ Backend running in the cloud (Render)
- ✅ Database in the cloud (MongoDB Atlas)
- ✅ Mobile app connecting to cloud backend
- ✅ No more localhost dependencies!

---

**Need the full guide?** See `DEPLOYMENT_GUIDE.md` for detailed instructions.
