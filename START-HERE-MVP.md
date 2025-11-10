# 🚀 START HERE - MVP with Real Dynamic News

## What You Have Now

Your app is **100% ready** to fetch real news from the internet! I've set everything up for you.

---

## ⚡ Quick Start (2 Minutes)

### Step 1: Get API Keys (100% FREE!)

**NewsAPI** (FREE - 100 requests/day):
- Go to: https://newsapi.org/register
- Sign up → Copy your API key

**Alpha Vantage** (FREE - 25 requests/day):
- Go to: https://www.alphavantage.co/support/#api-key
- Enter email → Copy your API key

**That's it!** No paid services needed. Social media content will be generated using smart rules (no AI cost).

### Step 2: Add Keys

Edit `backend/.env.local` (file already created for you):

```env
NEWS_API_KEY=paste_your_newsapi_key_here
ALPHA_VANTAGE_API_KEY=paste_your_alphavantage_key_here

# Leave these empty to use FREE rule-based content generator
# OPENAI_API_KEY=
# CLAUDE_API_KEY=
```

### Step 3: Install & Run

```bash
# Install dependencies
npm install

# Start everything
npm run start:mvp
```

**Done!** Open http://localhost:5173

---

## 🎯 What Works

✅ **Real news** from Reuters, Bloomberg, CNBC, WSJ, TechCrunch  
✅ **Financial news** with sentiment analysis  
✅ **Smart social media posts** (rule-based, no AI cost!)  
✅ **SQLite database** (no installation needed)  
✅ **In-memory cache** (no Redis needed)  
✅ **48-hour news filter**  
✅ **Sentiment analysis**  
✅ **Verified sources**  
✅ **Clickable links**  
✅ **Dynamic color theming**  
✅ **100% FREE** to run  

---

## 💰 Cost

- **NewsAPI:** FREE (100/day)
- **Alpha Vantage:** FREE (25/day)
- **Social Media Generation:** FREE (rule-based, no AI)

**Total: $0/month** 🎉

---

## 📁 Key Files

- `backend/.env.local` - Add your API keys here
- `backend/data/app.db` - SQLite database (auto-created)
- `MVP-SETUP-GUIDE.md` - Detailed instructions
- `REAL-NEWS-READY.md` - What changed

---

## 🆘 Troubleshooting

### "Module not found"
```bash
npm install
```

### "API key invalid"
- Check `backend/.env.local` for typos
- Restart backend server

### "Port already in use"
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

---

## ## ✅ Success Checklist

- [ ] Got FREE API keys (NewsAPI + Alpha Vantage)
- [ ] Added keys to `backend/.env.local`
- [ ] Ran `npm install`
- [ ] Ran `npm run start:mvp`
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Can search for companies
- [ ] Real news appears!
- [ ] Social media posts generate (FREE!)

**You're all set! 🎉**

### 💡 Want AI-Powered Content Instead?

The free rule-based generator works great, but if you want even better social media posts:

1. Get OpenAI API key: https://platform.openai.com/api-keys
2. Add to `backend/.env.local`: `OPENAI_API_KEY=your_key`
3. Restart backend
4. Cost: ~$3/month for testing

**But the free version is perfect for MVP!**

---

## 📚 More Info

- **MVP-SETUP-GUIDE.md** - Detailed setup guide
- **REAL-NEWS-READY.md** - Technical changes
- **docs/API.md** - API documentation

**Happy coding! 🚀**
