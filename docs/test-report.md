# Test Report — Implementation of SSL/TLS in a Website

**Project:** Secure Login Website Using SSL/TLS  
**Date:** 2026-10-03

---

## Test Environment

| Item | Value |
|------|-------|
| OS | Windows |
| Node.js | v22.19.0 |
| HTTPS Port | 8443 |
| HTTP Port | 8080 |
| Browser | Chrome / Firefox |

---

## Application Tests

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| A1 | Home page loads | 200 OK | 200 OK | ✅ PASS |
| A2 | Login page loads | 200 OK | 200 OK | ✅ PASS |
| A3 | Register page loads | 200 OK | 200 OK | ✅ PASS |
| A4 | Dashboard requires auth | Redirect to login | 401 + redirect | ✅ PASS |
| A5 | Security page loads | 200 OK | 200 OK | ✅ PASS |
| A6 | Security info API | JSON with security data | JSON returned | ✅ PASS |

---

## Authentication Tests

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| B1 | Valid registration | 201, account created | 201 created | ✅ PASS |
| B2 | Duplicate email | 400, error message | 400 duplicate | ✅ PASS |
| B3 | Invalid email format | 400, invalid email | 400 invalid | ✅ PASS |
| B4 | Password mismatch | 400, mismatch error | 400 mismatch | ✅ PASS |
| B5 | Missing fields | 400, fields required | 400 required | ✅ PASS |
| B6 | Short password (<8) | 400, too short | 400 short | ✅ PASS |
| B7 | Short username (<3) | 400, too short | 400 short | ✅ PASS |
| B8 | Valid login | 200, redirect to dashboard | 200 redirect | ✅ PASS |
| B9 | Wrong password | 401, generic error | 401 invalid | ✅ PASS |
| B10 | Non-existent email | 401, generic error | 401 invalid | ✅ PASS |
| B11 | Logout | Session destroyed | Session destroyed | ✅ PASS |
| B12 | Access dashboard after logout | Redirect to login | Redirect | ✅ PASS |

---

## TLS Tests

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| C1 | HTTPS server starts | Listening on 8443 | Listening | ✅ PASS |
| C2 | Certificate loads | No error | Loaded | ✅ PASS |
| C3 | TLS connection works | Browser connects | Connected | ✅ PASS |
| C4 | Browser shows padlock | Lock icon (or warning) | Warning (self-signed) | ✅ PASS (expected) |
| C5 | HTTP redirects to HTTPS | 301 to https://localhost:8443 | 301 redirect | ✅ PASS |
| C6 | HTTP login redirected | Redirect | 301 redirect | ✅ PASS |
| C7 | Registration over HTTPS | 201 over TLS | 201 over TLS | ✅ PASS |
| C8 | Login over HTTPS | 200 over TLS | 200 over TLS | ✅ PASS |

---

## Security Tests

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| D1 | Password stored as hash | `$2b$12$...` in DB | bcrypt hash | ✅ PASS |
| D2 | Plaintext password in DB | Never present | Not present | ✅ PASS |
| D3 | Private key via API | 404/not accessible | Not exposed | ✅ PASS |
| D4 | Private key in .gitignore | Listed | `cert/*.key` in .gitignore | ✅ PASS |
| D5 | HttpOnly cookie | `document.cookie` empty | HttpOnly=true | ✅ PASS |
| D6 | Secure cookie | Transmitted over HTTPS only | Secure=true | ✅ PASS |
| D7 | SameSite cookie | SameSite=Strict | SameSite=Strict | ✅ PASS |
| D8 | HSTS header | Strict-Transport-Security present | Present | ✅ PASS |
| D9 | CSP header | Content-Security-Policy present | Present | ✅ PASS |
| D10 | X-Content-Type-Options | nosniff | nosniff | ✅ PASS |
| D11 | Referrer-Policy | strict-origin-when-cross-origin | Present | ✅ PASS |
| D12 | Session fixation | Session regenerated on login | regenerate() called | ✅ PASS |
| D13 | Protected routes | requireAuth middleware | Middleware active | ✅ PASS |

---

## Database Verification

After registering user `test@example.com`:

```
SELECT id, username, email, password_hash, created_at FROM users;

id | username | email             | password_hash         | created_at
1  | TestUser | test@example.com  | $2b$12$....(60 chars) | 2026-10-03 ...
```

**Confirmed:** Only `password_hash` is stored. No plaintext password.

---

## Known Limitations

1. Self-signed certificate causes browser warning (expected for development)
2. `node:sqlite` is an experimental Node.js 22 feature (stable in Node 23+)
3. Session is stored in memory — restarts clear all sessions
4. No production-grade session store (Redis/DB-backed)
5. Single-server setup (no load balancer)
