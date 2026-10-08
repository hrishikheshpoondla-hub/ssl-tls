'use strict';

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password synchronously using bcrypt.
 * The original password is never stored.
 * @param {string} password - plaintext
 * @returns {string} bcrypt hash
 */
function hashPasswordSync(password) {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash synchronously.
 * @param {string} password   - plaintext input from user
 * @param {string} hash       - stored bcrypt hash from database
 * @returns {boolean}
 */
function comparePasswordSync(password, hash) {
  return bcrypt.compareSync(password, hash);
}

module.exports = { hashPasswordSync, comparePasswordSync };
