# Quick Render Deployment Guide

## Step 1: Create Account & Connect Repo
1. Go to [render.com](https://render.com)
2. Click **Sign Up** → Choose **GitHub**
3. Authorize Render to access your GitHub account
4. Click **New** → **Web Service**
5. Select your `expense-tracker` repository

## Step 2: Configure Render

Fill in these fields:
- **Name**: `expense-tracker` (or any name)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Plan**: Free (it's fine for testing)

## Step 3: Get Your Backend URL

After deployment:
- Render shows URL like: `https://expense-tracker.onrender.com`
- Backend API is at: `https://expense-tracker.onrender.com/api`

## Step 4: Update Frontend Code

Edit `index.html`, `login.html`, `signup.html` - add this in the `<head>` section:

```html
<script>
  window.API_BASE_URL = 'https://YOUR-RENDER-URL/api';
</script>
```

Replace `YOUR-RENDER-URL` with your actual Render URL (e.g., `https://expense-tracker.onrender.com`)

## Step 5: Push to GitHub

```bash
git add .
git commit -m "Configure Render backend URL"
git push origin master
```

GitHub Pages will update automatically.

## Done!

Your app now has:
- **Frontend** on GitHub Pages: `https://chunduru-abhiram.github.io/expense-tracker/`
- **Backend** on Render: `https://expense-tracker.onrender.com/`

Signup/login will work!

---

## Troubleshooting

**"Signup failed" still?**
- Open browser DevTools (F12) → Console
- Copy the error message
- Check if your Render URL is correct in the code

**Render URL format:**
- Should be: `https://your-app-name.onrender.com`
- NOT: `https://your-app-name.onrender.com/` (no trailing slash)
