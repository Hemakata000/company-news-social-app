# 🚀 Quick Start Guide

## ERR_CONNECTION_REFUSED Fix

If you're seeing "This site can't be reached" or "ERR_CONNECTION_REFUSED", it means the development server isn't running yet. Follow these steps:

## Step-by-Step Instructions

### 1. Open Terminal/Command Prompt
Navigate to the frontend directory:
```bash
cd frontend
```

### 2. Install Dependencies (First Time Only)
```bash
npm install
```

**Expected output:**
```
npm WARN deprecated ...
added 1234 packages in 30s
```

### 3. Start the Development Server
```bash
npm run dev
```

**Expected output:**
```
> company-news-social-app-frontend@1.0.0 dev
> vite

  VITE v5.0.8  ready in 500ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 4. Open Your Browser
Only AFTER you see the "ready" message, open:
**http://localhost:3000**

## 🔧 Troubleshooting

### Problem: "npm is not recognized"
**Solution:** Install Node.js from https://nodejs.org/

### Problem: "Port 3000 is already in use"
**Solutions:**
```bash
# Option 1: Kill existing process
npx kill-port 3000

# Option 2: Use different port
npm run dev -- --port 3001
```

### Problem: "Cannot find module" errors
**Solution:**
```bash
# Delete and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Problem: TypeScript errors
**Solution:**
```bash
# Check for errors
npm run build

# If errors persist, try:
rm -rf node_modules package-lock.json
npm install
```

## ✅ Success Indicators

You'll know it's working when you see:
1. ✅ Terminal shows "ready in XXXms"
2. ✅ Browser loads the app at http://localhost:3000
3. ✅ You see "Company News Social Content Generator" page
4. ✅ Search box is visible and functional

## 🧪 Test the App

Once it's running, try searching for:
- **Apple**
- **Microsoft** 
- **Google**
- **Tesla**
- **Amazon**

You should see:
- Auto-complete suggestions
- News articles with highlights
- Social media content for different platforms
- Copy buttons that work

## 🆘 Still Having Issues?

1. **Check Node.js version:** `node --version` (should be 18+)
2. **Check npm version:** `npm --version` (should be 8+)
3. **Try incognito/private browsing**
4. **Clear browser cache**
5. **Check browser console for errors** (F12 → Console tab)

## 📝 Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Format code
npm run format
```

## 🎯 What You're Testing

This is a **frontend-only** version that uses mock data, so:
- ✅ No backend required
- ✅ No database required  
- ✅ No API keys required
- ✅ Works completely offline
- ✅ Realistic data and behavior
- ✅ All features functional

Perfect for testing the UI/UX without infrastructure setup!