# Project Report

**Title:** Implementation of SSL/TLS in a Website  
**Type:** College Micro Project  
**Technology Stack:** Node.js, Express.js, SQLite, bcrypt, HTML/CSS/JavaScript

---

## 1. Abstract

This project demonstrates the practical implementation of HTTPS using SSL/TLS on a small but fully functional secure login website. The application is built using Node.js and Express.js and implements real TLS encryption using Node's built-in HTTPS module, a self-signed development certificate, HTTP-to-HTTPS redirection, secure session cookies, and bcrypt password hashing. The project clearly distinguishes between TLS (which protects data during network transmission) and bcrypt (which protects passwords stored in the database), and provides a security information page, a developer tools verification guide, and documentation of the complete TLS handshake process.

---

## 2. Introduction

The internet was originally built on HTTP, a protocol that transmits data in plaintext. This means any party who intercepts network traffic — such as an attacker performing a man-in-the-middle attack — can read sensitive data such as login credentials and session tokens.

HTTPS, which is HTTP running over TLS (Transport Layer Security), was developed to solve this problem. TLS encrypts all communication between a browser and a server so that intercepted traffic appears as meaningless ciphertext.

TLS is now the standard for all websites that handle sensitive information. This project demonstrates how TLS is implemented in a real web application using commonly available open-source tools.

---

## 3. Problem Statement

HTTP transmits data as plaintext. Without encryption:
- Passwords entered in login forms can be intercepted over the network.
- Session cookies can be stolen and used to hijack authenticated sessions.
- Data can be modified in transit without detection.

The goal of this project is to implement HTTPS with TLS to protect data in transit, combined with bcrypt to protect stored passwords.

---

## 4. Objectives

1. Implement a real HTTPS server using Node.js's built-in `https` module.
2. Generate a TLS certificate for local development.
3. Redirect all HTTP traffic to HTTPS automatically.
4. Implement secure session cookies with `HttpOnly`, `Secure`, and `SameSite` attributes.
5. Hash passwords using bcrypt before storing them in the database.
6. Add security headers (HSTS, CSP, X-Content-Type-Options, Referrer-Policy).
7. Create a user registration and login system.
8. Provide a security information page explaining the implementation.
9. Document the system with a development log, test report, and viva preparation.

---

## 5. Existing System

Most introductory web development projects use plain HTTP. Problems with this approach:
- Data is transmitted in cleartext.
- Passwords are often stored without hashing.
- No protection against man-in-the-middle attacks.
- No session security attributes.

---

## 6. Proposed System

A secure login website that:
- Uses real HTTPS/TLS with a valid certificate.
- Stores only bcrypt-hashed passwords.
- Uses secure session cookies.
- Redirects HTTP to HTTPS.
- Adds standard security headers.
- Explains the security implementation through a dedicated page.

---

## 7. Technologies Used

| Technology | Purpose |
|-----------|---------|
| Node.js v22 | Server runtime |
| Express.js | Web framework |
| Node.js `https` module | Real TLS/HTTPS server |
| Node.js `node:sqlite` | Database (built-in, experimental) |
| bcrypt | Password hashing |
| express-session | Session management |
| helmet | Security headers |
| selfsigned | TLS certificate generation |
| HTML5, CSS3 | Frontend structure and styling |
| Vanilla JavaScript | Frontend interactivity |

---

## 8. System Requirements

**Software:**
- Node.js v22.5 or higher (for built-in `node:sqlite`)
- npm (Node package manager)

**Hardware:**
- Any computer capable of running Node.js
- 512 MB RAM minimum

**Network:**
- Localhost access only (development)

---

## 9. System Architecture

```
        ┌──────────────────────────────────┐
        │          Browser                 │
        │  (Chrome / Firefox / Edge)       │
        └────────────────┬─────────────────┘
                         │
              ┌──────────▼────────────┐
              │  HTTP :8080           │
              │  (Redirect Server)    │──── 301 → https://localhost:8443
              └───────────────────────┘
                         │
              ┌──────────▼────────────────────┐
              │  HTTPS :8443 (TLS)             │
              │  Node.js + Express             │
              │                                │
              │  Routes:                       │
              │  GET  /            Home        │
              │  GET  /login.html  Login       │
              │  POST /api/login   Authenticate│
              │  POST /api/register Register   │
              │  GET  /api/dashboard Protected │
              │  POST /api/logout  Logout      │
              │  GET  /security.html Security  │
              └──────────┬─────────────────────┘
                         │
              ┌──────────▼────────────────────┐
              │     SQLite Database            │
              │   database/users.db            │
              │                                │
              │   users table:                 │
              │   - id (INTEGER PK)            │
              │   - username (TEXT)            │
              │   - email (TEXT UNIQUE)        │
              │   - password_hash (TEXT)       │
              │   - created_at (TEXT)          │
              └───────────────────────────────┘
```

---

## 10. SSL/TLS Overview

**SSL/TLS** provides three security guarantees:
1. **Confidentiality** — Data is encrypted so only the intended recipient can read it.
2. **Integrity** — Data cannot be modified in transit without detection.
3. **Authentication** — The server's identity is verified using a digital certificate.

TLS is the current version. SSL was deprecated due to vulnerabilities (POODLE, BEAST). Despite this, "SSL" is still commonly used to refer to TLS.

---

## 11. HTTPS

HTTPS = HTTP + TLS

- Without TLS: `Browser ───── plaintext ─────▶ Server`
- With TLS:    `Browser ═════ encrypted ═════▶ Server`

HTTPS protects data **while it is in transit** on the network.

---

## 12. TLS Handshake

The TLS handshake establishes a secure connection before any application data is exchanged:

1. **ClientHello** — Browser sends supported TLS versions and cipher suites.
2. **ServerHello** — Server selects the cipher suite and sends its certificate.
3. **Certificate Verification** — Browser checks the certificate against trusted CAs.
4. **Key Exchange** — Both parties derive the session keys.
5. **Finished** — Handshake is complete; all subsequent data is encrypted.

---

## 13. Digital Certificate

The TLS certificate is an X.509 document that contains:
- The server's **public key**
- The server's **identity** (Common Name = domain name)
- The **issuer** (CA or self for development)
- **Validity period**
- A **digital signature** from the CA

In this project, the certificate is **self-signed** (CN=localhost) and is valid for 365 days. This is appropriate for local development. Production websites use certificates from trusted CAs such as Let's Encrypt.

**Certificate file:** `cert/server.crt`

---

## 14. Private Key

The private key corresponds to the public key in the certificate. It is used by the server to:
- Prove ownership of the certificate during the TLS handshake.
- Decrypt data encrypted with the public key.

**Security rules for the private key:**
- Never displayed in the UI.
- Never sent to the browser.
- Never exposed through any API.
- Never committed to version control (listed in `.gitignore`).
- Stored only in `cert/server.key` on the server.

---

## 15. System Design

### Registration Flow

```
User fills form → Client-side validation →
POST /api/register (over TLS) →
Server validates email, password length, uniqueness →
bcrypt.hashSync(password, 12) →
INSERT INTO users (password_hash) — plaintext never saved →
201 Created
```

### Login Flow

```
User fills form → POST /api/login (over TLS) →
SELECT user by email →
bcrypt.compareSync(inputPassword, stored_hash) →
If match: req.session.regenerate() → store userId, username →
Set secure cookie → 200 OK → redirect to dashboard
```

---

## 16. Database Design

```sql
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

All queries use **parameterized statements** to prevent SQL injection.

The `password_hash` column always contains a bcrypt hash (`$2b$12$...`) — never a plaintext password.

---

## 17. Authentication

Session-based authentication using `express-session`:
- On successful login, a session is created with `userId` and `username`.
- `req.session.regenerate()` is called before setting session data to prevent session fixation attacks.
- The `requireAuth` middleware checks for a valid session before allowing access to protected API routes.
- Logout destroys the session and clears the cookie.

---

## 18. SSL/TLS Implementation

```javascript
const https = require('https');
const fs    = require('fs');

const tlsOptions = {
  key:  fs.readFileSync('cert/server.key'),
  cert: fs.readFileSync('cert/server.crt'),
};

https.createServer(tlsOptions, expressApp).listen(8443);
```

The browser establishes a real TLS connection to port 8443. All HTTP requests — login, registration, logout — travel through this encrypted channel.

---

## 19. HTTP → HTTPS Redirect

```javascript
const http = require('http');
const httpApp = express();
httpApp.use((req, res) => {
  res.redirect(301, `https://localhost:8443${req.url}`);
});
http.createServer(httpApp).listen(8080);
```

Port 8080 exists only to redirect users to HTTPS. The `301 Moved Permanently` status code tells browsers and search engines that the resource has permanently moved to HTTPS.

---

## 20. Secure Cookies

Session cookies are configured with:
```javascript
cookie: {
  httpOnly: true,    // not accessible via document.cookie
  secure:   true,    // only transmitted over HTTPS
  sameSite: 'strict', // not sent with cross-site requests
  maxAge:   1800000, // 30 minutes
}
```

These attributes protect the session cookie from XSS and CSRF attacks.

---

## 21. Security Headers

Implemented using the `helmet` npm package:

| Header | Value | Protection |
|--------|-------|-----------|
| `Strict-Transport-Security` | `max-age=31536000` | Forces HTTPS for 1 year |
| `Content-Security-Policy` | (restricted sources) | Mitigates XSS |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer data |

---

## 22. Testing

21 automated tests were run and all passed:
- Application tests (pages load, API responds correctly)
- Authentication tests (registration, login, logout, invalid inputs)
- TLS tests (HTTPS server, HTTP redirect, certificates)
- Security tests (cookie attributes, security headers, password hashing)

See `docs/test-report.md` for full results.

---

## 23. Results

| Feature | Status |
|---------|--------|
| HTTPS server on port 8443 | ✅ Working |
| HTTP → HTTPS redirect (port 8080) | ✅ Working |
| TLS certificate loaded | ✅ Working |
| Registration with bcrypt | ✅ Working |
| Login with session | ✅ Working |
| Logout | ✅ Working |
| Protected dashboard | ✅ Working |
| Secure cookies (HttpOnly, Secure, SameSite) | ✅ Working |
| Security headers | ✅ Working |
| Security info page | ✅ Working |
| 21/21 automated tests | ✅ Passing |

---

## 24. Advantages

1. Demonstrates **real TLS** — not simulated or faked.
2. Clean, easy-to-understand code suitable for explanation in a viva.
3. No heavy frameworks — uses Node.js built-ins and minimal dependencies.
4. Covers multiple security concepts in one project: TLS, cookies, hashing, headers.
5. Visual security information page aids demonstration.
6. Complete documentation: development log, test report, verification guide, viva prep.

---

## 25. Limitations

1. Uses a **self-signed certificate** — browsers show a warning (expected in development).
2. Sessions stored **in memory** — lost on server restart; not suitable for production.
3. `node:sqlite` is **experimental** in Node v22 (stable in v23+).
4. No rate limiting on login — brute-force protection would be needed in production.
5. Single-server, no load balancing.

---

## 26. Future Enhancements

1. Use a CA-issued certificate (e.g., Let's Encrypt with Certbot) for production.
2. Add a Redis or database-backed session store for persistence.
3. Implement login rate limiting to prevent brute-force attacks.
4. Add CSRF tokens for additional protection beyond SameSite cookies.
5. Move to a stable SQLite driver once the Node built-in module stabilizes.
6. Deploy behind a reverse proxy (Nginx/Caddy) with automatic certificate renewal.

---

## 27. Conclusion

This project successfully demonstrates the implementation of SSL/TLS in a web application. A real HTTPS server was created using Node.js's built-in `https` module with a genuine TLS certificate. All application routes — registration, login, dashboard, logout — operate over this encrypted channel.

The project clearly distinguishes between:
- **TLS** — which encrypts data *during network transmission*
- **bcrypt** — which hashes passwords *before storage in the database*

HTTP traffic is automatically redirected to HTTPS, session cookies are secured with `HttpOnly`, `Secure`, and `SameSite=Strict` attributes, and standard security headers are applied. All 21 automated tests pass. The implementation is real, demonstrable, and appropriate in scope for a college micro project.

---

## 28. References

1. RFC 8446 — The Transport Layer Security (TLS) Protocol Version 1.3. IETF. https://tools.ietf.org/html/rfc8446
2. Node.js Documentation — HTTPS module. https://nodejs.org/api/https.html
3. OWASP — Transport Layer Security Cheat Sheet. https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html
4. OWASP — Session Management Cheat Sheet. https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
5. Let's Encrypt — Free TLS Certificates. https://letsencrypt.org/
6. bcrypt — npm package documentation. https://www.npmjs.com/package/bcrypt
7. helmet — npm package documentation. https://helmetjs.github.io/
8. MDN Web Docs — HTTP cookies. https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
9. MDN Web Docs — Content Security Policy (CSP). https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
10. NIST — Guidelines for the Selection, Configuration, and Use of TLS Implementations (SP 800-52 Rev. 2). https://csrc.nist.gov/publications/detail/sp/800-52/rev-2/final
