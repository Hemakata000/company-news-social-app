# Frontend-Only Testing Guide

This guide helps you run and test the Company News Social App frontend without needing the backend or database.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will start at: **http://localhost:3000**

### 3. Test the Application
Open your browser and navigate to http://localhost:3000

## 🧪 Available Test Data

The app includes mock data for these companies:
- **Apple Inc** (AAPL)
- **Microsoft Corporation** (MSFT) 
- **Google** (GOOGL)
- **Amazon** (AMZN)
- **Tesla** (TSLA)
- **Meta** (META)
- **Netflix** (NFLX)
- **Spotify** (SPOT)
- **Uber** (UBER)
- **Airbnb** (ABNB)

## 🎯 Testing Features

### Search Functionality
1. Type any company name from the list above
2. See auto-complete suggestions
3. View search history
4. Test different search options

### News Display
- View news articles with highlights
- Check source links and publication dates
- Test loading states and error handling

### Social Media Content
- Generate content for LinkedIn, Twitter, Facebook, Instagram
- Test different tones (Professional, Casual, Enthusiastic)
- Copy content to clipboard
- Regenerate content with different options

### UI/UX Testing
- Test responsive design on different screen sizes
- Navigate between Home and About pages
- Test keyboard shortcuts and accessibility
- Check loading states and error messages

## 🔧 Configuration

### Mock API Settings
The app uses mock data by default in development. This is controlled by:
- `.env.local` file with `VITE_USE_MOCK_API=true`
- Automatic detection of development mode

### Network Simulation
The mock API simulates:
- Network delays (500-1500ms)
- Occasional network errors (5% chance)
- Service availability (95% uptime)
- Rate limiting and timeouts

## 📦 Building for Production

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run build:prod
```

### Preview Production Build
```bash
npm run preview
```

## 🌐 Deployment Options

### Static Hosting
The built app is a static website that can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

### Local Static Server
```bash
# After building
npm run serve
```

## 🐛 Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Kill existing process
npx kill-port 3000
# Or use different port
npm run dev -- --port 3001
```

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

### Mock API Issues

**No data showing:**
- Check browser console for errors
- Verify company names match the available test data
- Try refreshing the page

**Network errors:**
- The mock API simulates network issues
- Wait a moment and try again
- Check browser developer tools

## 📊 Performance Testing

### Lighthouse Audit
```bash
# Build and serve
npm run build
npm run preview

# Run Lighthouse audit on http://localhost:3000
```

### Bundle Analysis
```bash
npm run analyze
```

## 🔍 Development Tools

### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag

### Browser Developer Tools
- React Developer Tools
- Redux DevTools (if using Redux)
- Lighthouse for performance auditing

## 📝 Testing Checklist

- [ ] App loads without errors
- [ ] Search functionality works
- [ ] Company suggestions appear
- [ ] News articles display correctly
- [ ] Social media content generates
- [ ] Navigation between pages works
- [ ] Responsive design on mobile
- [ ] Error states display properly
- [ ] Loading states show correctly
- [ ] Copy to clipboard works
- [ ] Keyboard navigation works
- [ ] Accessibility features work

## 🚀 Next Steps

Once frontend testing is complete, you can:
1. Deploy the static build to a hosting service
2. Integrate with a real backend API
3. Add authentication and user accounts
4. Implement real-time features
5. Add analytics and monitoring

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Node.js and npm versions
3. Clear browser cache and cookies
4. Try incognito/private browsing mode
5. Check network connectivity

The app is designed to work entirely in the browser with mock data, so no external services are required for testing.