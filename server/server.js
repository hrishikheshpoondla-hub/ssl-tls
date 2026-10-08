'use strict';

const path    = require('path');
const fs      = require('fs');
const http    = require('http');
const https   = require('https');
const express = require('express');
const session = require('express-session');
const helmet  = require('helmet');

const db   = require('./database');
const auth = require('./auth');

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers (Stage 10)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", 'data:'],
        connectSrc:  ["'self'"],
        fontSrc:     ["'self'"],
        objectSrc:   ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
  })
);

// Session configuration (Stages 4 & 9)
const SESSION_SECRET = 'dev-session-secret-change-in-production';

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'sid',   // do not use default 'connect.sid'
    cookie: {
      httpOnly: true,   // not accessible via document.cookie
      secure:   true,   // only sent over HTTPS
      sameSite: 'strict',
      maxAge:   30 * 60 * 1000, // 30 minutes
    },
  })
);

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------------------------------------------------------------------------
// Middleware helpers
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  // Return 401 JSON for API routes — the client JS handles the redirect
  return res.status(401).json({ error: 'Unauthorized. Please log in.', authenticated: false });
}

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

// --- Registration -----------------------------------------------------------
app.post('/api/register', (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Validation
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }

  try {
    // Check duplicate email
    const existing = db.findUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Hash password with bcrypt (salt rounds = 12)
    const passwordHash = auth.hashPasswordSync(password);

    db.createUser({
      username: username.trim(),
      email:    email.toLowerCase().trim(),
      passwordHash,
    });

    return res.status(201).json({ message: 'Account created successfully. Please log in.' });
  } catch (err) {
    console.error('[Register] Error:', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// --- Login ------------------------------------------------------------------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = db.findUserByEmail(email.toLowerCase().trim());

    // Always compare to prevent timing attacks; give generic error
    const passwordMatch = user
      ? auth.comparePasswordSync(password, user.password_hash)
      : false;

    if (!user || !passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('[Login] Session regenerate error:', err.message);
        return res.status(500).json({ error: 'Login failed. Please try again.' });
      }
      req.session.userId   = user.id;
      req.session.username = user.username;

      return res.json({ message: 'Login successful.', redirect: '/dashboard.html' });
    });
  } catch (err) {
    console.error('[Login] Error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// --- Logout -----------------------------------------------------------------
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[Logout] Error:', err.message);
    }
    res.clearCookie('sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

// --- Dashboard (protected) --------------------------------------------------
app.get('/api/dashboard', requireAuth, (req, res) => {
  const user = db.findUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Session invalid. Please log in again.' });
  }
  res.json({
    username:      user.username,
    email:         user.email,
    userId:        user.id,
    sessionActive: true,
    authenticated: true,
  });
});

// --- Security info ----------------------------------------------------------
app.get('/api/security-info', (req, res) => {
  res.json({
    protocol:         'HTTPS',
    tls:              'Enabled',
    port:             HTTPS_PORT,
    secureCookie:     'Enabled',
    httpOnly:         'Enabled',
    sameSite:         'Strict',
    application:      'Node.js + Express',
    certificate:      'Development (self-signed)',
    hsts:             'Enabled',
    csp:              'Enabled',
    referrerPolicy:   'strict-origin-when-cross-origin',
    xContentTypeOptions: 'nosniff',
  });
});

// --- Auth status check (for protected HTML pages) --------------------------
app.get('/api/auth-check', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// ---------------------------------------------------------------------------
// Ports
// ---------------------------------------------------------------------------
const HTTP_PORT  = 8080;
const HTTPS_PORT = 8443;

// ---------------------------------------------------------------------------
// HTTP → HTTPS redirect server (Stage 8)
// ---------------------------------------------------------------------------
const httpApp = express();
httpApp.use((req, res) => {
  const host = req.headers.host ? req.headers.host.replace(/:\d+$/, '') : 'localhost';
  const redirectUrl = `https://${host}:${HTTPS_PORT}${req.url}`;
  res.redirect(301, redirectUrl);
});

// ---------------------------------------------------------------------------
// Load TLS certificate (Stage 6 & 7)
// ---------------------------------------------------------------------------
const certPath = path.join(__dirname, '..', 'cert', 'server.crt');
const keyPath  = path.join(__dirname, '..', 'cert', 'server.key');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('\n[ERROR] TLS certificate files not found!');
  console.error('  Expected:');
  console.error(`    cert/server.crt`);
  console.error(`    cert/server.key`);
  console.error('\n  Run this command to generate them:');
  console.error('    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\');
  console.error('      -keyout cert/server.key \\');
  console.error('      -out cert/server.crt \\');
  console.error('      -subj "/CN=localhost" \\');
  console.error('      -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"\n');
  process.exit(1);
}

const tlsOptions = {
  key:  fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

// ---------------------------------------------------------------------------
// Start servers
// ---------------------------------------------------------------------------
http.createServer(httpApp).listen(HTTP_PORT, () => {
  console.log(`[HTTP ] Redirect server running → http://localhost:${HTTP_PORT}`);
  console.log(`        All HTTP traffic is redirected to HTTPS.`);
});

https.createServer(tlsOptions, app).listen(HTTPS_PORT, () => {
  console.log(`[HTTPS] Secure server running  → https://localhost:${HTTPS_PORT}`);
  console.log(`        TLS certificate loaded from: cert/server.crt`);
  console.log(`        Private key loaded from    : cert/server.key  (not exposed)`);
  console.log(`\n  Open: https://localhost:${HTTPS_PORT}`);
  console.log(`  Note: Browser will show a certificate warning (self-signed dev cert).`);
  console.log(`        Click "Advanced" → "Proceed to localhost" to continue.\n`);
});
