# OpenAI Rate Limit Fix

## Problem
Error: `Rate limit reached for gpt-4... Limit 10000, Used 10000, Requested 310`

## Root Cause
- App is using GPT-4 which has strict rate limits (10,000 tokens/min)
- Processing multiple articles simultaneously hits the limit quickly

## Solution
Switch to GPT-3.5-turbo which has:
- Higher rate limits (60,000 tokens/min)
- Faster responses
- Lower cost ($0.0015 vs $0.03 per 1K tokens)
- Still excellent quality for social media posts

## Steps to Fix in Render

1. Go to https://dashboard.render.com
2. Click your backend service
3. Go to "Environment" tab
4. Add/Update this variable:
   - **Key**: `AI_MODEL`
   - **Value**: `gpt-3.5-turbo`
5. Save (triggers redeploy)

## Alternative: Increase Rate Limits

If you prefer to keep GPT-4:
1. Go to https://platform.openai.com/settings/organization/limits
2. Request rate limit increase
3. Wait for approval (can take days)

## Recommended: Use GPT-3.5-turbo
- Perfect for social media content
- 6x higher rate limits
- 20x cheaper
- Faster responses
