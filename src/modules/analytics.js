// =============================================================================
// Message Analytics — Patterns, stats, word frequency
// =============================================================================

const fs = require('fs');
const path = require('path');
const { dataPath } = require('../datadir');
const ANALYTICS_FILE = dataPath('analytics-data.json');

const COMMON_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can',
  'need','dare','ought','used','to','of','in','for','on','with','at','by','from',
  'as','into','through','during','before','after','above','below','between','out',
  'off','over','under','again','further','then','once','i','me','my','we','our',
  'you','your','he','his','she','her','it','its','they','them','their','this',
  'that','these','those','and','but','or','nor','not','so','very','just','about',
  'up','no','yes','ok','lol','lmao',
]);

const MAX_WORD_FREQ = 200;
const MAX_DAILY_DAYS = 30;

let hourlyMessages = new Array(24).fill(0);
let dailyMessages = {};     // 'YYYY-MM-DD' → count
let perServer = {};          // serverId → { name, count }
let perChannel = {};         // channelId → { name, server, count }
let perUser = {};            // userId → { tag, sent, received }
let wordFreq = {};           // word → count
let totalSent = 0;
let totalReceived = 0;

let ownUserId = null;
let saveTimer = null;

function trackMessage(message) {
  try {
    if (!message || !message.author) return;

    // Capture own user id on first message
    if (!ownUserId && message.client?.user?.id) {
      ownUserId = message.client.user.id;
    }

    const isOwn = message.author.id === ownUserId;
    const hour = new Date().getHours();
    const dateKey = new Date().toISOString().slice(0, 10);

    // Hourly
    hourlyMessages[hour]++;

    // Daily
    dailyMessages[dateKey] = (dailyMessages[dateKey] || 0) + 1;

    // Prune old daily entries
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_DAILY_DAYS);
    const cutoffKey = cutoff.toISOString().slice(0, 10);
    for (const key of Object.keys(dailyMessages)) {
      if (key < cutoffKey) delete dailyMessages[key];
    }

    // Per server
    if (message.guild) {
      const sid = message.guild.id;
      if (!perServer[sid]) perServer[sid] = { name: message.guild.name, count: 0 };
      perServer[sid].count++;
      perServer[sid].name = message.guild.name;
    }

    // Per channel
    const cid = message.channel?.id;
    if (cid) {
      if (!perChannel[cid]) {
        perChannel[cid] = {
          name: message.channel.name || 'DM',
          server: message.guild?.name || 'DM',
          count: 0,
        };
      }
      perChannel[cid].count++;
    }

    // Per user
    const uid = message.author.id;
    const tag = message.author.tag || message.author.username || uid;
    if (!perUser[uid]) perUser[uid] = { tag, sent: 0, received: 0 };
    perUser[uid].tag = tag;
    if (isOwn) {
      perUser[uid].sent++;
      totalSent++;
    } else {
      perUser[uid].received++;
      totalReceived++;
    }

    // Word frequency
    const content = (message.content || '').toLowerCase();
    const words = content.split(/\s+/);
    for (const raw of words) {
      const word = raw.replace(/[^a-z0-9]/g, '');
      if (word.length < 3) continue;
      if (COMMON_WORDS.has(word)) continue;
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }

    // Trim word freq to top MAX_WORD_FREQ
    const wordEntries = Object.entries(wordFreq);
    if (wordEntries.length > MAX_WORD_FREQ * 1.5) {
      wordEntries.sort((a, b) => b[1] - a[1]);
      wordFreq = {};
      for (let i = 0; i < MAX_WORD_FREQ && i < wordEntries.length; i++) {
        wordFreq[wordEntries[i][0]] = wordEntries[i][1];
      }
    }
  } catch (err) {
    console.error('[analytics] trackMessage error:', err.message);
  }
}

function topN(obj, n, sortKey = 'count') {
  return Object.entries(obj)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0))
    .slice(0, n);
}

function getAnalytics() {
  // Daily sorted by date
  const sortedDaily = {};
  const dailyKeys = Object.keys(dailyMessages).sort();
  for (const k of dailyKeys) sortedDaily[k] = dailyMessages[k];

  // Top words
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({ word, count }));

  // Top users sorted by total (sent + received)
  const topUsers = Object.entries(perUser)
    .map(([id, data]) => ({ id, ...data, total: data.sent + data.received }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  return {
    hourly: hourlyMessages,
    daily: sortedDaily,
    topServers: topN(perServer, 20),
    topChannels: topN(perChannel, 20),
    topUsers,
    topWords,
    totalSent,
    totalReceived,
  };
}

function save() {
  try {
    const data = {
      hourlyMessages,
      dailyMessages,
      perServer,
      perChannel,
      perUser,
      wordFreq,
      totalSent,
      totalReceived,
    };
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[analytics] Failed to save:', err.message);
  }
}

function load() {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
      if (Array.isArray(raw.hourlyMessages) && raw.hourlyMessages.length === 24) {
        hourlyMessages = raw.hourlyMessages;
      }
      if (raw.dailyMessages && typeof raw.dailyMessages === 'object') dailyMessages = raw.dailyMessages;
      if (raw.perServer && typeof raw.perServer === 'object') perServer = raw.perServer;
      if (raw.perChannel && typeof raw.perChannel === 'object') perChannel = raw.perChannel;
      if (raw.perUser && typeof raw.perUser === 'object') perUser = raw.perUser;
      if (raw.wordFreq && typeof raw.wordFreq === 'object') wordFreq = raw.wordFreq;
      if (typeof raw.totalSent === 'number') totalSent = raw.totalSent;
      if (typeof raw.totalReceived === 'number') totalReceived = raw.totalReceived;
      console.log('[analytics] Loaded — totalSent:', totalSent, 'totalReceived:', totalReceived);
    }
  } catch (err) {
    console.error('[analytics] Failed to load:', err.message);
  }
}

// Load on require, auto-save every 5 min
load();
saveTimer = setInterval(() => save(), 5 * 60 * 1000);

module.exports = {
  trackMessage,
  getAnalytics,
  save,
  load,
};
