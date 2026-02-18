# Vercel Deployment Guide

## Overview

This project consists of:
- **Frontend**: Next.js application in `frontend/` directory
- **Backend**: FastAPI application in `backend/` directory

## Deployment Options

### Option 1: Frontend on Vercel + Backend on External Service (Recommended)

This is the recommended approach as FastAPI works better on dedicated container services.

#### Frontend Deployment

1. **Create a new Vercel project**:
   - Connect your repository
   - Set **Root Directory** to `frontend`
   - Vercel will auto-detect Next.js

2. **Configure Environment Variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

3. **Deploy**: Vercel will automatically build and deploy your Next.js app

#### Backend Deployment

Deploy backend to one of these services:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Fly.io**: https://fly.io
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

Set up environment variables on your backend service:
- `ENV=production`
- Configure CORS to allow your Vercel frontend domain

### Option 2: Both on Vercel (Limited)

**Note**: FastAPI on Vercel Serverless Functions has limitations:
- Cold starts can be slow
- Limited execution time (10s on Hobby plan, 60s on Pro)
- May not work well for long-running operations

#### Frontend Deployment

Same as Option 1.

#### Backend Deployment on Vercel

1. **Create a separate Vercel project**:
   - Connect your repository
   - Set **Root Directory** to `backend`
   - Vercel will use the `backend/vercel.json` configuration

2. **Install Vercel Python runtime**:
   ```bash
   npm i -g vercel
   vercel
   ```

3. **Configure Environment Variables**:
   ```
   PYTHON_VERSION=3.11
   ```

4. **Update frontend environment variable**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-project.vercel.app
   ```

## Configuration Files

### Root `vercel.json`
Configures frontend deployment from root (if deploying monorepo).

### `frontend/next.config.js`
- Configures API rewrites for production
- Uses `NEXT_PUBLIC_API_URL` environment variable

### `backend/vercel.json`
Configures FastAPI as Vercel Serverless Functions (Option 2 only).

## Environment Variables

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL`: Backend API URL (e.g., `https://api.example.com`)

### Backend
- `ENV`: Environment (e.g., `production`)
- Configure CORS origins to include your Vercel frontend domain

## Local Development

Use `docker-compose.yml` for local development:
```bash
docker-compose up
```

Frontend: http://localhost:3000
Backend: http://localhost:8000

## Troubleshooting

### CORS Issues
Ensure backend CORS middleware allows your Vercel frontend domain:
```python
allow_origins=["https://your-frontend.vercel.app"]
```

### API Calls Failing
1. Check `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Verify backend is accessible and CORS is configured
3. Check browser console for errors

### Build Failures
1. Ensure all dependencies are in `package.json` (frontend) or `requirements.txt` (backend)
2. Check build logs in Vercel dashboard
3. Verify Node.js/Python versions match your local environment
