# Deployment Guide for Expense Tracker

## Problem
GitHub Pages only serves **static files** (HTML, CSS, JS). Your Express server (`server.js`) cannot run on GitHub Pages. That's why signup/login fail — there's no backend to handle API requests.

## Solution: Deploy Server Separately

You need to deploy your Node.js server to a platform that runs backend code. Here are the easiest options:

### Option 1: Railway (Recommended - Simplest)

1. **Sign up** at [railway.app](https://railway.app)
2. **Connect GitHub**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `expense-tracker` repository
3. **Configure Port**:
   - Railway automatically detects `Procfile` (already added)
   - Your server will run at a URL like: `https://expense-tracker-production.up.railway.app`

4. **Set Frontend API URL**:
   - After Railway deploys, note your server URL (e.g., `https://myapp-prod.up.railway.app`)
   - In your GitHub Pages HTML files, add this **before** loading `auth.js`:
   ```html
   <script>
     window.API_BASE_URL = 'https://myapp-prod.up.railway.app/api';
   </script>
   <script src="auth.js"></script>
   ```

5. **Update GitHub Pages settings**:
   - Go to GitHub Settings → Pages → Source: Deploy from branch → Branch: `master` → Folder: `/ (root)`
   - This serves the frontend from GitHub Pages

### Option 2: Render.com

Similar to Railway:
1. Sign up at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repo
4. Render detects `Procfile` automatically
5. Set `window.API_BASE_URL` in your frontend

### Option 3: Use Heroku Alternative (if you prefer)

Render and Railway both replaced Heroku's free tier.

## Quick Setup Steps

### Step 1: Deploy Backend to Railway
```bash
# Your code is already configured, just:
# 1. Push to GitHub (done ✅)
# 2. Sign up at railway.app
# 3. Connect your GitHub repo
# 4. Railway deploys automatically
```

### Step 2: Get Your Backend URL
After deployment, Railway shows you the URL: `https://YOUR-APP.up.railway.app`

### Step 3: Update Frontend API URL
Add this to the `<head>` of your HTML files (or create a config):

```html
<script>
  // Set API base URL based on environment
  if (window.location.hostname === 'github.io' || window.location.hostname.includes('pages')) {
    // Deployed on GitHub Pages
    window.API_BASE_URL = 'https://YOUR-RAILWAY-URL/api';
  }
</script>
```

### Step 4: Deploy Frontend to GitHub Pages
```bash
git push origin master  # Already done ✅
# GitHub Pages auto-deploys from master branch
```

## Testing

After deployment:
1. Go to `https://your-username.github.io/expense-tracker`
2. Try **Signup** → should work ✅
3. Try **Login** → should work ✅
4. Try **Save Budgets** → should work ✅

## Environment Variables

If you use Firestore:
- Upload `serviceAccountKey.json` to Railway's environment
- Set as secret: `GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json`

## Troubleshooting

**"Signup failed" error:**
- Check browser console (F12) → Network tab → `/api/signup` request
- If network shows 404 or connection refused, backend URL is wrong
- Update `window.API_BASE_URL` to match your deployed backend

**CORS errors:**
- Your server already has CORS enabled
- If still issues, check that `window.API_BASE_URL` is correct

## Free Tier Limits

- **Railway**: $5/month credit (enough for hobby projects)
- **Render**: Free tier with auto-sleep (wakes up on request)

---

**Next Action**: Deploy to Railway in 5 minutes. After that, your app works fully!
