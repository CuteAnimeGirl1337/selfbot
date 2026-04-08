// =============================================================================
// Keyword Alerts + Auto-Actions
// =============================================================================

const fs = require('fs');
const path = require('path');
const { dataPath } = require('./datadir');
const ALERTS_FILE = dataPath('alerts-data.json');

let keywords = [];
let alertLog = [];
const MAX_ALERT_LOG = 500;
let idCounter = 1;

function addKeyword(config) {
  const entry = {
    id: idCounter++,
    word: config.word || '',
    channels: Array.isArray(config.channels) ? config.channels : [],
    servers: Array.isArray(config.servers) ? config.servers : [],
    actions: Array.isArray(config.actions) ? config.actions : ['notify'],
    replyText: config.replyText || '',
    forwardTo: config.forwardTo || '',
    reactEmoji: config.reactEmoji || '\u2764\uFE0F',
    createdAt: Date.now(),
  };
  keywords.push(entry);
  save();
  return entry;
}

function removeKeyword(id) {
  const idx = keywords.findIndex(k => k.id === id);
  if (idx === -1) return false;
  keywords.splice(idx, 1);
  save();
  return true;
}

function getKeywords() {
  return keywords;
}

function getAlertLog(limit = 50) {
  return alertLog.slice(0, limit);
}

function checkMessage(message, client, broadcast) {
  try {
    // Skip own messages
    if (message.author?.id === client?.user?.id) return;

    const content = (message.content || '').toLowerCase();
    if (!content) return;

    for (const kw of keywords) {
      if (!content.includes(kw.word.toLowerCase())) continue;

      // Channel filter
      if (kw.channels.length > 0 && !kw.channels.includes(message.channel?.id)) continue;

      // Server filter
      if (kw.servers.length > 0 && !kw.servers.includes(message.guild?.id)) continue;

      const msgDetails = {
        content: message.content,
        author: message.author?.tag || message.author?.username || 'Unknown',
        authorId: message.author?.id,
        channel: message.channel?.name || message.channel?.id,
        channelId: message.channel?.id,
        guild: message.guild?.name || 'DM',
        guildId: message.guild?.id || null,
      };

      for (const action of kw.actions) {
        try {
          switch (action) {
            case 'notify':
              if (broadcast) {
                broadcast({
                  type: 'alert',
                  data: {
                    keyword: kw.word,
                    message: msgDetails,
                    timestamp: Date.now(),
                  },
                });
              }
              break;

            case 'react':
              if (message.react) {
                message.react(kw.reactEmoji).catch(() => {});
              }
              break;

            case 'reply':
              if (kw.replyText && message.reply) {
                message.reply(kw.replyText).catch(() => {});
              }
              break;

            case 'forward':
              if (kw.forwardTo && client) {
                const channel = client.channels?.cache?.get(kw.forwardTo);
                if (channel && channel.send) {
                  const fwdText = `**[Alert: "${kw.word}"]** ${msgDetails.author} in #${msgDetails.channel} (${msgDetails.guild}):\n> ${message.content}`;
                  channel.send(fwdText).catch(() => {});
                }
              }
              break;
          }
        } catch (err) {
          console.error('[alerts] Action error:', action, err.message);
        }
      }

      // Log the alert
      alertLog.unshift({
        keyword: kw.word,
        message: msgDetails,
        actions: kw.actions,
        timestamp: Date.now(),
      });
      if (alertLog.length > MAX_ALERT_LOG) alertLog.pop();
    }
  } catch (err) {
    console.error('[alerts] checkMessage error:', err.message);
  }
}

function save() {
  try {
    const data = { keywords, alertLog, idCounter };
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[alerts] Failed to save:', err.message);
  }
}

function load() {
  try {
    if (fs.existsSync(ALERTS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
      if (Array.isArray(raw.keywords)) keywords = raw.keywords;
      if (Array.isArray(raw.alertLog)) alertLog = raw.alertLog;
      if (raw.idCounter) idCounter = raw.idCounter;
      console.log('[alerts] Loaded', keywords.length, 'keywords,', alertLog.length, 'log entries');
    }
  } catch (err) {
    console.error('[alerts] Failed to load:', err.message);
  }
}

// Load on require
load();

module.exports = {
  keywords,
  addKeyword,
  removeKeyword,
  getKeywords,
  getAlertLog,
  checkMessage,
  save,
  load,
};
