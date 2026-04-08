const rules = {
  bannedWords: [],
  antiSpam: { enabled: false, maxMessages: 5, interval: 5000 },
  antiLink: { enabled: false, whitelist: [] },
  logChannel: null,
};

const userMessageLog = {};

const URL_REGEX = /https?:\/\/[^\s]+/gi;

async function logAction(client, action, reason, message) {
  if (!rules.logChannel) return;
  try {
    const channel = await client.channels.fetch(rules.logChannel);
    if (channel && typeof channel.send === 'function') {
      await channel.send(
        `**[AutoMod]** Action: \`${action}\` | Reason: ${reason}\n` +
        `User: ${message.author.tag} (${message.author.id})\n` +
        `Channel: <#${message.channel.id}>\n` +
        `Content: \`${message.content.substring(0, 200)}\``
      );
    }
  } catch (err) {
    console.error('[automod] Failed to log action:', err.message);
  }
}

function checkBannedWords(content) {
  const lower = content.toLowerCase();
  for (const word of rules.bannedWords) {
    if (lower.includes(word.toLowerCase())) {
      return { action: 'delete', reason: `Banned word: "${word}"` };
    }
  }
  return null;
}

function checkAntiSpam(userId) {
  if (!rules.antiSpam.enabled) return null;

  const now = Date.now();
  if (!userMessageLog[userId]) {
    userMessageLog[userId] = [];
  }

  // Clean old entries
  userMessageLog[userId] = userMessageLog[userId].filter(
    ts => now - ts < rules.antiSpam.interval
  );

  userMessageLog[userId].push(now);

  if (userMessageLog[userId].length > rules.antiSpam.maxMessages) {
    return { action: 'warn', reason: `Anti-spam: ${userMessageLog[userId].length} messages in ${rules.antiSpam.interval}ms` };
  }

  // Clean up old entries from other users to prevent memory leak
  const cutoff = Date.now() - (rules.antiSpam.interval || 5000) * 10;
  for (const uid in userMessageLog) {
    userMessageLog[uid] = userMessageLog[uid].filter(t => t > cutoff);
    if (userMessageLog[uid].length === 0) delete userMessageLog[uid];
  }

  return null;
}

function checkAntiLink(content) {
  if (!rules.antiLink.enabled) return null;

  const urls = content.match(URL_REGEX);
  if (!urls || urls.length === 0) return null;

  for (const url of urls) {
    const isWhitelisted = rules.antiLink.whitelist.some(domain => url.includes(domain));
    if (!isWhitelisted) {
      return { action: 'delete', reason: `Unapproved link: ${url}` };
    }
  }

  return null;
}

async function checkMessage(message, client) {
  // Don't check bot's own messages
  if (message.author.id === client.user.id) {
    return { action: null, reason: null };
  }

  // Check banned words
  const wordResult = checkBannedWords(message.content);
  if (wordResult) {
    await logAction(client, wordResult.action, wordResult.reason, message);
    return wordResult;
  }

  // Check anti-link
  const linkResult = checkAntiLink(message.content);
  if (linkResult) {
    await logAction(client, linkResult.action, linkResult.reason, message);
    return linkResult;
  }

  // Check anti-spam
  const spamResult = checkAntiSpam(message.author.id);
  if (spamResult) {
    await logAction(client, spamResult.action, spamResult.reason, message);
    return spamResult;
  }

  return { action: null, reason: null };
}

function addBannedWord(word) {
  if (!word || rules.bannedWords.includes(word.toLowerCase())) return false;
  rules.bannedWords.push(word.toLowerCase());
  return true;
}

function removeBannedWord(word) {
  const idx = rules.bannedWords.indexOf(word.toLowerCase());
  if (idx !== -1) {
    rules.bannedWords.splice(idx, 1);
    return true;
  }
  return false;
}

function setAntiSpam(enabled, maxMessages, interval) {
  rules.antiSpam.enabled = !!enabled;
  if (typeof maxMessages === 'number' && maxMessages > 0) rules.antiSpam.maxMessages = maxMessages;
  if (typeof interval === 'number' && interval > 0) rules.antiSpam.interval = interval;
}

function setAntiLink(enabled, whitelist) {
  rules.antiLink.enabled = !!enabled;
  if (Array.isArray(whitelist)) rules.antiLink.whitelist = whitelist;
}

function getRules() {
  return { ...rules };
}

module.exports = { rules, checkMessage, addBannedWord, removeBannedWord, setAntiSpam, setAntiLink, getRules };
