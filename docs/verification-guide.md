# Verification Guide — Browser DevTools Walkthrough

**Project:** Implementation of SSL/TLS in a Website  
**Purpose:** Step-by-step guide for verifying the HTTPS/TLS implementation using browser developer tools.

---

## Prerequisites

- Server running: `npm start`
- Browser: Chrome, Firefox, or Edge
- URL: `https://localhost:8443`

> **Note:** The browser will show a certificate warning because this is a self-signed development certificate. Click **Advanced → Proceed to localhost** to continue.

---

## Verification Checklist

### ✅ 1. Verify HTTPS Connection

**Steps:**
1. Open `https://localhost:8443` in your browser.
2. Look at the address bar.
3. You should see `https://` (not `http://`).
4. You will see a warning icon (⚠️) instead of a lock (🔒) because the cert is self-signed.

**Expected:**
- URL begins with `https://`
- Port is `8443`

---

### ✅ 2. View the TLS Certificate

**Chrome:**
1. Click the ⚠️ icon in the address bar.
2. Click **"Certificate is not valid"** → **"Certificate"**.
3. Check:
   - **Issued to:** localhost
   - **Issued by:** localhost (self-signed)
   - **Valid from / to:** ~365 days

**Firefox:**
1. Click the ⚠️ icon → **Connection not secure** → **More Information**.
2. Click **"View Certificate"**.
3. Check the **Subject** (CN=localhost) and **Issuer** (self-signed).

---

### ✅ 3. Verify HTTP → HTTPS Redirect

**Steps:**
1. Open `http://localhost:8080` in your browser.
2. The browser should automatically redirect to `https://localhost:8443`.

**How to see the redirect:**
1. Open **DevTools** (F12).
2. Go to **Network** tab.
3. Enable **Preserve log**.
4. Navigate to `http://localhost:8080`.
5. Find the first request to `localhost:8080`.
6. Check **Status**: `301 Moved Permanently`.
7. Check **Response Headers** → **location**: `https://localhost:8443/`.

---

### ✅ 4. Verify Login over HTTPS

**Steps:**
1. Open `https://localhost:8443/login.html`.
2. Open **DevTools** → **Network** tab.
3. Log in with valid credentials.
4. Select the `login` request in the Network tab.
5. Check:
   - **Request URL:** `https://localhost:8443/api/login` ← HTTPS ✅
   - **Request Method:** POST
   - **Status:** 200
   - **Request Payload:** Contains `email` and `password` fields (encrypted in transit by TLS)

---

### ✅ 5. Inspect the Session Cookie

**Steps:**
1. After logging in, go to **DevTools** → **Application** tab.
2. In the left panel, click **Cookies** → `https://localhost:8443`.
3. Find the cookie named `sid`.
4. Check:

| Attribute | Expected Value | Why It Matters |
|-----------|---------------|----------------|
| **HttpOnly** | ✅ checked | JavaScript cannot access this cookie |
| **Secure** | ✅ checked | Only sent over HTTPS |
| **SameSite** | Strict | Not sent with cross-site requests |
| **Name** | `sid` | Renamed from default `connect.sid` |

**Verify HttpOnly in Console:**
1. Open **DevTools** → **Console** tab.
2. Type: `document.cookie`
3. The `sid` session cookie should **NOT appear** — that proves `HttpOnly` is working.

---

### ✅ 6. Verify Security Headers

**Steps:**
1. Open **DevTools** → **Network** tab.
2. Reload the page.
3. Click any request (e.g., the document request for `localhost:8443`).
4. Click **Response Headers**.
5. Check for these headers:

| Header | Expected |
|--------|---------|
| `strict-transport-security` | `max-age=31536000; includeSubDomains` |
| `content-security-policy` | (CSP directives) |
| `x-content-type-options` | `nosniff` |
| `referrer-policy` | `strict-origin-when-cross-origin` |

---

### ✅ 7. Verify Passwords Are Hashed

**Steps (SQLite verification):**

Using Node.js REPL:
```bash
node --experimental-sqlite -e "
const {DatabaseSync} = require('node:sqlite');
const db = new DatabaseSync('database/users.db');
const rows = db.prepare('SELECT id, username, email, password_hash FROM users').all();
console.table(rows);
"
```

**Expected output:**
```
┌─────────────────────────────────────────────────────────────────┐
│ id │ username │ email          │ password_hash                  │
│ 1  │ TestUser │ test@test.com  │ $2b$12$... (60 chars, never    │
│    │          │                │ the original password)         │
└─────────────────────────────────────────────────────────────────┘
```

The `password_hash` starts with `$2b$12$` which is a bcrypt hash with 12 rounds.  
**The original password is never stored.**

---

### ✅ 8. Verify Dashboard Protection

**Steps:**
1. Open an **Incognito window**.
2. Try to access `https://localhost:8443/dashboard.html` directly.
3. The page should redirect to the login page.

**Network verification:**
1. In the incognito window, open DevTools → Network.
2. Navigate to `https://localhost:8443/api/dashboard`.
3. Check **Status**: `401 Unauthorized`.

---

## Summary Checklist

| # | Verification | Expected | Check |
|---|-------------|---------|-------|
| 1 | URL uses HTTPS | `https://localhost:8443` | ☐ |
| 2 | Certificate CN | CN=localhost | ☐ |
| 3 | HTTP redirects | 301 → `https://localhost:8443` | ☐ |
| 4 | Login request URL | `https://` prefix | ☐ |
| 5 | Cookie: HttpOnly | `document.cookie` is empty | ☐ |
| 6 | Cookie: Secure | checked in Application tab | ☐ |
| 7 | Cookie: SameSite | Strict | ☐ |
| 8 | HSTS header | `max-age=31536000` | ☐ |
| 9 | CSP header | present | ☐ |
| 10 | Password hashed | starts with `$2b$12$` | ☐ |
| 11 | Dashboard protected | 401 without session | ☐ |
| 12 | Logout works | session destroyed | ☐ |
