function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cloneUser(userId, client) {
  try {
    const user = await client.users.fetch(userId, { force: true });
    return {
      username: user.username,
      avatarURL: user.displayAvatarURL({ format: 'png', size: 256 }),
      discriminator: user.discriminator || '0',
    };
  } catch (err) {
    throw new Error('Failed to fetch user ' + userId + ': ' + err.message);
  }
}

async function sendAs(channel, user, content, options = {}) {
  let webhook = null;

  try {
    // Resolve user info
    const username = user.username || user.tag || 'Unknown';
    const avatarURL = typeof user.displayAvatarURL === 'function'
      ? user.displayAvatarURL({ format: 'png', size: 256 })
      : user.avatarURL || null;

    // Create webhook
    webhook = await channel.createWebhook({
      name: username,
      avatar: avatarURL,
      reason: '[WebhookCloner] Impersonation webhook',
    });

    // Build message payload
    const payload = { content };
    if (options.embeds) payload.embeds = options.embeds;
    if (options.files) payload.files = options.files;
    if (options.tts) payload.tts = true;

    // Send message via webhook
    const sent = await webhook.send(payload);

    return {
      id: sent.id,
      channelId: channel.id,
      content: content,
      username: username,
      timestamp: Date.now(),
    };
  } catch (err) {
    throw new Error('sendAs failed: ' + err.message);
  } finally {
    // Always delete webhook after use
    if (webhook) {
      try {
        await webhook.delete('[WebhookCloner] Cleanup after impersonation');
      } catch (err) {
        console.error('[webhookcloner] Failed to delete webhook:', err.message);
      }
    }
  }
}

async function sendBatch(channel, user, messages, delayMs = 1000) {
  const results = [];

  for (let i = 0; i < messages.length; i++) {
    try {
      const msg = typeof messages[i] === 'string' ? { content: messages[i] } : messages[i];
      const result = await sendAs(channel, user, msg.content, msg);
      results.push(result);
    } catch (err) {
      results.push({ error: err.message, index: i });
    }

    if (i < messages.length - 1) {
      await delay(delayMs);
    }
  }

  return results;
}

module.exports = {
  sendAs,
  cloneUser,
  sendBatch,
};
