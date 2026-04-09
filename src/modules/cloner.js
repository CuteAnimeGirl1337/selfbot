const progress = {
  step: '',
  total: 0,
  current: 0,
  errors: [],
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetProgress() {
  progress.step = '';
  progress.total = 0;
  progress.current = 0;
  progress.errors = [];
}

function getProgress() {
  return { ...progress, errors: [...progress.errors] };
}

async function cloneServer(sourceGuild, targetGuild, options = {}) {
  resetProgress();

  const result = {
    rolesCreated: 0,
    channelsCreated: 0,
    emojisCreated: 0,
    errors: [],
  };

  const roleMap = new Map(); // sourceRoleId -> targetRoleId

  // Step 1: Clone roles
  try {
    const sourceRoles = sourceGuild.roles.cache
      .filter((r) => r.id !== sourceGuild.id) // Skip @everyone
      .sort((a, b) => a.position - b.position);

    progress.step = 'roles';
    progress.total = sourceRoles.size;
    progress.current = 0;

    for (const [, role] of sourceRoles) {
      try {
        const created = await targetGuild.roles.create({
          name: role.name,
          color: role.color,
          permissions: role.permissions,
          hoist: role.hoist,
          mentionable: role.mentionable,
          reason: '[Cloner] Cloning from ' + sourceGuild.name,
        });
        roleMap.set(role.id, created.id);
        result.rolesCreated++;
        progress.current++;
        await delay(500);
      } catch (err) {
        const msg = `Role "${role.name}": ${err.message}`;
        result.errors.push(msg);
        progress.errors.push(msg);
      }
    }
  } catch (err) {
    result.errors.push('Failed to fetch source roles: ' + err.message);
  }

  // Step 2: Clear target channels if requested
  if (options.clearTarget) {
    try {
      progress.step = 'clearing';
      const targetChannels = targetGuild.channels.cache;
      progress.total = targetChannels.size;
      progress.current = 0;

      for (const [, channel] of targetChannels) {
        try {
          await channel.delete('[Cloner] Clearing target server');
          progress.current++;
          await delay(500);
        } catch (err) {
          const msg = `Delete channel "${channel.name}": ${err.message}`;
          result.errors.push(msg);
          progress.errors.push(msg);
        }
      }
    } catch (err) {
      result.errors.push('Failed to clear target channels: ' + err.message);
    }
  }

  // Step 3: Clone categories first
  const categoryMap = new Map(); // sourceCategoryId -> targetCategoryId

  try {
    const categories = sourceGuild.channels.cache
      .filter((c) => c.type === 4) // GUILD_CATEGORY
      .sort((a, b) => a.position - b.position);

    progress.step = 'categories';
    progress.total = categories.size;
    progress.current = 0;

    for (const [, category] of categories) {
      try {
        const permOverwrites = buildPermissionOverwrites(category, roleMap, targetGuild);
        const created = await targetGuild.channels.create({
          name: category.name,
          type: 4,
          position: category.position,
          permissionOverwrites: permOverwrites,
          reason: '[Cloner] Cloning from ' + sourceGuild.name,
        });
        categoryMap.set(category.id, created.id);
        result.channelsCreated++;
        progress.current++;
        await delay(800);
      } catch (err) {
        const msg = `Category "${category.name}": ${err.message}`;
        result.errors.push(msg);
        progress.errors.push(msg);
      }
    }
  } catch (err) {
    result.errors.push('Failed to clone categories: ' + err.message);
  }

  // Step 4: Clone text and voice channels
  try {
    const channels = sourceGuild.channels.cache
      .filter((c) => c.type !== 4) // Not categories
      .sort((a, b) => a.position - b.position);

    progress.step = 'channels';
    progress.total = channels.size;
    progress.current = 0;

    for (const [, channel] of channels) {
      try {
        const permOverwrites = buildPermissionOverwrites(channel, roleMap, targetGuild);
        const opts = {
          name: channel.name,
          type: channel.type,
          position: channel.position,
          permissionOverwrites: permOverwrites,
          reason: '[Cloner] Cloning from ' + sourceGuild.name,
        };

        // Set parent category if exists
        if (channel.parentId && categoryMap.has(channel.parentId)) {
          opts.parent = categoryMap.get(channel.parentId);
        }

        // Text channel properties
        if (channel.type === 0 || channel.type === 5 || channel.type === 15) {
          if (channel.topic) opts.topic = channel.topic;
          if (channel.nsfw) opts.nsfw = channel.nsfw;
          if (channel.rateLimitPerUser) opts.rateLimitPerUser = channel.rateLimitPerUser;
        }

        const created = await targetGuild.channels.create(opts);
        result.channelsCreated++;
        progress.current++;
        await delay(800);
      } catch (err) {
        const msg = `Channel "${channel.name}": ${err.message}`;
        result.errors.push(msg);
        progress.errors.push(msg);
      }
    }
  } catch (err) {
    result.errors.push('Failed to clone channels: ' + err.message);
  }

  // Step 5: Copy emojis
  if (options.copyEmojis) {
    try {
      const emojis = sourceGuild.emojis.cache;
      progress.step = 'emojis';
      progress.total = emojis.size;
      progress.current = 0;

      for (const [, emoji] of emojis) {
        try {
          await targetGuild.emojis.create({
            attachment: emoji.url,
            name: emoji.name,
            reason: '[Cloner] Cloning from ' + sourceGuild.name,
          });
          result.emojisCreated++;
          progress.current++;
          await delay(800);
        } catch (err) {
          const msg = `Emoji "${emoji.name}": ${err.message}`;
          result.errors.push(msg);
          progress.errors.push(msg);
        }
      }
    } catch (err) {
      result.errors.push('Failed to clone emojis: ' + err.message);
    }
  }

  // Step 6: Copy server identity
  if (options.copyIdentity) {
    progress.step = 'identity';
    try {
      const updates = { name: sourceGuild.name };
      if (sourceGuild.iconURL()) {
        updates.icon = sourceGuild.iconURL({ format: 'png', size: 1024 });
      }
      await targetGuild.edit(updates);
    } catch (err) {
      const msg = `Server identity: ${err.message}`;
      result.errors.push(msg);
      progress.errors.push(msg);
    }
  }

  progress.step = 'done';
  return result;
}

function buildPermissionOverwrites(channel, roleMap, targetGuild) {
  const overwrites = [];

  if (!channel.permissionOverwrites || !channel.permissionOverwrites.cache) {
    return overwrites;
  }

  for (const [, overwrite] of channel.permissionOverwrites.cache) {
    let targetId = overwrite.id;

    // Map source role ID to target role ID
    if (overwrite.type === 0 && roleMap.has(overwrite.id)) {
      targetId = roleMap.get(overwrite.id);
    } else if (overwrite.type === 0 && overwrite.id === channel.guild.id) {
      // @everyone role maps to target guild's @everyone
      targetId = targetGuild.id;
    } else if (overwrite.type === 0 && !roleMap.has(overwrite.id)) {
      continue; // Skip unmapped roles
    }

    overwrites.push({
      id: targetId,
      type: overwrite.type,
      allow: overwrite.allow,
      deny: overwrite.deny,
    });
  }

  return overwrites;
}

async function exportServer(guild) {
  const data = {
    name: guild.name,
    icon: guild.iconURL({ format: 'png', size: 1024 }),
    roles: guild.roles.cache
      .filter((r) => r.id !== guild.id)
      .sort((a, b) => a.position - b.position)
      .map((r) => ({
        name: r.name,
        color: r.hexColor,
        permissions: r.permissions.bitfield.toString(),
        hoist: r.hoist,
        mentionable: r.mentionable,
        position: r.position,
      })),
    channels: guild.channels.cache
      .sort((a, b) => a.position - b.position)
      .map((c) => ({
        name: c.name,
        type: c.type,
        position: c.position,
        parentName: c.parent ? c.parent.name : null,
        topic: c.topic || null,
        nsfw: c.nsfw || false,
        rateLimitPerUser: c.rateLimitPerUser || 0,
      })),
    emojis: guild.emojis.cache.map((e) => ({
      name: e.name,
      url: e.url,
      animated: e.animated,
    })),
    exportedAt: new Date().toISOString(),
  };

  return data;
}

module.exports = {
  cloneServer,
  exportServer,
  getProgress,
};
