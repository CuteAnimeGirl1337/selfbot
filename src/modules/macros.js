const macros = {};

function addMacro(name, commandStrings, delay = 500) {
  if (!name || !Array.isArray(commandStrings) || commandStrings.length === 0) {
    return false;
  }
  macros[name] = {
    commands: commandStrings,
    delay: delay,
    createdAt: Date.now(),
  };
  return true;
}

function removeMacro(name) {
  if (macros[name]) {
    delete macros[name];
    return true;
  }
  return false;
}

function getMacros() {
  return { ...macros };
}

async function executeMacro(name, message, config, commandHandler) {
  const macro = macros[name];
  if (!macro) return { success: false, error: 'Macro not found' };

  const prefix = config.prefix || '.';
  const results = [];

  for (let i = 0; i < macro.commands.length; i++) {
    const cmd = macro.commands[i];

    try {
      if (typeof commandHandler === 'function') {
        // Clone the message content with the command
        const fakeContent = prefix + cmd;
        await commandHandler(message, fakeContent);
        results.push({ command: cmd, status: 'ok' });
      } else {
        results.push({ command: cmd, status: 'skipped', reason: 'no handler' });
      }
    } catch (err) {
      results.push({ command: cmd, status: 'error', error: err.message });
    }

    // Wait between commands (except after the last one)
    if (i < macro.commands.length - 1 && macro.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, macro.delay));
    }
  }

  return { success: true, results };
}

module.exports = { macros, addMacro, removeMacro, getMacros, executeMacro };
