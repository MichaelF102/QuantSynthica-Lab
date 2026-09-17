# QuantSynthica Lab Quantitative Terminal: Production Deployment Guide

This guide walks you through publishing **QuantSynthica Lab** to **GitHub** and deploying the full-stack terminal to **Vercel** and your chosen backend host.

---

## Architecture Overview

QuantSynthica Lab is composed of two decoupled high-performance services:
1. **Frontend**: Next.js 15 (App Router, Tailwind CSS, Recharts, Lucide). Optimized for static generation and serverless execution on **Vercel**.
2. **Quantitative Engine Backend**: Python 3.12 + FastAPI + NumPy + Pandas + yfinance. Optimized for high-throughput vectorized backtesting, risk calculations, and live market data.

---

## Step 1: Initialize Git and Push to GitHub

### 1. Initialize Git locally
If not already initialized in your project root:
```bash
# Navigate to the project root
cd /home/michaelfernandes/Desktop/Projects/AlgorithmicTradingLab

# Initialize git
git init -b main

# Add all files (obeying .gitignore)
git add .

# Verify git status to ensure .venv, node_modules, and cache are excluded
git status

# Commit
git commit -m "feat: initial release of QuantSynthica Lab quantitative terminal"
```

### 2. Create a Repository on GitHub and Push

#### Option A: Using GitHub Web UI
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g. `QuantSynthicaLab` or `quantsynthica-lab`).
3. Set visibility to **Public** or **Private**. Leave "Initialize with README" **unchecked**.
4. Click **Create repository**.
5. Run the following commands in your terminal:
```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

#### Option B: Using GitHub CLI (`gh`)
If you have `gh` installed and authenticated:
```bash
gh repo create AlgorithmicTradingLab --public --source=. --remote=origin --push
```

---

## Step 2: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com) and go to your **Dashboard**.
2. Click **Add New...** → **Project**.
3. Select your GitHub repository (`QuantSynthicaLab` or `AlgorithmicTradingLab`) and click **Import**.
4. Configure the Project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)
5. **Environment Variables**:
   - Add:
     - **Key**: `NEXT_PUBLIC_API_URL`
     - **Value**: Your deployed backend URL (see Step 3 below, e.g. `https://api-quantsynthica.up.railway.app` or `https://quantsynthica-backend.onrender.com`).
     *(Note: If you haven't deployed the backend yet, you can leave this empty or point to your backend later in Vercel Project Settings → Environment Variables).*
6. Click **Deploy**.
7. Vercel will build and deploy your application in under 60 seconds with a production URL like `https://quantsynthica.vercel.app`.

---

## Step 3: Deploy the FastAPI Quantitative Engine

The backend runs Python 3.12 with FastAPI and mathematical libraries (NumPy, SciPy, Pandas, yfinance). You can deploy it for free or low-cost using any of the following platforms:

### Option A: Railway (Recommended — Easiest & Fastest)
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository.
4. Set the **Root Directory** to `/` or configure:
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Go to **Settings** → **Networking** → Click **Generate Domain**.
6. Copy the generated URL (e.g. `https://quantsynthica-production.up.railway.app`).
7. Paste this URL into your Vercel project's `NEXT_PUBLIC_API_URL` environment variable and redeploy.

### Option B: Render.com
1. Go to [render.com](https://render.com) and click **New Web Service**.
2. Connect your GitHub repository.
3. Choose **Docker** or **Python 3**:
   - If Python:
     - **Build Command**: `pip install -r backend/requirements.txt`
     - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port 10000`
   - If Docker: Render automatically uses the existing [Dockerfile](file:///home/michaelfernandes/Desktop/Projects/AlgorithmicTradingLab/Dockerfile) (`backend` target).
4. Copy your Render URL (e.g. `https://quantsynthica-api.onrender.com`) and add it to Vercel as `NEXT_PUBLIC_API_URL`.

### Option C: Docker / VPS (DigitalOcean / AWS / Hetzner)
Use the included `docker-compose.yml`:
```bash
docker compose up -d --build
```
This runs FastAPI on port 8000 and Next.js on port 3000 behind reverse proxy (Nginx or Caddy).

---

## Step 4: Production Verification Checklist

- [x] **Next.js Production Build**: `npm run build` generates all 14 routes with 0 errors.
- [x] **TypeScript Compliance**: `npx tsc --noEmit` passes with 0 type errors.
- [x] **Clean .gitignore**: `.venv/`, `node_modules/`, `__pycache__/`, `.next/`, and local caches are ignored.
- [x] **Vercel Config**: `vercel.json` and `.env.example` are created and configured.
- [x] **Cross-Origin (CORS)**: FastAPI `CORSMiddleware` in `backend/main.py` is configured with `allow_origins=["*"]` to accept requests from your Vercel production domain.
