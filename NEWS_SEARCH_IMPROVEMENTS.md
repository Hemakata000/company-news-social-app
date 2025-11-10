# News Search Improvements

## Problem
TCS, Infosys, and Accenture were not returning news results due to strict search criteria.

## Solution
Enhanced both NewsAPI and AlphaVantage clients with OR conditions and company aliases for better search results.

### Changes Made

#### 1. NewsAPI Client (`NewsAPIClient.ts`)
- Added `buildSearchQuery()` method that creates OR-based queries
- Added company alias mapping for:
  - TCS → "TCS" OR "Tata Consultancy Services" OR "Tata Consultancy"
  - Infosys → "Infosys" OR "Infosys Limited"
  - Accenture → "Accenture" OR "Accenture PLC"
  - Wipro, Cognizant, HCL, Tech Mahindra
- For multi-word companies: uses `"exact phrase" OR (word1 AND word2)` for better recall

#### 2. AlphaVantage Client (`AlphaVantageClient.ts`)
- Added ticker mappings for Indian IT companies:
  - TCS → TCS
  - Infosys → INFY
  - HCL → HCLTECH.NS
  - Tech Mahindra → TECHM.NS
- Enhanced fallback strategy: when ticker search fails, searches technology topic and filters by company name
- Added `getCompanySearchTerms()` method for alias-based filtering
- Improved `isRelevantToCompany()` to check multiple aliases

### How It Works

**NewsAPI Search Flow:**
1. Input: "TCS"
2. Query: `"TCS" OR "Tata Consultancy Services" OR "Tata Consultancy"`
3. Returns articles matching any of these terms

**AlphaVantage Search Flow:**
1. Input: "TCS"
2. First try: Search with ticker "TCS"
3. If no results: Search technology topic, filter for articles mentioning TCS/Tata Consultancy Services
4. Returns filtered, relevant articles

### Benefits
- **Better Recall**: OR conditions find more relevant articles
- **Alias Support**: Handles different ways companies are mentioned in news
- **Graceful Fallback**: AlphaVantage falls back to topic search if ticker fails
- **Indian Companies**: Proper support for TCS, Infosys, Wipro, HCL, Tech Mahindra

### Testing
Search for these companies to verify:
- TCS / Tata Consultancy Services
- Infosys
- Accenture
- Wipro
- Cognizant
- HCL Technologies
- Tech Mahindra
