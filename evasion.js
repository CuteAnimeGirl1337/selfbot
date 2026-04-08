const state = {
  enabled: true,
  randomizeDelay: true,
  maxCommandsPerMinute: 15,
  jitterTyping: true,
  avoidBurst: true,
};

const commandTimestamps = [];
const messageTimestamps = [];

function getState() {
  return { ...state };
}

function setState(key, val) {
  if (!(key in state)) return false;
  state[key] = val;
  return true;
}

function pruneTimestamps(arr) {
  const cutoff = Date.now() - 60000;
  while (arr.length > 0 && arr[0] < cutoff) {
    arr.shift();
  }
}

function canExecute() {
  if (!state.enabled) return true;
  pruneTimestamps(commandTimestamps);
  return commandTimestamps.length < state.maxCommandsPerMinute;
}

function addDelay() {
  if (!state.enabled || !state.randomizeDelay) return Promise.resolve();
  const delay = Math.floor(Math.random() * 701) + 100; // 100-800ms
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function trackCommand() {
  commandTimestamps.push(Date.now());
  pruneTimestamps(commandTimestamps);
}

function trackMessage() {
  messageTimestamps.push(Date.now());
  pruneTimestamps(messageTimestamps);
}

function getStats() {
  pruneTimestamps(commandTimestamps);
  pruneTimestamps(messageTimestamps);
  return {
    commandsLastMinute: commandTimestamps.length,
    messagesLastMinute: messageTimestamps.length,
    isThrottled: commandTimestamps.length >= state.maxCommandsPerMinute,
  };
}

module.exports = { getState, setState, canExecute, addDelay, trackCommand, trackMessage, getStats };
