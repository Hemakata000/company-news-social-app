# Testing Improved News Search Locally

## What We Improved
✅ Added OR-based search queries for better results
✅ Added company aliases (TCS, Infosys, Accenture, Wipro, etc.)
✅ Enhanced AlphaVantage fallback with topic filtering

## Test Commands

### 1. Test Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/health" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json
```

### 2. Test TCS News Search
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/news/TCS?limit=5" -Method GET
$json = $response.Content | ConvertFrom-Json
Write-Host "Company: $($json.company.name)"
Write-Host "Articles Found: $($json.articles.Count)"
Write-Host "Sources: $($json.sources -join ', ')"
$json.articles | ForEach-Object { Write-Host "- $($_.title.Substring(0, [Math]::Min(80, $_.title.Length)))..." }
```

### 3. Test Infosys News Search
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/news/Infosys?limit=5" -Method GET
$json = $response.Content | ConvertFrom-Json
Write-Host "Company: $($json.company.name)"
Write-Host "Articles Found: $($json.articles.Count)"
Write-Host "Sources: $($json.sources -join ', ')"
```

### 4. Test Accenture News Search
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/news/Accenture?limit=5" -Method GET
$json = $response.Content | ConvertFrom-Json
Write-Host "Company: $($json.company.name)"
Write-Host "Articles Found: $($json.articles.Count)"
Write-Host "Sources: $($json.sources -join ', ')"
```

### 5. Test Apple (for comparison)
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/news/Apple?limit=5" -Method GET
$json = $response.Content | ConvertFrom-Json
Write-Host "Company: $($json.company.name)"
Write-Host "Articles Found: $($json.articles.Count)"
Write-Host "Sources: $($json.sources -join ', ')"
```

## Expected Results

### Before Improvements
- TCS: 0 articles (404 error)
- Infosys: 0 articles (404 error)
- Accenture: 0 articles (404 error)

### After Improvements
- TCS: 1-5 articles ✅
- Infosys: 1-5 articles ✅
- Accenture: 1-5 articles ✅

## How the OR Search Works

**NewsAPI Query Examples:**
- TCS → `"TCS" OR "Tata Consultancy Services" OR "Tata Consultancy"`
- Infosys → `"Infosys" OR "Infosys Limited"`
- Accenture → `"Accenture" OR "Accenture PLC"`

**AlphaVantage Strategy:**
1. Try ticker symbol first (TCS, INFY, ACN)
2. If no results, search "technology" topic
3. Filter results for company mentions

## Frontend Testing

Once backend is confirmed working:

1. Open your app at `http://localhost:3000`
2. Search for "TCS"
3. Search for "Infosys"
4. Search for "Accenture"
5. Verify news articles appear

## Notes

- First request may take 5-10 seconds (API calls)
- Subsequent requests are cached (instant)
- Social media generation requires OpenAI API key with billing
- Without OpenAI, you'll see news but no social content
