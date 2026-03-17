# Vercel Deployment Guide - Frontend

## Prerequisites

Before deploying to Vercel, ensure you have:

1. A [Vercel account](https://vercel.com/signup) (free tier works great)
2. [Vercel CLI](https://vercel.com/cli) installed (optional but recommended)
3. Your backend API deployed and running (currently on Render: https://compilex-1-u5bd.onrender.com)
4. Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended for First-Time Users)

#### Step 1: Push Your Code to Git

```bash
# If not already a git repository
git init
git add .
git commit -m "Prepare frontend for Vercel deployment"

# Push to your remote repository (GitHub recommended)
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

#### Step 2: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Git repository
4. Select the repository containing your project

#### Step 3: Configure Project Settings

Configure the following settings in Vercel:

**Framework Preset:** Vite

**Root Directory:** `frontend`
- Click "Edit" next to Root Directory
- Enter: `frontend`
- This tells Vercel to build from the frontend folder

**Build Settings:**
- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Install Command: `npm install` (auto-detected)

#### Step 4: Add Environment Variables

In the Vercel project settings, add the following environment variable:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://compilex-1-u5bd.onrender.com/api` |

**To add environment variables:**
1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add variable name: `VITE_API_URL`
3. Add value: `https://compilex-1-u5bd.onrender.com/api`
4. Select environment: **Production**, **Preview**, and **Development** (check all)
5. Click **Save**

#### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-2 minutes)
3. Once deployed, Vercel will provide you with a URL like: `https://your-project.vercel.app`

---

### Option 2: Deploy via Vercel CLI (For Advanced Users)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy

Navigate to the frontend directory and run:

```bash
cd frontend
vercel
```

Follow the prompts:
- **Set up and deploy:** Yes
- **Which scope:** Select your account
- **Link to existing project:** No (first time) or Yes (subsequent deploys)
- **Project name:** Enter your desired name
- **Directory:** ./ (current directory)
- **Override settings:** No

#### Step 4: Set Environment Variables via CLI

```bash
vercel env add VITE_API_URL
```

When prompted, enter: `https://compilex-1-u5bd.onrender.com/api`

Select environments: Production, Preview, Development

#### Step 5: Deploy to Production

```bash
vercel --prod
```

---

## Post-Deployment

### 1. Verify Deployment

After deployment, test your application:

✅ Visit your Vercel URL  
✅ Test user registration  
✅ Test user login  
✅ Test API calls to your backend  
✅ Check browser console for errors  

### 2. Configure Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

### 3. Set Up Automatic Deployments

With the Vercel + Git integration:
- Every push to your `main` branch triggers a production deployment
- Every push to other branches creates a preview deployment
- Pull requests get unique preview URLs automatically

---

## Backend CORS Configuration

⚠️ **Important:** Make sure your backend allows requests from your Vercel domain.

If you're using the backend on Render, update your CORS settings in `backend/app.py`:

```python
from flask_cors import CORS

# Add your Vercel URL to allowed origins
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "https://your-project.vercel.app",  # Add your Vercel URL
            "https://*.vercel.app"  # Allow all Vercel preview deployments
        ]
    }
})
```

After updating CORS, redeploy your backend to Render.

---

## Troubleshooting

### Build Fails

**Issue:** Build fails with dependency errors

**Solution:**
```bash
# Locally test the build
cd frontend
npm install
npm run build
```

If successful locally but fails on Vercel, check Node.js version compatibility.

### API Calls Fail (404 or Network Errors)

**Issue:** Frontend can't connect to backend

**Solutions:**
1. Verify `VITE_API_URL` environment variable is set correctly in Vercel
2. Check that backend is running on Render
3. Verify CORS is configured properly on backend
4. Check browser console for detailed error messages

### Environment Variables Not Working

**Issue:** App uses default URL instead of environment variable

**Solution:**
1. Environment variables in Vite must be prefixed with `VITE_`
2. After adding/changing environment variables in Vercel, redeploy the project
3. Vercel requires a new deployment to pick up environment variable changes

### Routing Issues (404 on Page Refresh)

**Issue:** Page refresh returns 404

**Solution:** This is already handled by your `vercel.json` file with the rewrites configuration. If you still see issues, verify `vercel.json` exists in the frontend root directory.

---

## Updating Your Deployment

### Via Git (Automatic)

```bash
# Make changes to your code
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically detect the push and deploy the changes.

### Via CLI (Manual)

```bash
cd frontend
vercel --prod
```

---

## Monitoring and Analytics

Vercel provides built-in analytics:

1. Go to your project dashboard
2. Click on the **Analytics** tab
3. View:
   - Page views
   - Performance metrics
   - Real User Monitoring (RUM)
   - Web Vitals

---

## Cost

- **Free Tier Includes:**
  - ✅ Unlimited deployments
  - ✅ HTTPS/SSL certificates
  - ✅ Automatic CI/CD
  - ✅ 100 GB bandwidth per month
  - ✅ Preview deployments
  - ✅ Serverless functions (if needed later)

The free tier is more than sufficient for this educational project.

---

## Useful Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs [deployment-url]

# List all deployments
vercel ls

# Remove a deployment
vercel rm [deployment-url]

# Pull environment variables locally
vercel env pull
```

---

## Next Steps

1. ✅ Deploy frontend to Vercel
2. 🔄 Update backend CORS to allow Vercel domain
3. 📱 Update mobile app API URL if needed (in `mobile/src/config/environment.js`)
4. 🔒 Consider adding security headers (already configured in `vercel.json`)
5. 📊 Set up analytics and monitoring

---

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**Your frontend is ready for deployment!** 🚀

The configuration is already optimized with:
- ✅ Proper build configuration
- ✅ SPA routing support
- ✅ Security headers
- ✅ Caching strategies
- ✅ Environment variable support
