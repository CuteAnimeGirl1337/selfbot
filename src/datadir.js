// =============================================================================
// Data Directory — resolves writable path for data files
// =============================================================================
// In packaged Electron apps, the app directory is read-only (asar/AppImage).
// This module redirects data file paths to the user data directory.
const path = require('path');
const fs = require('fs');

let dataDir = __dirname; // default: project root (works for `node index.js`)

if (process.env.ELECTRON_DATA_DIR) {
  dataDir = process.env.ELECTRON_DATA_DIR;
  // Ensure it exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Returns the full path for a data file (e.g. 'data.json', 'auth.json').
 * In dev/CLI mode, returns __dirname/filename.
 * In packaged Electron, returns userData/filename.
 */
function dataPath(filename) {
  return path.join(dataDir, filename);
}

module.exports = { dataPath, dataDir };
