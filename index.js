// =============================================================================
// Entry Point — Starts bot + dashboard
// =============================================================================
require('dotenv').config();

const { client } = require('./bot');
const { startServer } = require('./server');
const tokenMgr = require('./token');

const PORT = process.env.PORT || 3000;

// Start web dashboard (always — even without token)
startServer(PORT);

// Try to login if we have a token
const token = tokenMgr.getToken();
if (token) {
  client.login(token).catch(err => {
    console.error('[login] Failed:', err.message);
  });
} else {
  console.log('[login] No token found. Open the dashboard to set one.');
}
