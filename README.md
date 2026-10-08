# 🔐 SecureLogin — Implementation of SSL/TLS in a Website

**College Micro Project**

A fully functional secure login website demonstrating real HTTPS/TLS implementation using Node.js.

---

## What This Project Demonstrates

| Security Concept | Implementation |
|---|---|
| **HTTPS / TLS** | Node.js `https` module with real TLS certificate |
| **HTTP → HTTPS redirect** | Port 8080 redirects → Port 8443 |
| **TLS Certificate** | Self-signed dev cert (localhost) |
| **Secure Session Cookies** | `HttpOnly`, `Secure`, `SameSite=Strict` |
| **Password Hashing** | `bcrypt` with 12 salt rounds |
| **Security Headers** | HSTS, CSP, X-Content-Type-Options, Referrer-Policy |
| **Parameterized SQL** | `better-sqlite3` prepared statements |

> **Key Distinction:**
> - **TLS** protects data *during network transmission*
> - **bcrypt** protects passwords *at rest in the database*

---

## Project Structure

```
secure-ssl-login/
├── server/
│   ├── server.js       ← Express app, HTTPS server, HTTP redirect, routes
│   ├── database.js     ← SQLite setup, prepared statements
│   └── auth.js         ← bcrypt helpers
├── public/
│   ├── index.html      ← Home page
│   ├── login.html      ← Login page
│   ├── register.html   ← Registration page
│   ├── dashboard.html  ← Protected authenticated page
│   ├── security.html   ← Security information & TLS demonstration
│   ├── css/style.css   ← Cybersecurity-themed dark UI
│   └── js/
│       ├── login.js
│       └── register.js
├── database/           ← SQLite database (auto-created, not in git)
├── cert/               ← TLS certificate files (not in git)
│   ├── server.crt
│   └── server.key
├── docs/
│   ├── development-log.md
│   ├── test-report.md
│   ├── verification-guide.md
│   ├── viva-questions.md
│   └── project-report.md
├── package.json
├── .gitignore
└── README.md
```

---

## Quick Start

### Step 1 — Install dependencies

```bash
cd secure-ssl-login
npm install
```

### Step 2 — Generate TLS certificate

**On Windows (PowerShell) using OpenSSL:**

```powershell
# If you have OpenSSL installed:
openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
  -keyout cert/server.key `
  -out cert/server.crt `
  -subj "/CN=localhost" `
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

**Alternative — using Git Bash or WSL:**

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout cert/server.key \
  -out cert/server.crt \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

> **Note:** The `cert/` directory and its contents are listed in `.gitignore`.
> The private key (`server.key`) is **never** committed to git.

### Step 3 — Start the server

```bash
npm start
```

You should see:

```
[HTTP ] Redirect server running → http://localhost:8080
[HTTPS] Secure server running  → https://localhost:8443
```

### Step 4 — Open the browser

```
https://localhost:8443
```

**Browser Warning:** Because this is a self-signed development certificate, the browser will show a security warning. This is **expected**. Click **"Advanced"** → **"Proceed to localhost (unsafe)"** to continue.

---

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `8080` | HTTP | Redirects all traffic to HTTPS |
| `8443` | HTTPS | Main application (TLS) |

---

## Security Architecture

```
        Browser
           │
    ┌──────▼──────┐
    │ HTTP :8080  │──── 301 Redirect ────▶ https://localhost:8443
    └─────────────┘
           │
    ┌──────▼──────────────────┐
    │  HTTPS :8443 (TLS)      │
    │  Node.js + Express      │
    │                         │
    │  Session: HttpOnly      │
    │           Secure        │
    │           SameSite      │
    └──────────┬──────────────┘
               │
    ┌──────────▼──────────────┐
    │       SQLite DB         │
    │  (password_hash ONLY)   │
    │  bcrypt, 12 rounds      │
    └─────────────────────────┘
```

---

## Cookie Security

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `HttpOnly` | true | JavaScript cannot access the cookie |
| `Secure` | true | Only transmitted over HTTPS |
| `SameSite` | Strict | Not sent with cross-site requests |
| `maxAge` | 30 min | Session expiry |

---

## Security Headers

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Content-Security-Policy` | Restricts script/style/resource sources |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

---

## Certificate Note

This project uses a **self-signed development certificate** for `localhost`.

- ✅ Suitable for local development and demonstration
- ✅ Demonstrates real TLS encryption
- ⚠️ Not trusted by browsers by default (expected browser warning)
- ❌ Not suitable for production use

**For production:** Use a certificate from a trusted CA such as [Let's Encrypt](https://letsencrypt.org/) (free).

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js |
| Web Framework | Express.js |
| HTTPS | Node.js `https` module |
| Database | SQLite (`better-sqlite3`) |
| Password Hashing | `bcrypt` |
| Session Management | `express-session` |
| Security Headers | `helmet` |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
