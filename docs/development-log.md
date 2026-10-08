# Development Log — Implementation of SSL/TLS in a Website

**Project:** Secure Login Website Using SSL/TLS  
**College Micro Project**

---

## Stage 0 — Master Instructions
**Date:** 2026-10-03  
**Status:** ✅ Complete

Defined project scope, technology stack, and development rules.  
Key constraint: SSL/TLS must be **real** — no fake indicators.

---

## Stage 1 — Project Initialization
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Created
- `server/server.js` — Express application with HTTPS + HTTP redirect
- `server/database.js` — SQLite abstraction
- `server/auth.js` — bcrypt helpers
- `public/index.html` — Home page with TLS diagram
- `public/login.html` — Login page
- `public/register.html` — Registration page
- `public/dashboard.html` — Protected dashboard
- `public/security.html` — Security info page
- `public/css/style.css` — Dark cybersecurity theme
- `public/js/login.js` — Login form logic
- `public/js/register.js` — Registration form logic
- `package.json` — Dependencies: express, express-session, bcrypt, better-sqlite3, helmet
- `.gitignore` — Excludes `node_modules/`, `database/*.db`, `cert/*.key`, `cert/*.crt`
- `README.md` — Complete setup guide

### Commands Executed
```
npm install
```

### Dependencies Installed
- `express` ^4.18.2
- `express-session` ^1.17.3
- `bcrypt` ^5.1.1
- `better-sqlite3` ^9.4.3
- `helmet` ^7.1.0

---

## Stage 2 — SQLite Database
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Changed
- `server/database.js`

### Implementation
- `better-sqlite3` used for synchronous SQLite access
- WAL mode enabled for performance
- Foreign keys enabled
- `users` table auto-created with: `id`, `username`, `email`, `password_hash`, `created_at`
- `email` column is `UNIQUE COLLATE NOCASE`
- Three prepared statements: `stmtInsertUser`, `stmtFindByEmail`, `stmtFindById`

### Functions Exported
- `createUser({ username, email, passwordHash })`
- `findUserByEmail(email)` → returns row including `password_hash`
- `findUserById(id)` → returns row **without** `password_hash` (safe for session use)

### Security Note
`findUserById` does NOT include `password_hash` in its SELECT — so session data never carries the hash.

---

## Stage 3 — Registration
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Changed
- `server/server.js` (POST `/api/register`)
- `server/auth.js` (`hashPasswordSync`)
- `public/register.html`
- `public/js/register.js`

### Validation (Server-side)
- All fields required
- Valid email regex
- Password minimum 8 characters
- Passwords must match
- Username minimum 3 characters
- Duplicate email check before insertion
- Generic error messages (no DB internals exposed)

### bcrypt
- `bcrypt.hashSync(password, 12)` — 12 salt rounds
- Hash stored as `password_hash`
- Original password **never** stored

---

## Stage 4 — Login & Session
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Changed
- `server/server.js` (POST `/api/login`, POST `/api/logout`)
- `server/auth.js` (`comparePasswordSync`)
- `public/login.html`
- `public/js/login.js`

### Process
1. Receive email + password
2. Look up user by email
3. Compare with `bcrypt.compareSync`
4. On success: `req.session.regenerate()` (prevents session fixation)
5. Store `userId` and `username` in session
6. Redirect to `/dashboard.html`

### Security
- `req.session.regenerate()` called before setting session data
- Generic error: "Invalid email or password" (doesn't reveal whether email exists)
- Passwords never logged

---

## Stage 5 — Dashboard
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Changed
- `public/dashboard.html`
- `server/server.js` (GET `/api/dashboard`)

### Implementation
- `requireAuth` middleware checks `req.session.userId`
- Unauthenticated requests → 401 → client-side redirect to `/login.html`
- Dashboard fetches `/api/dashboard` (protected) to get user info
- Displays: username, user ID, email, session status, connection type, cookie security
- Logout destroys session and clears cookie

---

## Stage 6 — TLS Certificate
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Created
- `cert/server.crt` (generated, not in git)
- `cert/server.key` (generated, not in git)

### Command
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout cert/server.key \
  -out cert/server.crt \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

### What These Files Are
- **`server.crt`** — Digital certificate containing the server's public key and identity (CN=localhost). Presented to browsers during TLS handshake.
- **`server.key`** — Private key. Used by the server to decrypt messages encrypted with the public key. **NEVER shared, NEVER committed to git.**

### .gitignore Entries
```
cert/server.key
cert/server.crt
cert/*.key
cert/*.crt
cert/*.pem
```

---

## Stage 7 — HTTPS Server
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Changed
- `server/server.js`

### Implementation
```javascript
const https = require('https');
const tlsOptions = {
  key:  fs.readFileSync('cert/server.key'),
  cert: fs.readFileSync('cert/server.crt'),
};
https.createServer(tlsOptions, app).listen(8443);
```

- Server exits with a clear error message if cert files are missing
- All routes (register, login, dashboard, logout, security) work over HTTPS

### Browser Warning
A self-signed certificate is not trusted by default. The browser shows:
> "Your connection is not private"

This is **expected** in development. Click **Advanced → Proceed to localhost**.

---

## Stage 8 — HTTP → HTTPS Redirect
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Changed
- `server/server.js`

### Implementation
```javascript
const httpApp = express();
httpApp.use((req, res) => {
  const host = req.headers.host.replace(/:\d+$/, '');
  res.redirect(301, `https://${host}:8443${req.url}`);
});
http.createServer(httpApp).listen(8080);
```

- HTTP port 8080 — redirect-only server
- Uses 301 (permanent) redirect
- Preserves the request path

---

## Stage 9 — Secure Cookies
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Changed
- `server/server.js` (session configuration)

### Cookie Attributes
```javascript
cookie: {
  httpOnly: true,     // not readable by JavaScript
  secure:   true,     // HTTPS only
  sameSite: 'strict', // no cross-site sending
  maxAge:   30 * 60 * 1000, // 30 minutes
}
```

### Session Cookie Name
`sid` (renamed from default `connect.sid` to avoid fingerprinting)

---

## Stage 10 — Security Headers
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Changed
- `server/server.js` (helmet configuration)

### Headers Added
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy` (restricts script/style/img sources)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Stage 11–12 — Security Page & TLS Demonstration
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Changed
- `public/security.html`

### Content
- Live security status from `/api/security-info`
- TLS handshake 5-step flow diagram
- HTTP vs HTTPS comparison (visual)
- TLS vs bcrypt distinction
- Cookie security attributes explained
- Security headers explained
- Development certificate disclaimer

---

## Stage 13 — Verification Guide
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Created
- `docs/verification-guide.md`

---

## Stage 14 — Testing
**Date:** 2026-10-03  
**Status:** ✅ Complete (see `docs/test-report.md`)

---

## Stage 15 — Code Review
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Verified
- No plaintext passwords in code or logs
- No private key exposed in any route
- No hardcoded production secrets (session secret is clearly marked dev-only)
- All routes protected appropriately
- No unused dependencies
- `npm install && npm start` works correctly

---

## Stage 16–17 — Reports & Viva
**Date:** 2026-10-03  
**Status:** ✅ Complete

### Files Created
- `docs/project-report.md`
- `docs/viva-questions.md`
