const fs = require('fs');
const path = require('path');
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

let accounts = []; // [{ name, token, addedAt }]

function load() {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
  } catch {}
}

function save() {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  } catch (e) {
    console.error('[accounts] Failed to save:', e.message);
  }
}

function addAccount(name, token) {
  accounts.push({ name, token: token.slice(0, 10) + '...' + token.slice(-5), fullToken: token, addedAt: Date.now() });
  save();
}

function removeAccount(name) {
  accounts = accounts.filter(a => a.name !== name);
  save();
}

function getAccounts() {
  return accounts.map(a => ({ name: a.name, token: a.token, addedAt: a.addedAt }));
}

function getFullToken(name) {
  return accounts.find(a => a.name === name)?.fullToken || null;
}

load();
module.exports = { addAccount, removeAccount, getAccounts, getFullToken, load, save };
