const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AUTH_FILE = path.join(__dirname, 'auth.json');
let token = null;

function loadOrCreateToken() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      if (data.token) {
        token = data.token;
        return token;
      }
    }
  } catch (err) {
    console.error('[auth] Failed to read auth.json:', err.message);
  }

  token = crypto.randomBytes(16).toString('hex');
  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ token }, null, 2), 'utf-8');
  } catch (err) {
    console.error('[auth] Failed to write auth.json:', err.message);
  }
  return token;
}

function getToken() {
  if (!token) loadOrCreateToken();
  return token;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(part => {
    const [key, ...rest] = part.trim().split('=');
    if (key) cookies[key.trim()] = rest.join('=').trim();
  });
  return cookies;
}

function authMiddleware(req, res, next) {
  // Skip auth for login page, static files, and non-api routes
  if (req.path === '/login' || req.path.startsWith('/public/') || !req.path.startsWith('/api/')) {
    return next();
  }

  const expected = getToken();

  // Check query parameter
  if (req.query && req.query.token === expected) {
    return next();
  }

  // Check Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken === expected) {
      return next();
    }
  }

  // Check cookie
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.auth_token === expected) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized. Provide token via query param, Bearer header, or auth_token cookie.' });
}

function loginHandler(req, res) {
  if (req.method === 'GET') {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Selfbot Dashboard - Login</title>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; color: #eee; }
    .login-box { background: #16213e; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); min-width: 320px; }
    h2 { margin-top: 0; text-align: center; }
    input { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #444; border-radius: 4px; background: #0f3460; color: #eee; box-sizing: border-box; }
    button { width: 100%; padding: 10px; background: #e94560; border: none; border-radius: 4px; color: #fff; cursor: pointer; font-size: 1rem; margin-top: 8px; }
    button:hover { background: #c73650; }
    .error { color: #e94560; text-align: center; margin-top: 8px; display: none; }
  </style>
</head>
<body>
  <div class="login-box">
    <h2>Dashboard Login</h2>
    <form id="loginForm">
      <input type="password" id="token" name="token" placeholder="Enter auth token" required />
      <button type="submit">Login</button>
      <p class="error" id="error">Invalid token</p>
    </form>
  </div>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = document.getElementById('token').value.trim();
      const res = await fetch('/api/health?token=' + encodeURIComponent(token));
      if (res.ok) {
        document.cookie = 'auth_token=' + token + '; path=/; max-age=604800';
        window.location.href = '/';
      } else {
        document.getElementById('error').style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
    return res.type('html').send(html);
  }
}

// Initialize token on require
loadOrCreateToken();
console.log('[auth] Dashboard token:', token);

module.exports = { authMiddleware, getToken, loginHandler };
