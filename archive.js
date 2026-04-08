// =============================================================================
// Deleted Message Archive — Persistent deleted message storage
// =============================================================================

const fs = require('fs');
const path = require('path');
const { dataPath } = require('./datadir');
const ARCHIVE_FILE = dataPath('archive-data.json');

const MAX_ARCHIVE = 5000;
const MAX_CACHE_PER_CHANNEL = 1000;
const MAX_CACHED_CHANNELS = 50;

let archive = [];
const messageCache = new Map();  // channelId → Map(messageId → message data)

let broadcastFn = null;
let saveTimer = null;

function cacheMessage(message) {
  try {
    if (!message || !message.id || !message.channel) return;

    const channelId = message.channel.id;

    if (!messageCache.has(channelId)) {
      // Evict oldest channel if at capacity
      if (messageCache.size >= MAX_CACHED_CHANNELS && messageCache.size > 0) {
        const firstKey = messageCache.keys().next().value;
        if (firstKey !== undefined) messageCache.delete(firstKey);
      }
      messageCache.set(channelId, new Map());
    }

    const channelCache = messageCache.get(channelId);

    channelCache.set(message.id, {
      id: message.id,
      content: message.content || '',
      author: {
        id: message.author?.id,
        tag: message.author?.tag || message.author?.username || 'Unknown',
        avatar: message.author?.displayAvatarURL?.({ dynamic: true }) || message.author?.avatar || null,
      },
      channel: {
        id: message.channel.id,
        name: message.channel.name || 'DM',
      },
      guild: message.guild ? {
        id: message.guild.id,
        name: message.guild.name,
      } : null,
      attachments: message.attachments
        ? Array.from(message.attachments.values()).map(a => ({
            name: a.name,
            url: a.url,
            proxyURL: a.proxyURL,
            size: a.size,
            contentType: a.contentType,
          }))
        : [],
      embeds: message.embeds
        ? message.embeds.map(e => ({
            title: e.title,
            description: e.description,
            url: e.url,
            color: e.color,
            footer: e.footer?.text,
          }))
        : [],
      timestamp: message.createdTimestamp || Date.now(),
    });

    // Trim channel cache
    if (channelCache.size > MAX_CACHE_PER_CHANNEL) {
      const oldest = channelCache.keys().next().value;
      channelCache.delete(oldest);
    }
  } catch (err) {
    console.error('[archive] cacheMessage error:', err.message);
  }
}

function archiveDeleted(message, broadcast) {
  try {
    if (!message) return;
    if (broadcast) broadcastFn = broadcast;

    let entry = null;
    const channelId = message.channel?.id;

    // Try to get full data from cache
    const channelCache = channelId ? messageCache.get(channelId) : null;
    const cached = channelCache ? channelCache.get(message.id) : null;

    if (cached) {
      entry = { ...cached, deletedAt: Date.now() };
      channelCache.delete(message.id);
    } else {
      // Use whatever partial data is available
      entry = {
        id: message.id,
        content: message.partial ? '[Partial - content unavailable]' : (message.content || ''),
        author: {
          id: message.author?.id || null,
          tag: message.author?.tag || message.author?.username || 'Unknown',
          avatar: message.author?.displayAvatarURL?.({ dynamic: true }) || null,
        },
        channel: {
          id: message.channel?.id || null,
          name: message.channel?.name || 'Unknown',
        },
        guild: message.guild ? {
          id: message.guild.id,
          name: message.guild.name,
        } : null,
        attachments: message.attachments
          ? Array.from(message.attachments.values()).map(a => ({
              name: a.name, url: a.url, size: a.size,
            }))
          : [],
        embeds: message.embeds
          ? message.embeds.map(e => ({
              title: e.title, description: e.description, url: e.url,
            }))
          : [],
        timestamp: message.createdTimestamp || Date.now(),
        deletedAt: Date.now(),
      };
    }

    archive.unshift(entry);
    if (archive.length > MAX_ARCHIVE) archive.pop();

    // Broadcast to dashboard
    if (broadcastFn) {
      broadcastFn({ type: 'archive', data: entry });
    }

    return entry;
  } catch (err) {
    console.error('[archive] archiveDeleted error:', err.message);
    return null;
  }
}

function search(query, filters = {}) {
  try {
    let results = archive;

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(e => (e.content || '').toLowerCase().includes(q));
    }

    if (filters.author) {
      const a = filters.author.toLowerCase();
      results = results.filter(e =>
        (e.author?.tag || '').toLowerCase().includes(a) ||
        e.author?.id === filters.author
      );
    }

    if (filters.channel) {
      results = results.filter(e =>
        e.channel?.id === filters.channel ||
        (e.channel?.name || '').toLowerCase().includes(filters.channel.toLowerCase())
      );
    }

    if (filters.guild) {
      results = results.filter(e =>
        e.guild?.id === filters.guild ||
        (e.guild?.name || '').toLowerCase().includes(filters.guild.toLowerCase())
      );
    }

    return results;
  } catch (err) {
    console.error('[archive] search error:', err.message);
    return [];
  }
}

function getArchive(limit = 50, offset = 0) {
  return archive.slice(offset, offset + limit);
}

function getStats() {
  const byServer = {};
  const byUser = {};

  for (const entry of archive) {
    const serverId = entry.guild?.id || 'DM';
    const serverName = entry.guild?.name || 'DM';
    if (!byServer[serverId]) byServer[serverId] = { name: serverName, count: 0 };
    byServer[serverId].count++;

    const userId = entry.author?.id || 'unknown';
    const userTag = entry.author?.tag || 'Unknown';
    if (!byUser[userId]) byUser[userId] = { tag: userTag, count: 0 };
    byUser[userId].count++;
  }

  return {
    total: archive.length,
    byServer: Object.entries(byServer)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count),
    byUser: Object.entries(byUser)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count),
  };
}

function save() {
  try {
    fs.writeFileSync(ARCHIVE_FILE, JSON.stringify({ archive }, null, 2), 'utf-8');
  } catch (err) {
    console.error('[archive] Failed to save:', err.message);
  }
}

function load() {
  try {
    if (fs.existsSync(ARCHIVE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf-8'));
      if (Array.isArray(raw.archive)) {
        archive = raw.archive;
      }
      console.log('[archive] Loaded', archive.length, 'archived messages');
    }
  } catch (err) {
    console.error('[archive] Failed to load:', err.message);
  }
}

// Load on require, auto-save every 2 min
load();
saveTimer = setInterval(() => save(), 2 * 60 * 1000);

module.exports = {
  cacheMessage,
  archiveDeleted,
  search,
  getArchive,
  getStats,
  save,
  load,
};
