// =============================================================================
// User Tracker — Presence, avatar, username, status monitoring
// =============================================================================

const fs = require('fs');
const path = require('path');
const { dataPath } = require('./datadir');
const TRACKER_FILE = dataPath('tracker-data.json');

const tracked = new Set();
const history = new Map();    // userId → [{ type, old, new, timestamp }]
const sessions = new Map();   // userId → { onlineSince, lastSeen, totalOnline }

let saveTimer = null;

function addUser(userId) {
  tracked.add(userId);
  if (!history.has(userId)) history.set(userId, []);
  if (!sessions.has(userId)) sessions.set(userId, { onlineSince: null, lastSeen: null, totalOnline: 0 });
}

function removeUser(userId) {
  tracked.delete(userId);
}

function getTracked() {
  return Array.from(tracked);
}

function pushEvent(userId, event) {
  if (!history.has(userId)) history.set(userId, []);
  const arr = history.get(userId);
  arr.push(event);
  if (arr.length > 2000) arr.splice(0, arr.length - 2000);
}

function getHistory(userId, limit = 50) {
  const arr = history.get(userId);
  if (!arr) return [];
  return arr.slice(-limit);
}

function getAllHistory(limit = 100) {
  const all = [];
  for (const [userId, events] of history) {
    for (const ev of events) {
      all.push({ userId, ...ev });
    }
  }
  all.sort((a, b) => b.timestamp - a.timestamp);
  return all.slice(0, limit);
}

function getSessions() {
  const result = {};
  for (const [userId, sess] of sessions) {
    result[userId] = { ...sess };
    // If currently online, add ongoing session time
    if (sess.onlineSince) {
      result[userId].currentSessionDuration = Date.now() - sess.onlineSince;
    }
  }
  return result;
}

function startTracking(client, broadcast) {
  // Reset daily totalOnline at midnight
  const resetDaily = () => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    setTimeout(() => {
      for (const [, sess] of sessions) {
        sess.totalOnline = 0;
      }
      resetDaily();
    }, msUntilMidnight);
  };
  resetDaily();

  client.on('presenceUpdate', (oldPresence, newPresence) => {
    try {
      const userId = newPresence?.userId || newPresence?.user?.id;
      if (!userId || !tracked.has(userId)) return;

      const userTag = newPresence.user?.tag || newPresence.user?.username || userId;
      const oldStatus = oldPresence?.status || 'offline';
      const newStatus = newPresence?.status || 'offline';
      const sess = sessions.get(userId) || { onlineSince: null, lastSeen: null, totalOnline: 0 };
      sessions.set(userId, sess);

      // Online/offline transitions
      if (oldStatus === 'offline' && newStatus !== 'offline') {
        const event = { type: 'online', old: oldStatus, new: newStatus, timestamp: Date.now() };
        pushEvent(userId, event);
        sess.onlineSince = Date.now();
        sess.lastSeen = Date.now();
        if (broadcast) broadcast({ type: 'tracker', data: { userId, userTag, event } });
      } else if (oldStatus !== 'offline' && newStatus === 'offline') {
        const event = { type: 'offline', old: oldStatus, new: newStatus, timestamp: Date.now() };
        pushEvent(userId, event);
        if (sess.onlineSince) {
          sess.totalOnline += Date.now() - sess.onlineSince;
          sess.onlineSince = null;
        }
        sess.lastSeen = Date.now();
        if (broadcast) broadcast({ type: 'tracker', data: { userId, userTag, event } });
      } else if (oldStatus !== newStatus) {
        // Status change (dnd → idle, etc.)
        const event = { type: 'status', old: oldStatus, new: newStatus, timestamp: Date.now() };
        pushEvent(userId, event);
        sess.lastSeen = Date.now();
        if (broadcast) broadcast({ type: 'tracker', data: { userId, userTag, event } });
      }

      // Activity changes
      const oldActivity = oldPresence?.activities?.[0]?.name || null;
      const newActivity = newPresence?.activities?.[0]?.name || null;
      if (oldActivity !== newActivity) {
        const event = { type: 'activity', old: oldActivity, new: newActivity, timestamp: Date.now() };
        pushEvent(userId, event);
        if (broadcast) broadcast({ type: 'tracker', data: { userId, userTag, event } });
      }
    } catch (err) {
      console.error('[tracker] presenceUpdate error:', err.message);
    }
  });

  client.on('userUpdate', (oldUser, newUser) => {
    try {
      if (!tracked.has(newUser.id)) return;
      const userTag = newUser.tag || newUser.username || newUser.id;

      // Avatar change
      if (oldUser.avatar !== newUser.avatar) {
        const event = {
          type: 'avatar',
          old: oldUser.displayAvatarURL?.({ dynamic: true }) || oldUser.avatar,
          new: newUser.displayAvatarURL?.({ dynamic: true }) || newUser.avatar,
          timestamp: Date.now(),
        };
        pushEvent(newUser.id, event);
        if (broadcast) broadcast({ type: 'tracker', data: { userId: newUser.id, userTag, event } });
      }

      // Username/tag change
      const oldTag = oldUser.tag || oldUser.username;
      const newTag = newUser.tag || newUser.username;
      if (oldTag !== newTag) {
        const event = { type: 'username', old: oldTag, new: newTag, timestamp: Date.now() };
        pushEvent(newUser.id, event);
        if (broadcast) broadcast({ type: 'tracker', data: { userId: newUser.id, userTag, event } });
      }
    } catch (err) {
      console.error('[tracker] userUpdate error:', err.message);
    }
  });

  // Auto-save every 5 minutes
  if (saveTimer) clearInterval(saveTimer);
  saveTimer = setInterval(() => save(), 5 * 60 * 1000);

  console.log('[tracker] Tracking started for', tracked.size, 'users');
}

function save() {
  try {
    const data = {
      tracked: Array.from(tracked),
      history: {},
      sessions: {},
    };
    for (const [userId, events] of history) {
      data.history[userId] = events;
    }
    for (const [userId, sess] of sessions) {
      data.sessions[userId] = sess;
    }
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[tracker] Failed to save:', err.message);
  }
}

function load() {
  try {
    if (fs.existsSync(TRACKER_FILE)) {
      const raw = JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'));
      if (Array.isArray(raw.tracked)) {
        for (const id of raw.tracked) tracked.add(id);
      }
      if (raw.history && typeof raw.history === 'object') {
        for (const [userId, events] of Object.entries(raw.history)) {
          history.set(userId, Array.isArray(events) ? events : []);
        }
      }
      if (raw.sessions && typeof raw.sessions === 'object') {
        for (const [userId, sess] of Object.entries(raw.sessions)) {
          sessions.set(userId, sess);
        }
      }
      console.log('[tracker] Loaded', tracked.size, 'tracked users');
    }
  } catch (err) {
    console.error('[tracker] Failed to load:', err.message);
  }
}

// Load on require
load();

module.exports = {
  tracked,
  addUser,
  removeUser,
  getTracked,
  getHistory,
  getAllHistory,
  getSessions,
  startTracking,
  save,
  load,
};
