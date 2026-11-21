const path = require('path');
const fs = require('fs');

// Load environment variables from root .env or backend .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateGuard = require('rateguard-dhairyamathur');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust reverse proxies (Render, Railway, Heroku, Nginx) so client IP is accurately detected
app.set('trust proxy', 1);

// CORS setup - allow origins and expose custom RateGuard headers
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins,
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

// Rate limit configuration for the live demo (supports optional env overrides)
const RATE_LIMIT_CONFIG = {
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 60 seconds (1 minute window)
  max: Number(process.env.RATE_LIMIT_MAX) || 10,                   // 10 requests allowed per window
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

// ==========================================
// API ROUTING (/api/*)
// ==========================================
const apiRouter = express.Router();

// 1. Rate-limit configuration endpoint
apiRouter.get('/config', (req, res) => {
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
apiRouter.get('/test', apiLimiter, (req, res) => {
  res.status(200).json({
    success: true,
    status: 200,
    message: 'Request accepted by RateGuard! Quota is within limits.',
    timestamp: new Date().toISOString(),
    rateLimit: req.rateLimit
  });
});

// 3. Reset quota endpoint using RateGuard's built-in resetAll()
apiRouter.post('/reset', (req, res) => {
  apiLimiter.resetAll();
  res.json({
    success: true,
    message: 'Rate limit counters reset successfully via RateGuard middleware.'
  });
});

// 4. Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 5. 404 handler for unrecognized /api/* routes
apiRouter.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    error: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Mount all API routes under /api
app.use('/api', apiRouter);

// ==========================================
// FRONTEND STATIC FILES & SPA FALLBACK
// ==========================================
const frontendDist = path.resolve(__dirname, '../frontend/dist');

if (fs.existsSync(frontendDist)) {
  // Serve static assets from frontend build
  app.use(express.static(frontendDist));

  // SPA fallback: any non-API route serves the frontend index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Helpful fallback in development if frontend has not been compiled
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>RateGuard Server</title></head>
        <body style="font-family: sans-serif; background: #0B0F17; color: #fff; padding: 2.5rem; text-align: center;">
          <h1 style="color: #10b981;">RateGuard Backend is Running</h1>
          <p style="color: #94a3b8;">Frontend build directory was not found. Run <code>npm run build</code> in the root directory to build the frontend.</p>
          <p><a href="/api/health" style="color: #06b6d4;">Check API Health (/api/health)</a></p>
        </body>
      </html>
    `);
  });
}

// Start Server if executed directly (Render, Railway, local `npm start`)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[RateGuard] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[RateGuard] API available at http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
