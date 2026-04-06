# Vercel Deployment Guide - CyberFlix MERN App

This guide walks you through deploying the CyberFlix MERN application on Vercel.

## Prerequisites

- GitHub account with the repository pushed (✅ Already done)
- Vercel account (free at https://vercel.com)
- MongoDB Atlas account (free tier available)
- Gmail account for email service

## Deployment Architecture

This MERN app is deployed in two parts:

1. **Frontend (React + Vite)** → Vercel ✅
2. **Backend (Express API)** → Separate service (Render.com, Railway, or self-hosted)

---

## Part 1: Deploy Backend API

### Option A: Deploy on Render.com (Recommended - Free tier available)

1. Go to https://render.com and sign up
2. Create new Web Service
3. Connect your GitHub repository
4. Set configuration:
   - **Name**: cyberflix-api
   - **Environment**: Node
   - **Build Command**: `npm install && cd server && npm install`
   - **Start Command**: `npm start --prefix server`
5. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/cyberflix
   JWT_SECRET=your-long-random-secret-key-here
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM_NAME=Cyberflix
   EMAIL_FROM_EMAIL=your-gmail@gmail.com
   VERIFICATION_CODE_EXPIRES=10m
   NODE_ENV=production
   ```
6. Click "Deploy"
7. Copy the deployed URL (e.g., `https://cyberflix-api.onrender.com`)

### Option B: Deploy on Railway.app

1. Go to https://railway.app and sign up
2. Create new project from GitHub
3. Add plugins: PostgreSQL or MongoDB (if using cloud)
4. Set environment variables (same as above)
5. Deploy

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Prepare Environment Variables

1. Get your backend API URL from Part 1 (e.g., `https://cyberflix-api.onrender.com`)

### Step 2: Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your GitHub repository (`sudarshan1808/cyberflx`)
4. Vercel will auto-detect the setup

### Step 3: Configure Build & Environment Variables

**Build Settings:**
- **Framework**: Vite (auto-detected)
- **Build Command**: `npm run build --prefix client`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install && cd server && npm install && cd ../client && npm install`

**Environment Variables** - Add in Vercel Dashboard:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your frontend is now live!

---

## Troubleshooting

### Build fails with "Cannot find module"

**Solution**: Ensure all dependencies are installed. The install command should be:
```
npm install && cd server && npm install && cd ../client && npm install
```

### API requests fail (CORS error)

**Solution**: Backend needs CORS configured for your Vercel domain.

In `server/index.js`, update CORS origin:
```javascript
cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
})
```

Set `CLIENT_ORIGIN` environment variable on backend to your Vercel URL.

### Email verification not working

**Solution**: Verify these are set on YOUR BACKEND service:
- `EMAIL_USER` (gmail address)
- `EMAIL_PASSWORD` (Gmail app password, NOT your regular password)

**To get Gmail app password:**
1. Enable 2FA on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Create app password for "Mail"
4. Copy that password to `EMAIL_PASSWORD`

### Vercel build succeeds but site shows 404

**Solution**: The build output directory might be wrong. Should be `client/dist`.

---

## Post-Deployment

After deployment:

1. ✅ Test login/registration
2. ✅ Test email verification
3. ✅ Test watchlist functionality
4. ✅ Test content browsing and ratings

---

## Environment Variables Reference

### Backend (.env)
```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=random-secret-key
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Cyberflix
EMAIL_FROM_EMAIL=your-gmail@gmail.com
VERIFICATION_CODE_EXPIRES=10m
PORT=5000
CLIENT_ORIGIN=https://your-vercel-domain.vercel.app
```

### Frontend (Vercel Environment Variables)
```
VITE_API_URL=https://your-backend-url.onrender.com
```

---

## Summary

After following these steps, you'll have:

📱 Frontend → Vercel (e.g., `https://cyberflx.vercel.app`)
🔌 Backend → Render/Railway (e.g., `https://cyberflix-api.onrender.com`)
🗄️ Database → MongoDB Atlas (cloud)

Both services communicate via the `VITE_API_URL` environment variable.

---

For more help:
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com/
