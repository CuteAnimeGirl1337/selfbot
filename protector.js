const fs = require('fs');
const path = require('path');
const { dataPath } = require('./datadir');

const DATA_FILE = dataPath('protector-data.json');

const SUSPICIOUS_PATTERNS = [
  /(?:discord\.gift|discordapp\.com\/gifts)\/[a-zA-Z0-9]+/i,
  /(?:grabify|iplogger|2no\.co|ipgrabber|blasze)/i,
  /(?:token|grab|steal|hack|inject|webhook).*(?:\.exe|\.bat|\.cmd|\.ps1|\.scr|\.dll)/i,
  /(?:free\s*nitro|nitro\s*gen|claim\s*nitro).*(?:http|www)/i,
  /(?:discord.*(?:login|verify|auth|billing)).*(?:\.ru|\.tk|\.ml|\.ga|\.cf|\.xyz)/i,
  /(?:\.exe|\.bat|\.cmd|\.scr|\.msi|\.dll)\s*$/i,
  /(?:eval|atob|document\.cookie|localStorage|\.token)/i,
  /(?:require\s*\(\s*['"]child_process|exec\s*\(|spawn\s*\()/i,
];

const PATTERN_REASONS = [
  'Suspected gift/nitro link',
  'Known IP logger domain',
  'Suspicious executable with grabber keywords',
  'Fake free nitro phishing',
  'Phishing domain impersonating Discord',
  'Suspicious executable file extension',
  'Potential token/cookie stealing code',
  'Potential code injection attempt',
];

const MAX_ALERTS = 200;

const state = {
  enabled: true,
  alerts: [],
  autoBlock: false,
  whitelist: [],
};

function checkMessage(message) {
  if (!state.enabled) return null;
  if (!message || !message.content) return null;
  if (message.author && state.whitelist.includes(message.author.id)) return null;

  const content = message.content;

  for (let i = 0; i < SUSPICIOUS_PATTERNS.length; i++) {
    if (SUSPICIOUS_PATTERNS[i].test(content)) {
      const alert = {
        from: message.author ? message.author.id : 'unknown',
        content: content.substring(0, 500),
        reason: PATTERN_REASONS[i],
        channel: message.channel ? message.channel.id : 'unknown',
        time: Date.now(),
      };

      state.alerts.push(alert);
      if (state.alerts.length > MAX_ALERTS) {
        state.alerts = state.alerts.slice(-MAX_ALERTS);
      }

      save();

      return { suspicious: true, reason: PATTERN_REASONS[i] };
    }
  }

  return { suspicious: false, reason: null };
}

function getAlerts() {
  return [...state.alerts];
}

function getState() {
  return {
    enabled: state.enabled,
    autoBlock: state.autoBlock,
    whitelist: [...state.whitelist],
    alertCount: state.alerts.length,
  };
}

function setState(key, val) {
  if (key === 'enabled' || key === 'autoBlock') {
    state[key] = val;
    save();
    return true;
  }
  return false;
}

function addWhitelist(userId) {
  if (!state.whitelist.includes(userId)) {
    state.whitelist.push(userId);
    save();
  }
}

function removeWhitelist(userId) {
  const idx = state.whitelist.indexOf(userId);
  if (idx !== -1) {
    state.whitelist.splice(idx, 1);
    save();
  }
}

function save() {
  try {
    const data = {
      enabled: state.enabled,
      alerts: state.alerts,
      autoBlock: state.autoBlock,
      whitelist: state.whitelist,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[protector] Failed to save:', err.message);
  }
}

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (typeof data.enabled === 'boolean') state.enabled = data.enabled;
      if (typeof data.autoBlock === 'boolean') state.autoBlock = data.autoBlock;
      if (Array.isArray(data.alerts)) state.alerts = data.alerts.slice(-MAX_ALERTS);
      if (Array.isArray(data.whitelist)) state.whitelist = data.whitelist;
    }
  } catch (err) {
    console.error('[protector] Failed to load:', err.message);
  }
}

load();

module.exports = { checkMessage, getAlerts, getState, setState, addWhitelist, removeWhitelist, save, load };
