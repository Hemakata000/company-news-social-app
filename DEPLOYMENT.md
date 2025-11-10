# Free Deployment Guide

## Option 1: Vercel (Frontend) + Render (Backend) - RECOMMENDED

### Prerequisites
- GitHub account
- Push your code to a GitHub repository

### Step 1: Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: company-news-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `NEWSAPI_KEY` = (your key)
   - `ALPHA_VANTAGE_KEY` = (your key)
   - `OPENAI_API_KEY` = (your key - optional)
   - `ANTHROPIC_API_KEY` = (your key - optional)
6. Click "Create Web Service"
7. **Copy the URL** (e.g., `https://company-news-backend.onrender.com`)

### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_API_BASE_URL` = (your Render backend URL from Step 1)
   - `VITE_USE_MOCK_API` = `false`
6. Click "Deploy"
7. Your app will be live at `https://your-app.vercel.app`

### Step 3: Update Backend CORS

After deployment, update your backend to allow requests from your Vercel domain:

In `backend/src/server.ts`, update the CORS configuration:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app'  // Add your Vercel URL
  ],
  credentials: true
}));
```

Commit and push - Render will auto-deploy.

---

## Option 2: Railway (All-in-One) - EASIEST

### Step 1: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will detect both frontend and backend

### Step 2: Configure Backend Service

1. Select the backend service
2. Add Environment Variables (same as Render above)
3. Set Start Command: `cd backend && npm start`

### Step 3: Configure Frontend Service

1. Select the frontend service
2. Add Environment Variable:
   - `VITE_API_BASE_URL` = (your Railway backend URL)
3. Set Build Command: `cd frontend && npm run build`
4. Set Start Command: `cd frontend && npm run preview`

### Step 4: Generate Domains

1. Click on each service → Settings → Generate Domain
2. Your app will be live!

---

## Option 3: Netlify (Frontend) + Render (Backend)

Similar to Option 1, but use Netlify instead of Vercel:

1. Deploy backend to Render (same as Option 1, Step 1)
2. Go to [netlify.com](https://netlify.com)
3. Drag and drop your `frontend/dist` folder after building locally
4. Or connect GitHub for automatic deployments

---

## Important Notes

### Free Tier Limitations

**Render Free Tier:**
- Spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month (enough for one service)

**Vercel Free Tier:**
- 100 GB bandwidth/month
- Unlimited deployments
- Always on (no sleep)

**Railway Free Tier:**
- $5 credit/month
- ~500 hours of runtime
- Services may sleep

### Database

If you need a database:
- **Render**: Free PostgreSQL (90 days, then expires)
- **Supabase**: Free PostgreSQL (permanent, 500MB)
- **PlanetScale**: Free MySQL (5GB storage)

### Cost Optimization

To stay within free tiers:
1. Use Vercel for frontend (always free, always on)
2. Use Render for backend (free but sleeps)
3. Accept the 30-second cold start on first request
4. Or upgrade to Railway's $5/month for better performance

---

## Quick Deploy Commands

### Build locally first (to test):
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

### Push to GitHub:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

Then follow the deployment steps above!
