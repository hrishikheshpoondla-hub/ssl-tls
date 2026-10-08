/**
 * generate-cert.js
 * 
 * Generates a self-signed TLS certificate for localhost.
 * Uses the 'selfsigned' package — pure JavaScript, no openssl required.
 * 
 * Output:
 *   cert/server.key  — private key (PEM)
 *   cert/server.crt  — self-signed certificate (PEM)
 * 
 * Run: node generate-cert.js
 */

'use strict';

const selfsigned = require('selfsigned');
const fs         = require('fs');
const path       = require('path');

const CERT_DIR  = path.join(__dirname, 'cert');
const KEY_FILE  = path.join(CERT_DIR, 'server.key');
const CERT_FILE = path.join(CERT_DIR, 'server.crt');

fs.mkdirSync(CERT_DIR, { recursive: true });

async function main() {
  console.log('[Cert] Generating self-signed TLS certificate for localhost...');
  console.log('       This may take a few seconds (RSA-2048 key generation)...\n');

  const attrs = [{ name: 'commonName', value: 'localhost' }];

  const opts = {
    keySize:   2048,
    days:      365,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' },
        ],
      },
    ],
  };

  // selfsigned ≥ 2.x returns a Promise
  const pems = await Promise.resolve(selfsigned.generate(attrs, opts));

  // Property names may be 'private', 'public', 'cert' or 'serviceKey', 'certificate'
  const privateKeyPem = pems.private || pems.serviceKey || pems.key;
  const certPem       = pems.cert    || pems.certificate;

  if (!privateKeyPem) {
    console.error('[Cert] ERROR: Could not obtain private key from selfsigned. Keys:', Object.keys(pems));
    process.exit(1);
  }
  if (!certPem) {
    console.error('[Cert] ERROR: Could not obtain certificate from selfsigned. Keys:', Object.keys(pems));
    process.exit(1);
  }

  fs.writeFileSync(KEY_FILE,  privateKeyPem);
  fs.writeFileSync(CERT_FILE, certPem);

  const certSize = fs.statSync(CERT_FILE).size;
  const keySize  = fs.statSync(KEY_FILE).size;

  console.log('✅ Certificate generated successfully!\n');
  console.log(`   cert/server.crt  (${certSize} bytes)  — presented to browser during TLS handshake`);
  console.log(`   cert/server.key  (${keySize} bytes)  — PRIVATE KEY — never share or commit!\n`);
  console.log('⚠️  Both files are listed in .gitignore and will NOT be committed to git.\n');
  console.log('📋 Certificate details:');
  console.log('   Common Name (CN)  : localhost');
  console.log('   Subject Alt Names : DNS:localhost, IP:127.0.0.1');
  console.log('   Validity          : 365 days');
  console.log('   Algorithm         : RSA-2048 with SHA-256\n');
  console.log('⚠️  This is a SELF-SIGNED certificate — for local development ONLY.');
  console.log('   Browsers will show a warning. Click Advanced → Proceed to localhost.');
  console.log('   Production sites must use a CA-issued certificate (e.g., Let\'s Encrypt).\n');
  console.log('👉 Now run: npm start');
}

main().catch(err => {
  console.error('[Cert] Fatal error:', err.message);
  process.exit(1);
});
