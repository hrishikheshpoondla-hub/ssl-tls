'use strict';

// Node.js 22.5+ ships a built-in SQLite module (experimental).
// This requires no native compilation — works on Windows without Visual Studio.
const { DatabaseSync } = require('node:sqlite');
const path             = require('path');
const fs               = require('fs');

// ---------------------------------------------------------------------------
// Database initialisation
// ---------------------------------------------------------------------------
const DB_DIR  = path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'users.db');

// Ensure the database directory exists
fs.mkdirSync(DB_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Create users table if it does not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

console.log('[DB] SQLite database initialised at:', DB_PATH);

// ---------------------------------------------------------------------------
// Prepared statements (node:sqlite uses .prepare())
// ---------------------------------------------------------------------------
const stmtInsertUser  = db.prepare(
  'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
);
const stmtFindByEmail = db.prepare(
  'SELECT id, username, email, password_hash, created_at FROM users WHERE email = ? COLLATE NOCASE'
);
const stmtFindById    = db.prepare(
  'SELECT id, username, email, created_at FROM users WHERE id = ?'
);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new user.
 * @param {{ username: string, email: string, passwordHash: string }} user
 */
function createUser({ username, email, passwordHash }) {
  return stmtInsertUser.run(username, email, passwordHash);
}

/**
 * Find a user by email. Returns the full row (including password_hash) or undefined.
 * @param {string} email
 */
function findUserByEmail(email) {
  return stmtFindByEmail.get(email);
}

/**
 * Find a user by ID. Does NOT return password_hash.
 * @param {number} id
 */
function findUserById(id) {
  return stmtFindById.get(id);
}

module.exports = { createUser, findUserByEmail, findUserById };
