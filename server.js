// =============================================================================
// Web Dashboard Server — Express + WebSocket
// =============================================================================
const express = require('express');
const http = require('http');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const path = require('path');
const { client, config, commandList, stats, setBroadcast, log } = require('./bot');

// Lazy-load optional modules (created by backend agent)
let macrosMod, schedulerMod, automodMod, pluginsMod, nitroMod, authMod, persistMod;
try { macrosMod = require('./macros'); } catch { macrosMod = null; }
try { schedulerMod = require('./scheduler'); } catch { schedulerMod = null; }
try { automodMod = require('./automod'); } catch { automodMod = null; }
try { pluginsMod = require('./plugins'); } catch { pluginsMod = null; }
try { nitroMod = require('./nitro'); } catch { nitroMod = null; }
try { authMod = require('./auth'); } catch { authMod = null; }
try { persistMod = require('./persist'); } catch { persistMod = null; }
let trackerMod, alertsMod, analyticsMod, archiveMod;
try { trackerMod = require('./tracker'); } catch { trackerMod = null; }
try { alertsMod = require('./alerts'); } catch { alertsMod = null; }
try { analyticsMod = require('./analytics'); } catch { analyticsMod = null; }
try { archiveMod = require('./archive'); } catch { archiveMod = null; }
const tokenMgr = require('./token');
let accountsMod;
try { accountsMod = require('./accounts'); } catch { accountsMod = null; }
let stealthMod; try { stealthMod = require('./stealth'); } catch { stealthMod = null; }
let protectorMod; try { protectorMod = require('./protector'); } catch { protectorMod = null; }
let evasionMod; try { evasionMod = require('./evasion'); } catch { evasionMod = null; }
let raidprotectMod; try { raidprotectMod = require('./raidprotect'); } catch { raidprotectMod = null; }
let msgloggerMod; try { msgloggerMod = require('./msglogger'); } catch { msgloggerMod = null; }
let clonerMod; try { clonerMod = require('./cloner'); } catch { clonerMod = null; }
let webhookclonerMod; try { webhookclonerMod = require('./webhookcloner'); } catch { webhookclonerMod = null; }

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// Auth middleware (skip for login endpoints and static files)
if (authMod) {
  app.get('/login', authMod.loginHandler);
  app.use('/api', (req, res, next) => {
    // Skip auth for token/login endpoints
    if (req.path.startsWith('/login')) return next();
    return authMod.authMiddleware(req, res, next);
  });
}

app.use(express.static(path.join(__dirname, 'public')));

// =============================================================================
// WebSocket — Live updates
// =============================================================================

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  // Send initial state
  ws.send(JSON.stringify({ type: 'init', data: getFullState() }));
  ws.on('close', () => clients.delete(ws));
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const ws of clients) {
    if (ws.readyState === 1) ws.send(msg);
  }
}

// Give bot.js the broadcast function
setBroadcast(broadcast);

// Push stats every 2 seconds
setInterval(() => {
  broadcast({ type: 'stats', data: getFullState() });
}, 2000);

function getFullState() {
  try {
    const user = client.user;
    return {
      user: user
        ? {
            tag: user.tag,
            id: user.id,
            avatar: user.displayAvatarURL({ size: 128 }),
            status: user.presence?.status || 'offline',
          }
        : null,
      stats: stats.getAll(),
      guilds: client.guilds.cache.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.iconURL({ size: 64 }) || '',
        memberCount: g.memberCount,
        ownerId: g.ownerId,
      })),
      config: {
        prefix: config.prefix,
        afk: config.afk,
        autoDeleteCommands: config.autoDeleteCommands,
        disabledCommands: [...config.disabledCommands],
      },
      commands: commandList.map(([name, desc]) => ({
        name,
        description: desc,
        uses: stats.commandUsage[name] || 0,
        enabled: !config.disabledCommands.has(name),
      })),
    };
  } catch {
    return { user: null, stats: stats.getAll(), guilds: [], config: { prefix: config.prefix, afk: config.afk, autoDeleteCommands: config.autoDeleteCommands, disabledCommands: [] }, commands: [] };
  }
}

// =============================================================================
// REST API
// =============================================================================

app.get('/api/stats', (req, res) => {
  res.json(getFullState());
});

app.get('/api/snipes', (req, res) => {
  res.json(stats.snipes);
});

app.get('/api/editsnipes', (req, res) => {
  res.json(stats.editSnipes);
});

app.get('/api/logs', (req, res) => {
  res.json(stats.logs);
});

app.post('/api/settings', (req, res) => {
  const { prefix, afk, autoDeleteCommands, presence, customStatus } = req.body;
  if (prefix !== undefined) config.prefix = prefix;
  if (afk !== undefined) {
    config.afk = { enabled: afk.enabled, reason: afk.reason || 'AFK', since: Date.now() };
  }
  if (autoDeleteCommands !== undefined) config.autoDeleteCommands = autoDeleteCommands;
  if (presence && client.user) {
    client.user.setStatus(presence);
  }
  if (customStatus !== undefined && client.user) {
    const { CustomStatus } = require('discord.js-selfbot-v13');
    const custom = new CustomStatus(client).setState(customStatus);
    client.user.setPresence({ activities: [custom] });
  }
  log('info', `Settings updated from dashboard`);
  broadcast({ type: 'stats', data: getFullState() });
  res.json({ ok: true });
});

app.post('/api/commands/:name/toggle', (req, res) => {
  const { name } = req.params;
  if (config.disabledCommands.has(name)) {
    config.disabledCommands.delete(name);
  } else {
    config.disabledCommands.add(name);
  }
  log('info', `Command ${name} ${config.disabledCommands.has(name) ? 'disabled' : 'enabled'} from dashboard`);
  broadcast({ type: 'stats', data: getFullState() });
  res.json({ ok: true, enabled: !config.disabledCommands.has(name) });
});

app.post('/api/guilds/:id/leave', async (req, res) => {
  try {
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    await guild.leave();
    log('info', `Left guild ${guild.name} from dashboard`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Spy logs
app.get('/api/spy', (req, res) => {
  res.json(stats.spyLog);
});

app.get('/api/spy/targets', (req, res) => {
  res.json([...stats.spyTargets]);
});

app.post('/api/spy/toggle', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (stats.spyTargets.has(userId)) {
    stats.spyTargets.delete(userId);
  } else {
    stats.spyTargets.add(userId);
  }
  log('info', `Spy ${stats.spyTargets.has(userId) ? 'enabled' : 'disabled'} for ${userId} from dashboard`);
  res.json({ ok: true, active: stats.spyTargets.has(userId) });
});

// Auto-replies
app.get('/api/autoreplies', (req, res) => {
  res.json(stats.autoReplies);
});

app.post('/api/autoreplies', (req, res) => {
  const { userId, reply } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (!reply) {
    delete stats.autoReplies[userId];
  } else {
    stats.autoReplies[userId] = reply;
  }
  log('info', `Auto-reply ${reply ? 'set' : 'removed'} for ${userId} from dashboard`);
  res.json({ ok: true });
});

// Reminders
app.get('/api/reminders', (req, res) => {
  res.json(stats.reminders);
});

// Send DM from dashboard
app.post('/api/dm', async (req, res) => {
  const { userId, message: msg } = req.body;
  if (!userId || !msg) return res.status(400).json({ error: 'userId and message required' });
  try {
    const user = await client.users.fetch(userId);
    await user.send(msg);
    log('info', `DM sent to ${user.tag} from dashboard`);
    res.json({ ok: true, tag: user.tag });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send message to channel from dashboard
app.post('/api/send', async (req, res) => {
  const { channelId, message: msg } = req.body;
  if (!channelId || !msg) return res.status(400).json({ error: 'channelId and message required' });
  try {
    const ch = client.channels.cache.get(channelId);
    if (!ch) return res.status(404).json({ error: 'Channel not found' });
    await ch.send(msg);
    log('info', `Message sent to #${ch.name || channelId} from dashboard`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get DM channels
app.get('/api/dms', (req, res) => {
  const dms = client.channels.cache
    .filter(c => c.type === 'DM')
    .map(c => ({
      id: c.id,
      recipient: c.recipient ? { id: c.recipient.id, tag: c.recipient.tag, avatar: c.recipient.displayAvatarURL({ size: 32 }) } : null,
    }))
    .filter(d => d.recipient);
  res.json(dms);
});

// Get friends list
app.get('/api/friends', (req, res) => {
  try {
    const friends = client.relationships.cache
      .filter(r => r.type === 1)
      .map(r => ({
        id: r.user?.id || r.id,
        tag: r.user?.tag || 'Unknown',
        avatar: r.user?.displayAvatarURL({ size: 32 }) || '',
        status: r.user?.presence?.status || 'offline',
      }));
    res.json(friends);
  } catch {
    res.json([]);
  }
});

// Webhook sender from dashboard
app.post('/api/webhook', async (req, res) => {
  const { channelId, name, avatar, content } = req.body;
  if (!channelId || !content) return res.status(400).json({ error: 'channelId and content required' });
  try {
    const ch = client.channels.cache.get(channelId);
    if (!ch) return res.status(404).json({ error: 'Channel not found' });
    const webhook = await ch.createWebhook(name || 'Dashboard', { avatar: avatar || undefined });
    await webhook.send(content);
    await webhook.delete();
    log('info', `Webhook sent to #${ch.name || channelId} from dashboard`);
    res.json({ ok: true, channel: ch.name || channelId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get channels for a guild
app.get('/api/guilds/:id/channels', (req, res) => {
  const guild = client.guilds.cache.get(req.params.id);
  if (!guild) return res.status(404).json({ error: 'Guild not found' });
  const channels = guild.channels.cache
    .filter(c => ['GUILD_TEXT', 'GUILD_NEWS', 'GUILD_VOICE'].includes(c.type))
    .sort((a, b) => a.position - b.position)
    .map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      topic: c.topic || '',
      parent: c.parent?.name || '',
      position: c.position,
    }));
  res.json(channels);
});

// Account info
app.get('/api/account', (req, res) => {
  const user = client.user;
  if (!user) return res.json(null);
  try {
    const friends = client.relationships?.cache?.filter(r => r.type === 1)?.size || 0;
    const blocked = client.relationships?.cache?.filter(r => r.type === 2)?.size || 0;
    const pending = client.relationships?.cache?.filter(r => r.type === 3 || r.type === 4)?.size || 0;
    res.json({
      tag: user.tag,
      id: user.id,
      avatar: user.displayAvatarURL({ size: 256 }),
      banner: user.bannerURL?.({ size: 512 }) || null,
      createdAt: user.createdTimestamp,
      status: user.presence?.status || 'offline',
      bio: user.bio || '',
      nitro: user.nitroType || 0,
      phone: user.phone ? true : false,
      email: user.email ? true : false,
      mfa: user.mfaEnabled || false,
      friends,
      blocked,
      pending,
      guilds: client.guilds.cache.size,
    });
  } catch (e) {
    res.json({ tag: user.tag, id: user.id, error: e.message });
  }
});

// Export logs
app.get('/api/export/logs', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="logs.json"');
  res.json(stats.logs);
});

app.get('/api/export/snipes', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="snipes.json"');
  res.json(stats.snipes);
});

app.get('/api/export/spy', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="spy.json"');
  res.json(stats.spyLog);
});

// Prefix change from dashboard
app.post('/api/prefix', (req, res) => {
  const { prefix } = req.body;
  if (!prefix) return res.status(400).json({ error: 'prefix required' });
  config.prefix = prefix;
  log('info', `Prefix changed to ${prefix} from dashboard`);
  broadcast({ type: 'stats', data: getFullState() });
  res.json({ ok: true });
});

// Clear snipe logs
app.post('/api/snipes/clear', (req, res) => {
  stats.snipes = [];
  stats.editSnipes = [];
  log('info', 'Snipe logs cleared from dashboard');
  res.json({ ok: true });
});

// Economy / Gambling
app.get('/api/economy', (req, res) => {
  res.json(stats.getEconomyStats());
});

app.get('/api/economy/leaderboard', (req, res) => {
  res.json(stats.getLeaderboard());
});

app.get('/api/economy/players', (req, res) => {
  const players = Object.entries(stats.economy).map(([id, p]) => ({
    id, tag: p.tag, balance: p.balance, bank: p.bank,
    level: p.level, xp: p.xp, wins: p.wins, losses: p.losses,
    biggestWin: p.biggestWin,
  }));
  res.json(players);
});

app.get('/api/economy/log', (req, res) => {
  res.json(stats.gamblingLog);
});

app.post('/api/economy/give', (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount) return res.status(400).json({ error: 'userId and amount required' });
  const p = stats.getPlayer(userId);
  if (!p) return res.status(400).json({ error: 'Player not found' });
  p.balance += parseInt(amount);
  log('info', `Gave ${amount} coins to ${userId} from dashboard`);
  res.json({ ok: true, balance: p.balance });
});

app.post('/api/economy/reset', (req, res) => {
  const { userId } = req.body;
  if (userId) {
    delete stats.economy[userId];
    log('info', `Reset economy for ${userId} from dashboard`);
  } else {
    stats.economy = {};
    log('info', 'Reset all economy from dashboard');
  }
  res.json({ ok: true });
});

// =============================================================================
// Macros API
// =============================================================================
app.get('/api/macros', (req, res) => {
  res.json(macrosMod ? macrosMod.getMacros() : {});
});
app.post('/api/macros', (req, res) => {
  if (!macrosMod) return res.status(501).json({ error: 'Macros module not loaded' });
  const { name, commands, delay } = req.body;
  if (!name || !commands) return res.status(400).json({ error: 'name and commands required' });
  macrosMod.addMacro(name, commands, delay || 500);
  log('info', `Macro "${name}" created from dashboard`);
  res.json({ ok: true });
});
app.delete('/api/macros/:name', (req, res) => {
  if (!macrosMod) return res.status(501).json({});
  macrosMod.removeMacro(req.params.name);
  res.json({ ok: true });
});
app.post('/api/macros/:name/run', async (req, res) => {
  if (!macrosMod) return res.status(501).json({});
  const macro = macrosMod.getMacros()[req.params.name];
  if (!macro) return res.status(404).json({ error: 'Macro not found' });
  // Execute macro commands via sending to first available text channel
  const channelId = req.body.channelId;
  if (channelId) {
    const ch = client.channels.cache.get(channelId);
    if (ch) {
      for (const cmd of macro.commands) {
        await ch.send(config.prefix + cmd).catch(() => null);
        await new Promise(r => setTimeout(r, macro.delay || 500));
      }
    }
  }
  log('info', `Macro "${req.params.name}" executed from dashboard`);
  res.json({ ok: true });
});

// =============================================================================
// Scheduler API
// =============================================================================
app.get('/api/scheduler', (req, res) => {
  res.json(schedulerMod ? schedulerMod.getScheduled() : []);
});
app.post('/api/scheduler', (req, res) => {
  if (!schedulerMod) return res.status(501).json({});
  const { channelId, message, sendAt, recurring } = req.body;
  if (!channelId || !message || !sendAt) return res.status(400).json({ error: 'Missing fields' });
  schedulerMod.addScheduled(channelId, message, sendAt, recurring || null);
  log('info', `Scheduled message for channel ${channelId} from dashboard`);
  res.json({ ok: true });
});
app.delete('/api/scheduler/:id', (req, res) => {
  if (!schedulerMod) return res.status(501).json({});
  schedulerMod.removeScheduled(req.params.id);
  res.json({ ok: true });
});

// =============================================================================
// AutoMod API
// =============================================================================
app.get('/api/automod', (req, res) => {
  res.json(automodMod ? automodMod.getRules() : { bannedWords: [], antiSpam: {}, antiLink: {}, logChannel: null });
});
app.post('/api/automod/words', (req, res) => {
  if (!automodMod) return res.status(501).json({});
  const { word, action } = req.body; // action: 'add' or 'remove'
  if (action === 'remove') automodMod.removeBannedWord(word);
  else automodMod.addBannedWord(word);
  res.json({ ok: true, words: automodMod.getRules().bannedWords });
});
app.post('/api/automod/antispam', (req, res) => {
  if (!automodMod) return res.status(501).json({});
  const { enabled, maxMessages, interval } = req.body;
  automodMod.setAntiSpam(enabled, maxMessages, interval);
  res.json({ ok: true });
});
app.post('/api/automod/antilink', (req, res) => {
  if (!automodMod) return res.status(501).json({});
  const { enabled, whitelist } = req.body;
  automodMod.setAntiLink(enabled, whitelist);
  res.json({ ok: true });
});
app.post('/api/automod/logchannel', (req, res) => {
  if (!automodMod) return res.status(501).json({});
  automodMod.rules.logChannel = req.body.channelId || null;
  res.json({ ok: true });
});

// =============================================================================
// Plugins API
// =============================================================================
app.get('/api/plugins', (req, res) => {
  res.json(pluginsMod ? pluginsMod.getPlugins() : []);
});
app.post('/api/plugins/reload', (req, res) => {
  if (!pluginsMod) return res.status(501).json({});
  pluginsMod.reloadPlugins();
  log('info', 'Plugins reloaded from dashboard');
  res.json({ ok: true, count: pluginsMod.getPlugins().length });
});

// =============================================================================
// Nitro Sniper API
// =============================================================================
app.get('/api/nitro', (req, res) => {
  res.json({
    enabled: nitroMod ? nitroMod.isEnabled() : false,
    claimed: nitroMod ? nitroMod.getClaimed() : [],
  });
});
app.post('/api/nitro/toggle', (req, res) => {
  if (!nitroMod) return res.status(501).json({});
  nitroMod.setEnabled(!nitroMod.isEnabled());
  log('info', `Nitro sniper ${nitroMod.isEnabled() ? 'enabled' : 'disabled'} from dashboard`);
  res.json({ ok: true, enabled: nitroMod.isEnabled() });
});

// =============================================================================
// Backup / Import API
// =============================================================================
app.get('/api/export/all', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="backup.json"');
  res.json({
    economy: stats.economy,
    autoReplies: stats.autoReplies,
    spyTargets: [...stats.spyTargets],
    reminders: stats.reminders,
    config: { prefix: config.prefix, disabledCommands: [...config.disabledCommands] },
    macros: macrosMod ? macrosMod.getMacros() : {},
    scheduled: schedulerMod ? schedulerMod.getScheduled() : [],
    automod: automodMod ? automodMod.getRules() : {},
    exportedAt: Date.now(),
  });
});

app.get('/api/export/economy', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="economy.json"');
  res.json(stats.economy);
});

app.get('/api/export/settings', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="settings.json"');
  res.json({
    prefix: config.prefix,
    disabledCommands: [...config.disabledCommands],
    autoReplies: stats.autoReplies,
    macros: macrosMod ? macrosMod.getMacros() : {},
  });
});

app.post('/api/import', (req, res) => {
  try {
    const data = req.body;
    if (data.economy) stats.economy = data.economy;
    if (data.autoReplies) stats.autoReplies = data.autoReplies;
    if (data.spyTargets) stats.spyTargets = new Set(data.spyTargets);
    if (data.reminders) stats.reminders = data.reminders;
    if (data.config) {
      if (data.config.prefix) config.prefix = data.config.prefix;
      if (data.config.disabledCommands) config.disabledCommands = new Set(data.config.disabledCommands);
    }
    if (data.macros && macrosMod) {
      for (const [name, macro] of Object.entries(data.macros)) {
        macrosMod.addMacro(name, macro.commands, macro.delay);
      }
    }
    log('info', 'Data imported from dashboard');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/backup/guild', async (req, res) => {
  const { guildId } = req.body;
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).json({ error: 'Guild not found' });
  try {
    const backup = {
      name: guild.name,
      id: guild.id,
      icon: guild.iconURL({ size: 256 }),
      roles: guild.roles.cache.map(r => ({ name: r.name, color: r.hexColor, position: r.position, permissions: r.permissions.bitfield.toString(), hoist: r.hoist, mentionable: r.mentionable })),
      channels: guild.channels.cache.map(c => ({ name: c.name, type: c.type, position: c.position, parent: c.parent?.name, topic: c.topic })),
      emojis: guild.emojis.cache.map(e => ({ name: e.name, url: e.url, animated: e.animated })),
      memberCount: guild.memberCount,
      backupAt: Date.now(),
    };
    res.setHeader('Content-Disposition', `attachment; filename="${guild.name}-backup.json"`);
    res.json(backup);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================================
// Auth token info
// =============================================================================
app.get('/api/auth/token', (req, res) => {
  res.json({ token: authMod ? authMod.getToken() : null });
});

// =============================================================================
// Discord Client API — Chat interface
// =============================================================================

app.get('/api/discord/conversations', async (req, res) => {
  try {
    // DMs from cache
    let dms = client.channels.cache
      .filter(c => c.type === 'DM')
      .map(c => ({
        id: c.id,
        type: 'dm',
        name: c.recipient?.tag || 'Unknown',
        avatar: c.recipient?.displayAvatarURL({ size: 64 }) || '',
        recipientId: c.recipient?.id,
        lastMessageId: c.lastMessageId,
      }))
      .filter(d => d.name !== 'Unknown');

    // If cache is empty, load DMs from friends via relationships
    if (dms.length === 0) {
      try {
        const friends = client.relationships?.friendCache;
        if (friends && friends.size > 0) {
          const dmPromises = [];
          for (const [userId, user] of friends) {
            dmPromises.push(
              user.createDM().then(dm => ({
                id: dm.id,
                type: 'dm',
                name: user.tag,
                avatar: user.displayAvatarURL({ size: 64 }),
                recipientId: user.id,
                lastMessageId: dm.lastMessageId,
              })).catch(() => null)
            );
          }
          const results = await Promise.all(dmPromises);
          dms = results.filter(Boolean);
        }
      } catch {}
    }

    // Also try to get group DMs
    const groupDms = client.channels.cache
      .filter(c => c.type === 'GROUP_DM')
      .map(c => ({
        id: c.id,
        type: 'group_dm',
        name: c.name || c.recipients?.map(r => r.tag).join(', ') || 'Group DM',
        avatar: c.iconURL?.({ size: 64 }) || '',
        recipientId: null,
        lastMessageId: c.lastMessageId,
      }));

    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 64 }) || '',
      channels: g.channels.cache
        .filter(c => ['GUILD_TEXT', 'GUILD_NEWS'].includes(c.type))
        .sort((a, b) => a.position - b.position)
        .map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          parent: c.parent?.name || null,
        })),
    }));

    res.json({ dms: [...dms, ...groupDms], guilds });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Open/create a DM channel with a user
app.post('/api/discord/dm/open', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const user = await client.users.fetch(userId);
    const dm = await user.createDM();
    res.json({
      id: dm.id,
      type: 'dm',
      name: user.tag,
      avatar: user.displayAvatarURL({ size: 64 }),
      recipientId: user.id,
      lastMessageId: dm.lastMessageId,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function formatMessage(m) {
  return {
    id: m.id,
    content: m.content,
    author: {
      id: m.author.id,
      tag: m.author.tag,
      avatar: m.author.displayAvatarURL({ size: 64 }),
      bot: m.author.bot,
    },
    timestamp: m.createdTimestamp,
    editedTimestamp: m.editedTimestamp,
    attachments: m.attachments.map(a => ({
      id: a.id, url: a.url, proxyURL: a.proxyURL, name: a.name,
      size: a.size, contentType: a.contentType, width: a.width, height: a.height,
    })),
    embeds: m.embeds.map(e => ({
      title: e.title, description: e.description, url: e.url, color: e.color,
      thumbnail: e.thumbnail?.url, image: e.image?.url, fields: e.fields,
    })),
    reactions: m.reactions.cache.map(r => ({
      emoji: r.emoji.toString(), count: r.count, me: r.me,
    })),
    replyTo: m.reference ? { messageId: m.reference.messageId } : null,
    stickers: m.stickers?.map(s => ({ name: s.name, url: s.url })) || [],
  };
}

app.get('/api/discord/channels/:id/messages', async (req, res) => {
  try {
    const channel = client.channels.cache.get(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const { limit, before } = req.query;
    const messages = await channel.messages.fetch({
      limit: parseInt(limit) || 50,
      before: before || undefined,
    });
    const result = messages.map(m => formatMessage(m)).reverse();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/discord/channels/:id/messages', async (req, res) => {
  try {
    const channel = client.channels.cache.get(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const options = { content: req.body.content };
    if (req.body.replyTo) {
      options.reply = { messageId: req.body.replyTo };
    }
    const sent = await channel.send(options);
    res.json(formatMessage(sent));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/discord/messages/:channelId/:messageId', async (req, res) => {
  try {
    const channel = client.channels.cache.get(req.params.channelId);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const msg = await channel.messages.fetch(req.params.messageId);
    await msg.delete();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/discord/channels/:id/typing', async (req, res) => {
  try {
    const channel = client.channels.cache.get(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    await channel.sendTyping();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/discord/messages/:channelId/:messageId/react', async (req, res) => {
  try {
    const channel = client.channels.cache.get(req.params.channelId);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const msg = await channel.messages.fetch(req.params.messageId);
    await msg.react(req.body.emoji);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/discord/channels/:id/upload', async (req, res) => {
  try {
    const channel = client.channels.cache.get(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const { content, fileName, fileData } = req.body;
    if (!fileName || !fileData) return res.status(400).json({ error: 'fileName and fileData required' });
    const buffer = Buffer.from(fileData, 'base64');
    const { MessageAttachment } = require('discord.js-selfbot-v13');
    const attachment = new MessageAttachment(buffer, fileName);
    const sent = await channel.send({ content: content || '', files: [attachment] });
    res.json(formatMessage(sent));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Discord Client — Real-time WebSocket events
client.on('messageCreate', (message) => {
  broadcast({ type: 'discord-message', data: {
    channelId: message.channel.id,
    message: {
      id: message.id,
      content: message.content,
      author: {
        id: message.author.id, tag: message.author.tag,
        avatar: message.author.displayAvatarURL({ size: 64 }), bot: message.author.bot,
      },
      timestamp: message.createdTimestamp,
      attachments: message.attachments.map(a => ({
        id: a.id, url: a.url, proxyURL: a.proxyURL, name: a.name,
        size: a.size, contentType: a.contentType, width: a.width, height: a.height,
      })),
      embeds: message.embeds.map(e => ({
        title: e.title, description: e.description, color: e.color,
        thumbnail: e.thumbnail?.url, image: e.image?.url,
      })),
      reactions: [],
      replyTo: message.reference ? { messageId: message.reference.messageId } : null,
      stickers: message.stickers?.map(s => ({ name: s.name, url: s.url })) || [],
    },
  }});
});

client.on('messageDelete', (message) => {
  broadcast({ type: 'discord-delete', data: {
    channelId: message.channel.id,
    messageId: message.id,
  }});
});

client.on('messageUpdate', (old, newMsg) => {
  broadcast({ type: 'discord-edit', data: {
    channelId: newMsg.channel.id,
    messageId: newMsg.id,
    content: newMsg.content,
    editedTimestamp: newMsg.editedTimestamp,
  }});
});

// =============================================================================
// Token / Login API — NO auth middleware on these
// =============================================================================

app.get('/api/login/status', (req, res) => {
  const hasToken = tokenMgr.hasToken();
  const loggedIn = !!client.user;
  res.json({
    hasToken,
    loggedIn,
    user: loggedIn ? {
      tag: client.user.tag,
      id: client.user.id,
      avatar: client.user.displayAvatarURL({ size: 128 }),
    } : null,
  });
});

app.post('/api/login', async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string' || token.length < 20) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  // Save token
  tokenMgr.saveToken(token);

  // Try to login
  try {
    // Destroy existing connection if any
    if (client.user) {
      client.destroy();
    }
    await client.login(token);
    log('info', `Logged in as ${client.user.tag} via dashboard`);
    res.json({
      ok: true,
      user: {
        tag: client.user.tag,
        id: client.user.id,
        avatar: client.user.displayAvatarURL({ size: 128 }),
      },
    });
  } catch (e) {
    tokenMgr.clearToken();
    res.status(401).json({ error: `Login failed: ${e.message}` });
  }
});

app.post('/api/logout', (req, res) => {
  tokenMgr.clearToken();
  try { client.destroy(); } catch {}
  console.log('[INFO] Logged out via dashboard');
  res.json({ ok: true });
});

// =============================================================================
// User Tracker API
// =============================================================================
app.get('/api/tracker/users', (req, res) => {
  if (!trackerMod) return res.json([]);
  const tracked = trackerMod.getTracked();
  const sessions = trackerMod.getSessions();
  const users = [...tracked].map(id => {
    const user = client.users?.cache?.get(id);
    const sess = sessions[id] || {};
    return {
      id,
      tag: user?.tag || sess.tag || id,
      avatar: user?.displayAvatarURL?.({ size: 64 }) || '',
      status: user?.presence?.status || 'offline',
      lastSeen: sess.lastSeen || null,
      onlineSince: sess.onlineSince || null,
      totalOnline: sess.totalOnline || 0,
    };
  });
  res.json(users);
});

app.get('/api/tracker/history', (req, res) => {
  if (!trackerMod) return res.json([]);
  const limit = parseInt(req.query.limit) || 50;
  const userId = req.query.userId;
  res.json(userId ? trackerMod.getHistory(userId, limit) : trackerMod.getAllHistory(limit));
});

app.post('/api/tracker/add', (req, res) => {
  if (!trackerMod) return res.status(501).json({ error: 'Tracker not loaded' });
  trackerMod.addUser(req.body.userId);
  res.json({ ok: true });
});

app.post('/api/tracker/remove', (req, res) => {
  if (!trackerMod) return res.status(501).json({});
  trackerMod.removeUser(req.body.userId);
  res.json({ ok: true });
});

// =============================================================================
// Keyword Alerts API
// =============================================================================
app.get('/api/alerts', (req, res) => {
  res.json(alertsMod ? alertsMod.getKeywords() : []);
});

app.post('/api/alerts', (req, res) => {
  if (!alertsMod) return res.status(501).json({});
  alertsMod.addKeyword(req.body);
  res.json({ ok: true });
});

app.delete('/api/alerts/:id', (req, res) => {
  if (!alertsMod) return res.status(501).json({});
  alertsMod.removeKeyword(req.params.id);
  res.json({ ok: true });
});

app.get('/api/alerts/log', (req, res) => {
  res.json(alertsMod ? alertsMod.getAlertLog(parseInt(req.query.limit) || 50) : []);
});

// =============================================================================
// Analytics API
// =============================================================================
app.get('/api/analytics', (req, res) => {
  res.json(analyticsMod ? analyticsMod.getAnalytics() : {
    hourlyMessages: new Array(24).fill(0), dailyMessages: {}, perServer: {},
    perChannel: {}, perUser: {}, wordFreq: {}, totalSent: 0, totalReceived: 0,
  });
});

// =============================================================================
// Deleted Message Archive API
// =============================================================================
app.get('/api/archive', (req, res) => {
  if (!archiveMod) return res.json([]);
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  res.json(archiveMod.getArchive(limit, offset));
});

app.post('/api/archive/search', (req, res) => {
  if (!archiveMod) return res.json([]);
  res.json(archiveMod.search(req.body.query, req.body));
});

app.get('/api/archive/stats', (req, res) => {
  res.json(archiveMod ? archiveMod.getStats() : { total: 0 });
});

app.get('/api/export/archive', (req, res) => {
  if (!archiveMod) return res.json([]);
  res.setHeader('Content-Disposition', 'attachment; filename="archive.json"');
  res.json(archiveMod.getArchive(5000, 0));
});

// =============================================================================
// Member Export API
// =============================================================================
app.get('/api/guilds/:id/members', async (req, res) => {
  try {
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const members = await guild.members.fetch().catch(() => guild.members.cache);
    const list = members.map(m => ({
      id: m.id,
      tag: m.user.tag,
      nickname: m.nickname,
      joinedAt: m.joinedTimestamp,
      createdAt: m.user.createdTimestamp,
      roles: m.roles.cache.filter(r => r.id !== guild.id).map(r => r.name),
      bot: m.user.bot,
      status: m.presence?.status || 'offline',
    }));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/guilds/:id/members/export', async (req, res) => {
  try {
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const members = await guild.members.fetch().catch(() => guild.members.cache);
    const csv = ['ID,Tag,Nickname,Joined,Created,Roles,Bot,Status'];
    members.forEach(m => {
      csv.push(`${m.id},"${m.user.tag}","${m.nickname || ''}",${m.joinedAt?.toISOString() || ''},${m.user.createdAt.toISOString()},"${m.roles.cache.filter(r => r.id !== guild.id).map(r => r.name).join(';')}",${m.user.bot},${m.presence?.status || 'offline'}`);
    });
    res.setHeader('Content-Disposition', `attachment; filename="${guild.name}-members.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv.join('\n'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================================
// Command Runner
// =============================================================================
app.post('/api/commands/run', async (req, res) => {
  const { command: rawCmd, channelId } = req.body;
  if (!rawCmd) return res.status(400).json({ error: 'command required' });
  if (!client.user) return res.status(503).json({ error: 'Bot not logged in' });
  const cmdText = rawCmd.startsWith(config.prefix) ? rawCmd : config.prefix + rawCmd;
  const responses = [];

  if (channelId) {
    try {
      const ch = client.channels.cache.get(channelId);
      if (!ch) return res.status(404).json({ error: 'Channel not found' });
      await ch.send(cmdText);
      await new Promise(r => setTimeout(r, 2000));
      const msgs = await ch.messages.fetch({ limit: 5 });
      msgs.filter(m => m.author.id === client.user.id && m.content !== cmdText).first(3)
        .forEach(m => responses.push({ content: m.content, timestamp: m.createdTimestamp }));
      return res.json({ ok: true, mode: 'channel', responses });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  const args = cmdText.slice(config.prefix.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();
  const cmds = {
    ping: () => `Pong! 🏓 Dashboard execution`,
    uptime: () => { const ms=client.uptime||0; return `Uptime: **${Math.floor(ms/864e5)}d ${Math.floor(ms/36e5)%24}h ${Math.floor(ms/6e4)%60}m**`; },
    guilds: () => `**Servers (${client.guilds.cache.size}):**\n${client.guilds.cache.sort((a,b)=>b.memberCount-a.memberCount).map(g=>`${g.name} — ${g.memberCount}`).slice(0,25).join('\n')}`,
    info: () => { const m=process.memoryUsage(); return `**Bot Info**\nNode: ${process.version}\nMemory: ${(m.heapUsed/1048576).toFixed(1)}MB\nGuilds: ${client.guilds.cache.size}\nCommands: ${commandList.length}\nMessages: ${stats.messagesSeen}\nMsg/min: ${stats.getMsgRate()}`; },
    help: () => { const p=Math.max(1,Math.min(parseInt(args[0])||1,Math.ceil(commandList.length/15))); return `**Commands (${p}/${Math.ceil(commandList.length/15)}) — ${commandList.length} total:**\n${commandList.slice((p-1)*15,p*15).map(([c,d])=>`\`${config.prefix}${c}\` — ${d}`).join('\n')}`; },
    bal: () => { const p=stats.getPlayer(client.user.id,client.user.tag); return `💰 **Balance:** ${p.balance.toLocaleString()} | **Bank:** ${p.bank.toLocaleString()} | **Level:** ${p.level} | **XP:** ${p.xp}/${p.level*100}`; },
    balance: () => cmds.bal(),
    lb: () => cmds.leaderboard(),
    leaderboard: () => { const lb=stats.getLeaderboard(); return lb.length ? '**Leaderboard:**\n'+lb.map((e,i)=>`${i+1}. ${e.tag} — ${e.total.toLocaleString()}`).join('\n') : 'No players.'; },
    '8ball': () => `🎱 ${['Yes.','No.','Maybe.','Absolutely.','Definitely not.','Ask again later.','Without a doubt.','Most likely.'][Math.floor(Math.random()*8)]}`,
    coinflip: () => Math.random()<.5 ? '🪙 **Heads!**' : '🪙 **Tails!**',
    roll: () => { const m=(args[0]||'1d6').match(/^(\d+)?d(\d+)$/i); if(!m) return 'Format: 2d6'; const n=Math.min(parseInt(m[1]||1),20),s=Math.min(parseInt(m[2]),1000); const r=Array.from({length:n},()=>Math.floor(Math.random()*s)+1); return `🎲 ${r.join(' + ')} = **${r.reduce((a,b)=>a+b,0)}**`; },
    choose: () => { const o=args.join(' ').split('|').map(s=>s.trim()).filter(Boolean); return o.length<2?'Use | to separate':'I choose: **'+o[Math.floor(Math.random()*o.length)]+'**'; },
    rate: () => { const t=args.join(' ')||'that'; const r=Math.floor(Math.random()*11); return `I rate **${t}**: ${'█'.repeat(r)}${'░'.repeat(10-r)} **${r}/10**`; },
    daily: () => { const p=stats.getPlayer(client.user.id,client.user.tag),now=Date.now(); if(p.daily&&now-p.daily<864e5) return '⏳ Already claimed.'; const r=Math.floor(Math.random()*1501)+500; p.balance+=r; p.daily=now; return `🪙 **+${r}** coins! Balance: **${p.balance.toLocaleString()}**`; },
    work: () => { const p=stats.getPlayer(client.user.id,client.user.tag),now=Date.now(); if(p.worked&&now-p.worked<18e5) return '⏳ Work later.'; const j=['programmer','chef','driver','teacher','artist','miner'][Math.floor(Math.random()*6)],r=Math.floor(Math.random()*401)+100; p.balance+=r; p.worked=now; return `💼 **${j}**: **+${r}** coins! Balance: **${p.balance.toLocaleString()}**`; },
    reverse: () => args.join(' ').split('').reverse().join(''),
    upper: () => args.join(' ').toUpperCase(),
    lower: () => args.join(' ').toLowerCase(),
    mock: () => args.join(' ').split('').map((c,i)=>i%2?c.toUpperCase():c.toLowerCase()).join(''),
    base64: () => Buffer.from(args.join(' ')).toString('base64'),
    debase64: () => { try { return Buffer.from(args.join(' '),'base64').toString('utf-8'); } catch { return 'Invalid base64'; } },
    length: () => `**${args.join(' ').length}** characters`,
    color: () => { const c='#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'); return `🎨 **${c}**`; },
    // Fun commands
    fortune: () => { const f=['A surprise awaits you.','Good things come to those who wait.','Today is your lucky day.','Be careful what you wish for.','Adventure is just around the corner.','A friend will bring you good news.','Your patience will be rewarded.','Expect the unexpected.','Success is in your future.','Take a chance today.']; return `🥠 ${f[Math.floor(Math.random()*f.length)]}`; },
    trivia: () => { const q=[{q:'What planet is closest to the sun?',a:'Mercury'},{q:'How many bones in the human body?',a:'206'},{q:'What is the hardest natural substance?',a:'Diamond'},{q:'What year did the Titanic sink?',a:'1912'},{q:'What is the smallest country?',a:'Vatican City'}]; const t=q[Math.floor(Math.random()*q.length)]; return `❓ **${t.q}**\n||${t.a}||`; },
    riddle: () => { const r=['I have cities but no houses. What am I? ||A map||','What has hands but can\'t clap? ||A clock||','What has a head and tail but no body? ||A coin||','What gets wetter the more it dries? ||A towel||']; return `🧩 ${r[Math.floor(Math.random()*r.length)]}`; },
    wyr: () => { const w=['Would you rather fly or be invisible?','Would you rather live in the past or the future?','Would you rather always be hot or always be cold?','Would you rather have unlimited money or unlimited knowledge?']; return `🤔 ${w[Math.floor(Math.random()*w.length)]}`; },
    truth: () => { const t=['What is your biggest fear?','What is the most embarrassing thing you\'ve done?','What is your biggest secret?','Who was your first crush?','What is the worst lie you\'ve told?']; return `🔮 ${t[Math.floor(Math.random()*t.length)]}`; },
    dare: () => { const d=['Send a message to your crush.','Change your pfp to something random for 1 hour.','Let someone send a message from your account.','Post an embarrassing photo.']; return `🎯 ${d[Math.floor(Math.random()*d.length)]}`; },
    pickup: () => { const p=['Are you a magician? Because whenever I look at you, everyone else disappears.','Do you have a map? I just got lost in your eyes.','Is your name Google? Because you have everything I\'ve been searching for.']; return `💘 ${p[Math.floor(Math.random()*p.length)]}`; },
    shower: () => { const s=['If you clean a vacuum cleaner, you become a vacuum cleaner.','The word "swims" is still "swims" upside down.','Every time you clean something, you make something else dirty.','At some point, your parents put you down and never picked you up again.']; return `🚿 ${s[Math.floor(Math.random()*s.length)]}`; },
    haiku: () => { const h=['Cherry blossoms fall\nWhispers of the ancient wind\nSpring awakens now','Silent moonlit night\nStars reflect upon the lake\nPeace fills every breath','Morning coffee steam\nRises like a gentle ghost\nNew day has begun']; return h[Math.floor(Math.random()*h.length)]; },
    achievement: () => `\`\`\`\n╔══════════════════════╗\n║ 🏆 Achievement Get!  ║\n║  ${(args.join(' ')||'Being awesome').slice(0,20).padEnd(20)} ║\n╚══════════════════════╝\n\`\`\``,
    'russian-roulette': () => Math.random()<1/6 ? '💥 **BANG!** You died.' : '🔫 *click* You survived.',
    dicewar: () => { const y=Math.floor(Math.random()*6)+1,b=Math.floor(Math.random()*6)+1; return `🎲 You: **${y}** vs Bot: **${b}** — ${y>b?'**You win!**':y<b?'**Bot wins!**':'**Tie!**'}`; },
    lottery: () => { const pick=()=>Math.floor(Math.random()*50)+1; const yours=args.slice(0,5).map(Number).filter(n=>n>0&&n<=50); const winning=Array.from({length:5},pick); if(yours.length<5) return 'Pick 5 numbers 1-50: `lottery 3 17 22 38 45`'; const matches=yours.filter(n=>winning.includes(n)).length; return `🎰 Your: ${yours.join(' ')} | Winning: ${winning.join(' ')} | **${matches} match${matches!==1?'es':''}!**`; },
    // Text transforms
    binary: () => args.join(' ').split('').map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' '),
    hextext: () => args.join(' ').split('').map(c=>c.charCodeAt(0).toString(16)).join(' '),
    rot13: () => args.join(' ').replace(/[a-zA-Z]/g,c=>{const b=c<='Z'?65:97;return String.fromCharCode((c.charCodeAt(0)-b+13)%26+b)}),
    morse: () => { const m={a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'}; return args.join(' ').toLowerCase().split('').map(c=>m[c]||c).join(' '); },
    pig: () => args.join(' ').split(' ').map(w=>/^[aeiou]/i.test(w)?w+'yay':w.replace(/^([^aeiou]+)(.*)/i,'$2$1ay')).join(' '),
    stutter: () => args.join(' ').split(' ').map(w=>w[0]+'-'+w).join(' '),
    boxtext: () => { const t=args.join(' '); const w=t.length+2; return `\`\`\`\n╔${'═'.repeat(w)}╗\n║ ${t} ║\n╚${'═'.repeat(w)}╝\n\`\`\``; },
    // Utility
    snowflake: () => { const id=args[0]||'0'; try { const ts=Number(BigInt(id)>>22n)/1000+1420070400; return `**${id}** created: <t:${Math.floor(ts)}:F>`; } catch { return 'Invalid ID'; } },
    memory: () => { const m=process.memoryUsage(); return `**Memory:** Heap ${(m.heapUsed/1048576).toFixed(1)}MB / ${(m.heapTotal/1048576).toFixed(1)}MB | RSS ${(m.rss/1048576).toFixed(1)}MB`; },
    system: () => `**System:** ${process.platform} ${process.arch} | Node ${process.version} | PID ${process.pid}`,
    servercount: () => `**Total members:** ${client.guilds.cache.reduce((s,g)=>s+g.memberCount,0).toLocaleString()} across ${client.guilds.cache.size} servers`,
    channelcount: () => `**Total channels:** ${client.channels.cache.size}`,
    emojicount: () => `**Total emojis:** ${client.guilds.cache.reduce((s,g)=>s+g.emojis.cache.size,0)}`,
  };

  if (cmds[cmdName]) {
    const result = cmds[cmdName]();
    responses.push({ content: result, timestamp: Date.now() });
    stats.incCommand(cmdName);
    broadcast({ type: 'command', data: { name: cmdName, args: args.join(' '), user: 'Dashboard', channel: 'terminal', guild: 'Dashboard', time: Date.now() } });
    broadcast({ type: 'response', data: { command: cmdName, response: result.slice(0,500), user: 'Dashboard', channel: 'terminal', guild: 'Dashboard', time: Date.now() } });
  } else {
    responses.push({ content: `\`${cmdName}\` needs a channel to run. Select one below, or use commands like: ping, help, bal, daily, work, roll, 8ball, coinflip, choose, rate, reverse, upper, lower, mock, base64, color`, timestamp: Date.now(), isError: true });
  }
  res.json({ ok: true, mode: 'virtual', responses });
});

app.get('/api/commands/channels', (req, res) => {
  const channels = [];
  client.guilds?.cache?.forEach(g => {
    g.channels.cache.filter(c => c.type === 'GUILD_TEXT').sort((a,b) => a.position-b.position)
      .forEach(c => channels.push({ id: c.id, name: `#${c.name}`, guild: g.name }));
  });
  client.channels?.cache?.filter(c => c.type === 'DM' && c.recipient)
    .forEach(c => channels.push({ id: c.id, name: c.recipient.tag, guild: 'DMs' }));
  res.json(channels);
});

// ========== Multi-Account API ==========

app.get('/api/accounts', (req, res) => {
  if (!accountsMod) return res.status(500).json({ error: 'Accounts module not loaded' });
  res.json(accountsMod.getAccounts());
});

app.post('/api/accounts', (req, res) => {
  if (!accountsMod) return res.status(500).json({ error: 'Accounts module not loaded' });
  const { name, token } = req.body || {};
  if (!name || !token) return res.status(400).json({ error: 'name and token required' });
  accountsMod.addAccount(name, token);
  res.json({ ok: true });
});

app.delete('/api/accounts/:name', (req, res) => {
  if (!accountsMod) return res.status(500).json({ error: 'Accounts module not loaded' });
  accountsMod.removeAccount(req.params.name);
  res.json({ ok: true });
});

app.post('/api/accounts/:name/switch', async (req, res) => {
  if (!accountsMod) return res.status(500).json({ error: 'Accounts module not loaded' });
  const fullToken = accountsMod.getFullToken(req.params.name);
  if (!fullToken) return res.status(404).json({ error: 'Account not found' });
  try {
    client.destroy();
    tokenMgr.saveToken(fullToken);
    await client.login(fullToken);
    res.json({ ok: true, user: client.user?.tag || 'unknown' });
  } catch (e) {
    res.status(500).json({ error: `Switch failed: ${e.message}` });
  }
});

// ========== Stealth API ==========
app.get('/api/stealth', (req, res) => {
  if (!stealthMod) return res.status(500).json({ error: 'Stealth module not loaded' });
  res.json(stealthMod.getState());
});
app.post('/api/stealth', (req, res) => {
  if (!stealthMod) return res.status(500).json({ error: 'Stealth module not loaded' });
  const { key, value } = req.body;
  stealthMod.setState(key, value);
  res.json(stealthMod.getState());
});

// ========== Token Protector API ==========
app.get('/api/protector', (req, res) => {
  if (!protectorMod) return res.status(500).json({ error: 'Protector module not loaded' });
  res.json({ state: protectorMod.getState(), alerts: protectorMod.getAlerts() });
});
app.post('/api/protector', (req, res) => {
  if (!protectorMod) return res.status(500).json({ error: 'Protector module not loaded' });
  const { key, value } = req.body;
  protectorMod.setState(key, value);
  res.json(protectorMod.getState());
});

// ========== Evasion API ==========
app.get('/api/evasion', (req, res) => {
  if (!evasionMod) return res.status(500).json({ error: 'Evasion module not loaded' });
  res.json({ state: evasionMod.getState(), stats: evasionMod.getStats() });
});
app.post('/api/evasion', (req, res) => {
  if (!evasionMod) return res.status(500).json({ error: 'Evasion module not loaded' });
  const { key, value } = req.body;
  evasionMod.setState(key, value);
  res.json(evasionMod.getState());
});

// ========== Raid Protection API ==========
app.get('/api/raidprotect', (req, res) => {
  if (!raidprotectMod) return res.status(500).json({ error: 'Raid protection module not loaded' });
  res.json(raidprotectMod.getState());
});
app.post('/api/raidprotect/toggle', (req, res) => {
  if (!raidprotectMod) return res.status(500).json({ error: 'Raid protection module not loaded' });
  const { guildId } = req.body;
  if (!guildId) return res.status(400).json({ error: 'guildId required' });
  if (raidprotectMod.isProtected(guildId)) { raidprotectMod.disable(guildId); }
  else { raidprotectMod.enable(guildId); }
  res.json({ protected: raidprotectMod.isProtected(guildId) });
});
app.get('/api/raidprotect/events', (req, res) => {
  if (!raidprotectMod) return res.status(500).json({ error: 'Raid protection module not loaded' });
  const guildId = req.query.guildId;
  const limit = parseInt(req.query.limit) || 20;
  if (!guildId) return res.status(400).json({ error: 'guildId required' });
  res.json(raidprotectMod.getEventLog(guildId, limit));
});

// ========== Message Logger API ==========
app.get('/api/msglogger', (req, res) => {
  if (!msgloggerMod) return res.status(500).json({ error: 'Message logger module not loaded' });
  res.json({ state: msgloggerMod.getState(), stats: msgloggerMod.getStats() });
});
app.post('/api/msglogger/toggle', (req, res) => {
  if (!msgloggerMod) return res.status(500).json({ error: 'Message logger module not loaded' });
  const { guildId, channelId } = req.body;
  if (channelId) {
    msgloggerMod.enableChannel(channelId);
    res.json({ ok: true, channelId });
  } else if (guildId) {
    if (msgloggerMod.isLogging(guildId)) { msgloggerMod.disableGuild(guildId); }
    else { msgloggerMod.enableGuild(guildId); }
    res.json({ ok: true, logging: msgloggerMod.isLogging(guildId) });
  } else {
    res.status(400).json({ error: 'guildId or channelId required' });
  }
});
app.post('/api/msglogger/search', (req, res) => {
  if (!msgloggerMod) return res.status(500).json({ error: 'Message logger module not loaded' });
  const { query, authorId, guildId, limit } = req.body;
  res.json(msgloggerMod.search(query, { authorId, guildId, limit: limit || 50 }));
});
app.get('/api/msglogger/messages', (req, res) => {
  if (!msgloggerMod) return res.status(500).json({ error: 'Message logger module not loaded' });
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  res.json(msgloggerMod.getMessages(limit, offset));
});

// ========== Server Cloner API ==========
app.post('/api/cloner/clone', async (req, res) => {
  if (!clonerMod) return res.status(500).json({ error: 'Cloner module not loaded' });
  const { sourceGuildId, targetGuildId, options } = req.body;
  if (!sourceGuildId || !targetGuildId) return res.status(400).json({ error: 'sourceGuildId and targetGuildId required' });
  const source = client.guilds.cache.get(sourceGuildId);
  const target = client.guilds.cache.get(targetGuildId);
  if (!source) return res.status(404).json({ error: 'Source server not found' });
  if (!target) return res.status(404).json({ error: 'Target server not found' });
  try {
    const result = await clonerMod.cloneServer(source, target, options || {});
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/cloner/export', async (req, res) => {
  if (!clonerMod) return res.status(500).json({ error: 'Cloner module not loaded' });
  const { guildId } = req.body;
  if (!guildId) return res.status(400).json({ error: 'guildId required' });
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).json({ error: 'Server not found' });
  try {
    const data = await clonerMod.exportServer(guild);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ========== Webhook Cloner API ==========
app.post('/api/webhookcloner/sendas', async (req, res) => {
  if (!webhookclonerMod) return res.status(500).json({ error: 'Webhook cloner module not loaded' });
  const { channelId, userId, content } = req.body;
  if (!channelId || !userId || !content) return res.status(400).json({ error: 'channelId, userId, and content required' });
  const channel = client.channels.cache.get(channelId);
  if (!channel) return res.status(404).json({ error: 'Channel not found' });
  const user = client.users.cache.get(userId) || await client.users.fetch(userId).catch(() => null);
  if (!user) return res.status(404).json({ error: 'User not found' });
  try {
    await webhookclonerMod.sendAs(channel, user, content);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function startServer(port) {
  // Initialize optional modules
  if (pluginsMod) pluginsMod.loadPlugins();
  if (schedulerMod) schedulerMod.startScheduler(client);
  if (persistMod) {
    const data = persistMod.load();
    if (data) {
      if (data.economy) stats.economy = data.economy;
      if (data.autoReplies) stats.autoReplies = data.autoReplies;
      if (data.spyTargets) stats.spyTargets = new Set(data.spyTargets);
      if (data.reminders) stats.reminders = data.reminders;
      if (data.config?.prefix) config.prefix = data.config.prefix;
      if (data.config?.disabledCommands) config.disabledCommands = new Set(data.config.disabledCommands);
      if (data.macros && macrosMod) {
        for (const [name, m] of Object.entries(data.macros)) macrosMod.addMacro(name, m.commands, m.delay);
      }
      if (data.scheduled && schedulerMod) {
        for (const s of data.scheduled) schedulerMod.addScheduled(s.channelId, s.message, s.sendAt, s.recurring);
      }
      if (data.automod && automodMod) {
        if (data.automod.bannedWords) automodMod.rules.bannedWords = data.automod.bannedWords;
        if (data.automod.antiSpam) automodMod.rules.antiSpam = data.automod.antiSpam;
        if (data.automod.antiLink) automodMod.rules.antiLink = data.automod.antiLink;
        if (data.automod.logChannel) automodMod.rules.logChannel = data.automod.logChannel;
      }
      log('info', 'Data loaded from disk');
    }
    persistMod.startAutoSave(() => ({
      stats,
      config,
      macros: macrosMod ? macrosMod.getMacros() : {},
      scheduledMessages: schedulerMod ? schedulerMod.getScheduled() : [],
    }), 60000);
  }

  // Initialize new modules
  if (trackerMod) {
    trackerMod.load();
    trackerMod.startTracking(client, broadcast);
    log('info', `Tracker loaded (${trackerMod.getTracked().length} users)`);
  }
  if (alertsMod) {
    alertsMod.load();
    log('info', `Alerts loaded (${alertsMod.getKeywords().length} keywords)`);
  }
  if (analyticsMod) {
    analyticsMod.load();
    log('info', 'Analytics loaded');
  }
  if (archiveMod) {
    archiveMod.load();
    log('info', `Archive loaded (${archiveMod.getStats().total} messages)`);
  }

  // Hook new modules into message events
  client.on('messageCreate', (message) => {
    if (analyticsMod) analyticsMod.trackMessage(message);
    if (archiveMod) archiveMod.cacheMessage(message);
    if (alertsMod && message.author?.id !== client.user?.id) {
      alertsMod.checkMessage(message, client, broadcast);
    }
  });

  client.on('messageDelete', (message) => {
    if (archiveMod) archiveMod.archiveDeleted(message, broadcast);
  });

  // Token protector
  if (protectorMod) {
    client.on('messageCreate', (msg) => {
      if (msg.author.id === client.user?.id) return;
      const result = protectorMod.checkMessage(msg);
      if (result?.suspicious) {
        broadcast({ type: 'protector-alert', data: { from: msg.author.tag, reason: result.reason, channel: msg.channel.name, time: Date.now() } });
        log('warn', `Token protector: ${result.reason} from ${msg.author.tag}`);
      }
    });
  }

  // Raid protection
  if (raidprotectMod) {
    client.on('guildBanAdd', (ban) => { if (raidprotectMod.isProtected(ban.guild.id)) raidprotectMod.trackEvent(ban.guild, 'ban', null, ban.user.id); });
    client.on('channelDelete', (ch) => { if (ch.guild && raidprotectMod.isProtected(ch.guild.id)) raidprotectMod.trackEvent(ch.guild, 'channelDelete', null, ch.id); });
    client.on('roleDelete', (role) => { if (role.guild && raidprotectMod.isProtected(role.guild.id)) raidprotectMod.trackEvent(role.guild, 'roleDelete', null, role.id); });
  }

  // Message logger
  if (msgloggerMod) {
    client.on('messageCreate', (msg) => { msgloggerMod.logMessage(msg); });
  }

  // Periodic save for new modules
  setInterval(() => {
    if (trackerMod) trackerMod.save();
    if (alertsMod) alertsMod.save();
    if (analyticsMod) analyticsMod.save();
    if (archiveMod) archiveMod.save();
    if (msgloggerMod && msgloggerMod.save) msgloggerMod.save();
    if (raidprotectMod && raidprotectMod.save) raidprotectMod.save();
    if (protectorMod && protectorMod.save) protectorMod.save();
    if (evasionMod && evasionMod.save) evasionMod.save();
    if (stealthMod && stealthMod.save) stealthMod.save();
  }, 120000);

  if (authMod) log('info', `Dashboard auth token: ${authMod.getToken()}`);

  server.listen(port, () => {
    log('info', `Dashboard running at http://localhost:${port}`);
  });
}

module.exports = { startServer };
