# 🚀 Full Stack Deployment Guide

This guide will help you deploy your Flask backend to the cloud and connect your mobile app to it.

---

## 📋 Overview

We'll deploy:
1. **Backend (Flask)** → Render.com (Free tier)
2. **Database (MongoDB)** → MongoDB Atlas (Free tier)
3. **Mobile App** → Build with cloud backend URL

**Total Cost**: FREE! 🎉

---

## 🗄️ Step 1: Set Up MongoDB Atlas (Cloud Database)

### 1.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a **FREE M0 Cluster**:
   - Cloud Provider: AWS (or any)
   - Region: Choose closest to you
   - Cluster Name: `CompilerGamified` (or any name)

### 1.2 Configure Database Access

1. In Atlas Dashboard → **Database Access**
2. Click **Add New Database User**
   - Username: `dbuser` (or your choice)
   - Password: Generate a secure password (SAVE THIS!)
   - Database User Privileges: **Read and write to any database**
3. Click **Add User**

### 1.3 Configure Network Access

1. In Atlas Dashboard → **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (0.0.0.0/0)
   - This is needed for cloud deployment
   - In production, restrict to your backend server IP
4. Click **Confirm**

### 1.4 Get Connection String

1. In Atlas Dashboard → **Database** → Click **Connect**
2. Choose **Connect your application**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://dbuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. **Replace `<password>` with your actual database password**
5. **Add your database name** after `.net/`:
   ```
   mongodb+srv://dbuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/compiler_gamified?retryWrites=true&w=majority
   ```

✅ **Save this connection string - you'll need it!**

---

## ☁️ Step 2: Deploy Backend to Render.com

### 2.1 Create Render Account

1. Go to [Render.com](https://render.com)
2. Sign up with GitHub (recommended)

### 2.2 Push Code to GitHub

**If you haven't already:**

```bash
cd E:\Mini_Project
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

### 2.3 Create Web Service on Render

1. In Render Dashboard → Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure the service:

**Basic Settings:**
- **Name**: `compiler-gamified-backend` (or your choice)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`

**Instance Type:**
- Select: **Free** (or paid if you prefer)

### 2.4 Add Environment Variables

In the **Environment Variables** section, add:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string from Step 1.4 |
| `MONGODB_DB` | `compiler_gamified` |
| `JWT_SECRET` | Generate a random secret (e.g., `openssl rand -hex 32`) |
| `ALLOW_ADMIN_REG` | `true` |
| `PORT` | `10000` (Render default) |
| `PYTHON_VERSION` | `3.11.0` |

**Example:**
```
MONGODB_URI=mongodb+srv://dbuser:mypassword@cluster0.xxxxx.mongodb.net/compiler_gamified?retryWrites=true&w=majority
MONGODB_DB=compiler_gamified
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
ALLOW_ADMIN_REG=true
PORT=10000
PYTHON_VERSION=3.11.0
```

### 2.5 Deploy!

1. Click **Create Web Service**
2. Render will automatically:
   - Clone your repo
   - Install dependencies
   - Start your app
3. Wait for deployment (5-10 minutes)
4. You'll get a URL like: `https://compiler-gamified-backend.onrender.com`

### 2.6 Test Your Deployment

Visit: `https://your-app-name.onrender.com/api/health`

You should see:
```json
{"status": "ok"}
```

✅ **Your backend is live!**

---

## 📱 Step 3: Update Mobile App to Use Cloud Backend

### 3.1 Update API Client

Open `E:\Mini_Project\mobile\src\api\client.js` and update the base URL:

**Before:**
```javascript
const API_BASE_URL = 'http://192.168.x.x:5000';
```

**After:**
```javascript
const API_BASE_URL = 'https://your-app-name.onrender.com';
```

**Example:**
```javascript
const API_BASE_URL = 'https://compiler-gamified-backend.onrender.com';
```

### 3.2 Commit and Push Changes

```bash
cd E:\Mini_Project\mobile
git add src/api/client.js
git commit -m "Update backend URL to production"
git push
```

### 3.3 Rebuild Mobile App

Now rebuild your APK with the cloud backend:

```bash
cd E:\Mini_Project\mobile
eas build --platform android --profile preview
```

Wait for the build to complete (5-15 minutes), then download the APK!

---

## 🧪 Step 4: Test Everything

### 4.1 Test Backend Directly

Use a tool like Postman or curl:

```bash
# Health check
curl https://your-app-name.onrender.com/api/health

# Register a user
curl -X POST https://your-app-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "student"
  }'
```

### 4.2 Test Mobile App

1. Download and install the new APK
2. Open the app
3. Try registering and logging in
4. All data should now persist in MongoDB Atlas!

---

## 🎯 Alternative Deployment Options

### Option 2: Railway.app

Very similar to Render, also has a free tier:

1. Go to [Railway.app](https://railway.app)
2. Connect GitHub repo
3. Add MongoDB Atlas connection string as environment variable
4. Deploy!

### Option 3: Heroku

More expensive now (no free tier), but well-documented:

```bash
# Install Heroku CLI
# Login and create app
heroku create your-app-name

# Add environment variables
heroku config:set MONGODB_URI="your-connection-string"
heroku config:set JWT_SECRET="your-secret"

# Deploy
git push heroku main
```

### Option 4: Google Cloud Run / AWS / Azure

For production scale, consider:
- **Google Cloud Run**: Serverless, pay per use
- **AWS Elastic Beanstalk**: Full-featured, scalable
- **Azure App Service**: Enterprise-ready

---

## 🔒 Security Best Practices

### Before Going to Production:

1. **Change JWT Secret**:
   ```bash
   # Generate secure secret
   openssl rand -hex 32
   ```

2. **Restrict MongoDB Network Access**:
   - Get your Render server's IP
   - In MongoDB Atlas → Network Access → Whitelist only that IP

3. **Disable Debug Mode**:
   - In `app.py`, ensure `debug=False` for production

4. **HTTPS Only**:
   - Render provides free SSL certificates automatically ✅

5. **Environment Variables**:
   - Never commit `.env` files to Git
   - Add `.env` to `.gitignore`

6. **Rate Limiting**:
   - Consider adding Flask-Limiter for API rate limiting

---

## 📊 Monitoring & Logs

### Render.com

- **Logs**: Dashboard → Your Service → Logs tab
- **Metrics**: Dashboard → Your Service → Metrics tab
- **Health Checks**: Automatically monitors `/api/health`

### MongoDB Atlas

- **Monitoring**: Dashboard → Cluster → Metrics tab
- **Alerts**: Set up email alerts for database issues

---

## 🐛 Troubleshooting

### Build fails on Render

**Error: `ModuleNotFoundError`**
- Check `requirements.txt` has all dependencies
- Ensure `gunicorn` is included

**Error: `Application failed to start`**
- Check Render logs for details
- Verify `Start Command` is `gunicorn app:app`
- Ensure `app.py` creates `app` instance at module level

### Mobile app can't connect

**Error: `Network request failed`**
- Verify backend URL in `client.js` is correct
- Check backend is actually running (visit health endpoint)
- Rebuild mobile app after changing URL

### Database connection issues

**Error: `MongoServerError: Authentication failed`**
- Check MongoDB Atlas password is correct
- Ensure connection string has password filled in
- Verify database user has correct permissions

**Error: `MongoNetworkError`**
- Check Network Access allows 0.0.0.0/0
- Verify connection string format is correct

### Render service sleeps (Free tier)

- Free tier services sleep after 15 mins of inactivity
- First request after sleep takes ~30 seconds (cold start)
- **Solution**: Upgrade to paid tier OR use a cron job to ping every 10 mins

---

## 📝 Quick Reference

### Your Deployed URLs

Fill these in after deployment:

- **Backend URL**: `https://__________________.onrender.com`
- **MongoDB Atlas Cluster**: `cluster0._____.mongodb.net`
- **Health Check**: `https://__________________.onrender.com/api/health`

### Important Commands

```bash
# Test backend locally
cd E:\Mini_Project\backend
python app.py

# Test mobile app locally (with cloud backend)
cd E:\Mini_Project\mobile
npm start

# Build production mobile app
cd E:\Mini_Project\mobile
eas build --platform android --profile preview

# Push updates to cloud
git add .
git commit -m "Your changes"
git push
# Render auto-deploys on push!
```

---

## 🎉 Success Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Network access configured (0.0.0.0/0)
- [ ] MongoDB connection string saved
- [ ] Code pushed to GitHub
- [ ] Render web service created
- [ ] Environment variables configured
- [ ] Backend deployed successfully
- [ ] Health check endpoint works
- [ ] Mobile app updated with backend URL
- [ ] Mobile app rebuilt with EAS
- [ ] APK downloaded and tested
- [ ] Registration/login works
- [ ] Data persists in cloud database

---

## 🆘 Need Help?

- **Render Support**: [docs.render.com](https://docs.render.com)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Expo/EAS Docs**: [docs.expo.dev](https://docs.expo.dev)

---

**🎊 Congratulations!** Your app is now fully deployed to the cloud!
