# 🚀 MVP Setup Guide - Real Dynamic News

Get your app running with **real news from the internet** in just a few steps!

## What You'll Get

✅ **Real-time news** from Reuters, Bloomberg, CNBC, WSJ, TechCrunch  
✅ **Financial news** with sentiment analysis from Alpha Vantage  
✅ **AI-generated social media posts** using OpenAI  
✅ **SQLite database** - zero installation, just a file!  
✅ **In-memory caching** - no Redis needed for MVP  

---

## Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Step 2: Get Free API Keys (5 minutes)

### NewsAPI (Required - 100 free requests/day)
1. Go to: https://newsapi.org/register
2. Sign up with your email
3. Copy your API key

### Alpha Vantage (Required - 25 free requests/day)
1. Go to: https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Copy your API key

### OpenAI (Required - Pay-as-you-go, ~$0.002 per request)
1. Go to: https://platform.openai.com/signup
2. Create an account
3. Go to: https://platform.openai.com/api-keys
4. Create a new API key
5. Add $5-10 credit to your account

**Total cost for testing:** ~$5-10 (will last for thousands of requests)

---

## Step 3: Configure Backend

Edit `backend/.env.local` and add your API keys:

```env
# Replace these with your actual API keys
NEWS_API_KEY=your_newsapi_key_here
ALPHA_VANTAGE_API_KEY=your_alphavantage_key_here
OPENAI_API_KEY=your_openai_key_here
```

**That's it!** The database will be created automatically.

---

## Step 4: Start the Application

### Option A: Automatic (Recommended)

**Windows:**
```bash
# From project root
npm run start:mvp
```

**Mac/Linux:**
```bash
# From project root
chmod +x start-mvp.sh
./start-mvp.sh
```

### Option B: Manual

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## Step 5: Test It Out!

1. Open your browser to: **http://localhost:5173**
2. Search for a company: **Apple**, **Microsoft**, **Tesla**, etc.
3. Watch real news load from the internet!
4. See AI-generated social media posts

---

## 📁 Where's My Data?

- **Database:** `backend/data/app.db` (SQLite file)
- **Cache:** In-memory (resets when you restart)
- **Logs:** Console output

---

## 🔧 Troubleshooting

### "Cannot find module 'better-sqlite3'"
```bash
cd backend
npm install
```

### "API key is invalid"
- Double-check your API keys in `backend/.env.local`
- Make sure there are no extra spaces
- Restart the backend server

### "Port 3001 already in use"
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### "No news found"
- Check your API keys are valid
- NewsAPI free tier has limits (100 requests/day)
- Try a different company name

### Database errors
```bash
# Delete and recreate database
rm backend/data/app.db
cd backend
npm run migrate
```

---

## 💡 Tips for MVP Testing

1. **Start with popular companies:** Apple, Microsoft, Google, Tesla
2. **Monitor API usage:** NewsAPI dashboard shows your remaining requests
3. **Use gpt-3.5-turbo:** Cheaper than GPT-4 for testing ($0.002 vs $0.03 per request)
4. **Cache is your friend:** Same searches use cached data (15 min TTL)

---

## 🎯 What's Next?

Once your MVP is working:

1. **Add more companies** to the database
2. **Customize AI prompts** for better social media content
3. **Deploy to production** (see DEPLOYMENT-GUIDE.md)
4. **Add user authentication**
5. **Implement rate limiting** for production use

---

## 📊 API Cost Estimates

For 100 company searches per day:

- **NewsAPI:** FREE (100 requests/day)
- **Alpha Vantage:** FREE (25 requests/day)
- **OpenAI:** ~$0.20/day (100 requests × $0.002)

**Monthly cost:** ~$6/month for OpenAI only

---

## 🆘 Need Help?

1. Check the console for error messages
2. Verify all API keys are correct
3. Make sure both backend and frontend are running
4. Check that ports 3001 and 5173 are available

---

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] API keys configured in `.env.local`
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Can search for companies
- [ ] Real news articles appear
- [ ] Social media posts generate
- [ ] Database file created at `backend/data/app.db`

**You're all set! 🎉**
