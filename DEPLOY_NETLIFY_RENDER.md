# Deploy to Netlify + Render - Step by Step

## Prerequisites
✅ GitHub account  
✅ Your code pushed to GitHub  
✅ API keys ready (NEWSAPI_KEY, ALPHA_VANTAGE_KEY)

---

## PART 1: Deploy Backend to Render (20 minutes)

### Step 1: Sign up for Render
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with your GitHub account
4. Authorize Render to access your repositories

### Step 2: Create Web Service
1. Click "New +" button (top right)
2. Select "Web Service"
3. Click "Connect" next to your repository
4. If you don't see it, click "Configure account" and grant access

### Step 3: Configure Backend Service
Fill in these settings:

**Basic Settings:**
- **Name**: `company-news-backend` (or any name you like)
- **Region**: Oregon (US West) - closest to you
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Instance Type:**
- Select **Free** (it will say "Free - 512 MB RAM")

### Step 4: Add Environment Variables
Scroll down to "Environment Variables" section and add these:

Click "Add Environment Variable" for each:

1. **NODE_ENV**
   - Value: `production`

2. **PORT**
   - Value: `3001`

3. **NEWSAPI_KEY**
   - Value: `YOUR_ACTUAL_NEWSAPI_KEY`
   - Get it from: https://newsapi.org/

4. **ALPHA_VANTAGE_KEY**
   - Value: `YOUR_ACTUAL_ALPHA_VANTAGE_KEY`
   - Get it from: https://www.alphavantage.co/support/#api-key

5. **OPENAI_API_KEY** (Optional - for AI features)
   - Value: `YOUR_OPENAI_KEY` or leave empty

6. **ANTHROPIC_API_KEY** (Optional - for Claude AI)
   - Value: `YOUR_ANTHROPIC_KEY` or leave empty

### Step 5: Deploy Backend
1. Click "Create Web Service" button at the bottom
2. Wait 5-10 minutes for deployment
3. Watch the logs - you should see:
   ```
   ==> Building...
   ==> Deploying...
   ==> Your service is live 🎉
   ```

### Step 6: Get Your Backend URL
1. At the top of the page, you'll see your service URL
2. It will look like: `https://company-news-backend-xxxx.onrender.com`
3. **COPY THIS URL** - you'll need it for the frontend!

### Step 7: Test Backend
1. Click on the URL or open: `https://your-backend-url.onrender.com/api/health`
2. You should see: `{"status":"ok","timestamp":"..."}`
3. ✅ Backend is working!

---

## PART 2: Deploy Frontend to Netlify (10 minutes)

### Step 1: Build Frontend Locally First
Open PowerShell in your project root:

```powershell
cd frontend
npm run build
```

This creates a `dist` folder with your built app.

### Step 2: Sign up for Netlify
1. Go to https://netlify.com
2. Click "Sign up"
3. Sign up with your GitHub account

### Step 3: Deploy via Drag & Drop (Easiest)
1. On Netlify dashboard, look for the drag & drop area
2. It says "Want to deploy a new site without connecting to Git?"
3. **Drag the `frontend/dist` folder** into this area
4. Wait 30 seconds
5. ✅ Your site is live!

### Step 4: Get Your Frontend URL
1. Netlify will give you a random URL like: `https://random-name-123.netlify.app`
2. Click "Site settings" → "Change site name" to customize it
3. Change to: `company-news-social` (or any available name)
4. Your URL becomes: `https://company-news-social.netlify.app`

### Step 5: Configure Environment Variables
**IMPORTANT:** The frontend needs to know where your backend is!

1. Go to "Site settings" → "Environment variables"
2. Click "Add a variable"
3. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-url.onrender.com` (from Part 1, Step 6)
4. Add another:
   - **Key**: `VITE_USE_MOCK_API`
   - **Value**: `false`

### Step 6: Rebuild with Environment Variables
Since you added environment variables, you need to rebuild:

**Option A: Drag & Drop Again**
1. In your PowerShell, run: `npm run build` (in frontend folder)
2. Drag the new `dist` folder to Netlify again
3. It will update your site

**Option B: Connect to GitHub (Better for future updates)**
1. Go to "Site settings" → "Build & deploy"
2. Click "Link repository"
3. Select your GitHub repo
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Click "Deploy site"

---

## PART 3: Update Backend CORS (5 minutes)

Your backend needs to allow requests from your Netlify domain.

### Step 1: Update CORS in Backend
Open `backend/src/server.ts` and find the CORS configuration.

Update it to include your Netlify URL:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://company-news-social.netlify.app'  // Add your Netlify URL
  ],
  credentials: true
}));
```

### Step 2: Push to GitHub
```powershell
git add .
git commit -m "Add Netlify URL to CORS"
git push origin main
```

### Step 3: Wait for Auto-Deploy
Render will automatically detect the change and redeploy (takes 5 minutes).

---

## PART 4: Test Your Live App! 🎉

1. Open your Netlify URL: `https://company-news-social.netlify.app`
2. Search for "Apple" or "Microsoft"
3. Wait 30 seconds on first request (Render free tier cold start)
4. You should see real news articles!

---

## Troubleshooting

### Frontend shows "Network Error"
- Check that `VITE_API_BASE_URL` is set correctly in Netlify
- Make sure you rebuilt after adding environment variables
- Check browser console for CORS errors

### Backend not responding
- Render free tier sleeps after 15 minutes of inactivity
- First request takes 30 seconds to wake up
- Check Render logs for errors

### CORS Error
- Make sure you added your Netlify URL to backend CORS
- Make sure you pushed the changes to GitHub
- Wait for Render to redeploy

### "API key invalid" errors
- Check that you added the correct API keys in Render
- Make sure there are no extra spaces in the keys
- Verify keys work by testing them directly

---

## Free Tier Limits

**Render Free Tier:**
- ✅ 750 hours/month (enough for one service)
- ✅ Automatic HTTPS
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ 30-second cold start

**Netlify Free Tier:**
- ✅ 100 GB bandwidth/month
- ✅ Unlimited sites
- ✅ Automatic HTTPS
- ✅ Always on (no sleep)

---

## Next Steps

### To Update Your App:
1. Make changes to your code
2. Push to GitHub: `git push origin main`
3. Render auto-deploys backend (5 min)
4. Netlify auto-deploys frontend (2 min)

### To Monitor:
- **Render Dashboard**: See backend logs and metrics
- **Netlify Dashboard**: See frontend deploys and analytics

### To Upgrade (Optional):
- **Render**: $7/month for always-on backend
- **Netlify**: Free tier is usually enough

---

## Success Checklist

- [ ] Backend deployed to Render
- [ ] Backend URL copied
- [ ] Frontend built locally
- [ ] Frontend deployed to Netlify
- [ ] Environment variables added to Netlify
- [ ] Frontend rebuilt with env vars
- [ ] CORS updated in backend
- [ ] Changes pushed to GitHub
- [ ] App tested and working!

🎉 **Congratulations! Your app is live and accessible from anywhere!**
