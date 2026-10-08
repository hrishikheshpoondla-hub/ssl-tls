# Viva Questions & Answers

**Project:** Implementation of SSL/TLS in a Website  
**College Micro Project**

---

### Q1. What is SSL?

**SSL** (Secure Sockets Layer) is a cryptographic protocol that was designed to provide secure communication over a network. It encrypts data between a client (browser) and a server. SSL has been deprecated due to known vulnerabilities.

---

### Q2. What is TLS?

**TLS** (Transport Layer Security) is the modern, more secure successor to SSL. TLS provides authentication, data confidentiality, and data integrity between two communicating parties. This project uses TLS.

---

### Q3. What is the difference between SSL and TLS?

| Feature | SSL | TLS |
|---------|-----|-----|
| Status | Deprecated | Current standard |
| Versions | SSL 2.0, 3.0 | TLS 1.0, 1.1, 1.2, 1.3 |
| Security | Known vulnerabilities | Stronger, fixed vulnerabilities |
| Usage | No longer used | Used in all modern HTTPS |

In common usage, "SSL" and "TLS" are often used interchangeably, but technically TLS is the correct term today.

---

### Q4. What is HTTPS?

**HTTPS** (HyperText Transfer Protocol Secure) is HTTP running over TLS. TLS encrypts the HTTP communication between the browser and the server, protecting data in transit from interception or modification.

---

### Q5. Why port 443? Why does this project use port 8443?

**Port 443** is the standard, reserved port number for HTTPS (as defined by IANA).

This project uses **port 8443** because:
- Port 443 requires administrator/root privileges to bind on most systems.
- Port 8443 is a common alternative for development and testing.
- In production, the standard port 443 would be used.

---

### Q6. What is a digital certificate?

A **digital certificate** (also called a TLS/SSL certificate or X.509 certificate) is an electronic document that:
- Contains the server's **public key**
- Contains the server's **identity** (domain name / CN)
- Is signed by a **Certificate Authority (CA)**

The browser uses the certificate to verify that it is communicating with the correct server and to obtain the server's public key for the TLS handshake.

---

### Q7. What is a private key?

A **private key** is the secret cryptographic key that corresponds to the public key in the certificate. It is:
- Used by the server to decrypt messages encrypted with the public key
- Used to create digital signatures that prove the server's identity
- **Never shared** with anyone — not the browser, not the user, not committed to git
- Stored only on the server

In this project, the private key is in `cert/server.key` and is excluded from git via `.gitignore`.

---

### Q8. What happens during a TLS handshake?

1. **ClientHello** — Browser tells the server it wants TLS and lists the cipher suites it supports.
2. **ServerHello** — Server selects a cipher suite and sends its TLS certificate.
3. **Certificate Verification** — Browser checks whether the certificate is trusted.
4. **Key Exchange** — Browser and server negotiate session keys (symmetric encryption keys) using the server's public key.
5. **Handshake Complete** — Both sides confirm the handshake is done.
6. **Encrypted Communication** — All data is now transmitted through the encrypted TLS channel.

---

### Q9. What is encryption?

**Encryption** is the process of converting readable data (plaintext) into an unreadable form (ciphertext) using a cryptographic algorithm and a key. Only someone with the corresponding decryption key can reverse it back to plaintext.

TLS uses **symmetric encryption** for the actual data transfer (fast) and **asymmetric encryption** (public/private key) during the handshake.

---

### Q10. What is authentication?

**Authentication** is the process of verifying the identity of a user or system. In this project:
- **Server authentication**: TLS certificate proves the server's identity to the browser.
- **User authentication**: The login system verifies that the user knows their password using bcrypt comparison.

---

### Q11. What is a Certificate Authority (CA)?

A **Certificate Authority (CA)** is a trusted organization that issues digital certificates. The CA verifies the identity of the certificate applicant before issuing a certificate. Browsers come pre-installed with a list of trusted CA root certificates.

Examples: Let's Encrypt (free), DigiCert, Comodo, GlobalSign.

---

### Q12. Why does a self-signed certificate show a browser warning?

A **self-signed certificate** is signed by the server itself, not by a trusted CA. The browser has no way to verify that the server is who it claims to be, because no trusted third party has vouched for it. Therefore, the browser shows a warning.

This is **expected and acceptable in development**. In production, a CA-issued certificate would be used and the browser would show the green padlock automatically.

---

### Q13. Why is HTTP insecure?

HTTP transmits data as **plaintext**. This means:
- Anyone who intercepts the network traffic (man-in-the-middle attack) can read the data.
- Passwords, session cookies, and sensitive information are visible.
- The data can be modified without detection.

HTTPS with TLS encrypts the data so an interceptor sees only ciphertext.

---

### Q14. Why redirect HTTP to HTTPS?

Users sometimes type a URL without specifying `https://` — the browser defaults to HTTP. If the server only served HTTPS and ignored HTTP, users would get a connection error.

By running an HTTP server that **301-redirects** all requests to HTTPS, we ensure every user is always using the secure encrypted connection, regardless of how they typed the URL.

---

### Q15. What does the Secure cookie flag do?

The **Secure** flag tells the browser to only send the cookie over an HTTPS connection. If the cookie has the Secure flag and the user somehow accesses the site over HTTP, the cookie will **not** be sent. This prevents session hijacking over unencrypted connections.

---

### Q16. What does HttpOnly do?

The **HttpOnly** flag prevents JavaScript from reading the cookie using `document.cookie`. This mitigates **Cross-Site Scripting (XSS)** attacks — even if an attacker injects malicious JavaScript, they cannot steal the session cookie.

---

### Q17. What does SameSite do?

**SameSite=Strict** prevents the browser from sending the cookie with cross-site requests. This mitigates **Cross-Site Request Forgery (CSRF)** attacks — a malicious website cannot trigger authenticated requests using the user's session cookie.

---

### Q18. Why use bcrypt?

**bcrypt** is used to hash passwords before storing them in the database because:
- It is a **one-way function** — the original password cannot be recovered from the hash.
- It is intentionally **slow** — the computational cost makes brute-force attacks expensive.
- It includes a **salt** — the salt is stored with the hash and prevents rainbow table attacks.
- This project uses **12 salt rounds**, which is the recommended minimum.

---

### Q19. Is bcrypt encryption?

**No.** bcrypt is a **hashing** algorithm, not encryption.
- **Encryption** is reversible — you can decrypt back to the original.
- **Hashing** is one-way — you cannot recover the original password from the hash.

bcrypt is used to verify a password by hashing the input again and comparing it to the stored hash, not by decrypting the stored hash.

---

### Q20. What is the difference between hashing and encryption?

| Property | Hashing | Encryption |
|----------|---------|-----------|
| Reversible? | No (one-way) | Yes (decrypt with key) |
| Purpose | Verification (password storage) | Confidentiality (data transmission) |
| Examples | bcrypt, SHA-256 | AES, RSA |
| Key required? | No | Yes |

In this project: **bcrypt hashing** protects stored passwords; **TLS encryption** protects data in transit.

---

### Q21. How does the website verify that HTTPS is actually working?

You can verify it using browser developer tools:
1. Open the browser → DevTools → Network tab.
2. Log in.
3. Check that the request URL shows `https://`.
4. Check the response headers for `Strict-Transport-Security`.
5. Check the cookie for `HttpOnly` and `Secure` flags.
6. Run `document.cookie` in the console — the session cookie should not appear (HttpOnly).
7. Click the address bar icon to view the TLS certificate.

---

### Q22. What happens if the certificate is invalid or expired?

The browser will:
- Show a full-page warning screen.
- Block the connection by default.
- Allow the user to proceed only if they explicitly accept the risk.

In production, an expired or invalid certificate will prevent users from accessing the site and must be renewed immediately.

---

### Q23. What attacks can TLS help mitigate?

| Attack | How TLS Helps |
|--------|--------------|
| Man-in-the-Middle (MITM) | TLS authenticates the server and encrypts traffic |
| Eavesdropping (Sniffing) | Data is encrypted — interceptor sees only ciphertext |
| Data Tampering | TLS uses message authentication codes (MAC) to detect modification |
| Session Hijacking | Secure cookie ensures session ID travels only over HTTPS |
| SSL Stripping | HSTS header tells the browser to always use HTTPS |

---

### Q24. What are the limitations of this project?

1. Uses a **self-signed certificate** — not trusted by browsers in production.
2. Uses **in-memory sessions** — sessions are lost when the server restarts.
3. **No rate limiting** on login attempts — susceptible to brute-force in production.
4. **No CSRF token** — relies on SameSite=Strict cookie only.
5. The `node:sqlite` module is **experimental** in Node 22.
6. The session secret is hardcoded — in production it should be in an environment variable.
7. Single-server setup — no load balancing or high availability.

---

### Q25. What would be required for production deployment?

1. **CA-issued certificate** — e.g., from Let's Encrypt (free, automated).
2. **Bind to port 443** (standard HTTPS) and port 80 (HTTP redirect).
3. **Persistent session store** — e.g., Redis or a database-backed session store.
4. **Rate limiting** — protect login from brute-force attacks.
5. **CSRF protection** — additional CSRF token besides SameSite cookie.
6. **Environment variables** — move session secrets and configuration out of code.
7. **HTTPS reverse proxy** — e.g., Nginx or Caddy in front of the Node.js server.
8. **Stable SQLite driver** — use better-sqlite3 on a build system that has Visual Studio.
9. **Monitoring and logging** — detect attacks and errors in production.
10. **HSTS preloading** — register the domain with browsers' HSTS preload lists.
