const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, 'plugins');
const plugins = new Map();

function ensurePluginsDir() {
  if (!fs.existsSync(PLUGINS_DIR)) {
    fs.mkdirSync(PLUGINS_DIR, { recursive: true });
  }
}

function loadPlugins() {
  ensurePluginsDir();
  plugins.clear();

  const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const filePath = path.join(PLUGINS_DIR, file);
    try {
      // Clear require cache for hot-reload support
      delete require.cache[require.resolve(filePath)];

      const plugin = require(filePath);
      if (plugin.name && typeof plugin.execute === 'function') {
        plugins.set(plugin.name, {
          name: plugin.name,
          description: plugin.description || 'No description',
          execute: plugin.execute,
          file: file,
        });
        console.log(`[plugins] Loaded: ${plugin.name} (${file})`);
      } else {
        console.warn(`[plugins] Skipped ${file}: missing name or execute function`);
      }
    } catch (err) {
      console.error(`[plugins] Failed to load ${file}:`, err.message);
    }
  }

  console.log(`[plugins] ${plugins.size} plugin(s) loaded`);
  return plugins.size;
}

function getPlugins() {
  const list = [];
  for (const [name, plugin] of plugins) {
    list.push({ name, description: plugin.description, file: plugin.file });
  }
  return list;
}

function reloadPlugins() {
  // Clear all plugin caches
  const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const filePath = path.join(PLUGINS_DIR, file);
    try {
      delete require.cache[require.resolve(filePath)];
    } catch (_) {}
  }
  return loadPlugins();
}

async function executePlugin(name, message, args, client, stats) {
  const plugin = plugins.get(name);
  if (!plugin) {
    return { success: false, error: `Plugin "${name}" not found` };
  }

  try {
    await plugin.execute(message, args, client, stats);
    return { success: true };
  } catch (err) {
    console.error(`[plugins] Error executing ${name}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { loadPlugins, getPlugins, reloadPlugins, executePlugin };
