// =============================================================================
// Token Manager — Save/load Discord token to token.json
// =============================================================================
const fs = require('fs');
const path = require('path');
const { dataPath } = require('./datadir');

const TOKEN_FILE = dataPath('token.json');

// When user explicitly logs out, we set this flag so we don't auto-login from .env
let loggedOut = false;

function getToken() {
  if (loggedOut) return null;

  // 1. Check token.json first
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      if (data.loggedOut) { loggedOut = true; return null; }
      if (data.token) return data.token;
    }
  } catch {}

  // 2. Fall back to .env
  return process.env.TOKEN || null;
}

function saveToken(token) {
  loggedOut = false;
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, savedAt: Date.now() }, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[token] Failed to save:', e.message);
    return false;
  }
}

function clearToken() {
  loggedOut = true;
  try {
    // Write a loggedOut flag so it persists across restarts too
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ loggedOut: true }, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[token] Failed to clear:', e.message);
    return false;
  }
}

function hasToken() {
  return !!getToken();
}

module.exports = { getToken, saveToken, clearToken, hasToken };
