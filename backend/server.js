const express = require('express');
const cors = require('cors');
const rateGuard = require('rateguard-dhairyamathur');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup - expose rate limit headers so frontend can read them directly
app.use(cors({
  origin: '*',
  exposedHeaders: [
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
    'Retry-After',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ]
}));

app.use(express.json());

// Rate limit configuration for the live demo
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 60 seconds (1 minute window)
  max: 10,             // 10 requests allowed per window
  statusCode: 429,
  headers: true,
  legacyHeaders: true,
  message: {
    success: false,
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    error: 'Too many requests! Rate limit exceeded. Please wait before retrying.'
  }
};

// Instantiate RateGuard middleware using the actual published package
const apiLimiter = rateGuard(RATE_LIMIT_CONFIG);

// 1. Rate-limit configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    packageName: 'rateguard-dhairyamathur',
    npmUrl: 'https://www.npmjs.com/package/rateguard-dhairyamathur',
    githubUrl: 'https://github.com/dhairyamathur500-hue/Rategaurd_NPM_Package',
    config: {
      windowMs: RATE_LIMIT_CONFIG.windowMs,
      windowSeconds: RATE_LIMIT_CONFIG.windowMs / 1000,
      max: RATE_LIMIT_CONFIG.max,
      statusCode: RATE_LIMIT_CONFIG.statusCode,
      headers: RATE_LIMIT_CONFIG.headers,
      legacyHeaders: RATE_LIMIT_CONFIG.legacyHeaders,
      message: RATE_LIMIT_CONFIG.message
    }
  });
});

// 2. Protected test endpoint guarded by rateguard-dhairyamathur
app.get('/api/test', apiLimiter, (req, res) => {
  res.status(200).json({
    success: true,
    status: 200,
    message: 'Request accepted by RateGuard! Quota is within limits.',
    timestamp: new Date().toISOString(),
    rateLimit: req.rateLimit
  });
});

// 3. Reset quota endpoint using RateGuard's built-in resetAll()
app.post('/api/reset', (req, res) => {
  apiLimiter.resetAll();
  res.json({
    success: true,
    message: 'Rate limit counters reset successfully via RateGuard middleware.'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Serve frontend static build if available
const path = require('path');
const fs = require('fs');
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`RateGuard Backend running on http://localhost:${PORT}`);
});
