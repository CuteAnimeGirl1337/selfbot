const fs = require('fs');
const path = require('path');
const { dataPath } = require('./datadir');

const DATA_FILE = dataPath('raidprotect-data.json');

const state = {
  enabled: false,
  protectedGuilds: new Set(),
  thresholds: {
    maxBansPerMinute: 3,
    maxKicksPerMinute: 3,
    maxChannelDeletesPerMinute: 2,
    maxRoleDeletesPerMinute: 2,
  },
  actions: {
    removePermissions: true,
    notifyOwner: true,
    logChannel: null,
  },
  eventLog: [], // { guildId, type, executorId, targetId, time }
};

const MAX_EVENT_LOG = 5000;

const THRESHOLD_MAP = {
  ban: 'maxBansPerMinute',
  kick: 'maxKicksPerMinute',
  channelDelete: 'maxChannelDeletesPerMinute',
  roleDelete: 'maxRoleDeletesPerMinute',
};

function enable(guildId) {
  state.protectedGuilds.add(guildId);
  state.enabled = true;
}

function disable(guildId) {
  state.protectedGuilds.delete(guildId);
  if (state.protectedGuilds.size === 0) {
    state.enabled = false;
  }
}

function isProtected(guildId) {
  return state.enabled && state.protectedGuilds.has(guildId);
}

function checkThreshold(guildId, type) {
  const thresholdKey = THRESHOLD_MAP[type];
  if (!thresholdKey) return false;

  const limit = state.thresholds[thresholdKey];
  const cutoff = Date.now() - 60000;

  const count = state.eventLog.filter(
    (e) => e.guildId === guildId && e.type === type && e.time >= cutoff
  ).length;

  return count >= limit;
}

async function trackEvent(guild, type, executorId, targetId) {
  if (!guild || !isProtected(guild.id)) return;

  const entry = {
    guildId: guild.id,
    type,
    executorId: executorId || 'unknown',
    targetId: targetId || 'unknown',
    time: Date.now(),
  };

  state.eventLog.push(entry);

  // Trim log
  if (state.eventLog.length > MAX_EVENT_LOG) {
    state.eventLog = state.eventLog.slice(-MAX_EVENT_LOG);
  }

  // Try to resolve executor from audit log if not provided
  if (executorId === null || executorId === 'unknown') {
    try {
      const auditLogs = await guild.fetchAuditLogs({ limit: 1 });
      const latestEntry = auditLogs.entries.first();
      if (latestEntry && latestEntry.executor) {
        entry.executorId = latestEntry.executor.id;
      }
    } catch (err) {
      // Audit log access may fail, ignore
    }
  }

  // Check if threshold exceeded
  if (checkThreshold(guild.id, type)) {
    await handleThresholdExceeded(guild, type, entry.executorId);
  }
}

async function handleThresholdExceeded(guild, type, executorId) {
  const msg = `[RaidProtect] Threshold exceeded in ${guild.name} (${guild.id}): ${type} by ${executorId}`;
  console.warn(msg);

  // Log to channel if configured
  if (state.actions.logChannel) {
    try {
      const channel = await guild.client.channels.fetch(state.actions.logChannel);
      if (channel && typeof channel.send === 'function') {
        await channel.send(
          `**[RaidProtect] ALERT**\n` +
          `Guild: **${guild.name}**\n` +
          `Event: \`${type}\` threshold exceeded\n` +
          `Suspected attacker: <@${executorId}> (\`${executorId}\`)\n` +
          `Time: <t:${Math.floor(Date.now() / 1000)}:F>`
        );
      }
    } catch (err) {
      console.error('[raidprotect] Failed to send log:', err.message);
    }
  }

  // Notify guild owner
  if (state.actions.notifyOwner) {
    try {
      const owner = await guild.fetchOwner();
      if (owner) {
        await owner.send(
          `**[RaidProtect] Your server "${guild.name}" is under attack!**\n` +
          `Event type: \`${type}\`\n` +
          `Suspected attacker: <@${executorId}>`
        ).catch(() => {});
      }
    } catch (err) {
      // Owner DMs may be closed
    }
  }

  // Try to remove permissions from attacker
  if (state.actions.removePermissions && executorId && executorId !== 'unknown') {
    try {
      const member = await guild.members.fetch(executorId);
      if (member && member.manageable) {
        const adminRoles = member.roles.cache.filter(
          (r) => r.permissions.has('Administrator') || r.permissions.has('BanMembers') ||
                 r.permissions.has('KickMembers') || r.permissions.has('ManageChannels') ||
                 r.permissions.has('ManageRoles')
        );
        for (const [, role] of adminRoles) {
          try {
            await member.roles.remove(role, '[RaidProtect] Automated permission removal');
          } catch (err) {
            // May lack permissions
          }
        }
        console.log(`[raidprotect] Removed dangerous roles from ${executorId} in ${guild.name}`);
      }
    } catch (err) {
      console.error('[raidprotect] Failed to remove attacker roles:', err.message);
    }
  }
}

function getEventLog(guildId, limit = 50) {
  const filtered = guildId
    ? state.eventLog.filter((e) => e.guildId === guildId)
    : state.eventLog;
  return filtered.slice(-limit);
}

function getState() {
  return {
    enabled: state.enabled,
    protectedGuilds: [...state.protectedGuilds],
    thresholds: { ...state.thresholds },
    actions: { ...state.actions },
    eventLogSize: state.eventLog.length,
  };
}

function setState(key, val) {
  if (key === 'thresholds' && typeof val === 'object') {
    Object.assign(state.thresholds, val);
  } else if (key === 'actions' && typeof val === 'object') {
    Object.assign(state.actions, val);
  } else if (key === 'enabled') {
    state.enabled = Boolean(val);
  } else if (key === 'logChannel') {
    state.actions.logChannel = val || null;
  }
}

function save() {
  try {
    const data = {
      enabled: state.enabled,
      protectedGuilds: [...state.protectedGuilds],
      thresholds: state.thresholds,
      actions: state.actions,
      eventLog: state.eventLog.slice(-1000), // Save last 1000 events
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[raidprotect] Failed to save:', err.message);
  }
}

function load() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);

    if (data.enabled !== undefined) state.enabled = data.enabled;
    if (Array.isArray(data.protectedGuilds)) {
      state.protectedGuilds = new Set(data.protectedGuilds);
    }
    if (data.thresholds) Object.assign(state.thresholds, data.thresholds);
    if (data.actions) Object.assign(state.actions, data.actions);
    if (Array.isArray(data.eventLog)) state.eventLog = data.eventLog;

    console.log(`[raidprotect] Loaded: ${state.protectedGuilds.size} protected guilds, ${state.eventLog.length} events`);
  } catch (err) {
    console.error('[raidprotect] Failed to load:', err.message);
  }
}

module.exports = {
  enable,
  disable,
  isProtected,
  trackEvent,
  checkThreshold,
  getEventLog,
  getState,
  setState,
  save,
  load,
};
