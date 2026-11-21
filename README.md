# RateGuard Interactive Showcase & Live Test Bench

A modern, responsive, and developer-focused website showcasing and demonstrating the published npm package **[`rateguard-dhairyamathur`](https://www.npmjs.com/package/rateguard-dhairyamathur)**.

This repository is structured as a **single full-stack integrated application** designed to be deployed together as a **single web service** on platforms like **Render**, **Railway**, or **Heroku**.

---

## ⚡ Highlights

- **Actual NPM Package Integration**: Imports and runs `rateguard-dhairyamathur` directly in an Express.js backend.
- **Single Integrated Deployment**: Backend serves both the REST API (`/api/*`) and the React production build (`/*`) from a single origin and port.
- **Zero Simulation**: Rate limiting, HTTP 429 status codes, remaining quota, and response headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`) are calculated and emitted in real-time by RateGuard.
- **Interactive Live Test Bench**:
  - **Send Request**: Test single endpoint requests.
  - **Send Burst (5x)**: Rapidly dispatch requests to exceed the quota window.
  - **Reset Counters**: Reset memory storage using RateGuard's `limiter.resetAll()`.
- **Live Stats Dashboard**: Tracks Total Requests, Successful (200), Remaining Quota, and Blocked (429).
- **HTTP 429 Alert Banner**: Displays real-time warnings with retry-after timestamps when limits are reached.
- **Header & Payload Inspector**: Real-time inspection of HTTP headers and response body.
- **Active Configuration Viewer**: Displays active window, max limit, and custom error formats.

---

## 🚀 Quick Start (Local Run)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Build Frontend
```bash
npm run build
```

### 3. Start Backend & Website
```bash
npm start
```
Open **[http://localhost:5001](http://localhost:5001)** to view the live website and interact with the live API!

---

## 🛠️ Development Mode (With Hot Reloading)

To run the backend and Vite dev server concurrently with instant hot module replacement:

```bash
# Terminal 1: Backend Server (Port 5001)
npm run dev:backend

# Terminal 2: Frontend Vite Server (Port 5173 with auto-proxy to 5001)
npm run dev:frontend
```

---

## 🌐 Single-Click Deployment

### Deploying to Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Connect your GitHub repository: `dhairyamathur500-hue/RateGaurd-Test`.
3. Configure the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
5. Click **Deploy Web Service**. Render will automatically run `npm run build` (installing dependencies and compiling the Vite frontend) and launch the Express backend.

*(Alternatively, Render detects `render.yaml` automatically if you create a Blueprint instance).*

---

### Deploying to Railway
1. Go to [Railway](https://railway.app/) and click **New Project** > **Deploy from GitHub repo**.
2. Select `RateGaurd-Test`.
3. Railway automatically recognizes the Node.js project, uses `railway.toml` / `Procfile`, runs `npm run build`, and starts the app with `npm start`.
4. Under **Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: (provided automatically by Railway)
5. Generate a public domain under **Settings > Networking > Generate Domain**.

---

## 🔑 Environment Variables Reference

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5001` | Port the unified Express server listens on (auto-set by Render/Railway). |
| `NODE_ENV` | `development` | Set to `production` in production deployment. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | RateGuard window duration in milliseconds (default: 1 minute). |
| `RATE_LIMIT_MAX` | `10` | RateGuard maximum requests permitted per window. |
| `CORS_ORIGIN` | `*` | Allowed CORS origins for external API access. |
| `VITE_API_BASE_URL` | `""` | Optional custom backend URL (leave blank for same-origin single deployment). |

---

## 📦 RateGuard Package Usage

```bash
npm install rateguard-dhairyamathur
```

```javascript
const express = require('express');
const rateGuard = require('rateguard-dhairyamathur');

const app = express();

const limiter = rateGuard({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // 10 requests allowed
  message: {
    success: false,
    error: 'Too many requests, please slow down!'
  }
});

app.use('/api', limiter);
```

---

## 🔗 Official Links

- **NPM Package**: [https://www.npmjs.com/package/rateguard-dhairyamathur](https://www.npmjs.com/package/rateguard-dhairyamathur)
- **GitHub Repository**: [https://github.com/dhairyamathur500-hue/Rategaurd_NPM_Package](https://github.com/dhairyamathur500-hue/Rategaurd_NPM_Package)

---

## 📄 License

MIT © [Dhairya Mathur](https://github.com/dhairyamathur500-hue)
