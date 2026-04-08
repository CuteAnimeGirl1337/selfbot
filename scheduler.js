let idCounter = 1;
const scheduled = [];
let schedulerTimer = null;

function addScheduled(channelId, message, sendAt, recurring = null) {
  const entry = {
    id: idCounter++,
    channelId,
    message,
    sendAt: typeof sendAt === 'number' ? sendAt : new Date(sendAt).getTime(),
    recurring,
    createdAt: Date.now(),
  };
  scheduled.push(entry);
  return entry;
}

function removeScheduled(id) {
  const idx = scheduled.findIndex(s => s.id === id);
  if (idx !== -1) {
    scheduled.splice(idx, 1);
    return true;
  }
  return false;
}

function getScheduled() {
  return [...scheduled];
}

function getRecurringInterval(recurring) {
  if (typeof recurring === 'number') return recurring;
  if (recurring === 'hourly') return 60 * 60 * 1000;
  if (recurring === 'daily') return 24 * 60 * 60 * 1000;
  return null;
}

function startScheduler(client) {
  if (schedulerTimer) clearInterval(schedulerTimer);

  // Restore idCounter based on existing entries
  if (scheduled.length > 0) {
    const maxId = Math.max(...scheduled.map(s => s.id));
    if (maxId >= idCounter) idCounter = maxId + 1;
  }

  schedulerTimer = setInterval(async () => {
    const now = Date.now();
    const due = scheduled.filter(s => s.sendAt <= now);

    for (const entry of due) {
      try {
        const channel = await client.channels.fetch(entry.channelId);
        if (channel && channel.isText && channel.isText()) {
          await channel.send(entry.message);
        } else if (channel && typeof channel.send === 'function') {
          await channel.send(entry.message);
        } else {
          console.error(`[scheduler] Channel ${entry.channelId} not found or not a text channel`);
        }
      } catch (err) {
        console.error(`[scheduler] Failed to send scheduled message ${entry.id}:`, err.message);
      }

      const interval = getRecurringInterval(entry.recurring);
      if (interval) {
        // Reschedule
        entry.sendAt = now + interval;
      } else {
        // Remove one-time message
        const idx = scheduled.findIndex(s => s.id === entry.id);
        if (idx !== -1) scheduled.splice(idx, 1);
      }
    }
  }, 10000);

  console.log('[scheduler] Started (checking every 10s)');
}

module.exports = { scheduled, addScheduled, removeScheduled, getScheduled, startScheduler };
