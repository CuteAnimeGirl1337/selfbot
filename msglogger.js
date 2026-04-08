const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'msglogger-data.json');

const MAX_MEMORY = 50000;
const MAX_DISK = 10000;

const state = {
  enabled: false,
  loggedGuilds: new Set(),
  loggedChannels: new Set(),
  messages: [],
  stats: {
    totalLogged: 0,
    byGuild: {},
    byUser: {},
  },
};

function logMessage(message) {
  if (!state.enabled) return;
  if (!message || !message.content && !message.attachments?.size) return;
  if (!message.guild) return;

  const guildId = message.guild.id;
  const channelId = message.channel.id;

  if (!isLogging(guildId, channelId)) return;

  const entry = {
    id: message.id,
    content: message.content || '',
    authorId: message.author ? message.author.id : 'unknown',
    authorTag: message.author ? message.author.tag : 'unknown',
    channelId,
    channelName: message.channel.name || 'unknown',
    guildId,
    guildName: message.guild.name || 'unknown',
    timestamp: message.createdTimestamp || Date.now(),
    attachments: message.attachments
      ? [...message.attachments.values()].map((a) => ({ url: a.url, name: a.name, size: a.size }))
      : [],
    hasEmbeds: message.embeds ? message.embeds.length > 0 : false,
  };

  state.messages.push(entry);

  // Trim to max memory size (FIFO)
  if (state.messages.length > MAX_MEMORY) {
    state.messages = state.messages.slice(-MAX_MEMORY);
  }

  // Update stats
  state.stats.totalLogged++;
  state.stats.byGuild[guildId] = (state.stats.byGuild[guildId] || 0) + 1;
  state.stats.byUser[entry.authorId] = (state.stats.byUser[entry.authorId] || 0) + 1;
}

function search(query, filters = {}) {
  let results = state.messages;

  if (filters.guildId) {
    results = results.filter((m) => m.guildId === filters.guildId);
  }
  if (filters.channelId) {
    results = results.filter((m) => m.channelId === filters.channelId);
  }
  if (filters.authorId) {
    results = results.filter((m) => m.authorId === filters.authorId);
  }
  if (filters.before) {
    const ts = typeof filters.before === 'number' ? filters.before : new Date(filters.before).getTime();
    results = results.filter((m) => m.timestamp < ts);
  }
  if (filters.after) {
    const ts = typeof filters.after === 'number' ? filters.after : new Date(filters.after).getTime();
    results = results.filter((m) => m.timestamp > ts);
  }

  if (query) {
    const lower = query.toLowerCase();
    results = results.filter((m) => m.content.toLowerCase().includes(lower));
  }

  const limit = filters.limit || 100;
  return results.slice(-limit);
}

function getMessages(limit = 50, offset = 0, filters = {}) {
  let results = state.messages;

  if (filters.guildId) {
    results = results.filter((m) => m.guildId === filters.guildId);
  }
  if (filters.channelId) {
    results = results.filter((m) => m.channelId === filters.channelId);
  }
  if (filters.authorId) {
    results = results.filter((m) => m.authorId === filters.authorId);
  }

  // Return newest first
  const reversed = results.slice().reverse();
  return reversed.slice(offset, offset + limit);
}

function getStats() {
  return {
    enabled: state.enabled,
    totalLogged: state.stats.totalLogged,
    inMemory: state.messages.length,
    guildsLogged: state.loggedGuilds.size || 'all',
    channelsLogged: state.loggedChannels.size || 'all',
    byGuild: { ...state.stats.byGuild },
    byUser: { ...state.stats.byUser },
  };
}

function enableGuild(guildId) {
  state.loggedGuilds.add(guildId);
}

function disableGuild(guildId) {
  state.loggedGuilds.delete(guildId);
}

function enableChannel(channelId) {
  state.loggedChannels.add(channelId);
}

function disableChannel(channelId) {
  state.loggedChannels.delete(channelId);
}

function isLogging(guildId, channelId) {
  // If specific guilds are set, check membership
  if (state.loggedGuilds.size > 0 && !state.loggedGuilds.has(guildId)) {
    return false;
  }
  // If specific channels are set, check membership
  if (state.loggedChannels.size > 0 && !state.loggedChannels.has(channelId)) {
    return false;
  }
  return true;
}

function getState() {
  return {
    enabled: state.enabled,
    loggedGuilds: [...state.loggedGuilds],
    loggedChannels: [...state.loggedChannels],
    messageCount: state.messages.length,
    totalLogged: state.stats.totalLogged,
  };
}

function setState(key, val) {
  if (key === 'enabled') {
    state.enabled = Boolean(val);
  } else if (key === 'loggedGuilds' && Array.isArray(val)) {
    state.loggedGuilds = new Set(val);
  } else if (key === 'loggedChannels' && Array.isArray(val)) {
    state.loggedChannels = new Set(val);
  }
}

function save() {
  try {
    const data = {
      enabled: state.enabled,
      loggedGuilds: [...state.loggedGuilds],
      loggedChannels: [...state.loggedChannels],
      messages: state.messages.slice(-MAX_DISK),
      stats: state.stats,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[msglogger] Failed to save:', err.message);
  }
}

function load() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);

    if (data.enabled !== undefined) state.enabled = data.enabled;
    if (Array.isArray(data.loggedGuilds)) {
      state.loggedGuilds = new Set(data.loggedGuilds);
    }
    if (Array.isArray(data.loggedChannels)) {
      state.loggedChannels = new Set(data.loggedChannels);
    }
    if (Array.isArray(data.messages)) {
      state.messages = data.messages;
    }
    if (data.stats) {
      Object.assign(state.stats, data.stats);
    }

    console.log(`[msglogger] Loaded: ${state.messages.length} messages, ${state.stats.totalLogged} total logged`);
  } catch (err) {
    console.error('[msglogger] Failed to load:', err.message);
  }
}

module.exports = {
  logMessage,
  search,
  getMessages,
  getStats,
  enableGuild,
  disableGuild,
  enableChannel,
  disableChannel,
  isLogging,
  getState,
  setState,
  save,
  load,
};
