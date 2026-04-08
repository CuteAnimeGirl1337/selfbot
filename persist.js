const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'data.json');

let autoSaveTimer = null;

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[persist] Failed to load data.json:', err.message);
  }
  return {};
}

function save(stats, config, macros, scheduledMessages) {
  try {
    const data = {
      economy: stats.economy || {},
      autoReplies: stats.autoReplies || {},
      spyTargets: stats.spyTargets instanceof Set ? Array.from(stats.spyTargets) : (stats.spyTargets || []),
      reminders: stats.reminders || [],
      prefix: config ? config.prefix : undefined,
      disabledCommands: config && config.disabledCommands instanceof Set
        ? Array.from(config.disabledCommands)
        : (config ? config.disabledCommands : undefined),
      macros: macros || {},
      scheduledMessages: scheduledMessages || [],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[persist] Failed to save data.json:', err.message);
  }
}

function restore(data, stats, config, macrosObj, scheduledArr) {
  if (!data || typeof data !== 'object') return;

  if (data.economy) stats.economy = data.economy;
  if (data.autoReplies) stats.autoReplies = data.autoReplies;
  if (Array.isArray(data.spyTargets)) {
    stats.spyTargets = new Set(data.spyTargets);
  }
  if (Array.isArray(data.reminders)) stats.reminders = data.reminders;

  if (data.prefix !== undefined && config) config.prefix = data.prefix;
  if (Array.isArray(data.disabledCommands) && config) {
    config.disabledCommands = new Set(data.disabledCommands);
  }

  if (data.macros && macrosObj) {
    Object.assign(macrosObj, data.macros);
  }

  if (Array.isArray(data.scheduledMessages) && scheduledArr) {
    scheduledArr.length = 0;
    scheduledArr.push(...data.scheduledMessages);
  }
}

function startAutoSave(statsFn, interval = 60000) {
  if (autoSaveTimer) clearInterval(autoSaveTimer);

  autoSaveTimer = setInterval(() => {
    const { stats, config, macros, scheduledMessages } = statsFn();
    save(stats, config, macros, scheduledMessages);
  }, interval);

  const shutdown = () => {
    console.log('[persist] Saving data before exit...');
    try {
      const data = statsFn();
      save(data.stats, data.config, data.macros, data.scheduledMessages);
    } catch (e) {
      console.error('[persist] Save failed on exit:', e.message);
    }
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { load, save, restore, startAutoSave };
