# RateGuard Interactive Showcase & Live Test Bench

A modern, responsive, and developer-focused website showcasing and demonstrating the published npm package **[`rateguard-dhairyamathur`](https://www.npmjs.com/package/rateguard-dhairyamathur)**.

---

## ⚡ Highlights

- **Actual NPM Package Integration**: Imports and runs `rateguard-dhairyamathur` directly in an Express.js backend.
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

## 🚀 Quick Start

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
Open **[http://localhost:5001](http://localhost:5001)** to view the live website!

---

## 🛠️ Development Mode

To run frontend and backend independently with instant hot-reloading:

```bash
# Terminal 1 - Backend Server (Port 5001)
npm run dev:backend

# Terminal 2 - Frontend Vite Server (Port 5173 with proxy to 5001)
npm run dev:frontend
```

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
