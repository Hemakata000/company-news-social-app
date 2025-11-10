# Push to GitHub - Step by Step Guide

## Step 1: Create Personal Access Token (Instead of Password)

GitHub no longer accepts passwords for Git operations. You need a Personal Access Token.

### Create Token:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: `Productivity Enhancer Deploy`
4. Select expiration: `90 days` (or No expiration)
5. Check these scopes:
   - ✅ **repo** (all sub-options)
   - ✅ **workflow**
6. Scroll down and click "Generate token"
7. **COPY THE TOKEN** - you won't see it again!
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Save it in a text file temporarily

## Step 2: Create New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `company-news-social-app`
   - **Description**: `Company News & Social Media Content Generator`
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** check "Initialize with README" (we already have code)
3. Click "Create repository"

## Step 3: Connect Your Local Code to GitHub

GitHub will show you commands. Use these in PowerShell:

### Option A: Using HTTPS (Recommended)

```powershell
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/company-news-social-app.git

# Push your code
git push -u origin main
```

When prompted for credentials:
- **Username**: Your GitHub username
- **Password**: Paste your Personal Access Token (not your actual password!)

### Option B: If you get an error, try this:

```powershell
# Remove existing remote if any
git remote remove origin

# Add remote with your username in the URL
git remote add origin https://YOUR_USERNAME@github.com/YOUR_USERNAME/company-news-social-app.git

# Push
git push -u origin main
```

## Step 4: Verify Upload

1. Go to your repository: `https://github.com/YOUR_USERNAME/company-news-social-app`
2. You should see all your files!
3. ✅ Success!

---

## Troubleshooting

### "Authentication failed"
- Make sure you're using the Personal Access Token, not your password
- Check that the token has `repo` scope
- Try regenerating the token

### "Repository not found"
- Check the repository name matches exactly
- Make sure you created the repository on GitHub first
- Verify your username is correct in the URL

### "Permission denied"
- Make sure the repository visibility matches (public/private)
- Check that your token hasn't expired
- Verify you're logged into the correct GitHub account

---

## Next Steps After Pushing

Once your code is on GitHub:

1. ✅ **Deploy Backend to Render**
   - Follow `DEPLOY_NETLIFY_RENDER.md` Part 1

2. ✅ **Deploy Frontend to Netlify**
   - Follow `DEPLOY_NETLIFY_RENDER.md` Part 2

3. ✅ **Your app will be live!**

---

## Future Updates

After initial push, to update your code:

```powershell
# Make changes to your code
# Then:

git add .
git commit -m "Description of changes"
git push
```

No need to enter credentials again - Git will remember!
