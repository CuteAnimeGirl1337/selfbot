const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'stealth-data.json');

const state = {
  ghostRead: false,
  invisibleTyping: false,
  delayedResponses: false,
  minDelay: 500,
  maxDelay: 2000,
};

function getState() {
  return { ...state };
}

function setState(key, value) {
  if (!(key in state)) return false;
  state[key] = value;
  save();
  return true;
}

function shouldDelay() {
  if (!state.delayedResponses) return Promise.resolve();
  if (state.maxDelay <= state.minDelay) return Promise.resolve();
  const delay = Math.floor(Math.random() * (state.maxDelay - state.minDelay + 1)) + state.minDelay;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function interceptTyping(channel) {
  if (state.invisibleTyping) return false;
  return true;
}

function interceptRead(channel) {
  if (state.ghostRead) return false;
  return true;
}

function save() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[stealth] Failed to save:', err.message);
  }
}

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      for (const key of Object.keys(state)) {
        if (key in data) state[key] = data[key];
      }
    }
  } catch (err) {
    console.error('[stealth] Failed to load:', err.message);
  }
}

load();

module.exports = { state, getState, setState, shouldDelay, interceptTyping, interceptRead, save, load };
