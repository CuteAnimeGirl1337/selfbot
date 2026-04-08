// =============================================================================
// Bot — Discord selfbot with 300 commands + stats tracking
// =============================================================================
const {
  Client,
  MessageAttachment,
  WebEmbed,
  RichPresence,
  CustomStatus,
} = require('discord.js-selfbot-v13');
const stats = require('./stats');
const fmt = require('./format');
const util = require('util');
const crypto = require('crypto');

const client = new Client();

// Bot config (mutable from dashboard)
const config = {
  prefix: '!',
  afk: { enabled: false, reason: '', since: null },
  autoDeleteCommands: false,
  disabledCommands: new Set(),
};

// Command registry
const commandList = [
  // -- Utility --
  ['ping', 'Check latency'],
  ['uptime', 'Bot uptime'],
  ['guilds', 'List your servers'],
  ['help', 'Help menu'],
  ['info', 'System & bot info'],
  ['token', 'Nice try'],
  // -- User Info --
  ['serverinfo', 'Server information'],
  ['userinfo', 'User information'],
  ['avatar', 'Get user avatar'],
  ['banner', 'Get user banner'],
  ['whois', 'Detailed user lookup'],
  ['roleinfo', 'Role information'],
  ['rolelist', 'List all roles'],
  ['channelinfo', 'Channel information'],
  ['channels', 'List text channels'],
  ['membercount', 'Server member count'],
  ['boosts', 'Server boost info'],
  ['invites', 'Top server invites'],
  ['servericon', 'Get server icon'],
  ['serverbanner', 'Get server banner'],
  ['emojis', 'List server emojis'],
  ['friends', 'List your friends'],
  ['blocked', 'List blocked users'],
  ['mutual', 'Mutual servers with user'],
  ['creationdate', 'ID to creation date'],
  // -- Messages --
  ['say', 'Say something anonymously'],
  ['edit', 'Edit replied message'],
  ['copy', 'Copy replied message'],
  ['quote', 'Quote replied message'],
  ['firstmsg', 'First message in channel'],
  ['msgcount', 'Cached message count'],
  ['purge', 'Delete your last N messages'],
  ['clear', 'Quick delete your messages'],
  ['ghostping', 'Send and instantly delete'],
  ['bookmark', 'DM yourself a message link'],
  // -- Snipe --
  ['snipe', 'Show last deleted message'],
  ['editsnipe', 'Show last edited message'],
  ['snipeclear', 'Clear snipe logs'],
  // -- Moderation --
  ['react', 'React to replied message'],
  ['massreact', 'React to last N messages'],
  ['stealemoji', 'Steal emoji from replied msg'],
  ['slowmode', 'Set channel slowmode'],
  ['topic', 'Set channel topic'],
  ['nick', 'Change your nickname'],
  ['leaveserver', 'Leave current server'],
  // -- Server Admin --
  ['pin', 'Pin the replied message'],
  ['unpin', 'Unpin the replied message'],
  ['lockdown', 'Lock channel for @everyone'],
  ['unlock', 'Unlock channel for @everyone'],
  ['nuke', 'Clone and delete channel'],
  // -- Status & Presence --
  ['status', 'Set custom status'],
  ['presence', 'Set online/idle/dnd/invisible'],
  ['afk', 'Set AFK status'],
  ['activity', 'Set playing/streaming/etc'],
  ['bio', 'Set your About Me'],
  ['hypesquad', 'Change HypeSquad house'],
  // -- DM --
  ['dm', 'Send a DM'],
  ['embed', 'Send a WebEmbed'],
  ['spam', 'Repeat a message (max 10)'],
  // -- Fun Text --
  ['reverse', 'Reverse text'],
  ['mock', 'mOcK tExT'],
  ['ascii', 'Big letter text'],
  ['clap', 'Clap between words'],
  ['spoiler', 'Letter-by-letter spoiler'],
  ['typewriter', 'Typing animation'],
  ['countdown', 'Countdown timer'],
  ['upper', 'UPPERCASE text'],
  ['lower', 'lowercase text'],
  ['leet', '1337 sp34k'],
  ['vaporwave', 'Fullwidth text'],
  ['flip', 'Upside down text'],
  ['shuffle', 'Shuffle words randomly'],
  ['wordcount', 'Count words in reply'],
  ['charcount', 'Count chars in reply'],
  ['base64', 'Encode to base64'],
  ['debase64', 'Decode from base64'],
  ['encrypt', 'Caesar cipher encrypt'],
  ['decrypt', 'Caesar cipher decrypt'],
  ['zalgo', 'Zalgo text'],
  ['uwu', 'UwU-ify text'],
  ['bubble', 'Bubble letter text'],
  ['tiny', 'Superscript text'],
  ['wide', 'S p a c e d text'],
  ['strikethrough', '~~text~~'],
  ['bold', '**text**'],
  ['italic', '*text*'],
  // -- Fun --
  ['8ball', 'Magic 8-ball'],
  ['coinflip', 'Heads or tails'],
  ['roll', 'Roll dice (e.g. 2d6)'],
  ['choose', 'Pick from options'],
  ['rate', 'Rate something /10'],
  ['poll', 'Create a reaction poll'],
  ['timer', 'Set a timer'],
  ['slots', 'Slot machine'],
  ['rps', 'Rock paper scissors'],
  ['minesweeper', 'Minesweeper grid'],
  ['ship', 'Ship percentage'],
  ['pp', 'PP size meme'],
  ['iq', 'Random IQ score'],
  ['roast', 'Random roast'],
  ['compliment', 'Random compliment'],
  ['joke', 'Random joke'],
  ['fact', 'Random fun fact'],
  // -- Spy & Auto --
  ['autoreply', 'Auto-reply to a user'],
  ['spy', 'Log messages from a user'],
  ['remind', 'Set a reminder'],
  // -- Steal --
  ['steal', 'Steal avatar from user'],
  ['invite', 'Create server invite'],
  // -- Utility (new) --
  ['calc', 'Math calculator'],
  ['color', 'Random hex color'],
  ['timestamp', 'Discord timestamp'],
  ['hash', 'SHA-256 hash text'],
  ['length', 'String length'],
  ['prefix', 'Change prefix'],
  ['togglecmd', 'Toggle command on/off'],
  // -- Account --
  ['nitrocheck', 'Check nitro type'],
  ['sessions', 'Active sessions count'],
  ['guildcount', 'Quick guild count'],
  ['relationships', 'Relationship stats'],
  // -- Automation --
  ['eval', 'Evaluate JavaScript'],
  ['webhook', 'Create & send webhook'],
  ['reply', 'Anonymous reply'],
  ['massclear', 'Clear N messages (perms)'],
  // -- Economy --
  ['bal', 'Show balance, bank, level, XP'],
  ['balance', 'Show balance (alias)'],
  ['daily', 'Claim daily reward (24h cooldown)'],
  ['work', 'Work for coins (30min cooldown)'],
  ['deposit', 'Move coins to bank'],
  ['withdraw', 'Move coins from bank'],
  ['give', 'Transfer coins to a user'],
  ['rob', 'Attempt to rob a user'],
  ['leaderboard', 'Top 15 richest'],
  ['lb', 'Leaderboard alias'],
  ['inventory', 'Show your inventory'],
  ['inv', 'Inventory alias'],
  ['shop', 'Show item sell values'],
  ['sell', 'Sell inventory items'],
  // -- Gambling --
  ['coinflipbet', 'Bet on heads/tails (2x)'],
  ['slotbet', 'Slots with betting'],
  ['blackjack', 'Play blackjack'],
  ['bj', 'Blackjack alias'],
  ['roulette', 'Roulette (red/black/number)'],
  ['crash', 'Crash game (cash out in time)'],
  ['dice', 'Bet over/under on 2d6'],
  ['horse', 'Horse race betting (4x)'],
  ['scratch', 'Scratch card game'],
  ['gamble', '50/50 double or nothing'],
  ['highlow', 'Higher or lower card game'],
  ['fish', 'Go fishing (items to inv)'],
  ['hunt', 'Go hunting (items to inv)'],
  ['mine', 'Go mining (items to inv)'],
  // -- System --
  ['macro', 'Manage macros (add|del|list|run)'],
  ['schedule', 'Schedule messages (add|list|clear)'],
  ['automod', 'AutoMod (addword|antispam|antilink|status)'],
  ['nitrosniper', 'Toggle nitro sniper'],
  // -- Profile --
  ['setavatar', 'Set avatar from URL'],
  ['setbanner', 'Set banner from URL'],
  ['setname', 'Set global display name'],
  ['setpronouns', 'Set pronouns'],
  ['setaccentcolor', 'Set banner accent color'],
  ['setusername', 'Change username'],
  ['copyavatar', 'Copy user avatar'],
  ['copybanner', 'Copy user banner'],
  ['copybio', 'Copy user bio'],
  ['clearavatar', 'Remove avatar'],
  ['clearbanner', 'Remove banner'],
  ['clearbio', 'Clear bio'],
  ['clearpronouns', 'Clear pronouns'],
  ['clearstatus', 'Clear custom status'],
  ['profile', 'Detailed user profile'],
  // -- Friends --
  ['addfriend', 'Send friend request'],
  ['removefriend', 'Remove friend'],
  ['block', 'Block a user'],
  ['unblock', 'Unblock a user'],
  ['friendlist', 'List all friends'],
  ['pendingfriends', 'Pending friend requests'],
  ['blocklist', 'Full blocked list'],
  ['friendnick', 'Set friend nickname'],
  ['note', 'Set/view note on user'],
  ['friendinvite', 'Create friend invite link'],
  ['allfriends', 'Friend count by status'],
  ['mutualfriends', 'Mutual friends with user'],
  // -- Guild Management --
  ['setservername', 'Set server name'],
  ['setservericon', 'Set server icon'],
  ['setserverbanner', 'Set server banner'],
  ['kick', 'Kick a member'],
  ['ban', 'Ban a member'],
  ['unban', 'Unban a user by ID'],
  ['timeout', 'Timeout a member'],
  ['untimeout', 'Remove timeout'],
  ['banlist', 'List server bans'],
  ['addrole', 'Add role to member'],
  ['removerole', 'Remove role from member'],
  ['createrole', 'Create a new role'],
  ['deleterole', 'Delete a role'],
  ['createchannel', 'Create a channel'],
  ['deletechannel', 'Delete a channel'],
  ['clonechannel', 'Clone current channel'],
  ['auditlog', 'View audit log'],
  ['prune', 'Prune inactive members'],
  ['serveremoji', 'Add emoji to server'],
  ['removeemoji', 'Remove emoji from server'],
  // -- Messages --
  ['forward', 'Forward replied message'],
  ['crosspost', 'Crosspost announcement'],
  ['markread', 'Mark channel as read'],
  ['markallread', 'Mark all guilds read'],
  ['suppress', 'Suppress embeds'],
  ['unsuppress', 'Show embeds'],
  ['thread', 'Create thread from reply'],
  ['closethread', 'Archive current thread'],
  ['pinall', 'Pin last N messages'],
  ['unpinall', 'Unpin all in channel'],
  ['massforward', 'Forward N messages'],
  ['superreact', 'Burst/super reaction'],
  ['reactall', 'React to last N msgs'],
  ['unreact', 'Remove your reaction'],
  ['search', 'Search messages in channel'],
  // -- Text Transforms --
  ['emojify', 'Text to emoji letters'],
  ['boxtext', 'Unicode box text'],
  ['gradient', 'Gradient ANSI text'],
  ['rainbow', 'Rainbow ANSI text'],
  ['matrix', 'Matrix rain text'],
  ['glitch', 'Glitchy text'],
  ['morse', 'Morse code convert'],
  ['binary', 'Text to binary'],
  ['hextext', 'Text to hex'],
  ['rot13', 'ROT13 cipher'],
  ['pig', 'Pig latin'],
  ['stutter', 'S-stutter text'],
  ['fancy', 'Fancy script font'],
  ['gothic', 'Gothic fraktur font'],
  ['monospace', 'Monospace font'],
  ['double', 'Double-struck font'],
  ['smallcaps', 'Small caps text'],
  ['superscript', 'Superscript (alias)'],
  ['subscript', 'Subscript text'],
  // -- Fun --
  ['trivia', 'Random trivia question'],
  ['riddle', 'Random riddle'],
  ['wyr', 'Would you rather'],
  ['truth', 'Truth question'],
  ['dare', 'Dare challenge'],
  ['pickup', 'Random pickup line'],
  ['shower', 'Shower thought'],
  ['fortune', 'Fortune cookie'],
  ['ascii-art', 'ASCII art text'],
  ['dicewar', 'Dice war vs bot'],
  ['numberguess', 'Number guessing game'],
  ['hangman', 'Hangman game'],
  ['tictactoe', 'Tic-tac-toe board'],
  ['connect4', 'Connect 4 board'],
  ['russian-roulette', 'Russian roulette'],
  ['slot-jackpot', 'Enhanced slots'],
  ['lottery', 'Lottery draw'],
  ['blackjack-double', 'BJ double down'],
  ['battle', 'RPG battle'],
  ['duel', 'Quick draw duel'],
  ['heist', 'Multi-stage heist'],
  ['fish-rare', 'Rare fishing'],
  ['pet', 'Virtual pet'],
  ['achievement', 'MC achievement'],
  ['haiku', 'Random haiku'],
  // -- Utility (new) --
  ['servercount', 'Total members all servers'],
  ['channelcount', 'Total channels all servers'],
  ['rolecount', 'Total unique roles'],
  ['emojicount', 'Total emojis all servers'],
  ['oldest', 'Oldest account in server'],
  ['youngest', 'Newest account in server'],
  ['firstjoin', 'First member to join'],
  ['lastjoin', 'Most recent join'],
  ['serverboost', 'Detailed boost info'],
  ['permissions', 'Your channel permissions'],
  ['snowflake', 'Decode snowflake ID'],
  ['resolve', 'Resolve any Discord ID'],
  ['ping-detailed', 'Detailed latency info'],
  ['memory', 'Process memory usage'],
  ['system', 'OS/Node/platform info'],
  ['envinfo', 'Non-sensitive env info'],
  ['uptime-detailed', 'Detailed uptime info'],
  ['charmap', 'Unicode char info'],
  ['randomuser', 'Random server member'],
  ['randomchannel', 'Random text channel'],
  // -- Group DM --
  ['groupcreate', 'Create group DM'],
  ['groupadd', 'Add user to group DM'],
  ['groupremove', 'Remove from group DM'],
  ['groupname', 'Set group DM name'],
  ['groupicon', 'Set group DM icon'],
  ['groupleave', 'Leave group DM'],
  ['grouplist', 'List all group DMs'],
  ['groupowner', 'Transfer group ownership'],
  // -- Automation --
  ['reactionrole', 'Reaction role on message'],
  ['autodelete', 'Auto-delete your msgs'],
  ['autopurge', 'Auto-purge channel'],
  ['msgcount-user', 'Count user messages'],
  ['afk-custom', 'AFK with custom emoji'],
  ['copycat', 'Copy next msg from user'],
  ['annoy', 'Ping user N times'],
  ['echo', 'Send text to channel'],
  ['tts', 'Send TTS message'],
  ['disableinvites', 'Disable server invites'],
  // -- AI --
  ['ask', 'Ask AI a question'],
  ['translate', 'AI translate text'],
  ['summarize', 'AI summarize replied message'],
  ['explain', 'AI explain a topic'],
  ['code', 'AI write code'],
  // -- Stealth --
  ['ghost', 'Toggle ghost read (no read receipts)'],
  ['invistype', 'Toggle invisible typing'],
  ['humanmode', 'Toggle human-like delays'],
  ['stealthstatus', 'Show stealth mode status'],
  // -- Protection --
  ['raidprotect', 'Toggle raid protection for server'],
  ['protectstatus', 'Show protection status'],
  // -- Token Protector --
  ['tokenprotect', 'Toggle token protection'],
  ['protectorstatus', 'Show protector alerts'],
  // -- Evasion --
  ['evasion', 'Toggle selfbot detection evasion'],
  ['evasionstatus', 'Show evasion stats'],
  // -- Message Logger --
  ['logserver', 'Toggle message logging for server'],
  ['logchannel', 'Toggle logging for channel'],
  ['logsearch', 'Search logged messages'],
  ['logstats', 'Show logging stats'],
  // -- Server Cloner --
  ['cloneserver', 'Clone server structure to another server'],
  ['exportserver', 'Export server as JSON'],
  // -- Webhook Cloner --
  ['sendas', 'Send message as another user via webhook'],
  ['impersonate', 'Impersonate user for next N messages'],
];

// Broadcast function for WebSocket
let broadcast = () => {};
function setBroadcast(fn) { broadcast = fn; }

function log(level, msg) {
  const prefix = { info: '[INFO]', warn: '[WARN]', error: '[ERROR]' };
  console.log(`${prefix[level] || '[LOG]'} ${msg}`);
  stats.addLog(level, msg);
  broadcast({ type: 'log', data: { level, message: msg, time: Date.now() } });
}

// =============================================================================
// EVENTS
// =============================================================================

client.on('ready', async () => {
  log('info', `Logged in as ${client.user.tag} (${client.user.id})`);
  log('info', `Serving ${client.guilds.cache.size} guild(s)`);
  const custom = new CustomStatus(client).setEmoji('🟢').setState('Online');
  client.user.setPresence({ activities: [custom] });
  log('info', 'Ready!');

  // Start reminder checker
  setInterval(() => {
    const now = Date.now();
    stats.reminders = stats.reminders.filter(r => {
      if (now >= r.time) {
        const ch = client.channels.cache.get(r.channel);
        if (ch) ch.send(`⏰ Reminder: **${r.text}**`).catch(() => null);
        return false;
      }
      return true;
    });
  }, 5000);
});

// Snipe tracking
client.on('messageDelete', (message) => {
  if (!message.partial && message.author) {
    const data = {
      content: message.content,
      author: message.author.tag,
      authorAvatar: message.author.displayAvatarURL({ size: 32 }),
      channel: message.channel.name || 'DM',
      guild: message.guild?.name || 'DM',
      attachment: message.attachments.first()?.proxyURL || null,
    };
    stats.addSnipe(data);
    broadcast({ type: 'snipe', data: { ...data, time: Date.now() } });
  }
});

// Editsnipe tracking
client.on('messageUpdate', (old, _new) => {
  if (!old.partial && old.author) {
    const data = {
      oldContent: old.content,
      newContent: _new.content,
      author: old.author.tag,
      authorAvatar: old.author.displayAvatarURL({ size: 32 }),
      channel: old.channel.name || 'DM',
      guild: old.guild?.name || 'DM',
    };
    stats.addEditSnipe(data);
    broadcast({ type: 'editsnipe', data: { ...data, time: Date.now() } });
  }
});

// AFK auto-reply + auto-reply rules + spy
client.on('messageCreate', async (message) => {
  // AFK
  if (
    config.afk.enabled &&
    message.mentions.has(client.user) &&
    message.author.id !== client.user.id
  ) {
    message.reply(
      `I'm AFK: **${config.afk.reason}** (since <t:${Math.floor(config.afk.since / 1000)}:R>)`
    );
  }

  // Auto-reply
  const autoReply = stats.autoReplies[message.author.id];
  if (autoReply && message.author.id !== client.user.id) {
    await message.reply(autoReply).catch(() => null);
  }

  // Spy
  if (stats.spyTargets.has(message.author.id) && message.author.id !== client.user.id) {
    const data = {
      author: message.author.tag,
      authorId: message.author.id,
      content: message.content,
      channel: message.channel.name || 'DM',
      guild: message.guild?.name || 'DM',
    };
    stats.addSpyLog(data);
    broadcast({ type: 'spy', data: { ...data, time: Date.now() } });
  }
});

// =============================================================================
// UPSIDE DOWN MAP
// =============================================================================
const flipMap = {
  a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',
  m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',
  y:'ʎ',z:'z',A:'∀',B:'q',C:'Ɔ',D:'p',E:'Ǝ',F:'Ⅎ',G:'פ',H:'H',I:'I',J:'ſ',
  K:'ʞ',L:'˥',M:'W',N:'N',O:'O',P:'Ԁ',Q:'Q',R:'ɹ',S:'S',T:'┴',U:'∩',V:'Λ',
  W:'M',X:'X',Y:'⅄',Z:'Z','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9',
  '7':'Ɫ','8':'8','9':'6','0':'0','.':'˙',',':'\'','\'':',','!':'¡','?':'¿',
  '(':')',')':'(','[':']',']':'[','{':'}','}':'{','<':'>','>':'<',
};

const leetMap = {a:'4',e:'3',i:'1',o:'0',s:'5',t:'7',l:'1',b:'8',g:'9'};

const vaporMap = {};
for (let i = 33; i <= 126; i++) {
  vaporMap[String.fromCharCode(i)] = String.fromCharCode(i - 33 + 0xFF01);
}
vaporMap[' '] = '\u3000';

// =============================================================================
// BUBBLE MAP (a-z -> circled letters)
// =============================================================================
const bubbleMap = {};
for (let i = 0; i < 26; i++) {
  bubbleMap[String.fromCharCode(97 + i)] = String.fromCharCode(0x24D0 + i); // ⓐ-ⓩ
  bubbleMap[String.fromCharCode(65 + i)] = String.fromCharCode(0x24B6 + i); // Ⓐ-Ⓩ
}
for (let i = 0; i <= 9; i++) {
  bubbleMap[`${i}`] = i === 0 ? '\u24EA' : String.fromCharCode(0x2460 + i - 1); // ⓪-⑨
}
bubbleMap[' '] = ' ';

// =============================================================================
// TINY (SUPERSCRIPT) MAP
// =============================================================================
const tinyMap = {
  a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',
  m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',q:'q',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',
  y:'ʸ',z:'ᶻ',A:'ᴬ',B:'ᴮ',C:'ᶜ',D:'ᴰ',E:'ᴱ',F:'ᶠ',G:'ᴳ',H:'ᴴ',I:'ᴵ',J:'ᴶ',
  K:'ᴷ',L:'ᴸ',M:'ᴹ',N:'ᴺ',O:'ᴼ',P:'ᴾ',Q:'Q',R:'ᴿ',S:'ˢ',T:'ᵀ',U:'ᵁ',V:'ⱽ',
  W:'ᵂ',X:'ˣ',Y:'ʸ',Z:'ᶻ',' ':' ',
};

// =============================================================================
// MORSE CODE MAP
// =============================================================================
const morseMap = {a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',
'0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',' ':'/','?':'..--..','!':'-.-.--','.':'.-.-.-',',':'--..--'};
const morseRev = {};
for (const [k,v] of Object.entries(morseMap)) morseRev[v] = k;

// =============================================================================
// FANCY (MATHEMATICAL SCRIPT) MAP
// =============================================================================
const fancyMap = {};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach((c, i) => {
  fancyMap[c] = String.fromCodePoint(0x1D4B6 + i);
});
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => {
  fancyMap[c] = String.fromCodePoint(0x1D49C + i);
});
fancyMap[' '] = ' ';

// =============================================================================
// GOTHIC (MATHEMATICAL FRAKTUR) MAP
// =============================================================================
const gothicMap = {};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach((c, i) => {
  gothicMap[c] = String.fromCodePoint(0x1D51E + i);
});
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => {
  gothicMap[c] = String.fromCodePoint(0x1D504 + i);
});
gothicMap[' '] = ' ';

// =============================================================================
// MONOSPACE (MATHEMATICAL MONOSPACE) MAP
// =============================================================================
const monoMap = {};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach((c, i) => {
  monoMap[c] = String.fromCodePoint(0x1D68A + i);
});
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => {
  monoMap[c] = String.fromCodePoint(0x1D670 + i);
});
monoMap[' '] = ' ';

// =============================================================================
// DOUBLE-STRUCK MAP
// =============================================================================
const doubleMap = {};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach((c, i) => {
  doubleMap[c] = String.fromCodePoint(0x1D552 + i);
});
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => {
  doubleMap[c] = String.fromCodePoint(0x1D538 + i);
});
doubleMap[' '] = ' ';

// =============================================================================
// SMALL CAPS MAP
// =============================================================================
const smallcapsMap = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ',' ':' '};

// =============================================================================
// SUBSCRIPT MAP
// =============================================================================
const subscriptMap = {a:'ₐ',e:'ₑ',h:'ₕ',i:'ᵢ',j:'ⱼ',k:'ₖ',l:'ₗ',m:'ₘ',n:'ₙ',o:'ₒ',p:'ₚ',r:'ᵣ',s:'ₛ',t:'ₜ',u:'ᵤ',v:'ᵥ',x:'ₓ','0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',' ':' '};

// =============================================================================
// EMOJI LETTER MAP
// =============================================================================
const emojiLetterMap = {};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach(c => {
  emojiLetterMap[c] = `:regional_indicator_${c}:`;
});
emojiLetterMap[' '] = '   ';
'0123456789'.split('').forEach(n => {
  const words = ['zero','one','two','three','four','five','six','seven','eight','nine'];
  emojiLetterMap[n] = `:${words[parseInt(n)]}:`;
});

// =============================================================================
// TRIVIA, RIDDLES, PICKUP LINES, SHOWER THOUGHTS, FORTUNES, HAIKUS
// =============================================================================
const triviaQuestions = [
  {q:'What planet is closest to the sun?',a:'Mercury'},
  {q:'How many bones are in the human body?',a:'206'},
  {q:'What is the chemical symbol for gold?',a:'Au'},
  {q:'What year did the Titanic sink?',a:'1912'},
  {q:'What is the largest ocean on Earth?',a:'Pacific'},
  {q:'Who painted the Mona Lisa?',a:'Leonardo da Vinci'},
  {q:'What is the hardest natural substance?',a:'Diamond'},
  {q:'How many continents are there?',a:'7'},
  {q:'What is the speed of light in km/s?',a:'299,792'},
  {q:'What is the smallest country in the world?',a:'Vatican City'},
  {q:'What gas do plants absorb from the atmosphere?',a:'Carbon dioxide'},
  {q:'Who wrote Romeo and Juliet?',a:'Shakespeare'},
  {q:'What is the capital of Japan?',a:'Tokyo'},
  {q:'How many hearts does an octopus have?',a:'3'},
  {q:'What is the longest river in the world?',a:'Nile'},
  {q:'What element does O represent?',a:'Oxygen'},
  {q:'In what year did World War II end?',a:'1945'},
  {q:'What is the largest mammal?',a:'Blue whale'},
  {q:'How many players on a soccer team?',a:'11'},
  {q:'What planet is known as the Red Planet?',a:'Mars'},
  {q:'Who discovered gravity?',a:'Isaac Newton'},
  {q:'What is the boiling point of water in Celsius?',a:'100'},
  {q:'What language has the most native speakers?',a:'Mandarin Chinese'},
  {q:'What is the largest desert in the world?',a:'Sahara'},
  {q:'How many strings does a standard guitar have?',a:'6'},
  {q:'What is the currency of Japan?',a:'Yen'},
  {q:'Who invented the telephone?',a:'Alexander Graham Bell'},
  {q:'What is the tallest mountain in the world?',a:'Mount Everest'},
  {q:'How many teeth does an adult human have?',a:'32'},
  {q:'What color is a ruby?',a:'Red'},
];

const riddles = [
  {q:'I have cities but no houses, forests but no trees, water but no fish. What am I?',a:'A map'},
  {q:'What has keys but no locks?',a:'A piano'},
  {q:'What can you break without touching?',a:'A promise'},
  {q:'What gets wetter the more it dries?',a:'A towel'},
  {q:'What has a head and a tail but no body?',a:'A coin'},
  {q:'What has an eye but cannot see?',a:'A needle'},
  {q:'What can travel around the world while staying in a corner?',a:'A stamp'},
  {q:'What has hands but cannot clap?',a:'A clock'},
  {q:'What comes down but never goes up?',a:'Rain'},
  {q:'What has teeth but cannot bite?',a:'A comb'},
  {q:'What building has the most stories?',a:'A library'},
  {q:'What can you catch but never throw?',a:'A cold'},
  {q:'I am not alive but I grow. What am I?',a:'Fire'},
  {q:'What word becomes shorter when you add two letters?',a:'Short'},
  {q:'What has 88 keys but cannot open a door?',a:'A piano'},
  {q:'What goes up and down but stays in the same place?',a:'Stairs'},
  {q:'What is full of holes but still holds water?',a:'A sponge'},
  {q:'What invention lets you look through a wall?',a:'A window'},
  {q:'What month has 28 days?',a:'All of them'},
  {q:'What runs but never walks?',a:'Water'},
];

const wyrQuestions = [
  'Would you rather be able to fly or be invisible?',
  'Would you rather live without music or without movies?',
  'Would you rather always be 10 min late or 20 min early?',
  'Would you rather have unlimited money or unlimited knowledge?',
  'Would you rather lose your phone or your wallet?',
  'Would you rather be famous or rich?',
  'Would you rather live in the past or the future?',
  'Would you rather be a genius or be extremely attractive?',
  'Would you rather never sleep or never eat?',
  'Would you rather fight 100 duck-sized horses or 1 horse-sized duck?',
  'Would you rather have super strength or super speed?',
  'Would you rather live without AC or without heating?',
  'Would you rather be stuck in a room with spiders or snakes?',
  'Would you rather have free WiFi everywhere or free coffee everywhere?',
  'Would you rather know how you die or when you die?',
  'Would you rather never use social media again or never watch movies again?',
  'Would you rather be the funniest or smartest person in the room?',
  'Would you rather speak every language or play every instrument?',
  'Would you rather always be overdressed or underdressed?',
  'Would you rather live on a boat or in a treehouse?',
  'Would you rather have a pause button or a rewind button for life?',
  'Would you rather be able to talk to animals or speak all languages?',
  'Would you rather give up pizza or tacos forever?',
  'Would you rather be immortal or have 9 lives?',
  'Would you rather always be too hot or too cold?',
  'Would you rather have X-ray vision or night vision?',
  'Would you rather live without YouTube or without Netflix?',
  'Would you rather have a personal chef or a personal chauffeur?',
  'Would you rather be locked in IKEA or a mall overnight?',
  'Would you rather control fire or water?',
];

const truthQuestions = [
  'What is the most embarrassing thing you have done?',
  'What is your biggest fear?',
  'What is the last lie you told?',
  'What is your biggest insecurity?',
  'Who was your first crush?',
  'What is the worst thing you have ever said to someone?',
  'Have you ever cheated on a test?',
  'What is your most embarrassing childhood memory?',
  'What is the weirdest dream you have had?',
  'What is one thing you would change about yourself?',
  'Have you ever stalked someone on social media?',
  'What is your guilty pleasure?',
  'What is the longest you have gone without showering?',
  'What is your most unpopular opinion?',
  'Who do you secretly dislike?',
  'What is the most childish thing you still do?',
  'Have you ever blamed someone else for something you did?',
  'What is the worst date you have been on?',
  'What secret have you never told anyone?',
  'What is the most embarrassing song on your playlist?',
];

const dareQuestions = [
  'Change your Discord avatar to something embarrassing for 1 hour.',
  'Send "I love you" to the last person who DMed you.',
  'Set your status to something cringe for 30 minutes.',
  'Speak only in third person for the next 10 messages.',
  'Let someone else type your next 3 messages.',
  'Use only caps lock for the next 5 messages.',
  'Share the last photo in your camera roll.',
  'Send a voice message singing a nursery rhyme.',
  'Change your nickname to "I lost a dare" for 1 hour.',
  'React to every message in the chat for 5 minutes.',
  'Type with your elbows for the next message.',
  'Send a compliment to a random person in this server.',
  'Use only emojis for the next 5 messages.',
  'Share your screen time report.',
  'Let someone pick your profile picture for a day.',
  'Post your most recent search history entry.',
  'Send a DM to someone random saying "hey bestie!"',
  'Speak in an accent for your next 5 voice messages.',
  'Add "uwu" to the end of all messages for 10 minutes.',
  'Change your name to something the group picks.',
];

const pickupLines = [
  'Are you a magician? Because whenever I look at you, everyone else disappears.',
  'Do you have a map? I just got lost in your eyes.',
  'Are you a parking ticket? Because you have got fine written all over you.',
  'Is your name Google? Because you have everything I have been searching for.',
  'Are you a campfire? Because you are hot and I want s\'more.',
  'Do you have a Band-Aid? Because I just scraped my knee falling for you.',
  'Are you a time traveler? Because I see you in my future.',
  'Is your dad a boxer? Because you are a knockout.',
  'Are you Wi-Fi? Because I am feeling a connection.',
  'Do you believe in love at first sight, or should I walk by again?',
  'Are you a bank loan? Because you have my interest.',
  'Is your name Chapstick? Because you are da balm.',
  'Are you a 90 degree angle? Because you are looking right.',
  'If you were a vegetable, you would be a cute-cumber.',
  'Are you a dictionary? Because you add meaning to my life.',
  'Do you have a sunburn, or are you always this hot?',
  'Are you a keyboard? Because you are just my type.',
  'Is this the Hogwarts Express? Because it feels like you and I are headed somewhere magical.',
  'Are you made of copper and tellurium? Because you are Cu-Te.',
  'If beauty were time, you would be an eternity.',
];

const showerThoughts = [
  'The brain named itself.',
  'Every mirror you buy is already used.',
  'You have never seen your own face, only pictures and reflections.',
  'If you dig a hole through the earth you end up in the ocean.',
  'The word "swims" upside down is still "swims".',
  'Nothing is on fire. Fire is on things.',
  'You are the youngest you will ever be right now.',
  'Technically every mirror is second hand.',
  'Your stomach thinks all potatoes are mashed.',
  'The letter W is just a double U but it is actually a double V.',
  'The object of golf is to play the least amount of golf.',
  'If Pinocchio says "my nose will grow now" it creates a paradox.',
  'Everyone sees a slightly different rainbow.',
  'You never realize how long a minute is until you exercise.',
  'Dentists make their money off of people who do not listen to them.',
  'We drive on a parkway and park on a driveway.',
  'Your future self is watching you through memories.',
  'Every book is just a different arrangement of 26 letters.',
  'When you clean a vacuum cleaner you become the vacuum cleaner.',
  'Glue bottles cannot stick to themselves.',
  'The speed of light and the speed of darkness are the same.',
  'You can hear silence because it is loud sometimes.',
  'If two mind readers read each others minds they read their own.',
  'Lava is technically earth juice.',
  'You are always technically on the edge of the universe.',
];

const fortunes = [
  'Good things come to those who wait... but better things come to those who work.',
  'A beautiful, smart, and loving person will be coming into your life.',
  'A dubious friend may be an enemy in camouflage.',
  'A faithful friend is a strong defense.',
  'An unexpected event will soon bring you fortune.',
  'Your hard work will pay off sooner than you think.',
  'The star of riches is shining upon you right now.',
  'Your creativity will lead you to great success.',
  'Do not confuse recklessness with confidence.',
  'A pleasant surprise is waiting for you.',
  'You will soon be presented with a golden opportunity.',
  'Adventure can be real happiness.',
  'Believe in yourself and others will too.',
  'Change is inevitable. Growth is optional.',
  'Difficult roads often lead to beautiful destinations.',
  'Every exit is an entrance to somewhere else.',
  'Good fortune will find you in the coming weeks.',
  'It is never too late to be what you might have been.',
  'Now is the time to try something new.',
  'Your talent will be recognized and suitably rewarded.',
  'The greatest risk is not taking one.',
  'You will find success in unexpected places.',
  'A lifetime of happiness lies ahead of you.',
  'Something wonderful is about to happen.',
  'Trust your instincts. They will not lead you astray.',
];

const haikus = [
  'An old silent pond\nA frog jumps into the pond\nSplash! Silence again',
  'Autumn moonlight bright\nA worm digs silently deep\nInto the chestnut',
  'Lightning flash and then\nA night heron screaming through\nDarkness all around',
  'Over the wintry\nForest winds howl in rage\nWith no leaves to blow',
  'In the twilight rain\nThese brilliant hued hibiscus\nA lovely sunset',
  'The light of a candle\nIs transferred to another\nSpring twilight glowing',
  'Nobody sits here\nBeside the ruined bridge a\nWillow tree is green',
  'First autumn morning\nThe mirror I stare into\nShows my father face',
  'Temple bells die out\nThe fragrant blossoms remain\nA perfect evening',
  'Whitecaps on the bay\nA broken signpost clapping\nIn the April wind',
  'Sick on a journey\nMy dream goes wandering still\nOver withered fields',
  'A caterpillar\nThis deep in fall still not yet\nBecome a butterfly',
  'On a leafless bough\nA crow is sitting alone\nAutumn darkening',
  'Clouds come from time to\nTime and bring a chance to rest\nFrom looking at moon',
  'Do not forget plum\nBlossom fragrance comes after\nThe long winter rain',
  'Everything I touch\nWith tenderness alas pricks\nLike a bramble thorn',
  'Green caterpillar\nClinging to a blade of grass\nDreams of butterfly',
  'Harvest moon rising\nThe farmer walks through gold fields\nSilent gratitude',
  'Morning dew glistens\nOn each petal it rests still\nSun begins to rise',
  'Cherry blossoms fall\nLanding gently on the stream\nFloating far away',
];

// =============================================================================
// AUTO-DELETE AND COPYCAT STATE
// =============================================================================
const autoDeleteChannels = new Map();
const copycatTargets = new Map();
const petData = new Map();
const numberGuessGames = new Map();

// =============================================================================
// ZALGO GENERATOR
// =============================================================================
const zalgoChars = {
  up: ['\u030d','\u030e','\u0304','\u0305','\u033f','\u0311','\u0306','\u0310','\u0352','\u0357','\u0351','\u0307','\u0308','\u030a','\u0342','\u0343','\u0344','\u034a','\u034b','\u034c','\u0303','\u0302','\u030c','\u0350','\u0300','\u0301','\u030b','\u030f','\u0312','\u0313','\u0314','\u033d','\u0309','\u0363','\u0364','\u0365','\u0366','\u0367','\u0368','\u0369','\u036a','\u036b','\u036c','\u036d','\u036e','\u036f','\u0346','\u034d','\u034e'],
  mid: ['\u0315','\u031b','\u0340','\u0341','\u0358','\u0321','\u0322','\u0327','\u0328','\u0334','\u0335','\u0336','\u034f','\u035c','\u035d','\u035e','\u035f','\u0360','\u0362','\u0338','\u0337','\u0361','\u0489'],
  down: ['\u0316','\u0317','\u0318','\u0319','\u031c','\u031d','\u031e','\u031f','\u0320','\u0324','\u0325','\u0326','\u0329','\u032a','\u032b','\u032c','\u032d','\u032e','\u032f','\u0330','\u0331','\u0332','\u0333','\u0339','\u033a','\u033b','\u033c','\u0345','\u0347','\u0348','\u0349','\u034d','\u034e','\u0353','\u0354','\u0355','\u0356','\u0359','\u035a','\u0323'],
};

function zalgoify(text, intensity = 3) {
  return text.split('').map(c => {
    if (c === ' ') return c;
    let result = c;
    for (let i = 0; i < intensity; i++) {
      result += zalgoChars.up[Math.floor(Math.random() * zalgoChars.up.length)];
      result += zalgoChars.mid[Math.floor(Math.random() * zalgoChars.mid.length)];
      result += zalgoChars.down[Math.floor(Math.random() * zalgoChars.down.length)];
    }
    return result;
  }).join('');
}

// =============================================================================
// COMMAND HANDLER
// =============================================================================

client.on('messageCreate', async (message) => {
  stats.incMessages();

  // Nitro sniper (runs for all messages)
  try {
    const nitroMod = require('./nitro');
    nitroMod.checkMessage(message, client, broadcast, log);
  } catch {}

  // AutoMod (runs for other users' messages in guilds)
  if (message.author.id !== client.user.id && message.guild) {
    try {
      const automodMod = require('./automod');
      const result = automodMod.checkMessage(message, client);
      if (result && result.action === 'delete') {
        await message.delete().catch(() => null);
        log('info', `AutoMod: deleted message from ${message.author.tag} — ${result.reason}`);
        if (automodMod.rules.logChannel) {
          const logCh = client.channels.cache.get(automodMod.rules.logChannel);
          if (logCh) logCh.send(`🛡️ **AutoMod:** Deleted message from **${message.author.tag}** in #${message.channel.name}\nReason: ${result.reason}`).catch(() => null);
        }
      }
    } catch {}
  }

  if (message.author.id !== client.user.id) return;

  // Auto-delete own messages in configured channels
  if (autoDeleteChannels.has(message.channel.id)) {
    const delay = autoDeleteChannels.get(message.channel.id);
    setTimeout(() => message.delete().catch(() => null), delay);
  }

  if (!message.content.startsWith(config.prefix)) return;

  // Turn off AFK
  if (config.afk.enabled && !message.content.startsWith(`${config.prefix}afk`)) {
    config.afk.enabled = false;
    message.channel.send('Welcome back! AFK disabled.').then((m) =>
      setTimeout(() => m.delete().catch(() => null), 3000)
    );
  }

  const args = message.content.slice(config.prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (config.disabledCommands.has(command)) return;

  if (commandList.some(([c]) => c === command)) {
    stats.incCommand(command);
    broadcast({ type: 'command', data: { name: command, args: args.join(' '), user: message.author.tag, channel: message.channel.name || 'DM', guild: message.guild?.name || 'DM', time: Date.now() } });
  }

  // Wrap message.reply to also broadcast response to dashboard
  const _origReply = message.reply.bind(message);
  message.reply = async (content) => {
    const text = typeof content === 'string' ? content : content?.content || String(content);
    const sent = await _origReply(content);
    broadcast({ type: 'response', data: { command, args: args.join(' '), response: text.slice(0, 500), user: message.author.tag, channel: message.channel.name || 'DM', guild: message.guild?.name || 'DM', time: Date.now() } });
    return sent;
  };

  if (config.autoDeleteCommands && command !== 'say') {
    setTimeout(() => message.delete().catch(() => null), 500);
  }

  // Helper
  const getReply = async () => {
    if (!message.reference) return null;
    return message.channel.messages.fetch(message.reference.messageId).catch(() => null);
  };

  // ========== UTILITY ==========

  if (command === 'ping') {
    const sent = await message.reply('Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`Pong! **${latency}ms** roundtrip · **${client.ws.ping}ms** ws`);
  }

  else if (command === 'uptime') {
    const ms = client.uptime;
    const s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000) % 24, d = Math.floor(ms / 86400000);
    await message.reply(`Uptime: **${d}d ${h}h ${m}m ${s}s**`);
  }

  else if (command === 'guilds') {
    const list = client.guilds.cache
      .sort((a, b) => b.memberCount - a.memberCount)
      .map((g) => `${g.name} — ${g.memberCount}`)
      .slice(0, 25);
    await message.reply(`**Servers (${client.guilds.cache.size}):**\n${list.join('\n')}`);
  }

  else if (command === 'info') {
    const mem = process.memoryUsage();
    await message.reply([
      `**Bot Info**`,
      `Node: ${process.version}`,
      `Platform: ${process.platform}`,
      `Memory: ${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(mem.heapTotal / 1024 / 1024).toFixed(1)}MB`,
      `Guilds: ${client.guilds.cache.size}`,
      `Commands: ${commandList.length}`,
      `Messages seen: ${stats.messagesSeen}`,
      `Msg/min: ${stats.getMsgRate()}`,
    ].join('\n'));
  }

  else if (command === 'token') {
    await message.reply(`\`${'*'.repeat(20)}\` — nice try lol`);
  }

  // ========== USER INFO ==========

  else if (command === 'serverinfo') {
    if (!message.guild) return message.reply('Server only.');
    const g = message.guild;
    await message.reply([
      `**${g.name}**`, `ID: ${g.id}`, `Owner: <@${g.ownerId}>`,
      `Members: ${g.memberCount}`, `Channels: ${g.channels.cache.size}`,
      `Roles: ${g.roles.cache.size}`,
      `Boosts: ${g.premiumSubscriptionCount || 0} (Tier ${g.premiumTier})`,
      `Created: <t:${Math.floor(g.createdTimestamp / 1000)}:F>`,
    ].join('\n'));
  }

  else if (command === 'userinfo') {
    const user = message.mentions.users.first() || message.author;
    const member = message.guild ? await message.guild.members.fetch(user.id).catch(() => null) : null;
    const lines = [
      `**${user.tag}**`, `ID: ${user.id}`,
      `Created: <t:${Math.floor(user.createdTimestamp / 1000)}:F>`,
    ];
    if (member) {
      lines.push(`Joined: <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`);
      lines.push(`Nickname: ${member.nickname || 'None'}`);
      lines.push(`Roles: ${member.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.name).join(', ') || 'None'}`);
    }
    await message.reply(lines.join('\n'));
  }

  else if (command === 'avatar') {
    const user = message.mentions.users.first() || message.author;
    await message.reply(user.displayAvatarURL({ size: 4096, dynamic: true }));
  }

  else if (command === 'banner') {
    const user = message.mentions.users.first() || message.author;
    try {
      const f = await client.users.fetch(user.id, { force: true });
      await message.reply(f.bannerURL({ size: 4096, dynamic: true }) || 'No banner.');
    } catch { await message.reply('Could not fetch banner.'); }
  }

  else if (command === 'whois') {
    const user = message.mentions.users.first();
    if (!user) return message.reply('Mention a user.');
    let f; try { f = await client.users.fetch(user.id, { force: true }); } catch { f = user; }
    const flags = f.flags?.toArray().join(', ') || 'None';
    await message.reply([
      `**${f.tag}**`, `ID: ${f.id}`,
      `Created: <t:${Math.floor(f.createdTimestamp / 1000)}:F>`,
      `Badges: ${flags}`,
      `Avatar: ${f.displayAvatarURL({ size: 4096, dynamic: true })}`,
      f.bannerURL?.({ size: 4096, dynamic: true }) ? `Banner: ${f.bannerURL({ size: 4096, dynamic: true })}` : null,
    ].filter(Boolean).join('\n'));
  }

  else if (command === 'roleinfo') {
    if (!message.guild) return message.reply('Server only.');
    const name = args.join(' ').toLowerCase();
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === name);
    if (!role) return message.reply('Role not found.');
    await message.reply([
      `**${role.name}**`, `ID: ${role.id}`, `Color: ${role.hexColor}`,
      `Members: ${role.members.size}`, `Position: ${role.position}`,
      `Hoisted: ${role.hoist}`, `Mentionable: ${role.mentionable}`,
    ].join('\n'));
  }

  else if (command === 'rolelist') {
    if (!message.guild) return message.reply('Server only.');
    const roles = message.guild.roles.cache.sort((a,b) => b.position - a.position).map(r => `${r.name} (${r.members.size})`).slice(0,30);
    await message.reply(`**Roles:**\n${roles.join('\n')}`);
  }

  else if (command === 'channelinfo') {
    const ch = message.channel;
    await message.reply([
      `**#${ch.name || 'DM'}**`, `ID: ${ch.id}`, `Type: ${ch.type}`,
      ch.topic ? `Topic: ${ch.topic}` : null,
      `Created: <t:${Math.floor(ch.createdTimestamp / 1000)}:F>`,
    ].filter(Boolean).join('\n'));
  }

  else if (command === 'channels') {
    if (!message.guild) return message.reply('Server only.');
    const t = message.guild.channels.cache.filter(c => c.type === 'GUILD_TEXT').map(c => `#${c.name}`).slice(0,40).join(', ');
    await message.reply(`**Text channels:** ${t}`);
  }

  else if (command === 'membercount') {
    if (!message.guild) return message.reply('Server only.');
    await message.reply(`**Members:** ${message.guild.memberCount}`);
  }

  else if (command === 'boosts') {
    if (!message.guild) return message.reply('Server only.');
    await message.reply(`**Boosts:** ${message.guild.premiumSubscriptionCount || 0} | **Tier:** ${message.guild.premiumTier}`);
  }

  else if (command === 'invites') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const inv = await message.guild.invites.fetch();
      const top = inv.sort((a,b) => (b.uses||0) - (a.uses||0)).first(10).map(i => `\`${i.code}\` — ${i.uses} uses`).join('\n');
      await message.reply(`**Invites:**\n${top || 'None'}`);
    } catch { await message.reply('No permission.'); }
  }

  else if (command === 'servericon') {
    if (!message.guild) return message.reply('Server only.');
    await message.reply(message.guild.iconURL({ size: 4096, dynamic: true }) || 'No icon.');
  }

  else if (command === 'serverbanner') {
    if (!message.guild) return message.reply('Server only.');
    await message.reply(message.guild.bannerURL({ size: 4096 }) || 'No banner.');
  }

  else if (command === 'emojis') {
    if (!message.guild) return message.reply('Server only.');
    const e = message.guild.emojis.cache.map(e => `${e}`).slice(0,50).join(' ');
    await message.reply(e || 'No emojis.');
  }

  else if (command === 'friends') {
    try {
      const rels = client.relationships.cache.filter(r => r.type === 1);
      const list = rels.map(r => r.user?.tag || r.id).slice(0, 30).join('\n');
      await message.reply(`**Friends (${rels.size}):**\n${list || 'None'}`);
    } catch { await message.reply('Could not fetch friends.'); }
  }

  else if (command === 'blocked') {
    try {
      const rels = client.relationships.cache.filter(r => r.type === 2);
      const list = rels.map(r => r.user?.tag || r.id).slice(0, 30).join('\n');
      await message.reply(`**Blocked (${rels.size}):**\n${list || 'None'}`);
    } catch { await message.reply('Could not fetch.'); }
  }

  else if (command === 'mutual') {
    const user = message.mentions.users.first();
    if (!user) return message.reply('Mention a user.');
    const mutual = client.guilds.cache.filter(g => g.members.cache.has(user.id));
    await message.reply(`**Mutual servers with ${user.tag}:** ${mutual.map(g => g.name).join(', ') || 'None found in cache'}`);
  }

  else if (command === 'creationdate') {
    const id = args[0] || message.author.id;
    const ts = Math.floor(Number(BigInt(id) >> 22n) / 1000 + 1420070400);
    await message.reply(`**${id}** created: <t:${ts}:F> (<t:${ts}:R>)`);
  }

  // ========== MESSAGES ==========

  else if (command === 'say') {
    const text = args.join(' ');
    if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(text);
  }

  else if (command === 'edit') {
    const ref = await getReply();
    if (!ref) return message.reply('Reply to your message.');
    if (ref.author.id !== client.user.id) return message.reply('Can only edit your msgs.');
    await ref.edit(args.join(' '));
    await message.delete().catch(() => null);
  }

  else if (command === 'copy') {
    const ref = await getReply();
    if (!ref) return message.reply('Reply to a message.');
    await message.delete().catch(() => null);
    await message.channel.send(ref.content || '*empty*');
  }

  else if (command === 'quote') {
    const ref = await getReply();
    if (!ref) return message.reply('Reply to a message.');
    await message.delete().catch(() => null);
    await message.channel.send(`> ${ref.content.replace(/\n/g, '\n> ')}\n— **${ref.author.tag}**`);
  }

  else if (command === 'firstmsg') {
    const msgs = await message.channel.messages.fetch({ after: '0', limit: 1 });
    const first = msgs.first();
    if (first) await message.reply(`First msg by **${first.author.tag}**: ${first.url}`);
  }

  else if (command === 'msgcount') {
    await message.reply(`Cached: **${message.channel.messages.cache.size}** messages`);
  }

  else if (command === 'purge') {
    const count = parseInt(args[0], 10);
    if (!count || count < 1 || count > 100) return message.reply('1-100.');
    const msgs = await message.channel.messages.fetch({ limit: 100 });
    const mine = msgs.filter(m => m.author.id === client.user.id).first(count);
    let d = 0;
    for (const msg of mine) { await msg.delete().catch(() => null); d++; await new Promise(r => setTimeout(r, 300)); }
    const c = await message.channel.send(`Deleted **${d}** message(s).`);
    setTimeout(() => c.delete().catch(() => null), 3000);
  }

  else if (command === 'clear') {
    const count = parseInt(args[0], 10) || 5;
    const msgs = await message.channel.messages.fetch({ limit: 100 });
    const mine = msgs.filter(m => m.author.id === client.user.id).first(count);
    for (const msg of mine) { await msg.delete().catch(() => null); await new Promise(r => setTimeout(r, 300)); }
  }

  else if (command === 'ghostping') {
    const text = args.join(' ') || '@everyone';
    await message.delete().catch(() => null);
    const m = await message.channel.send(text);
    await m.delete().catch(() => null);
  }

  else if (command === 'bookmark') {
    const ref = await getReply();
    if (!ref) return message.reply('Reply to a message.');
    try {
      await client.user.send(`🔖 Bookmarked: ${ref.url}\n> ${ref.content.slice(0, 200)}`);
      await message.reply('Bookmarked! Check your DMs.');
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  // ========== SNIPE ==========

  else if (command === 'snipe') {
    const s = stats.snipes[0];
    if (!s) return message.reply('Nothing to snipe.');
    let r = `**${s.author}:** ${s.content || '*no text*'}`;
    if (s.attachment) r += `\n${s.attachment}`;
    r += `\n*<t:${Math.floor(s.time / 1000)}:R>*`;
    await message.reply(r);
  }

  else if (command === 'editsnipe') {
    const s = stats.editSnipes[0];
    if (!s) return message.reply('Nothing to editsnipe.');
    await message.reply(`**${s.author}** edited:\n**Before:** ${s.oldContent}\n**After:** ${s.newContent}`);
  }

  else if (command === 'snipeclear') {
    stats.snipes.length = 0;
    stats.editSnipes.length = 0;
    await message.reply('Snipe logs cleared.');
  }

  // ========== MODERATION ==========

  else if (command === 'react') {
    const emoji = args[0];
    if (!emoji) return message.reply('Provide an emoji.');
    const ref = await getReply();
    if (!ref) return message.reply('Reply to a message.');
    await ref.react(emoji).catch(e => message.reply(`Failed: ${e.message}`));
    await message.delete().catch(() => null);
  }

  else if (command === 'massreact') {
    const emoji = args[0] || '👍';
    const count = Math.min(parseInt(args[1], 10) || 5, 20);
    const msgs = await message.channel.messages.fetch({ limit: count + 1 });
    await message.delete().catch(() => null);
    for (const [, msg] of msgs) {
      if (msg.id === message.id) continue;
      await msg.react(emoji).catch(() => null);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  else if (command === 'stealemoji') {
    const ref = await getReply();
    if (!ref || !message.guild) return message.reply('Reply to a msg with emoji in a server.');
    const match = ref.content.match(/<(a?):(\w+):(\d+)>/);
    if (!match) return message.reply('No custom emoji found.');
    const [, anim, eName, eId] = match;
    const url = `https://cdn.discordapp.com/emojis/${eId}.${anim ? 'gif' : 'png'}`;
    try {
      const emoji = await message.guild.emojis.create(url, args[0] || eName);
      await message.reply(`Stole: ${emoji}`);
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'slowmode') {
    const secs = parseInt(args[0], 10) || 0;
    try { await message.channel.setRateLimitPerUser(secs); await message.reply(`Slowmode: **${secs}s**`); }
    catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'topic') {
    try { await message.channel.setTopic(args.join(' ')); await message.reply('Topic updated.'); }
    catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'nick') {
    if (!message.guild) return message.reply('Server only.');
    const name = args.join(' ') || null;
    try { await message.guild.members.me.setNickname(name); await message.reply(`Nick ${name ? `→ **${name}**` : 'reset'}.`); }
    catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'leaveserver') {
    if (!message.guild) return message.reply('Server only.');
    await message.reply('Leaving...'); await message.guild.leave();
  }

  // ========== SERVER ADMIN (NEW) ==========

  else if (command === 'pin') {
    const ref = await getReply();
    if (!ref) return message.reply('Reply to a message to pin it.');
    try {
      await ref.pin();
      await message.delete().catch(() => null);
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'unpin') {
    const ref = await getReply();
    if (!ref) return message.reply('Reply to a message to unpin it.');
    try {
      await ref.unpin();
      await message.delete().catch(() => null);
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'lockdown') {
    if (!message.guild) return message.reply('Server only.');
    try {
      await message.channel.permissionOverwrites.edit(message.guild.id, { SEND_MESSAGES: false });
      await message.reply('Channel locked. @everyone cannot send messages.');
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'unlock') {
    if (!message.guild) return message.reply('Server only.');
    try {
      await message.channel.permissionOverwrites.edit(message.guild.id, { SEND_MESSAGES: null });
      await message.reply('Channel unlocked.');
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'nuke') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const ch = message.channel;
      const cloned = await ch.clone({ reason: 'Nuke command' });
      await cloned.setPosition(ch.position);
      await ch.delete('Nuked');
      await cloned.send('Channel nuked and recreated.');
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  // ========== STATUS & PRESENCE ==========

  else if (command === 'status') {
    const text = args.join(' ') || 'Chilling';
    const custom = new CustomStatus(client).setState(text);
    client.user.setPresence({ activities: [custom] });
    await message.reply(`Status: **${text}**`);
  }

  else if (command === 'presence') {
    const valid = ['online', 'idle', 'dnd', 'invisible'];
    const s = args[0]?.toLowerCase();
    if (!valid.includes(s)) return message.reply(`Valid: ${valid.join(', ')}`);
    client.user.setStatus(s);
    await message.reply(`Presence: **${s}**`);
  }

  else if (command === 'afk') {
    config.afk = { enabled: true, reason: args.join(' ') || 'AFK', since: Date.now() };
    await message.reply(`AFK: **${config.afk.reason}**`);
  }

  else if (command === 'activity') {
    // !activity playing Minecraft | !activity streaming https://twitch.tv/x Name
    const type = args[0]?.toUpperCase();
    const validTypes = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];
    if (!validTypes.includes(type)) return message.reply(`Types: ${validTypes.map(t => t.toLowerCase()).join(', ')}`);
    const name = args.slice(1).join(' ') || 'something';
    const act = { name, type };
    if (type === 'STREAMING') act.url = 'https://twitch.tv/discord';
    client.user.setActivity(act);
    await message.reply(`Activity: **${type.toLowerCase()} ${name}**`);
  }

  else if (command === 'bio') {
    const text = args.join(' ');
    try { await client.user.setAboutMe(text); await message.reply(`Bio updated.`); }
    catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'hypesquad') {
    const houses = { bravery: 'HOUSE_BRAVERY', brilliance: 'HOUSE_BRILLIANCE', balance: 'HOUSE_BALANCE' };
    const h = args[0]?.toLowerCase();
    if (!houses[h]) return message.reply(`Houses: bravery, brilliance, balance`);
    try { await client.user.setHypeSquad(houses[h]); await message.reply(`HypeSquad → **${h}**`); }
    catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  // ========== DM & EMBED ==========

  else if (command === 'dm') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Mention a user.');
    const text = args.slice(1).join(' ');
    if (!text) return message.reply('Provide a message.');
    try { await target.send(text); await message.reply(`DM sent to **${target.tag}**.`); }
    catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'embed') {
    const text = args.join(' ') || 'Hello!';
    const embed = new WebEmbed().setTitle('Embed').setDescription(text).setColor('BLUE');
    await message.channel.send({ content: `${WebEmbed.hiddenEmbed}${embed}` });
  }

  else if (command === 'spam') {
    const count = Math.min(parseInt(args[0], 10) || 1, 10);
    const text = args.slice(1).join(' ') || 'spam';
    await message.delete().catch(() => null);
    for (let i = 0; i < count; i++) { await message.channel.send(text); await new Promise(r => setTimeout(r, 500)); }
  }

  // ========== FUN TEXT ==========

  else if (command === 'reverse') {
    const text = args.join(' '); if (!text) return;
    await message.reply(text.split('').reverse().join(''));
  }

  else if (command === 'mock') {
    let text = args.join(' ');
    if (!text) { const ref = await getReply(); text = ref?.content; }
    if (!text) return message.reply('Provide text or reply.');
    await message.delete().catch(() => null);
    await message.channel.send(text.split('').map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join(''));
  }

  else if (command === 'ascii') {
    const text = args.join(' '); if (!text) return;
    const big = text.toUpperCase().split('').map(c => /[A-Z]/.test(c) ? `:regional_indicator_${c.toLowerCase()}:` : c === ' ' ? '   ' : c).join(' ');
    await message.delete().catch(() => null);
    await message.channel.send(big);
  }

  else if (command === 'clap') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(text.split(' ').join(' 👏 '));
  }

  else if (command === 'spoiler') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(text.split('').map(c => `||${c}||`).join(''));
  }

  else if (command === 'typewriter') {
    const text = args.join(' '); if (!text) return;
    const msg = await message.channel.send('\u200b');
    await message.delete().catch(() => null);
    let cur = '';
    for (const ch of text) { cur += ch; await msg.edit(cur); await new Promise(r => setTimeout(r, 200)); }
  }

  else if (command === 'countdown') {
    let secs = Math.min(parseInt(args[0], 10) || 5, 10);
    const msg = await message.reply(`**${secs}**`);
    const iv = setInterval(async () => { secs--; if (secs <= 0) { clearInterval(iv); await msg.edit('**GO!**'); } else await msg.edit(`**${secs}**`); }, 1000);
  }

  else if (command === 'upper') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(text.toUpperCase());
  }

  else if (command === 'lower') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(text.toLowerCase());
  }

  else if (command === 'leet') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(text.split('').map(c => leetMap[c.toLowerCase()] || c).join(''));
  }

  else if (command === 'vaporwave') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(text.split('').map(c => vaporMap[c] || c).join(''));
  }

  else if (command === 'flip') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(text.split('').map(c => flipMap[c] || c).reverse().join(''));
  }

  else if (command === 'shuffle') {
    const words = args; if (!words.length) return;
    for (let i = words.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [words[i], words[j]] = [words[j], words[i]]; }
    await message.delete().catch(() => null);
    await message.channel.send(words.join(' '));
  }

  else if (command === 'wordcount') {
    const ref = await getReply();
    if (!ref) return message.reply('Reply to a message.');
    const words = ref.content.trim().split(/\s+/).filter(Boolean).length;
    await message.reply(`**${words}** words`);
  }

  else if (command === 'charcount') {
    const ref = await getReply();
    if (!ref) return message.reply('Reply to a message.');
    await message.reply(`**${ref.content.length}** characters`);
  }

  else if (command === 'base64') {
    const text = args.join(' '); if (!text) return;
    await message.reply(`\`${Buffer.from(text).toString('base64')}\``);
  }

  else if (command === 'debase64') {
    const text = args.join(' '); if (!text) return;
    try { await message.reply(Buffer.from(text, 'base64').toString('utf-8')); }
    catch { await message.reply('Invalid base64.'); }
  }

  else if (command === 'encrypt') {
    const shift = parseInt(args[0], 10) || 3;
    const text = args.slice(1).join(' ') || args.join(' ');
    const encrypted = text.split('').map(c => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      return c;
    }).join('');
    await message.reply(`\`${encrypted}\` (shift ${shift})`);
  }

  else if (command === 'decrypt') {
    const shift = parseInt(args[0], 10) || 3;
    const text = args.slice(1).join(' ') || args.join(' ');
    const decrypted = text.split('').map(c => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 - shift + 26) % 26) + 97);
      return c;
    }).join('');
    await message.reply(`\`${decrypted}\` (shift ${shift})`);
  }

  // ========== NEW TEXT FUN ==========

  else if (command === 'zalgo') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(zalgoify(text));
  }

  else if (command === 'uwu') {
    let text = args.join(' ');
    if (!text) { const ref = await getReply(); text = ref?.content; }
    if (!text) return message.reply('Provide text or reply.');
    const uwuified = text
      .replace(/(?:r|l)/g, 'w')
      .replace(/(?:R|L)/g, 'W')
      .replace(/n([aeiou])/gi, 'ny$1')
      .replace(/N([aeiou])/gi, 'Ny$1')
      .replace(/N([AEIOU])/g, 'NY$1')
      .replace(/ove/g, 'uv')
      .replace(/!+/g, '! owo')
      .replace(/\?+/g, '? uwu');
    const faces = [' owo', ' uwu', ' >w<', ' ^w^', ' :3', ' ~w~'];
    await message.delete().catch(() => null);
    await message.channel.send(uwuified + faces[Math.floor(Math.random() * faces.length)]);
  }

  else if (command === 'bubble') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(text.split('').map(c => bubbleMap[c] || c).join(''));
  }

  else if (command === 'tiny') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(text.split('').map(c => tinyMap[c] || c).join(''));
  }

  else if (command === 'wide') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(text.split('').join(' '));
  }

  else if (command === 'strikethrough') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(`~~${text}~~`);
  }

  else if (command === 'bold') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(`**${text}**`);
  }

  else if (command === 'italic') {
    const text = args.join(' '); if (!text) return;
    await message.delete().catch(() => null);
    await message.channel.send(`*${text}*`);
  }

  // ========== FUN ==========

  else if (command === '8ball') {
    const responses = ['Yes.','No.','Maybe.','Absolutely.','Definitely not.','Ask again later.','Without a doubt.','Very doubtful.','Most likely.','Don\'t count on it.','Yes, in due time.','My sources say no.','Outlook good.','Signs point to yes.','Reply hazy, try again.'];
    await message.reply(`🎱 ${responses[Math.floor(Math.random() * responses.length)]}`);
  }

  else if (command === 'coinflip') {
    await message.reply(Math.random() < 0.5 ? '🪙 **Heads!**' : '🪙 **Tails!**');
  }

  else if (command === 'roll') {
    const match = (args[0] || '1d6').match(/^(\d+)?d(\d+)$/i);
    if (!match) return message.reply('Format: 2d6, d20, etc.');
    const num = Math.min(parseInt(match[1] || 1), 20);
    const sides = Math.min(parseInt(match[2]), 1000);
    const rolls = Array.from({ length: num }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);
    await message.reply(`🎲 ${rolls.join(' + ')} = **${total}**`);
  }

  else if (command === 'choose') {
    const options = args.join(' ').split('|').map(o => o.trim()).filter(Boolean);
    if (options.length < 2) return message.reply('Separate options with |');
    await message.reply(`I choose: **${options[Math.floor(Math.random() * options.length)]}**`);
  }

  else if (command === 'rate') {
    const thing = args.join(' ') || 'that';
    const rating = Math.floor(Math.random() * 11);
    const bar = '█'.repeat(rating) + '░'.repeat(10 - rating);
    await message.reply(`I rate **${thing}**: ${bar} **${rating}/10**`);
  }

  else if (command === 'poll') {
    const parts = args.join(' ').split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) return message.reply('Usage: !poll question | opt1 | opt2 ...');
    const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    const question = parts[0];
    const opts = parts.slice(1, 11);
    const text = `**📊 ${question}**\n\n${opts.map((o, i) => `${emojis[i]} ${o}`).join('\n')}`;
    await message.delete().catch(() => null);
    const poll = await message.channel.send(text);
    for (let i = 0; i < opts.length; i++) await poll.react(emojis[i]).catch(() => null);
  }

  else if (command === 'timer') {
    const secs = Math.min(parseInt(args[0], 10) || 30, 3600);
    await message.reply(`⏱️ Timer set for **${secs}s**`);
    setTimeout(async () => {
      await message.channel.send(`⏰ **Timer done!** (${secs}s)`);
    }, secs * 1000);
  }

  // ========== NEW FUN GAMES ==========

  else if (command === 'slots') {
    const symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '💎', '7️⃣', '🔔'];
    const r = () => symbols[Math.floor(Math.random() * symbols.length)];
    const s1 = r(), s2 = r(), s3 = r();
    let result;
    if (s1 === s2 && s2 === s3) result = '**JACKPOT!** 🎉🎉🎉';
    else if (s1 === s2 || s2 === s3 || s1 === s3) result = '**Two match!** Not bad.';
    else result = 'No match. Try again!';
    await message.reply(`🎰 [ ${s1} | ${s2} | ${s3} ]\n${result}`);
  }

  else if (command === 'rps') {
    const choices = ['rock', 'paper', 'scissors'];
    const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
    const userChoice = args[0]?.toLowerCase();
    if (!choices.includes(userChoice)) return message.reply('Usage: !rps rock/paper/scissors');
    const botChoice = choices[Math.floor(Math.random() * 3)];
    let result;
    if (userChoice === botChoice) result = "It's a **tie**!";
    else if (
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) result = 'You **win**! 🎉';
    else result = 'You **lose**! 💀';
    await message.reply(`You: ${emojis[userChoice]} vs Me: ${emojis[botChoice]}\n${result}`);
  }

  else if (command === 'minesweeper') {
    const size = Math.min(Math.max(parseInt(args[0], 10) || 5, 3), 9);
    const bombs = Math.min(Math.max(parseInt(args[1], 10) || Math.floor(size * size * 0.2), 1), size * size - 1);
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    // Place bombs
    let placed = 0;
    while (placed < bombs) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (grid[r][c] !== -1) { grid[r][c] = -1; placed++; }
    }
    // Calculate numbers
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === -1) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) count++;
          }
        }
        grid[r][c] = count;
      }
    }
    const numEmoji = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣'];
    const display = grid.map(row =>
      row.map(cell => `||${cell === -1 ? '💣' : numEmoji[cell]}||`).join('')
    ).join('\n');
    await message.reply(`**Minesweeper** (${size}x${size}, ${bombs} bombs)\n${display}`);
  }

  else if (command === 'ship') {
    const things = args.join(' ').split('|').map(s => s.trim()).filter(Boolean);
    if (things.length < 2) return message.reply('Usage: !ship thing1 | thing2');
    const pct = Math.floor(Math.random() * 101);
    const bar = '❤️'.repeat(Math.floor(pct / 10)) + '🖤'.repeat(10 - Math.floor(pct / 10));
    let comment;
    if (pct >= 90) comment = 'Soulmates! 💕';
    else if (pct >= 70) comment = 'Great match! 💖';
    else if (pct >= 50) comment = 'Could work! 💛';
    else if (pct >= 30) comment = 'Meh... 😐';
    else comment = 'Not happening. 💔';
    await message.reply(`**${things[0]}** x **${things[1]}**\n${bar} **${pct}%**\n${comment}`);
  }

  else if (command === 'pp') {
    const user = message.mentions.users.first() || message.author;
    const size = Math.floor(Math.random() * 12) + 1;
    await message.reply(`**${user.tag}**'s pp:\n8${'='.repeat(size)}D`);
  }

  else if (command === 'iq') {
    const user = message.mentions.users.first() || message.author;
    const iq = Math.floor(Math.random() * 200) + 1;
    let comment;
    if (iq >= 150) comment = 'Genius! 🧠';
    else if (iq >= 120) comment = 'Very smart! 📚';
    else if (iq >= 100) comment = 'Average! 👍';
    else if (iq >= 70) comment = 'Below average... 😬';
    else comment = 'Yikes... 💀';
    await message.reply(`**${user.tag}**'s IQ: **${iq}** ${comment}`);
  }

  else if (command === 'roast') {
    const roasts = [
      "You're the reason God created the middle finger.",
      "If you were any more inbred, you'd be a sandwich.",
      "You bring everyone so much joy... when you leave.",
      "You're not stupid; you just have bad luck thinking.",
      "I'd explain it to you, but I left my crayons at home.",
      "You're like a cloud. When you disappear, it's a beautiful day.",
      "If your brain was dynamite, there wouldn't be enough to blow your hat off.",
      "You're proof that even evolution makes mistakes.",
      "I'm not insulting you, I'm describing you.",
      "Somewhere out there, a tree is producing oxygen for you. I think you owe it an apology.",
      "You're the human equivalent of a participation trophy.",
      "Light travels faster than sound, which is why you seemed bright until you spoke.",
      "I'd roast you, but I don't burn trash.",
      "You're so dense, light bends around you.",
      "Your secrets are safe with me. I never even listen when you talk.",
    ];
    await message.reply(`🔥 ${roasts[Math.floor(Math.random() * roasts.length)]}`);
  }

  else if (command === 'compliment') {
    const compliments = [
      "You have a great sense of humor!",
      "You light up every room you walk into.",
      "You have an amazing smile.",
      "You're braver than you believe.",
      "Your creativity inspires everyone around you.",
      "You're one of a kind.",
      "You have an incredible work ethic.",
      "You make the world a better place.",
      "You always know the right thing to say.",
      "Your kindness is a beacon of light.",
      "You have a wonderful perspective on things.",
      "You're smarter than you give yourself credit for.",
      "People are lucky to have you in their lives.",
      "You have the best taste in music.",
      "You're basically a ray of sunshine in human form.",
    ];
    await message.reply(`💐 ${compliments[Math.floor(Math.random() * compliments.length)]}`);
  }

  else if (command === 'joke') {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything.",
      "I told my wife she was drawing her eyebrows too high. She looked surprised.",
      "Why did the scarecrow win an award? Because he was outstanding in his field.",
      "I'm reading a book about anti-gravity. It's impossible to put down.",
      "Why don't eggs tell jokes? They'd crack each other up.",
      "I used to hate facial hair, but then it grew on me.",
      "What do you call a fake noodle? An impasta.",
      "Why did the coffee file a police report? It got mugged.",
      "What do you call a bear with no teeth? A gummy bear.",
      "I told a chemistry joke. There was no reaction.",
      "Why can't you hear a pterodactyl going to the bathroom? Because the P is silent.",
      "I'm on a seafood diet. I see food and I eat it.",
      "What did the ocean say to the beach? Nothing, it just waved.",
      "Why don't skeletons fight each other? They don't have the guts.",
      "What do you call a dog that does magic? A Labracadabrador.",
    ];
    await message.reply(`😂 ${jokes[Math.floor(Math.random() * jokes.length)]}`);
  }

  else if (command === 'fact') {
    const facts = [
      "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible.",
      "Octopuses have three hearts and blue blood.",
      "A group of flamingos is called a 'flamboyance'.",
      "Bananas are berries, but strawberries aren't.",
      "The Eiffel Tower can grow up to 6 inches taller during the summer due to thermal expansion.",
      "There are more possible iterations of a game of chess than there are atoms in the known universe.",
      "The shortest war in history was between Britain and Zanzibar in 1896. It lasted 38 minutes.",
      "A day on Venus is longer than its year.",
      "The inventor of the Pringles can is buried in one.",
      "Cows have best friends and get stressed when they're separated.",
      "The heart of a blue whale is so big that a small child could swim through its arteries.",
      "There are more stars in the universe than grains of sand on Earth.",
      "Wombat poop is cube-shaped.",
      "The average person walks about 100,000 miles in a lifetime — that's like walking around the Earth 4 times.",
      "A jiffy is an actual unit of time: 1/100th of a second.",
    ];
    await message.reply(`🧠 ${facts[Math.floor(Math.random() * facts.length)]}`);
  }

  // ========== SPY & AUTO ==========

  else if (command === 'autoreply') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: !autoreply @user <reply text> or !autoreply @user to remove');
    const text = args.slice(1).join(' ');
    if (!text) {
      delete stats.autoReplies[target.id];
      await message.reply(`Auto-reply removed for **${target.tag}**.`);
    } else {
      stats.autoReplies[target.id] = text;
      await message.reply(`Auto-reply set for **${target.tag}**: ${text}`);
    }
  }

  else if (command === 'spy') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: !spy @user (toggle)');
    if (stats.spyTargets.has(target.id)) {
      stats.spyTargets.delete(target.id);
      await message.reply(`Stopped spying on **${target.tag}**.`);
    } else {
      stats.spyTargets.add(target.id);
      await message.reply(`Now spying on **${target.tag}**.`);
    }
  }

  else if (command === 'remind') {
    const time = parseInt(args[0], 10);
    if (!time) return message.reply('Usage: !remind <seconds> <text>');
    const text = args.slice(1).join(' ') || 'Reminder!';
    stats.reminders.push({ time: Date.now() + time * 1000, channel: message.channel.id, text });
    await message.reply(`⏰ Reminder set for **${time}s**: ${text}`);
  }

  // ========== STEAL & INVITE ==========

  else if (command === 'steal') {
    const user = message.mentions.users.first();
    if (!user) return message.reply('Mention a user.');
    await message.reply(user.displayAvatarURL({ size: 4096, dynamic: true, format: 'png' }));
  }

  else if (command === 'invite') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const inv = await message.channel.createInvite({ maxAge: 0, maxUses: 0 });
      await message.reply(`https://discord.gg/${inv.code}`);
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  // ========== NEW UTILITY ==========

  else if (command === 'calc') {
    const expr = args.join(' ');
    if (!expr) return message.reply('Usage: !calc <expression>');
    // Only allow safe math characters
    if (!/^[\d+\-*/%.() \t]+$/.test(expr)) return message.reply('Only digits, +, -, *, /, %, ., and parentheses allowed.');
    try {
      const fn = new Function(`"use strict"; return (${expr});`);
      const result = fn();
      if (typeof result !== 'number' || !isFinite(result)) return message.reply('Invalid result.');
      await message.reply(`🧮 \`${expr}\` = **${result}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'color') {
    const hex = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    await message.reply(`🎨 **${hex}** | RGB(${r}, ${g}, ${b})`);
  }

  else if (command === 'timestamp') {
    const secs = parseInt(args[0], 10);
    if (isNaN(secs)) return message.reply('Usage: !timestamp <seconds from now>');
    const ts = Math.floor(Date.now() / 1000) + secs;
    await message.reply([
      `**Timestamp: ${ts}**`,
      `Short time: <t:${ts}:t>`,
      `Long time: <t:${ts}:T>`,
      `Short date: <t:${ts}:d>`,
      `Long date: <t:${ts}:D>`,
      `Short datetime: <t:${ts}:f>`,
      `Long datetime: <t:${ts}:F>`,
      `Relative: <t:${ts}:R>`,
    ].join('\n'));
  }

  else if (command === 'hash') {
    const text = args.join(' ');
    if (!text) return message.reply('Usage: !hash <text>');
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    await message.reply(`🔒 SHA-256: \`${hash}\``);
  }

  else if (command === 'length') {
    const text = args.join(' ');
    if (!text) {
      const ref = await getReply();
      if (!ref) return message.reply('Provide text or reply to a message.');
      return message.reply(`**${ref.content.length}** characters`);
    }
    await message.reply(`**${text.length}** characters`);
  }

  else if (command === 'prefix') {
    const newPrefix = args[0];
    if (!newPrefix) return message.reply(`Current prefix: \`${config.prefix}\``);
    const old = config.prefix;
    config.prefix = newPrefix;
    await message.reply(`Prefix changed: \`${old}\` → \`${newPrefix}\``);
  }

  else if (command === 'togglecmd') {
    const cmd = args[0]?.toLowerCase();
    if (!cmd) return message.reply('Usage: !togglecmd <command>');
    if (cmd === 'togglecmd' || cmd === 'help') return message.reply('Cannot disable that command.');
    if (config.disabledCommands.has(cmd)) {
      config.disabledCommands.delete(cmd);
      await message.reply(`Command \`${cmd}\` **enabled**.`);
    } else {
      config.disabledCommands.add(cmd);
      await message.reply(`Command \`${cmd}\` **disabled**.`);
    }
  }

  // ========== NEW ACCOUNT ==========

  else if (command === 'nitrocheck') {
    try {
      const user = client.user;
      let nitroType = 'None';
      if (user.premiumType === 1) nitroType = 'Nitro Classic';
      else if (user.premiumType === 2) nitroType = 'Nitro';
      else if (user.premiumType === 3) nitroType = 'Nitro Basic';
      await message.reply(`**Nitro Status:** ${nitroType}`);
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'sessions') {
    try {
      const sessions = await client.api.auth.sessions.get();
      const count = sessions?.user_sessions?.length || 'unknown';
      await message.reply(`**Active sessions:** ${count}`);
    } catch (e) { await message.reply(`Could not fetch sessions: ${e.message}`); }
  }

  else if (command === 'guildcount') {
    await message.reply(`**Guilds:** ${client.guilds.cache.size}`);
  }

  else if (command === 'relationships') {
    try {
      const rels = client.relationships.cache;
      const friends = rels.filter(r => r.type === 1).size;
      const blocked = rels.filter(r => r.type === 2).size;
      const incoming = rels.filter(r => r.type === 3).size;
      const outgoing = rels.filter(r => r.type === 4).size;
      await message.reply([
        '**Relationship Stats:**',
        `Friends: **${friends}**`,
        `Blocked: **${blocked}**`,
        `Incoming requests: **${incoming}**`,
        `Outgoing requests: **${outgoing}**`,
        `Total: **${rels.size}**`,
      ].join('\n'));
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  // ========== NEW AUTOMATION ==========

  else if (command === 'eval') {
    const code = args.join(' ');
    if (!code) return message.reply('Usage: !eval <code>');
    try {
      let result = await eval(code);
      if (typeof result !== 'string') result = util.inspect(result, { depth: 2 });
      if (result.length > 1900) result = result.slice(0, 1900) + '...';
      await message.reply(`\`\`\`js\n${result}\n\`\`\``);
    } catch (e) {
      await message.reply(`\`\`\`js\nError: ${e.message}\n\`\`\``);
    }
  }

  else if (command === 'webhook') {
    if (!message.guild) return message.reply('Server only.');
    const name = args[0] || 'Selfbot Hook';
    const text = args.slice(1).join(' ') || 'Hello from webhook!';
    try {
      const webhook = await message.channel.createWebhook(name, {
        avatar: client.user.displayAvatarURL(),
      });
      await webhook.send(text);
      await webhook.delete();
      await message.delete().catch(() => null);
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'reply') {
    const ref = await getReply();
    if (!ref) return message.reply('Reply to a message.');
    const text = args.join(' ');
    if (!text) return message.reply('Provide reply text.');
    await message.delete().catch(() => null);
    await ref.reply(text);
  }

  else if (command === 'massclear') {
    if (!message.guild) return message.reply('Server only.');
    const count = Math.min(parseInt(args[0], 10) || 10, 100);
    try {
      const msgs = await message.channel.messages.fetch({ limit: count });
      let d = 0;
      for (const [, msg] of msgs) {
        await msg.delete().catch(() => null);
        d++;
        await new Promise(r => setTimeout(r, 350));
      }
      const c = await message.channel.send(`Cleared **${d}** message(s).`);
      setTimeout(() => c.delete().catch(() => null), 3000);
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  // ========== ECONOMY & GAMBLING ==========

  else if (command === 'bal' || command === 'balance') {
    const p = stats.getPlayer(message.author.id, message.author.tag);
    await message.reply(fmt.balanceCard(p, message.author.tag));
  }

  else if (command === 'daily') {
    const p = stats.getPlayer(message.author.id, message.author.tag);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    if (p.daily && now - p.daily < cooldown) {
      const remaining = cooldown - (now - p.daily);
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      return message.reply(`⏳ Come back in **${h}h ${m}m** for your daily reward.`);
    }
    const reward = Math.floor(Math.random() * 1501) + 500;
    p.balance += reward;
    p.daily = now;
    let reply = fmt.dailyResult(reward, p.balance);
    const lvl = stats.addXp(message.author.id, 25);
    if (lvl) reply += fmt.levelUp(lvl);
    await message.reply(reply);
  }

  else if (command === 'work') {
    const p = stats.getPlayer(message.author.id, message.author.tag);
    const now = Date.now();
    const cooldown = 30 * 60 * 1000;
    if (p.worked && now - p.worked < cooldown) {
      const remaining = cooldown - (now - p.worked);
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      return message.reply(`⏳ Work again in **${m}m ${s}s**.`);
    }
    const jobs = ['programmer', 'chef', 'driver', 'teacher', 'artist', 'miner', 'farmer', 'doctor', 'plumber', 'pilot'];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const reward = Math.floor(Math.random() * 401) + 100;
    p.balance += reward;
    p.worked = now;
    let reply = fmt.workResult(job, reward, p.balance);
    const lvl = stats.addXp(message.author.id, 10);
    if (lvl) reply += fmt.levelUp(lvl);
    await message.reply(reply);
  }

  else if (command === 'deposit') {
    const p = stats.getPlayer(message.author.id, message.author.tag);
    let amount;
    if (args[0] === 'all') amount = p.balance;
    else amount = parseInt(args[0], 10);
    if (!amount || amount <= 0) return message.reply('Usage: `deposit <amount|all>`');
    if (amount > p.balance) return message.reply(`You only have **${p.balance}** coins.`);
    p.balance -= amount;
    p.bank += amount;
    await message.reply(`Deposited **${amount}** coins. Bank: **${p.bank.toLocaleString()}**`);
  }

  else if (command === 'withdraw') {
    const p = stats.getPlayer(message.author.id, message.author.tag);
    let amount;
    if (args[0] === 'all') amount = p.bank;
    else amount = parseInt(args[0], 10);
    if (!amount || amount <= 0) return message.reply('Usage: `withdraw <amount|all>`');
    if (amount > p.bank) return message.reply(`You only have **${p.bank}** in the bank.`);
    p.bank -= amount;
    p.balance += amount;
    await message.reply(`Withdrew **${amount}** coins. Balance: **${p.balance.toLocaleString()}**`);
  }

  else if (command === 'give') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: `give <@user> <amount>`');
    const amount = parseInt(args[1], 10);
    if (!amount || amount <= 0) return message.reply('Provide a valid amount.');
    const p = stats.getPlayer(message.author.id, message.author.tag);
    if (amount > p.balance) return message.reply(`You only have **${p.balance}** coins.`);
    const tp = stats.getPlayer(target.id, target.tag);
    p.balance -= amount;
    tp.balance += amount;
    await message.reply(`Gave **${amount}** coins to **${target.tag}**.`);
  }

  else if (command === 'rob') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: `rob <@user>`');
    if (target.id === message.author.id) return message.reply('You cannot rob yourself.');
    const p = stats.getPlayer(message.author.id, message.author.tag);
    const tp = stats.getPlayer(target.id, target.tag);
    if (tp.balance < 100) return message.reply('That person is too poor to rob.');
    if (Math.random() < 0.4) {
      const pct = (Math.random() * 0.4 + 0.1);
      const stolen = Math.floor(tp.balance * pct);
      tp.balance -= stolen;
      p.balance += stolen;
      await message.reply(fmt.robResult(true, message.author.tag, target.tag, stolen));
    } else {
      const penalty = Math.floor(p.balance * 0.2);
      p.balance -= penalty;
      await message.reply(fmt.robResult(false, message.author.tag, target.tag, penalty));
    }
  }

  else if (command === 'leaderboard' || command === 'lb') {
    const lb = stats.getLeaderboard();
    if (!lb.length) return message.reply('No players yet.');
    await message.reply(fmt.leaderboardDisplay(lb));
  }

  else if (command === 'inventory' || command === 'inv') {
    const p = stats.getPlayer(message.author.id, message.author.tag);
    if (!p.inventory.length) return message.reply('Your inventory is empty.');
    const counts = {};
    for (const item of p.inventory) counts[item] = (counts[item] || 0) + 1;
    const lines = Object.entries(counts).map(([item, ct]) => `${item} x${ct}`);
    await message.reply(`**Your Inventory:**\n${lines.join('\n')}`);
  }

  else if (command === 'shop') {
    await message.reply(
      `**Shop — Sell Values:**\n` +
      `**Fish:** Common Fish (25), Uncommon Fish (100), Rare Fish (350), Legendary Fish (1500)\n` +
      `**Hunt:** Rabbit (20), Fox (80), Deer (300), Bear (1000), Dragon (2000)\n` +
      `**Mine:** Stone (15), Coal (40), Iron (100), Gold (400), Diamond (1200), Emerald (1800)\n` +
      `Use \`sell <item|all>\` to sell.`
    );
  }

  else if (command === 'sell') {
    const p = stats.getPlayer(message.author.id, message.author.tag);
    const itemValues = {
      'Common Fish': 25, 'Uncommon Fish': 100, 'Rare Fish': 350, 'Legendary Fish': 1500,
      'Rabbit': 20, 'Fox': 80, 'Deer': 300, 'Bear': 1000, 'Dragon': 2000,
      'Stone': 15, 'Coal': 40, 'Iron': 100, 'Gold': 400, 'Diamond': 1200, 'Emerald': 1800,
    };
    if (args[0] === 'all') {
      let total = 0;
      let count = 0;
      for (const item of p.inventory) {
        total += itemValues[item] || 10;
        count++;
      }
      if (!count) return message.reply('Nothing to sell.');
      p.inventory = [];
      p.balance += total;
      await message.reply(`Sold **${count}** items for **${total}** coins!`);
    } else {
      const itemName = args.join(' ');
      if (!itemName) return message.reply('Usage: `sell <item name|all>`');
      const idx = p.inventory.findIndex(i => i.toLowerCase() === itemName.toLowerCase());
      if (idx === -1) return message.reply(`You don't have **${itemName}**.`);
      const item = p.inventory.splice(idx, 1)[0];
      const value = itemValues[item] || 10;
      p.balance += value;
      await message.reply(`Sold **${item}** for **${value}** coins!`);
    }
  }

  // ---- Gambling Games ----

  else if (command === 'coinflipbet') {
    const bet = parseInt(args[0], 10);
    const choice = (args[1] || '').toLowerCase();
    if (!bet || bet < 10 || bet > 100000) return message.reply('Bet between 10 and 100,000.');
    if (choice !== 'h' && choice !== 't') return message.reply('Usage: `coinflipbet <amount> <h|t>`');
    const p = stats.getPlayer(message.author.id, message.author.tag);
    if (p.balance < bet) return message.reply(`You only have **${p.balance}** coins.`);
    const result = Math.random() < 0.5 ? 'h' : 't';
    const resultName = result === 'h' ? 'Heads' : 'Tails';
    if (result === choice) {
      const winnings = bet;
      p.balance += winnings;
      p.wins++;
      if (winnings > p.biggestWin) p.biggestWin = winnings;
      stats.logGamble(message.author.id, message.author.tag, 'coinflipbet', bet, 'win', winnings);
      let reply = `**${resultName}!** You won **${winnings}** coins!`;
      const lvl = stats.addXp(message.author.id, Math.floor(bet / 10));
      if (lvl) reply += `\nLevel up! You are now level **${lvl}**!`;
      await message.reply(reply);
    } else {
      p.balance -= bet;
      p.losses++;
      stats.logGamble(message.author.id, message.author.tag, 'coinflipbet', bet, 'loss', -bet);
      await message.reply(`**${resultName}!** You lost **${bet}** coins.`);
    }
  }

  else if (command === 'slotbet') {
    const bet = parseInt(args[0], 10);
    if (!bet || bet < 10 || bet > 100000) return message.reply('Bet between 10 and 100,000.');
    const p = stats.getPlayer(message.author.id, message.author.tag);
    if (p.balance < bet) return message.reply(`You only have **${p.balance}** coins.`);
    const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🔔'];
    const r = () => symbols[Math.floor(Math.random() * symbols.length)];
    const s1 = r(), s2 = r(), s3 = r();
    let multiplier = 0;
    if (s1 === s2 && s2 === s3) multiplier = 10;
    else if (s1 === s2 || s2 === s3 || s1 === s3) multiplier = 3;
    const display = `**[ ${s1} | ${s2} | ${s3} ]**`;
    if (multiplier > 0) {
      const winnings = bet * multiplier - bet;
      p.balance += winnings;
      p.wins++;
      if (winnings > p.biggestWin) p.biggestWin = winnings;
      stats.logGamble(message.author.id, message.author.tag, 'slotbet', bet, 'win', winnings);
      let reply = `${display}\n${multiplier === 10 ? 'JACKPOT! ' : ''}You won **${winnings}** coins! (${multiplier}x)`;
      const lvl = stats.addXp(message.author.id, Math.floor(bet / 10));
      if (lvl) reply += `\nLevel up! You are now level **${lvl}**!`;
      await message.reply(reply);
    } else {
      p.balance -= bet;
      p.losses++;
      stats.logGamble(message.author.id, message.author.tag, 'slotbet', bet, 'loss', -bet);
      await message.reply(`${display}\nNo match. You lost **${bet}** coins.`);
    }
  }

  else if (command === 'blackjack' || command === 'bj') {
    const bet = parseInt(args[0], 10);
    if (!bet || bet < 10 || bet > 100000) return message.reply('Bet between 10 and 100,000.');
    const p = stats.getPlayer(message.author.id, message.author.tag);
    if (p.balance < bet) return message.reply(`You only have **${p.balance}** coins.`);

    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    for (let d = 0; d < 6; d++) for (const s of suits) for (const r of ranks) deck.push({ rank: r, suit: s });
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }

    const cardVal = (hand) => {
      let total = 0, aces = 0;
      for (const c of hand) {
        if (c.rank === 'A') { aces++; total += 11; }
        else if (['K', 'Q', 'J'].includes(c.rank)) total += 10;
        else total += parseInt(c.rank, 10);
      }
      while (total > 21 && aces > 0) { total -= 10; aces--; }
      return total;
    };
    const showHand = (hand) => hand.map(c => `${c.rank}${c.suit}`).join(' ');

    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    let playerTotal = cardVal(playerHand);
    const dealerUp = `${dealerHand[0].rank}${dealerHand[0].suit}`;

    if (playerTotal === 21) {
      const winnings = Math.floor(bet * 1.5);
      p.balance += winnings;
      p.wins++;
      if (winnings > p.biggestWin) p.biggestWin = winnings;
      stats.logGamble(message.author.id, message.author.tag, 'blackjack', bet, 'win', winnings);
      const lvl = stats.addXp(message.author.id, Math.floor(bet / 10));
      let reply = `**Blackjack!** Your hand: ${showHand(playerHand)} (21)\nYou won **${winnings}** coins!`;
      if (lvl) reply += `\nLevel up! You are now level **${lvl}**!`;
      return message.reply(reply);
    }

    const bjMsg = await message.reply(
      `**Blackjack** (Bet: ${bet})\n` +
      `Your hand: ${showHand(playerHand)} (${playerTotal})\n` +
      `Dealer shows: ${dealerUp} | ??\n` +
      `Reply \`hit\` or \`stand\``
    );

    const filter = (m) => m.author.id === message.author.id && ['hit', 'stand'].includes(m.content.toLowerCase());
    const collector = message.channel.createMessageCollector({ filter, time: 30000 });

    let done = false;
    collector.on('collect', async (m) => {
      if (done) return;
      const action = m.content.toLowerCase();
      await m.delete().catch(() => null);

      if (action === 'hit') {
        playerHand.push(deck.pop());
        playerTotal = cardVal(playerHand);
        if (playerTotal > 21) {
          done = true;
          collector.stop();
          p.balance -= bet;
          p.losses++;
          stats.logGamble(message.author.id, message.author.tag, 'blackjack', bet, 'loss', -bet);
          await bjMsg.edit(
            `**Blackjack** (Bet: ${bet})\n` +
            `Your hand: ${showHand(playerHand)} (${playerTotal}) **BUST!**\n` +
            `Dealer hand: ${showHand(dealerHand)} (${cardVal(dealerHand)})\n` +
            `You lost **${bet}** coins.`
          ).catch(() => null);
          return;
        }
        await bjMsg.edit(
          `**Blackjack** (Bet: ${bet})\n` +
          `Your hand: ${showHand(playerHand)} (${playerTotal})\n` +
          `Dealer shows: ${dealerUp} | ??\n` +
          `Reply \`hit\` or \`stand\``
        ).catch(() => null);
      } else {
        done = true;
        collector.stop();
        let dealerTotal = cardVal(dealerHand);
        while (dealerTotal < 17) { dealerHand.push(deck.pop()); dealerTotal = cardVal(dealerHand); }
        let result, profit;
        if (dealerTotal > 21 || playerTotal > dealerTotal) {
          result = 'win'; profit = bet;
          p.balance += bet;
          p.wins++;
          if (profit > p.biggestWin) p.biggestWin = profit;
        } else if (playerTotal === dealerTotal) {
          result = 'push'; profit = 0;
        } else {
          result = 'loss'; profit = -bet;
          p.balance -= bet;
          p.losses++;
        }
        stats.logGamble(message.author.id, message.author.tag, 'blackjack', bet, result, profit);
        let text = `**Blackjack** (Bet: ${bet})\n` +
          `Your hand: ${showHand(playerHand)} (${playerTotal})\n` +
          `Dealer hand: ${showHand(dealerHand)} (${dealerTotal})\n`;
        if (result === 'win') {
          text += `You won **${bet}** coins!`;
          const lvl = stats.addXp(message.author.id, Math.floor(bet / 10));
          if (lvl) text += `\nLevel up! You are now level **${lvl}**!`;
        } else if (result === 'push') {
          text += `Push! Your bet was returned.`;
        } else {
          text += `You lost **${bet}** coins.`;
        }
        await bjMsg.edit(text).catch(() => null);
      }
    });
    collector.on('end', async (_, reason) => {
      if (!done) {
        done = true;
        p.balance -= bet;
        p.losses++;
        stats.logGamble(message.author.id, message.author.tag, 'blackjack', bet, 'loss', -bet);
        await bjMsg.edit(bjMsg.content + `\nTime's up! You lost **${bet}** coins.`).catch(() => null);
      }
    });
  }

  else if (command === 'roulette') {
    const bet = parseInt(args[0], 10);
    const pick = (args[1] || '').toLowerCase();
    if (!bet || bet < 10 || bet > 100000) return message.reply('Bet between 10 and 100,000.');
    if (!pick) return message.reply('Usage: `roulette <amount> <red|black|0-36>`');
    const p = stats.getPlayer(message.author.id, message.author.tag);
    if (p.balance < bet) return message.reply(`You only have **${p.balance}** coins.`);
    const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const spin = Math.floor(Math.random() * 37);
    const spinColor = spin === 0 ? 'green' : reds.includes(spin) ? 'red' : 'black';
    let won = false, multiplier = 0;
    const numPick = parseInt(pick, 10);
    if (!isNaN(numPick) && numPick >= 0 && numPick <= 36) {
      if (spin === numPick) { won = true; multiplier = 36; }
    } else if (pick === 'red' || pick === 'black') {
      if (spinColor === pick) { won = true; multiplier = 2; }
    } else {
      return message.reply('Pick `red`, `black`, or a number `0-36`.');
    }
    const emoji = spinColor === 'red' ? '🔴' : spinColor === 'black' ? '⚫' : '🟢';
    if (won) {
      const winnings = bet * multiplier - bet;
      p.balance += winnings;
      p.wins++;
      if (winnings > p.biggestWin) p.biggestWin = winnings;
      stats.logGamble(message.author.id, message.author.tag, 'roulette', bet, 'win', winnings);
      let reply = `${emoji} The ball landed on **${spin} ${spinColor}**!\nYou won **${winnings}** coins! (${multiplier}x)`;
      const lvl = stats.addXp(message.author.id, Math.floor(bet / 10));
      if (lvl) reply += `\nLevel up! You are now level **${lvl}**!`;
      await message.reply(reply);
    } else {
      p.balance -= bet;
      p.losses++;
      stats.logGamble(message.author.id, message.author.tag, 'roulette', bet, 'loss', -bet);
      await message.reply(`${emoji} The ball landed on **${spin} ${spinColor}**.\nYou lost **${bet}** coins.`);
    }
  }

  else if (command === 'crash') {
    const bet = parseInt(args[0], 10);
    if (!bet || bet < 10 || bet > 100000) return message.reply('Bet between 10 and 100,000.');
    const p = stats.getPlayer(message.author.id, message.author.tag);
    if (p.balance < bet) return message.reply(`You only have **${p.balance}** coins.`);
    const crashPoint = (1 / (1 - Math.random())) * 0.95;
    const crashAt = Math.min(parseFloat(crashPoint.toFixed(2)), 10.0);
    let multiplier = 1.00;
    let cashedOut = false;
    let crashed = false;
    const crashMsg = await message.reply(`**Crash** (Bet: ${bet})\nMultiplier: **1.00x**\nReact with ✅ to cash out!`);
    await crashMsg.react('✅').catch(() => null);

    const reactionFilter = (reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id;
    const reactionCollector = crashMsg.createReactionCollector({ filter: reactionFilter, time: 15000, max: 1 });

    reactionCollector.on('collect', () => {
      if (!crashed) cashedOut = true;
    });

    const interval = setInterval(async () => {
      if (cashedOut || crashed) {
        clearInterval(interval);
        reactionCollector.stop();
        if (cashedOut && !crashed) {
          const winnings = Math.floor(bet * multiplier) - bet;
          p.balance += winnings;
          p.wins++;
          if (winnings > p.biggestWin) p.biggestWin = winnings;
          stats.logGamble(message.author.id, message.author.tag, 'crash', bet, 'win', winnings);
          let text = `**Crash** (Bet: ${bet})\nYou cashed out at **${multiplier.toFixed(2)}x**!\nWon **${winnings}** coins!`;
          const lvl = stats.addXp(message.author.id, Math.floor(bet / 10));
          if (lvl) text += `\nLevel up! You are now level **${lvl}**!`;
          await crashMsg.edit(text).catch(() => null);
        }
        return;
      }
      multiplier += 0.15 + Math.random() * 0.2;
      multiplier = parseFloat(multiplier.toFixed(2));
      if (multiplier >= crashAt) {
        crashed = true;
        clearInterval(interval);
        reactionCollector.stop();
        p.balance -= bet;
        p.losses++;
        stats.logGamble(message.author.id, message.author.tag, 'crash', bet, 'loss', -bet);
        await crashMsg.edit(`**Crash** (Bet: ${bet})\nCRASHED at **${crashAt}x**! You lost **${bet}** coins.`).catch(() => null);
        return;
      }
      await crashMsg.edit(`**Crash** (Bet: ${bet})\nMultiplier: **${multiplier.toFixed(2)}x** (crashes at ???)\nReact with ✅ to cash out!`).catch(() => null);
    }, 1500);
  }

  else if (command === 'dice') {
    const bet = parseInt(args[0], 10);
    const direction = (args[1] || '').toLowerCase();
    const target = parseInt(args[2], 10);
    if (!bet || bet < 10 || bet > 100000) return message.reply('Bet between 10 and 100,000.');
    if (direction !== 'over' && direction !== 'under') return message.reply('Usage: `dice <amount> <over|under> <2-12>`');
    if (!target || target < 2 || target > 12) return message.reply('Pick a number between 2 and 12.');
    const p = stats.getPlayer(message.author.id, message.author.tag);
    if (p.balance < bet) return message.reply(`You only have **${p.balance}** coins.`);
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    const won = direction === 'over' ? total > target : total < target;
    if (won) {
      const winnings = bet;
      p.balance += winnings;
      p.wins++;
      if (winnings > p.biggestWin) p.biggestWin = winnings;
      stats.logGamble(message.author.id, message.author.tag, 'dice', bet, 'win', winnings);
      let reply = `🎲 Rolled **${d1}** + **${d2}** = **${total}** (${direction} ${target})\nYou won **${winnings}** coins!`;
      const lvl = stats.addXp(message.author.id, Math.floor(bet / 10));
      if (lvl) reply += `\nLevel up! You are now level **${lvl}**!`;
      await message.reply(reply);
    } else {
      p.balance -= bet;
      p.losses++;
      stats.logGamble(message.author.id, message.author.tag, 'dice', bet, 'loss', -bet);
      await message.reply(`🎲 Rolled **${d1}** + **${d2}** = **${total}** (needed ${direction} ${target})\nYou lost **${bet}** coins.`);
    }
  }

  else if (command === 'horse') {
    const bet = parseInt(args[0], 10);
    const pick = parseInt(args[1], 10);
    if (!bet || bet < 10 || bet > 100000) return message.reply('Bet between 10 and 100,000.');
    if (!pick || pick < 1 || pick > 4) return message.reply('Usage: `horse <amount> <1-4>`');
    const p = stats.getPlayer(message.author.id, message.author.tag);
    if (p.balance < bet) return message.reply(`You only have **${p.balance}** coins.`);
    const emojis = ['🐎', '🏇', '🦄', '🐴'];
    const positions = [0, 0, 0, 0];
    const finishLine = 15;
    const horseMsg = await message.reply('**Horse Race** Starting...');
    let winner = -1;
    const runRace = async () => {
      for (let round = 0; round < 8 && winner === -1; round++) {
        for (let h = 0; h < 4; h++) {
          positions[h] += Math.floor(Math.random() * 4);
          if (positions[h] >= finishLine) { winner = h + 1; positions[h] = finishLine; }
        }
        const track = positions.map((pos, i) =>
          `${emojis[i]} ${i + 1}: ${'▓'.repeat(Math.min(pos, finishLine))}${'░'.repeat(Math.max(finishLine - pos, 0))} ${pos >= finishLine ? '🏆' : ''}`
        ).join('\n');
        await horseMsg.edit(`**Horse Race** (Bet: ${bet} on #${pick})\n${track}`).catch(() => null);
        if (winner === -1) await new Promise(r => setTimeout(r, 1200));
      }
      if (winner === -1) winner = positions.indexOf(Math.max(...positions)) + 1;
      if (winner === pick) {
        const winnings = bet * 3;
        p.balance += winnings;
        p.wins++;
        if (winnings > p.biggestWin) p.biggestWin = winnings;
        stats.logGamble(message.author.id, message.author.tag, 'horse', bet, 'win', winnings);
        let text = `\nHorse **#${winner}** wins! You won **${winnings}** coins! (4x)`;
        const lvl = stats.addXp(message.author.id, Math.floor(bet / 10));
        if (lvl) text += `\nLevel up! You are now level **${lvl}**!`;
        await horseMsg.edit(horseMsg.content + text).catch(() => null);
      } else {
        p.balance -= bet;
        p.losses++;
        stats.logGamble(message.author.id, message.author.tag, 'horse', bet, 'loss', -bet);
        await horseMsg.edit(horseMsg.content + `\nHorse **#${winner}** wins. You lost **${bet}** coins.`).catch(() => null);
      }
    };
    runRace();
  }

  else if (command === 'scratch') {
    const bet = parseInt(args[0], 10);
    if (!bet || bet < 10 || bet > 100000) return message.reply('Bet between 10 and 100,000.');
    const p = stats.getPlayer(message.author.id, message.author.tag);
    if (p.balance < bet) return message.reply(`You only have **${p.balance}** coins.`);
    const symbols = ['💰', '🍀', '💎', '⭐', '🎯', '🔥', '👑'];
    const grid = Array.from({ length: 9 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
    const hidden = grid.map(() => '⬜');
    const formatGrid = (g) => `${g[0]} ${g[1]} ${g[2]}\n${g[3]} ${g[4]} ${g[5]}\n${g[6]} ${g[7]} ${g[8]}`;
    const scratchMsg = await message.reply(`**Scratch Card** (Bet: ${bet})\n${formatGrid(hidden)}\nRevealing...`);
    const order = [0,1,2,3,4,5,6,7,8].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 9; i++) {
      hidden[order[i]] = grid[order[i]];
      if (i === 2 || i === 5 || i === 8) {
        await new Promise(r => setTimeout(r, 1000));
        await scratchMsg.edit(`**Scratch Card** (Bet: ${bet})\n${formatGrid(hidden)}\n${i < 8 ? 'Revealing...' : 'Revealed!'}`).catch(() => null);
      }
    }
    const counts = {};
    for (const s of grid) counts[s] = (counts[s] || 0) + 1;
    const maxMatch = Math.max(...Object.values(counts));
    let multiplier = 0;
    if (maxMatch >= 3) multiplier = 5;
    else if (maxMatch === 2) multiplier = 2;
    if (multiplier > 0) {
      const winnings = bet * multiplier - bet;
      p.balance += winnings;
      p.wins++;
      if (winnings > p.biggestWin) p.biggestWin = winnings;
      stats.logGamble(message.author.id, message.author.tag, 'scratch', bet, 'win', winnings);
      let text = `\n**${maxMatch} matching!** You won **${winnings}** coins! (${multiplier}x)`;
      const lvl = stats.addXp(message.author.id, Math.floor(bet / 10));
      if (lvl) text += `\nLevel up! You are now level **${lvl}**!`;
      await scratchMsg.edit(scratchMsg.content.replace('Revealed!', '') + text).catch(() => null);
    } else {
      p.balance -= bet;
      p.losses++;
      stats.logGamble(message.author.id, message.author.tag, 'scratch', bet, 'loss', -bet);
      await scratchMsg.edit(scratchMsg.content.replace('Revealed!', 'No matches. You lost **' + bet + '** coins.')).catch(() => null);
    }
  }

  else if (command === 'gamble') {
    const bet = parseInt(args[0], 10);
    if (!bet || bet < 10 || bet > 100000) return message.reply('Bet between 10 and 100,000.');
    const p = stats.getPlayer(message.author.id, message.author.tag);
    if (p.balance < bet) return message.reply(`You only have **${p.balance}** coins.`);
    if (Math.random() < 0.5) {
      p.balance += bet;
      p.wins++;
      if (bet > p.biggestWin) p.biggestWin = bet;
      stats.logGamble(message.author.id, message.author.tag, 'gamble', bet, 'win', bet);
      let reply = `You won **${bet}** coins! Balance: **${p.balance.toLocaleString()}**`;
      const lvl = stats.addXp(message.author.id, Math.floor(bet / 10));
      if (lvl) reply += `\nLevel up! You are now level **${lvl}**!`;
      await message.reply(reply);
    } else {
      p.balance -= bet;
      p.losses++;
      stats.logGamble(message.author.id, message.author.tag, 'gamble', bet, 'loss', -bet);
      await message.reply(`You lost **${bet}** coins. Balance: **${p.balance.toLocaleString()}**`);
    }
  }

  else if (command === 'highlow') {
    const p = stats.getPlayer(message.author.id, message.author.tag);
    const cardNames = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const draw = () => Math.floor(Math.random() * 13);
    let current = draw();
    let streak = 0;
    let pot = 10;
    if (p.balance < 10) return message.reply('You need at least **10** coins to play.');
    p.balance -= 10;

    const hlMsg = await message.reply(
      `**Higher or Lower** (Cost: 10 coins)\n` +
      `Current card: **${cardNames[current]}**\n` +
      `Streak: ${streak} | Pot: ${pot}\n` +
      `Reply \`high\`, \`low\`, or \`cash\``
    );

    const filter = (m) => m.author.id === message.author.id && ['high', 'low', 'cash'].includes(m.content.toLowerCase());
    const collector = message.channel.createMessageCollector({ filter, time: 30000 });
    let ended = false;

    collector.on('collect', async (m) => {
      if (ended) return;
      const action = m.content.toLowerCase();
      await m.delete().catch(() => null);

      if (action === 'cash') {
        ended = true;
        collector.stop();
        p.balance += pot;
        if (pot - 10 > 0) { p.wins++; if (pot - 10 > p.biggestWin) p.biggestWin = pot - 10; }
        stats.logGamble(message.author.id, message.author.tag, 'highlow', 10, streak > 0 ? 'win' : 'push', pot - 10);
        let text = `**Higher or Lower**\nYou cashed out with **${pot}** coins! (Streak: ${streak})`;
        if (streak > 0) { const lvl = stats.addXp(message.author.id, streak * 5); if (lvl) text += `\nLevel up! You are now level **${lvl}**!`; }
        await hlMsg.edit(text).catch(() => null);
        return;
      }

      const next = draw();
      const correct = (action === 'high' && next >= current) || (action === 'low' && next <= current);
      if (correct) {
        streak++;
        pot = Math.floor(pot * 1.5);
        current = next;
        await hlMsg.edit(
          `**Higher or Lower**\n` +
          `Card: **${cardNames[current]}** -- Correct!\n` +
          `Streak: ${streak} | Pot: ${pot}\n` +
          `Reply \`high\`, \`low\`, or \`cash\``
        ).catch(() => null);
        collector.resetTimer();
      } else {
        ended = true;
        collector.stop();
        p.losses++;
        stats.logGamble(message.author.id, message.author.tag, 'highlow', 10, 'loss', -10);
        await hlMsg.edit(`**Higher or Lower**\nCard: **${cardNames[next]}** -- Wrong!\nYou lost your pot of **${pot}** coins.`).catch(() => null);
      }
    });
    collector.on('end', async () => {
      if (!ended) {
        ended = true;
        p.balance += pot;
        stats.logGamble(message.author.id, message.author.tag, 'highlow', 10, 'push', pot - 10);
        await hlMsg.edit(hlMsg.content + '\nTime ran out. Returned **' + pot + '** coins.').catch(() => null);
      }
    });
  }

  else if (command === 'fish') {
    const p = stats.getPlayer(message.author.id, message.author.tag);
    const roll = Math.random();
    let item, rarity;
    if (roll < 0.35) { item = null; rarity = 'nothing'; }
    else if (roll < 0.70) { item = 'Common Fish'; rarity = 'common'; }
    else if (roll < 0.88) { item = 'Uncommon Fish'; rarity = 'uncommon'; }
    else if (roll < 0.97) { item = 'Rare Fish'; rarity = 'rare'; }
    else { item = 'Legendary Fish'; rarity = 'legendary'; }
    if (item) {
      p.inventory.push(item);
      let reply = `🎣 You caught a **${item}**! (${rarity})`;
      const lvl = stats.addXp(message.author.id, rarity === 'legendary' ? 30 : rarity === 'rare' ? 15 : 5);
      if (lvl) reply += `\nLevel up! You are now level **${lvl}**!`;
      await message.reply(reply);
    } else {
      await message.reply('🎣 You cast your line... but caught nothing.');
    }
  }

  else if (command === 'hunt') {
    const p = stats.getPlayer(message.author.id, message.author.tag);
    const roll = Math.random();
    let item, rarity;
    if (roll < 0.30) { item = null; rarity = 'nothing'; }
    else if (roll < 0.60) { item = 'Rabbit'; rarity = 'common'; }
    else if (roll < 0.80) { item = 'Fox'; rarity = 'uncommon'; }
    else if (roll < 0.92) { item = 'Deer'; rarity = 'rare'; }
    else if (roll < 0.98) { item = 'Bear'; rarity = 'epic'; }
    else { item = 'Dragon'; rarity = 'legendary'; }
    if (item) {
      p.inventory.push(item);
      let reply = `🏹 You hunted a **${item}**! (${rarity})`;
      const lvl = stats.addXp(message.author.id, rarity === 'legendary' ? 40 : rarity === 'epic' ? 20 : 5);
      if (lvl) reply += `\nLevel up! You are now level **${lvl}**!`;
      await message.reply(reply);
    } else {
      await message.reply('🏹 You went hunting... but everything got away.');
    }
  }

  else if (command === 'mine') {
    const p = stats.getPlayer(message.author.id, message.author.tag);
    const roll = Math.random();
    let item, rarity;
    if (roll < 0.25) { item = 'Stone'; rarity = 'common'; }
    else if (roll < 0.50) { item = 'Coal'; rarity = 'common'; }
    else if (roll < 0.72) { item = 'Iron'; rarity = 'uncommon'; }
    else if (roll < 0.88) { item = 'Gold'; rarity = 'rare'; }
    else if (roll < 0.96) { item = 'Diamond'; rarity = 'rare'; }
    else { item = 'Emerald'; rarity = 'legendary'; }
    p.inventory.push(item);
    let reply = `⛏️ You mined **${item}**! (${rarity})`;
    const lvl = stats.addXp(message.author.id, rarity === 'legendary' ? 25 : rarity === 'rare' ? 12 : 5);
    if (lvl) reply += `\nLevel up! You are now level **${lvl}**!`;
    await message.reply(reply);
  }

  // ========== MACROS & SYSTEM ==========

  else if (command === 'macro') {
    try {
      const macrosMod = require('./macros');
      const sub = args[0];
      if (sub === 'add') {
        const name = args[1];
        const cmds = args.slice(2).join(' ').split('|').map(s => s.trim()).filter(Boolean);
        if (!name || !cmds.length) return message.reply('Usage: `macro add <name> cmd1 | cmd2 | cmd3`');
        macrosMod.addMacro(name, cmds, 500);
        await message.reply(`Macro **${name}** created with ${cmds.length} commands.`);
      } else if (sub === 'del') {
        macrosMod.removeMacro(args[1]);
        await message.reply(`Macro **${args[1]}** deleted.`);
      } else if (sub === 'list') {
        const list = Object.entries(macrosMod.getMacros());
        if (!list.length) return message.reply('No macros.');
        await message.reply(`**Macros:**\n${list.map(([n, m]) => `\`${n}\` — ${m.commands.length} commands`).join('\n')}`);
      } else if (sub === 'run') {
        const macro = macrosMod.getMacros()[args[1]];
        if (!macro) return message.reply('Macro not found.');
        for (const cmd of macro.commands) {
          await message.channel.send(config.prefix + cmd).catch(() => null);
          await new Promise(r => setTimeout(r, macro.delay || 500));
        }
      } else {
        // Try to run as macro name
        const macro = macrosMod.getMacros()[sub];
        if (macro) {
          for (const cmd of macro.commands) {
            await message.channel.send(config.prefix + cmd).catch(() => null);
            await new Promise(r => setTimeout(r, macro.delay || 500));
          }
        } else {
          await message.reply('Usage: `macro add|del|list|run <name>`');
        }
      }
    } catch { await message.reply('Macros module not available.'); }
  }

  else if (command === 'schedule') {
    try {
      const schedulerMod = require('./scheduler');
      const sub = args[0];
      if (sub === 'add') {
        const secs = parseInt(args[1], 10);
        const text = args.slice(2).join(' ');
        if (!secs || !text) return message.reply('Usage: `schedule add <seconds> <message>`');
        schedulerMod.addScheduled(message.channel.id, text, Date.now() + secs * 1000, null);
        await message.reply(`📅 Scheduled in **${secs}s**: ${text}`);
      } else if (sub === 'list') {
        const list = schedulerMod.getScheduled();
        if (!list.length) return message.reply('No scheduled messages.');
        const lines = list.map(s => `\`${String(s.id).slice(0,6)}\` — <t:${Math.floor(s.sendAt/1000)}:R> ${s.message.slice(0,40)}`);
        await message.reply(`**Scheduled:**\n${lines.join('\n')}`);
      } else if (sub === 'clear') {
        schedulerMod.scheduled.length = 0;
        await message.reply('All scheduled messages cleared.');
      } else {
        await message.reply('Usage: `schedule add|list|clear`');
      }
    } catch { await message.reply('Scheduler module not available.'); }
  }

  else if (command === 'automod') {
    try {
      const automodMod = require('./automod');
      const sub = args[0];
      if (sub === 'addword') {
        const word = args.slice(1).join(' ');
        automodMod.addBannedWord(word);
        await message.reply(`Added **${word}** to banned words.`);
      } else if (sub === 'delword') {
        const word = args.slice(1).join(' ');
        automodMod.removeBannedWord(word);
        await message.reply(`Removed **${word}** from banned words.`);
      } else if (sub === 'antispam') {
        const enabled = args[1] === 'on';
        automodMod.setAntiSpam(enabled, parseInt(args[2]) || 5, parseInt(args[3]) || 5000);
        await message.reply(`Anti-spam: **${enabled ? 'ON' : 'OFF'}**`);
      } else if (sub === 'antilink') {
        const enabled = args[1] === 'on';
        automodMod.setAntiLink(enabled, []);
        await message.reply(`Anti-link: **${enabled ? 'ON' : 'OFF'}**`);
      } else if (sub === 'status') {
        const r = automodMod.getRules();
        await message.reply(`**AutoMod Status:**\nBanned words: ${r.bannedWords.length}\nAnti-spam: ${r.antiSpam.enabled ? 'ON' : 'OFF'}\nAnti-link: ${r.antiLink.enabled ? 'ON' : 'OFF'}`);
      } else {
        await message.reply('Usage: `automod addword|delword|antispam|antilink|status`');
      }
    } catch { await message.reply('AutoMod module not available.'); }
  }

  else if (command === 'nitrosniper') {
    try {
      const nitroMod = require('./nitro');
      nitroMod.setEnabled(!nitroMod.isEnabled());
      await message.reply(`Nitro sniper: **${nitroMod.isEnabled() ? 'ON' : 'OFF'}**`);
    } catch { await message.reply('Nitro module not available.'); }
  }

  // ========== PROFILE ==========

  else if (command === 'setavatar') {
    if (!args[0]) return message.reply('Usage: `setavatar <url>`');
    try { await client.user.setAvatar(args[0]); await message.reply('Avatar updated!'); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'setbanner') {
    if (!args[0]) return message.reply('Usage: `setbanner <url>`');
    try { await client.user.setBanner(args[0]); await message.reply('Banner updated!'); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'setname') {
    if (!args.length) return message.reply('Usage: `setname <name>`');
    try { await client.user.setGlobalName(args.join(' ')); await message.reply(`Display name set to **${args.join(' ')}**`); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'setpronouns') {
    if (!args.length) return message.reply('Usage: `setpronouns <text>`');
    try { await client.user.setPronouns(args.join(' ')); await message.reply(`Pronouns set to **${args.join(' ')}**`); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'setaccentcolor') {
    if (!args[0]) return message.reply('Usage: `setaccentcolor <hex>`');
    try { await client.user.setAccentColor(parseInt(args[0].replace('#',''),16)); await message.reply('Accent color updated!'); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'setusername') {
    if (!args[0] || !args[1]) return message.reply('Usage: `setusername <name> <password>`');
    try { await client.user.setUsername(args[0], args[1]); await message.reply(`Username changed to **${args[0]}**`); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'copyavatar') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const url = user.displayAvatarURL({ size: 4096, dynamic: true });
      await client.user.setAvatar(url);
      await message.reply(`Copied avatar from **${user.tag}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'copybanner') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const fetched = await user.fetch(true);
      if (!fetched.banner) return message.reply('User has no banner.');
      const url = fetched.bannerURL({ size: 4096, dynamic: true });
      await client.user.setBanner(url);
      await message.reply(`Copied banner from **${user.tag}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'copybio') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const profile = await user.getProfile();
      if (!profile.bio) return message.reply('User has no bio.');
      await client.user.setAboutMe(profile.bio);
      await message.reply(`Copied bio from **${user.tag}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'clearavatar') {
    try { await client.user.setAvatar(null); await message.reply('Avatar removed!'); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'clearbanner') {
    try { await client.user.setBanner(null); await message.reply('Banner removed!'); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'clearbio') {
    try { await client.user.setAboutMe(''); await message.reply('Bio cleared!'); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'clearpronouns') {
    try { await client.user.setPronouns(''); await message.reply('Pronouns cleared!'); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'clearstatus') {
    try {
      const custom = new CustomStatus(client);
      client.user.setPresence({ activities: [custom] });
      await message.reply('Custom status cleared!');
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'profile') {
    try {
      const user = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]) : message.author);
      const fetched = await user.fetch(true);
      const flags = fetched.flags?.toArray().join(', ') || 'None';
      const created = `<t:${Math.floor(fetched.createdTimestamp / 1000)}:R>`;
      let info = `**Profile: ${fetched.tag}**\nID: \`${fetched.id}\`\nCreated: ${created}\nBot: ${fetched.bot}\nBadges: ${flags}`;
      if (fetched.banner) info += `\nBanner: ${fetched.bannerURL({ size: 4096, dynamic: true })}`;
      info += `\nAvatar: ${fetched.displayAvatarURL({ size: 4096, dynamic: true })}`;
      if (fetched.accentColor) info += `\nAccent: #${fetched.accentColor.toString(16)}`;
      try {
        const profile = await user.getProfile();
        if (profile.bio) info += `\nBio: ${profile.bio}`;
        if (profile.pronouns) info += `\nPronouns: ${profile.pronouns}`;
      } catch {}
      if (message.guild) {
        const member = await message.guild.members.fetch(fetched.id).catch(() => null);
        if (member) {
          info += `\nNickname: ${member.nickname || 'None'}`;
          info += `\nJoined: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`;
          info += `\nRoles: ${member.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.name).join(', ') || 'None'}`;
        }
      }
      await message.reply(info);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  // ========== FRIENDS ==========

  else if (command === 'addfriend') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      await user.sendFriendRequest();
      await message.reply(`Friend request sent to **${user.tag}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'removefriend') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      await user.deleteRelationship();
      await message.reply(`Removed **${user.tag}** from friends.`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'block') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      await user.setBlock(true);
      await message.reply(`Blocked **${user.tag}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'unblock') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      await user.deleteRelationship();
      await message.reply(`Unblocked **${user.tag}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'friendlist') {
    try {
      const friends = client.relationships.friendCache;
      if (!friends.size) return message.reply('No friends found.');
      const list = friends.map(r => {
        const u = client.users.cache.get(r.id) || r;
        const status = u.presence?.status || 'offline';
        return `${status === 'online' ? '🟢' : status === 'idle' ? '🟡' : status === 'dnd' ? '🔴' : '⚫'} **${u.tag || u.id}**`;
      }).slice(0, 30);
      await message.reply(`**Friends (${friends.size}):**\n${list.join('\n')}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'pendingfriends') {
    try {
      const incoming = client.relationships.incomingCache;
      const outgoing = client.relationships.outgoingCache;
      let msg = `**Pending Friend Requests:**\n`;
      msg += `**Incoming (${incoming.size}):** ${incoming.map(r => r.tag || r.id).slice(0,15).join(', ') || 'None'}\n`;
      msg += `**Outgoing (${outgoing.size}):** ${outgoing.map(r => r.tag || r.id).slice(0,15).join(', ') || 'None'}`;
      await message.reply(msg);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'blocklist') {
    try {
      const blocked = client.relationships.blockedCache;
      if (!blocked.size) return message.reply('No blocked users.');
      const list = blocked.map(r => `**${r.tag || r.id}**`).slice(0, 30);
      await message.reply(`**Blocked Users (${blocked.size}):**\n${list.join('\n')}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'friendnick') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const nick = args.slice(message.mentions.users.size ? 1 : 1).join(' ');
      await client.relationships.setNickname(user.id, nick);
      await message.reply(`Set friend nickname for **${user.tag}** to **${nick || 'none'}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'note') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const text = args.slice(message.mentions.users.size ? 1 : 1).join(' ');
      if (text) {
        await user.setNote(text);
        await message.reply(`Note set for **${user.tag}**: ${text}`);
      } else {
        const note = await user.getNote();
        await message.reply(`**${user.tag}** note: ${note || 'No note set'}`);
      }
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'friendinvite') {
    try {
      const invite = await client.user.createFriendInvite();
      await message.reply(`**Friend Invite:** https://discord.gg/${invite.code}\nExpires: <t:${Math.floor(invite.expiresTimestamp / 1000)}:R>\nMax uses: ${invite.maxUses}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'allfriends') {
    try {
      const friends = client.relationships.friendCache;
      let online = 0, idle = 0, dnd = 0, offline = 0;
      friends.forEach(r => {
        const u = client.users.cache.get(r.id);
        const s = u?.presence?.status || 'offline';
        if (s === 'online') online++; else if (s === 'idle') idle++; else if (s === 'dnd') dnd++; else offline++;
      });
      await message.reply(`**Friends Breakdown (${friends.size} total):**\n🟢 Online: ${online}\n🟡 Idle: ${idle}\n🔴 DnD: ${dnd}\n⚫ Offline: ${offline}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'mutualfriends') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const profile = await user.getProfile();
      const mutuals = profile.mutualFriends || [];
      if (!mutuals.length) return message.reply(`No mutual friends with **${user.tag}**`);
      const list = mutuals.map(u => `**${u.tag || u.id}**`).slice(0, 20);
      await message.reply(`**Mutual Friends with ${user.tag} (${mutuals.length}):**\n${list.join('\n')}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  // ========== GUILD MANAGEMENT ==========

  else if (command === 'setservername') {
    if (!message.guild) return message.reply('Server only.');
    if (!args.length) return message.reply('Usage: `setservername <name>`');
    try { await message.guild.setName(args.join(' ')); await message.reply(`Server name set to **${args.join(' ')}**`); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'setservericon') {
    if (!message.guild) return message.reply('Server only.');
    if (!args[0]) return message.reply('Usage: `setservericon <url>`');
    try { await message.guild.setIcon(args[0]); await message.reply('Server icon updated!'); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'setserverbanner') {
    if (!message.guild) return message.reply('Server only.');
    if (!args[0]) return message.reply('Usage: `setserverbanner <url>`');
    try { await message.guild.setBanner(args[0]); await message.reply('Server banner updated!'); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'kick') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const member = await message.guild.members.fetch(user.id);
      const reason = args.slice(1).join(' ') || 'No reason';
      await member.kick(reason);
      await message.reply(`Kicked **${user.tag}** — ${reason}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'ban') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const reason = args.slice(1).join(' ') || 'No reason';
      await message.guild.members.ban(user.id, { reason });
      await message.reply(`Banned **${user.tag}** — ${reason}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'unban') {
    if (!message.guild) return message.reply('Server only.');
    if (!args[0]) return message.reply('Usage: `unban <userId>`');
    try { await message.guild.members.unban(args[0]); await message.reply(`Unbanned user \`${args[0]}\``); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'timeout') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const minutes = parseInt(args[message.mentions.users.size ? 1 : 1]) || 5;
      const member = await message.guild.members.fetch(user.id);
      await member.timeout(minutes * 60000);
      await message.reply(`Timed out **${user.tag}** for ${minutes} minutes.`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'untimeout') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const member = await message.guild.members.fetch(user.id);
      await member.timeout(null);
      await message.reply(`Timeout removed for **${user.tag}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'banlist') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const bans = await message.guild.bans.fetch();
      if (!bans.size) return message.reply('No bans found.');
      const list = bans.map(b => `**${b.user.tag}** — ${b.reason || 'No reason'}`).slice(0, 20);
      await message.reply(`**Bans (${bans.size}):**\n${list.join('\n')}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'addrole') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const roleName = args.slice(message.mentions.users.size ? 1 : 1).join(' ');
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      if (!role) return message.reply('Role not found.');
      const member = await message.guild.members.fetch(user.id);
      await member.roles.add(role);
      await message.reply(`Added role **${role.name}** to **${user.tag}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'removerole') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const roleName = args.slice(message.mentions.users.size ? 1 : 1).join(' ');
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      if (!role) return message.reply('Role not found.');
      const member = await message.guild.members.fetch(user.id);
      await member.roles.remove(role);
      await message.reply(`Removed role **${role.name}** from **${user.tag}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'createrole') {
    if (!message.guild) return message.reply('Server only.');
    if (!args[0]) return message.reply('Usage: `createrole <name> [color]`');
    try {
      const color = args[1] ? parseInt(args[1].replace('#',''),16) : undefined;
      const role = await message.guild.roles.create({ name: args[0], color });
      await message.reply(`Created role **${role.name}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'deleterole') {
    if (!message.guild) return message.reply('Server only.');
    if (!args.length) return message.reply('Usage: `deleterole <name>`');
    try {
      const roleName = args.join(' ');
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      if (!role) return message.reply('Role not found.');
      await role.delete();
      await message.reply(`Deleted role **${roleName}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'createchannel') {
    if (!message.guild) return message.reply('Server only.');
    if (!args[0]) return message.reply('Usage: `createchannel <name> [text|voice]`');
    try {
      const type = args[1]?.toLowerCase() === 'voice' ? 'GUILD_VOICE' : 'GUILD_TEXT';
      const ch = await message.guild.channels.create(args[0], { type });
      await message.reply(`Created channel **${ch.name}** (${ch.type})`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'deletechannel') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const ch = message.mentions.channels.first() || message.channel;
      const name = ch.name;
      await ch.delete();
      if (ch.id !== message.channel.id) await message.reply(`Deleted channel **${name}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'clonechannel') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const cloned = await message.channel.clone();
      await cloned.send(`Cloned from **#${message.channel.name}**`);
      await message.reply(`Cloned channel: ${cloned}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'auditlog') {
    if (!message.guild) return message.reply('Server only.');
    try {
      const limit = Math.min(parseInt(args[0]) || 10, 20);
      const logs = await message.guild.fetchAuditLogs({ limit });
      const entries = logs.entries.map(e => `**${e.action}** by ${e.executor?.tag || 'Unknown'} — ${e.target?.tag || e.target?.name || 'Unknown'} (<t:${Math.floor(e.createdTimestamp / 1000)}:R>)`);
      await message.reply(`**Audit Log (${entries.length}):**\n${entries.join('\n')}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'prune') {
    if (!message.guild) return message.reply('Server only.');
    const days = parseInt(args[0]) || 7;
    try {
      const pruned = await message.guild.members.prune({ days, dry: false });
      await message.reply(`Pruned **${pruned}** members (inactive ${days}+ days).`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'serveremoji') {
    if (!message.guild) return message.reply('Server only.');
    if (!args[0] || !args[1]) return message.reply('Usage: `serveremoji <name> <url>`');
    try {
      const emoji = await message.guild.emojis.create(args[1], args[0]);
      await message.reply(`Added emoji **${emoji.name}** ${emoji}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'removeemoji') {
    if (!message.guild) return message.reply('Server only.');
    if (!args[0]) return message.reply('Usage: `removeemoji <name>`');
    try {
      const emoji = message.guild.emojis.cache.find(e => e.name === args[0]);
      if (!emoji) return message.reply('Emoji not found.');
      await emoji.delete();
      await message.reply(`Removed emoji **${args[0]}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  // ========== MESSAGES (NEW) ==========

  else if (command === 'forward') {
    try {
      const ref = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;
      if (!ref) return message.reply('Reply to a message to forward it.');
      const ch = message.mentions.channels.first() || client.channels.cache.get(args[0]);
      if (!ch) return message.reply('Usage: `forward <#channel>` (reply to a message)');
      await ch.send({ content: ref.content || undefined, embeds: ref.embeds, files: ref.attachments.map(a => a.url) });
      await message.reply(`Forwarded to ${ch}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'crosspost') {
    try {
      const ref = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;
      if (!ref) return message.reply('Reply to a message to crosspost it.');
      await ref.crosspost();
      await message.reply('Message crossposted!');
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'markread') {
    try { await message.channel.markAsRead(); await message.reply('Channel marked as read.'); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'markallread') {
    try {
      let count = 0;
      for (const guild of client.guilds.cache.values()) {
        try { await guild.markAsRead(); count++; } catch {}
      }
      await message.reply(`Marked **${count}** guilds as read.`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'suppress') {
    try {
      const ref = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;
      if (!ref) return message.reply('Reply to a message.');
      await ref.suppressEmbeds(true);
      await message.reply('Embeds suppressed.');
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'unsuppress') {
    try {
      const ref = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;
      if (!ref) return message.reply('Reply to a message.');
      await ref.suppressEmbeds(false);
      await message.reply('Embeds restored.');
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'thread') {
    if (!args.length) return message.reply('Usage: `thread <name>` (reply to a message)');
    try {
      const ref = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;
      if (!ref) return message.reply('Reply to a message to create a thread.');
      const thread = await ref.startThread({ name: args.join(' ') });
      await message.reply(`Thread created: ${thread}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'closethread') {
    try {
      if (!message.channel.isThread()) return message.reply('This is not a thread.');
      await message.channel.setArchived(true);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'pinall') {
    try {
      const count = Math.min(parseInt(args[0]) || 5, 10);
      const msgs = await message.channel.messages.fetch({ limit: count + 1 });
      let pinned = 0;
      for (const m of msgs.values()) {
        if (m.id === message.id) continue;
        try { await m.pin(); pinned++; } catch { break; }
      }
      await message.reply(`Pinned **${pinned}** messages.`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'unpinall') {
    try {
      const pinned = await message.channel.messages.fetchPinned();
      let count = 0;
      for (const m of pinned.values()) {
        try { await m.unpin(); count++; } catch {}
      }
      await message.reply(`Unpinned **${count}** messages.`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'massforward') {
    try {
      const ch = message.mentions.channels.first() || client.channels.cache.get(args[0]);
      const count = Math.min(parseInt(args[1] || args[0]) || 5, 20);
      if (!ch) return message.reply('Usage: `massforward <#channel> <count>`');
      const msgs = await message.channel.messages.fetch({ limit: count + 1 });
      let sent = 0;
      for (const m of [...msgs.values()].reverse()) {
        if (m.id === message.id) continue;
        try { await ch.send({ content: `**${m.author.tag}:** ${m.content || '(no content)'}`, files: m.attachments.map(a => a.url) }); sent++; } catch {}
      }
      await message.reply(`Forwarded **${sent}** messages to ${ch}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'superreact') {
    try {
      const ref = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;
      if (!ref) return message.reply('Reply to a message.');
      const emoji = args[0] || '🔥';
      await ref.react(emoji, true);
      await message.reply(`Super reacted with ${emoji}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'reactall') {
    try {
      const emoji = args[0] || '👍';
      const count = Math.min(parseInt(args[1]) || 5, 15);
      const msgs = await message.channel.messages.fetch({ limit: count + 1 });
      let reacted = 0;
      for (const m of msgs.values()) {
        if (m.id === message.id) continue;
        try { await m.react(emoji); reacted++; } catch {}
      }
      await message.reply(`Reacted to **${reacted}** messages with ${emoji}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'unreact') {
    try {
      const ref = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;
      if (!ref) return message.reply('Reply to a message.');
      const emoji = args[0] || '👍';
      const reaction = ref.reactions.cache.find(r => r.emoji.name === emoji || r.emoji.toString() === emoji);
      if (reaction) await reaction.users.remove(client.user.id);
      await message.reply(`Removed reaction ${emoji}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'search') {
    if (!args.length) return message.reply('Usage: `search <text>`');
    try {
      const query = args.join(' ').toLowerCase();
      const msgs = await message.channel.messages.fetch({ limit: 100 });
      const found = msgs.filter(m => m.content.toLowerCase().includes(query));
      if (!found.size) return message.reply('No messages found.');
      const results = found.first(10).map(m => `**${m.author.tag}** (<t:${Math.floor(m.createdTimestamp/1000)}:R>): ${m.content.slice(0,80)}`);
      await message.reply(`**Found ${found.size} messages matching "${args.join(' ')}":**\n${results.join('\n')}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  // ========== TEXT TRANSFORMS (NEW) ==========

  else if (command === 'emojify') {
    if (!args.length) return message.reply('Usage: `emojify <text>`');
    const text = args.join(' ').toLowerCase();
    const result = text.split('').map(c => emojiLetterMap[c] || c).join(' ');
    await message.channel.send(result.slice(0, 2000));
  }

  else if (command === 'boxtext') {
    if (!args.length) return message.reply('Usage: `boxtext <text>`');
    const text = args.join(' ');
    const top = '╔' + '═'.repeat(text.length + 2) + '╗';
    const mid = '║ ' + text + ' ║';
    const bot = '╚' + '═'.repeat(text.length + 2) + '╝';
    await message.channel.send(`\`\`\`\n${top}\n${mid}\n${bot}\n\`\`\``);
  }

  else if (command === 'gradient') {
    if (!args.length) return message.reply('Usage: `gradient <text>`');
    const text = args.join(' ');
    const colors = [31,33,32,36,34,35];
    const result = text.split('').map((c,i) => `\x1b[${colors[i % colors.length]}m${c}`).join('');
    await message.channel.send(`\`\`\`ansi\n${result}\x1b[0m\n\`\`\``);
  }

  else if (command === 'rainbow') {
    if (!args.length) return message.reply('Usage: `rainbow <text>`');
    const text = args.join(' ');
    const colors = [31,33,32,36,34,35];
    const result = text.split('').map((c,i) => `\x1b[1;${colors[i % colors.length]}m${c}`).join('');
    await message.channel.send(`\`\`\`ansi\n${result}\x1b[0m\n\`\`\``);
  }

  else if (command === 'matrix') {
    if (!args.length) return message.reply('Usage: `matrix <text>`');
    const text = args.join(' ');
    const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ01234567890';
    let lines = [];
    for (let i = 0; i < 3; i++) {
      let line = '';
      for (let j = 0; j < text.length + 10; j++) line += chars[Math.floor(Math.random() * chars.length)];
      lines.push(line);
    }
    lines.push('  ' + text.split('').join(' ') + '  ');
    for (let i = 0; i < 3; i++) {
      let line = '';
      for (let j = 0; j < text.length + 10; j++) line += chars[Math.floor(Math.random() * chars.length)];
      lines.push(line);
    }
    await message.channel.send(`\`\`\`\n${lines.join('\n')}\n\`\`\``);
  }

  else if (command === 'glitch') {
    if (!args.length) return message.reply('Usage: `glitch <text>`');
    const text = args.join(' ');
    const glitchChars = ['̸','̵','̶','̷','̴','̨','̡','̢','̧'];
    const result = text.split('').map(c => c + glitchChars[Math.floor(Math.random()*glitchChars.length)] + (Math.random()>0.5 ? glitchChars[Math.floor(Math.random()*glitchChars.length)] : '')).join('');
    await message.channel.send(result);
  }

  else if (command === 'morse') {
    if (!args.length) return message.reply('Usage: `morse <text>`');
    const text = args.join(' ');
    if (text.includes('.') || text.includes('-')) {
      const decoded = text.split(' / ').map(word => word.split(' ').map(c => morseRev[c] || c).join('')).join(' ');
      await message.channel.send(`**Decoded:** ${decoded}`);
    } else {
      const encoded = text.toLowerCase().split('').map(c => morseMap[c] || c).join(' ');
      await message.channel.send(`**Morse:** ${encoded}`);
    }
  }

  else if (command === 'binary') {
    if (!args.length) return message.reply('Usage: `binary <text>`');
    const text = args.join(' ');
    if (/^[01\s]+$/.test(text)) {
      const decoded = text.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
      await message.channel.send(`**Decoded:** ${decoded}`);
    } else {
      const encoded = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      await message.channel.send(`**Binary:** ${encoded}`);
    }
  }

  else if (command === 'hextext') {
    if (!args.length) return message.reply('Usage: `hextext <text>`');
    const text = args.join(' ');
    if (/^[0-9a-fA-F\s]+$/.test(text) && text.includes(' ')) {
      const decoded = text.split(' ').map(h => String.fromCharCode(parseInt(h, 16))).join('');
      await message.channel.send(`**Decoded:** ${decoded}`);
    } else {
      const encoded = text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
      await message.channel.send(`**Hex:** ${encoded}`);
    }
  }

  else if (command === 'rot13') {
    if (!args.length) return message.reply('Usage: `rot13 <text>`');
    const result = args.join(' ').replace(/[a-zA-Z]/g, c => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
    await message.channel.send(`**ROT13:** ${result}`);
  }

  else if (command === 'pig') {
    if (!args.length) return message.reply('Usage: `pig <text>`');
    const result = args.map(word => {
      const lower = word.toLowerCase();
      const vowels = 'aeiou';
      if (vowels.includes(lower[0])) return word + 'yay';
      const idx = lower.split('').findIndex(c => vowels.includes(c));
      if (idx === -1) return word + 'ay';
      return word.slice(idx) + word.slice(0, idx) + 'ay';
    }).join(' ');
    await message.channel.send(`**Pig Latin:** ${result}`);
  }

  else if (command === 'stutter') {
    if (!args.length) return message.reply('Usage: `stutter <text>`');
    const result = args.map(word => {
      const repeats = Math.floor(Math.random() * 3) + 1;
      const prefix = word.slice(0, Math.min(2, word.length));
      return (prefix + '-').repeat(repeats) + word;
    }).join(' ');
    await message.channel.send(result);
  }

  else if (command === 'fancy') {
    if (!args.length) return message.reply('Usage: `fancy <text>`');
    const result = args.join(' ').split('').map(c => fancyMap[c] || c).join('');
    await message.channel.send(result);
  }

  else if (command === 'gothic') {
    if (!args.length) return message.reply('Usage: `gothic <text>`');
    const result = args.join(' ').split('').map(c => gothicMap[c] || c).join('');
    await message.channel.send(result);
  }

  else if (command === 'monospace') {
    if (!args.length) return message.reply('Usage: `monospace <text>`');
    const result = args.join(' ').split('').map(c => monoMap[c] || c).join('');
    await message.channel.send(result);
  }

  else if (command === 'double') {
    if (!args.length) return message.reply('Usage: `double <text>`');
    const result = args.join(' ').split('').map(c => doubleMap[c] || c).join('');
    await message.channel.send(result);
  }

  else if (command === 'smallcaps') {
    if (!args.length) return message.reply('Usage: `smallcaps <text>`');
    const result = args.join(' ').toLowerCase().split('').map(c => smallcapsMap[c] || c).join('');
    await message.channel.send(result);
  }

  else if (command === 'superscript') {
    if (!args.length) return message.reply('Usage: `superscript <text>`');
    const result = args.join(' ').split('').map(c => tinyMap[c] || c).join('');
    await message.channel.send(result);
  }

  else if (command === 'subscript') {
    if (!args.length) return message.reply('Usage: `subscript <text>`');
    const result = args.join(' ').toLowerCase().split('').map(c => subscriptMap[c] || c).join('');
    await message.channel.send(result);
  }

  // ========== FUN (NEW) ==========

  else if (command === 'trivia') {
    const q = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
    await message.channel.send(`**Trivia:** ${q.q}\n||**Answer:** ${q.a}||`);
  }

  else if (command === 'riddle') {
    const r = riddles[Math.floor(Math.random() * riddles.length)];
    await message.channel.send(`**Riddle:** ${r.q}\n||**Answer:** ${r.a}||`);
  }

  else if (command === 'wyr') {
    const q = wyrQuestions[Math.floor(Math.random() * wyrQuestions.length)];
    await message.channel.send(`**Would You Rather:**\n${q}`);
  }

  else if (command === 'truth') {
    const q = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
    await message.channel.send(`**Truth:** ${q}`);
  }

  else if (command === 'dare') {
    const d = dareQuestions[Math.floor(Math.random() * dareQuestions.length)];
    await message.channel.send(`**Dare:** ${d}`);
  }

  else if (command === 'pickup') {
    const p = pickupLines[Math.floor(Math.random() * pickupLines.length)];
    await message.channel.send(`**Pickup Line:** ${p}`);
  }

  else if (command === 'shower') {
    const s = showerThoughts[Math.floor(Math.random() * showerThoughts.length)];
    await message.channel.send(`**Shower Thought:** ${s}`);
  }

  else if (command === 'fortune') {
    const f = fortunes[Math.floor(Math.random() * fortunes.length)];
    await message.channel.send(`🥠 **Fortune Cookie:** ${f}`);
  }

  else if (command === 'ascii-art') {
    if (!args.length) return message.reply('Usage: `ascii-art <text>`');
    const text = args.join(' ').toUpperCase().slice(0, 10);
    const font = {
      A:['  #  ','  #  ',' # # ','#####','#   #'], B:['#### ','#   #','#### ','#   #','#### '],
      C:['#####','#    ','#    ','#    ','#####'], D:['#### ','#   #','#   #','#   #','#### '],
      E:['#####','#    ','#### ','#    ','#####'], F:['#####','#    ','#### ','#    ','#    '],
      G:['#####','#    ','# ###','#   #','#####'], H:['#   #','#   #','#####','#   #','#   #'],
      I:['#####','  #  ','  #  ','  #  ','#####'], J:['#####','   # ','   # ','#  # ','#### '],
      K:['#   #','#  # ','###  ','#  # ','#   #'], L:['#    ','#    ','#    ','#    ','#####'],
      M:['#   #','## ##','# # #','#   #','#   #'], N:['#   #','##  #','# # #','#  ##','#   #'],
      O:['#####','#   #','#   #','#   #','#####'], P:['#####','#   #','#####','#    ','#    '],
      Q:['#####','#   #','# # #','#  ##','#####'], R:['#####','#   #','#####','#  # ','#   #'],
      S:['#####','#    ','#####','    #','#####'], T:['#####','  #  ','  #  ','  #  ','  #  '],
      U:['#   #','#   #','#   #','#   #','#####'], V:['#   #','#   #','#   #',' # # ','  #  '],
      W:['#   #','#   #','# # #','## ##','#   #'], X:['#   #',' # # ','  #  ',' # # ','#   #'],
      Y:['#   #',' # # ','  #  ','  #  ','  #  '], Z:['#####','   # ','  #  ',' #   ','#####'],
      ' ':['     ','     ','     ','     ','     '],
    };
    const lines = [[], [], [], [], []];
    for (const c of text) {
      const ch = font[c] || font[' '];
      for (let i = 0; i < 5; i++) lines[i].push(ch[i]);
    }
    const result = lines.map(l => l.join(' ')).join('\n');
    await message.channel.send(`\`\`\`\n${result}\n\`\`\``);
  }

  else if (command === 'dicewar') {
    const yours = Math.floor(Math.random() * 6) + 1;
    const mine = Math.floor(Math.random() * 6) + 1;
    const result = yours > mine ? '**You win!** 🎉' : yours < mine ? '**I win!** 😎' : '**Tie!** 🤝';
    await message.channel.send(`🎲 You rolled **${yours}** | I rolled **${mine}**\n${result}`);
  }

  else if (command === 'numberguess') {
    const target = Math.floor(Math.random() * 100) + 1;
    numberGuessGames.set(message.author.id, { target, attempts: 0, channel: message.channel.id });
    await message.channel.send('🔢 I picked a number between **1-100**. Type a number to guess! (Type `giveup` to quit)');
    const filter = m => m.author.id === message.author.id && m.channel.id === message.channel.id;
    const collector = message.channel.createMessageCollector({ filter, time: 60000 });
    collector.on('collect', async (m) => {
      const game = numberGuessGames.get(m.author.id);
      if (!game) return collector.stop();
      if (m.content.toLowerCase() === 'giveup') {
        await m.reply(`You gave up! The number was **${game.target}**`);
        numberGuessGames.delete(m.author.id);
        return collector.stop();
      }
      const guess = parseInt(m.content);
      if (isNaN(guess)) return;
      game.attempts++;
      if (guess === game.target) {
        await m.reply(`🎉 Correct! The number was **${game.target}**! You got it in **${game.attempts}** attempts.`);
        numberGuessGames.delete(m.author.id);
        collector.stop();
      } else if (Math.abs(guess - game.target) <= 5) {
        await m.reply('🔥 **Burning hot!**');
      } else if (Math.abs(guess - game.target) <= 15) {
        await m.reply('🌡️ **Warm!**');
      } else if (Math.abs(guess - game.target) <= 30) {
        await m.reply('❄️ **Cold...**');
      } else {
        await m.reply('🧊 **Freezing cold!**');
      }
    });
    collector.on('end', () => numberGuessGames.delete(message.author.id));
  }

  else if (command === 'hangman') {
    const words = ['javascript','discord','selfbot','programming','keyboard','elephant','horizon','quantum','galaxy','python','algorithm','database','terminal','internet','spectrum'];
    const word = (args[0] || words[Math.floor(Math.random() * words.length)]).toLowerCase();
    let guessed = new Set();
    let wrong = 0;
    const maxWrong = 6;
    const stages = ['```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```'];
    const display = () => word.split('').map(c => guessed.has(c) ? c : '_').join(' ');
    await message.channel.send(`**Hangman!** Guess letters.\n${stages[0]}\n\`${display()}\``);
    const filter = m => m.author.id === message.author.id && m.content.length === 1 && /[a-z]/i.test(m.content);
    const collector = message.channel.createMessageCollector({ filter, time: 120000 });
    collector.on('collect', async (m) => {
      const letter = m.content.toLowerCase();
      if (guessed.has(letter)) return m.reply('Already guessed!');
      guessed.add(letter);
      if (!word.includes(letter)) wrong++;
      const disp = display();
      if (wrong >= maxWrong) {
        await m.reply(`${stages[wrong]}\n**Game Over!** The word was **${word}**`);
        collector.stop();
      } else if (!disp.includes('_')) {
        await m.reply(`${stages[wrong]}\n\`${disp}\`\n🎉 **You win!**`);
        collector.stop();
      } else {
        await m.reply(`${stages[wrong]}\n\`${disp}\`\nWrong: ${wrong}/${maxWrong} | Guessed: ${[...guessed].join(', ')}`);
      }
    });
  }

  else if (command === 'tictactoe') {
    const board = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
    const display = () => `${board[0]}${board[1]}${board[2]}\n${board[3]}${board[4]}${board[5]}\n${board[6]}${board[7]}${board[8]}`;
    await message.channel.send(`**Tic-Tac-Toe!** Type 1-9 to place ❌\n${display()}`);
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const check = (mark) => wins.some(([a,b,c]) => board[a]===mark && board[b]===mark && board[c]===mark);
    const filter = m => m.author.id === message.author.id && /^[1-9]$/.test(m.content);
    const collector = message.channel.createMessageCollector({ filter, time: 120000 });
    collector.on('collect', async (m) => {
      const pos = parseInt(m.content) - 1;
      if (board[pos] === '❌' || board[pos] === '⭕') return m.reply('Spot taken!');
      board[pos] = '❌';
      if (check('❌')) { await m.reply(`${display()}\n🎉 **You win!**`); return collector.stop(); }
      const empty = board.map((v,i) => v!=='❌'&&v!=='⭕' ? i : -1).filter(i=>i>=0);
      if (!empty.length) { await m.reply(`${display()}\n🤝 **Draw!**`); return collector.stop(); }
      board[empty[Math.floor(Math.random()*empty.length)]] = '⭕';
      if (check('⭕')) { await m.reply(`${display()}\n😎 **I win!**`); return collector.stop(); }
      const empty2 = board.map((v,i) => v!=='❌'&&v!=='⭕' ? i : -1).filter(i=>i>=0);
      if (!empty2.length) { await m.reply(`${display()}\n🤝 **Draw!**`); return collector.stop(); }
      await m.reply(display());
    });
  }

  else if (command === 'connect4') {
    const rows = 6, cols = 7;
    const grid = Array.from({length: rows}, () => Array(cols).fill('⚫'));
    const display = () => grid.map(r => r.join('')).join('\n') + '\n1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣';
    await message.channel.send(`**Connect 4!** Type 1-7 to drop 🔴\n${display()}`);
    const drop = (col, piece) => { for (let r = rows-1; r >= 0; r--) if (grid[r][col]==='⚫') { grid[r][col]=piece; return r; } return -1; };
    const checkWin = (piece) => {
      for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
        if (c+3<cols && [0,1,2,3].every(i=>grid[r][c+i]===piece)) return true;
        if (r+3<rows && [0,1,2,3].every(i=>grid[r+i][c]===piece)) return true;
        if (r+3<rows&&c+3<cols && [0,1,2,3].every(i=>grid[r+i][c+i]===piece)) return true;
        if (r+3<rows&&c-3>=0 && [0,1,2,3].every(i=>grid[r+i][c-i]===piece)) return true;
      }
      return false;
    };
    const filter = m => m.author.id === message.author.id && /^[1-7]$/.test(m.content);
    const collector = message.channel.createMessageCollector({ filter, time: 180000 });
    collector.on('collect', async (m) => {
      const col = parseInt(m.content)-1;
      if (drop(col,'🔴')===-1) return m.reply('Column full!');
      if (checkWin('🔴')) { await m.reply(`${display()}\n🎉 **You win!**`); return collector.stop(); }
      const validCols = Array.from({length:cols},(_,i)=>i).filter(c=>grid[0][c]==='⚫');
      if (!validCols.length) { await m.reply(`${display()}\n🤝 **Draw!**`); return collector.stop(); }
      drop(validCols[Math.floor(Math.random()*validCols.length)],'🟡');
      if (checkWin('🟡')) { await m.reply(`${display()}\n😎 **I win!**`); return collector.stop(); }
      await m.reply(display());
    });
  }

  else if (command === 'russian-roulette') {
    const bang = Math.floor(Math.random() * 6) === 0;
    if (bang) {
      await message.channel.send('🔫 **BANG!** 💀 You died.');
    } else {
      await message.channel.send('🔫 *click* ... You survived! 😅');
    }
  }

  else if (command === 'slot-jackpot') {
    const symbols = ['🍒','🍋','🍊','🍇','🔔','⭐','💎','7️⃣'];
    const r = () => symbols[Math.floor(Math.random() * symbols.length)];
    const rows = [[r(),r(),r()],[r(),r(),r()],[r(),r(),r()]];
    const mid = rows[1];
    let display = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
    let result = '';
    if (mid[0]===mid[1]&&mid[1]===mid[2]) {
      if (mid[0]==='7️⃣') result = '🎰 **MEGA JACKPOT!!!** 🎰💰💰💰';
      else if (mid[0]==='💎') result = '💎 **DIAMOND JACKPOT!** 💎💰💰';
      else result = `**THREE ${mid[0]}!** You win! 🎉`;
    } else if (mid[0]===mid[1]||mid[1]===mid[2]||mid[0]===mid[2]) {
      result = '**Two of a kind!** Small win.';
    } else {
      result = 'No match. Better luck next time!';
    }
    await message.channel.send(`🎰 **Jackpot Slots**\n${display}\n▶️ ${mid.join(' | ')} ◀️\n${result}`);
  }

  else if (command === 'lottery') {
    const pick = (args.length >= 5) ? args.slice(0,5).map(Number) : Array.from({length:5},()=>Math.floor(Math.random()*50)+1);
    const winning = Array.from({length:5},()=>Math.floor(Math.random()*50)+1);
    const matches = pick.filter(n => winning.includes(n)).length;
    let prize = matches === 5 ? '🎉 **JACKPOT!!! ALL 5 MATCH!**' : matches >= 3 ? `🏆 **${matches} matches!** Nice!` : matches > 0 ? `${matches} match(es). Better luck next time.` : 'No matches. Try again!';
    await message.channel.send(`🎟️ **Lottery Draw**\nYour numbers: ${pick.join(', ')}\nWinning numbers: ${winning.join(', ')}\n${prize}`);
  }

  else if (command === 'blackjack-double') {
    const deck = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const val = c => c==='A'?11:['J','Q','K'].includes(c)?10:parseInt(c);
    const hand = [deck[Math.floor(Math.random()*13)], deck[Math.floor(Math.random()*13)]];
    const dealer = [deck[Math.floor(Math.random()*13)], deck[Math.floor(Math.random()*13)]];
    let total = hand.reduce((s,c)=>s+val(c),0);
    let dTotal = dealer.reduce((s,c)=>s+val(c),0);
    if (total > 21) total -= 10;
    if (dTotal > 21) dTotal -= 10;
    while (dTotal < 17) { const c = deck[Math.floor(Math.random()*13)]; dealer.push(c); dTotal += val(c); if (dTotal > 21) dTotal -= 10; }
    // Double down: one more card
    const extra = deck[Math.floor(Math.random()*13)];
    hand.push(extra);
    total += val(extra);
    if (total > 21) total -= 10;
    const result = total > 21 ? '**Bust! You lose.**' : dTotal > 21 ? '**Dealer busts! You win!** 🎉' : total > dTotal ? '**You win!** 🎉' : total < dTotal ? '**Dealer wins.** 😔' : '**Push! (Tie)**';
    await message.channel.send(`🃏 **Blackjack (Double Down)**\nYour hand: ${hand.join(', ')} (${total})\nDealer: ${dealer.join(', ')} (${dTotal})\n${result}`);
  }

  else if (command === 'battle') {
    try {
      const user = message.mentions.users.first();
      if (!user) return message.reply('Usage: `battle <@user>`');
      let hp1 = 100, hp2 = 100;
      const attacks = ['slashes','punches','kicks','blasts','smashes','stabs','shoots','bites'];
      let log = `⚔️ **${message.author.username} vs ${user.username}!**\n`;
      while (hp1 > 0 && hp2 > 0) {
        const atk = attacks[Math.floor(Math.random()*attacks.length)];
        const dmg = Math.floor(Math.random()*25)+5;
        hp2 = Math.max(0, hp2-dmg);
        log += `${message.author.username} ${atk} for **${dmg}** dmg! (${user.username}: ${hp2} HP)\n`;
        if (hp2 <= 0) break;
        const atk2 = attacks[Math.floor(Math.random()*attacks.length)];
        const dmg2 = Math.floor(Math.random()*25)+5;
        hp1 = Math.max(0, hp1-dmg2);
        log += `${user.username} ${atk2} for **${dmg2}** dmg! (${message.author.username}: ${hp1} HP)\n`;
      }
      log += hp1 > 0 ? `\n🏆 **${message.author.username} wins!**` : `\n🏆 **${user.username} wins!**`;
      await message.channel.send(log.slice(0, 2000));
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'duel') {
    const user = message.mentions.users.first();
    if (!user) return message.reply('Usage: `duel <@user>`');
    await message.channel.send(`⚔️ **DUEL:** ${message.author.username} vs ${user.username}!\n3... 2... 1... **DRAW!**`);
    const winner = Math.random() > 0.5 ? message.author : user;
    setTimeout(() => {
      message.channel.send(`🔫 **${winner.username}** drew first and wins the duel!`);
    }, 1500 + Math.random() * 2000);
  }

  else if (command === 'heist') {
    const stages = [
      ['Sneaking past guards...', 0.7],
      ['Cracking the vault...', 0.6],
      ['Grabbing the loot...', 0.8],
      ['Escaping the building...', 0.5],
      ['Getaway car chase...', 0.6],
    ];
    let loot = parseInt(args[0]) || 1000;
    let log = `💰 **The Heist** — Target: $${loot}\n`;
    let success = true;
    for (const [stage, chance] of stages) {
      if (Math.random() < chance) {
        log += `✅ ${stage} Success!\n`;
      } else {
        log += `❌ ${stage} **FAILED!**\n`;
        success = false;
        break;
      }
    }
    log += success ? `\n🎉 **Heist successful!** You got away with **$${loot}**!` : `\n🚔 **Busted!** You lost everything!`;
    await message.channel.send(log);
  }

  else if (command === 'fish-rare') {
    const catches = [
      ['🐟 Common Fish', 30],['🐠 Tropical Fish', 20],['🐡 Pufferfish', 15],
      ['🦈 Shark!', 8],['🐙 Octopus', 10],['🦞 Lobster', 8],
      ['🐋 Whale!', 3],['👑 Golden Fish!', 2],['🧜 Mermaid!!', 1],
      ['🗑️ Old Boot', 10],['📦 Treasure Chest!', 3],
    ];
    const total = catches.reduce((s,c)=>s+c[1],0);
    let roll = Math.floor(Math.random()*total);
    let caught = catches[0][0];
    for (const [name, weight] of catches) {
      roll -= weight;
      if (roll <= 0) { caught = name; break; }
    }
    const rarity = caught.includes('!') ? '**RARE CATCH!**' : caught.includes('!!') ? '**LEGENDARY!!!**' : '';
    await message.channel.send(`🎣 You cast your line...\nYou caught: ${caught} ${rarity}`);
  }

  else if (command === 'pet') {
    let pet = petData.get(message.author.id);
    const sub = args[0]?.toLowerCase();
    if (!pet && sub !== 'create') {
      return message.reply('You have no pet! Use `pet create <name>` to get one.');
    }
    if (sub === 'create') {
      const name = args.slice(1).join(' ') || 'Buddy';
      const types = ['🐶 Dog','🐱 Cat','🐰 Rabbit','🐹 Hamster','🐦 Bird','🐢 Turtle'];
      const type = types[Math.floor(Math.random()*types.length)];
      pet = { name, type, hunger: 100, happiness: 100, created: Date.now() };
      petData.set(message.author.id, pet);
      await message.reply(`You adopted a ${type} named **${name}**! 🎉`);
    } else if (sub === 'feed') {
      pet.hunger = Math.min(100, pet.hunger + 20);
      petData.set(message.author.id, pet);
      await message.reply(`You fed **${pet.name}**! Hunger: ${pet.hunger}/100`);
    } else if (sub === 'play') {
      pet.happiness = Math.min(100, pet.happiness + 20);
      pet.hunger = Math.max(0, pet.hunger - 10);
      petData.set(message.author.id, pet);
      await message.reply(`You played with **${pet.name}**! Happiness: ${pet.happiness}/100`);
    } else {
      const age = Math.floor((Date.now() - pet.created) / 60000);
      await message.reply(`**${pet.name}** (${pet.type})\nHunger: ${'🟩'.repeat(Math.floor(pet.hunger/10))}${'⬛'.repeat(10-Math.floor(pet.hunger/10))} ${pet.hunger}/100\nHappiness: ${'🟩'.repeat(Math.floor(pet.happiness/10))}${'⬛'.repeat(10-Math.floor(pet.happiness/10))} ${pet.happiness}/100\nAge: ${age} minutes`);
    }
  }

  else if (command === 'achievement') {
    if (!args.length) return message.reply('Usage: `achievement <text>`');
    const text = args.join(' ');
    await message.channel.send(`\`\`\`\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n  🏆 Achievement Get!\n  ${text}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\`\`\``);
  }

  else if (command === 'haiku') {
    const h = haikus[Math.floor(Math.random() * haikus.length)];
    await message.channel.send(`🍃 **Haiku:**\n*${h}*`);
  }

  // ========== UTILITY (NEW) ==========

  else if (command === 'servercount') {
    const total = client.guilds.cache.reduce((sum, g) => sum + g.memberCount, 0);
    await message.reply(`Total members across **${client.guilds.cache.size}** servers: **${total.toLocaleString()}**`);
  }

  else if (command === 'channelcount') {
    const total = client.channels.cache.size;
    await message.reply(`Total channels across all servers: **${total.toLocaleString()}**`);
  }

  else if (command === 'rolecount') {
    const roles = new Set();
    client.guilds.cache.forEach(g => g.roles.cache.forEach(r => roles.add(r.name)));
    await message.reply(`Total unique role names: **${roles.size.toLocaleString()}**`);
  }

  else if (command === 'emojicount') {
    const total = client.guilds.cache.reduce((sum, g) => sum + g.emojis.cache.size, 0);
    await message.reply(`Total emojis across all servers: **${total.toLocaleString()}**`);
  }

  else if (command === 'oldest') {
    if (!message.guild) return message.reply('Server only.');
    const members = await message.guild.members.fetch();
    const oldest = members.sort((a, b) => a.user.createdTimestamp - b.user.createdTimestamp).first();
    await message.reply(`Oldest account: **${oldest.user.tag}** — Created <t:${Math.floor(oldest.user.createdTimestamp / 1000)}:R>`);
  }

  else if (command === 'youngest') {
    if (!message.guild) return message.reply('Server only.');
    const members = await message.guild.members.fetch();
    const youngest = members.sort((a, b) => b.user.createdTimestamp - a.user.createdTimestamp).first();
    await message.reply(`Newest account: **${youngest.user.tag}** — Created <t:${Math.floor(youngest.user.createdTimestamp / 1000)}:R>`);
  }

  else if (command === 'firstjoin') {
    if (!message.guild) return message.reply('Server only.');
    const members = await message.guild.members.fetch();
    const first = members.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp).first();
    await message.reply(`First to join: **${first.user.tag}** — Joined <t:${Math.floor(first.joinedTimestamp / 1000)}:R>`);
  }

  else if (command === 'lastjoin') {
    if (!message.guild) return message.reply('Server only.');
    const members = await message.guild.members.fetch();
    const last = members.sort((a, b) => b.joinedTimestamp - a.joinedTimestamp).first();
    await message.reply(`Most recent join: **${last.user.tag}** — Joined <t:${Math.floor(last.joinedTimestamp / 1000)}:R>`);
  }

  else if (command === 'serverboost') {
    if (!message.guild) return message.reply('Server only.');
    const g = message.guild;
    await message.reply(`**Boost Info for ${g.name}:**\nLevel: ${g.premiumTier}\nBoosts: ${g.premiumSubscriptionCount}\nBoosters: ${g.members.cache.filter(m => m.premiumSince).size}`);
  }

  else if (command === 'permissions') {
    if (!message.guild) return message.reply('Server only.');
    const ch = message.mentions.channels.first() || message.channel;
    const perms = ch.permissionsFor(message.author);
    const list = perms.toArray().map(p => `\`${p}\``).join(', ');
    await message.reply(`**Your permissions in ${ch}:**\n${list}`);
  }

  else if (command === 'snowflake') {
    if (!args[0]) return message.reply('Usage: `snowflake <id>`');
    try {
      const id = BigInt(args[0]);
      const timestamp = Number((id >> 22n) + 1420070400000n);
      const date = new Date(timestamp);
      await message.reply(`**Snowflake ${args[0]}:**\nCreated: ${date.toUTCString()}\nTimestamp: <t:${Math.floor(timestamp/1000)}:F>\nRelative: <t:${Math.floor(timestamp/1000)}:R>`);
    } catch (e) { await message.reply(`Invalid snowflake ID.`); }
  }

  else if (command === 'resolve') {
    if (!args[0]) return message.reply('Usage: `resolve <id>`');
    const id = args[0];
    let result = `**Resolving ${id}:**\n`;
    const user = client.users.cache.get(id);
    if (user) result += `User: **${user.tag}**\n`;
    const channel = client.channels.cache.get(id);
    if (channel) result += `Channel: **${channel.name || 'DM'}** (${channel.type})\n`;
    const guild = client.guilds.cache.get(id);
    if (guild) result += `Guild: **${guild.name}**\n`;
    if (message.guild) {
      const role = message.guild.roles.cache.get(id);
      if (role) result += `Role: **${role.name}**\n`;
      const emoji = message.guild.emojis.cache.get(id);
      if (emoji) result += `Emoji: **${emoji.name}** ${emoji}\n`;
    }
    try {
      const ts = Number((BigInt(id) >> 22n) + 1420070400000n);
      result += `Created: <t:${Math.floor(ts/1000)}:F>`;
    } catch {}
    await message.reply(result);
  }

  else if (command === 'ping-detailed') {
    const start = Date.now();
    const sent = await message.reply('Pinging...');
    const roundtrip = Date.now() - start;
    await sent.edit(`**Latency:**\nWebSocket: ${client.ws.ping}ms\nMessage roundtrip: ${roundtrip}ms\nAPI estimate: ${Math.abs(roundtrip - client.ws.ping)}ms`);
  }

  else if (command === 'memory') {
    const mem = process.memoryUsage();
    await message.reply(`**Memory Usage:**\nRSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB\nHeap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB\nHeap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB\nExternal: ${(mem.external / 1024 / 1024).toFixed(2)} MB`);
  }

  else if (command === 'system') {
    const os = require('os');
    await message.reply(`**System Info:**\nOS: ${os.type()} ${os.release()}\nPlatform: ${os.platform()} ${os.arch()}\nNode.js: ${process.version}\nCPUs: ${os.cpus().length}\nMemory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB total\nUptime: ${(os.uptime() / 3600).toFixed(1)} hours`);
  }

  else if (command === 'envinfo') {
    await message.reply(`**Environment:**\nNode: ${process.version}\nPlatform: ${process.platform}\nArch: ${process.arch}\nPID: ${process.pid}\nCWD: ${process.cwd()}\nGuilds: ${client.guilds.cache.size}\nChannels: ${client.channels.cache.size}\nUsers cached: ${client.users.cache.size}`);
  }

  else if (command === 'uptime-detailed') {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    const secs = Math.floor(uptime % 60);
    const startTime = new Date(Date.now() - uptime * 1000);
    await message.reply(`**Uptime:** ${days}d ${hours}h ${mins}m ${secs}s\n**Started:** ${startTime.toUTCString()}\n**Timestamp:** <t:${Math.floor(startTime.getTime()/1000)}:F>`);
  }

  else if (command === 'charmap') {
    if (!args[0]) return message.reply('Usage: `charmap <char>`');
    const ch = args[0];
    const code = ch.codePointAt(0);
    await message.reply(`**Character Info: ${ch}**\nCodepoint: U+${code.toString(16).toUpperCase().padStart(4,'0')}\nDecimal: ${code}\nHTML: &#${code};\nUTF-8 bytes: ${Buffer.from(ch).length}\nCategory: ${code < 128 ? 'ASCII' : code < 0xFFFF ? 'BMP' : 'Supplementary'}`);
  }

  else if (command === 'randomuser') {
    if (!message.guild) return message.reply('Server only.');
    const members = message.guild.members.cache;
    const random = members.random();
    await message.reply(`🎲 Random member: **${random.user.tag}** (${random.user.id})`);
  }

  else if (command === 'randomchannel') {
    if (!message.guild) return message.reply('Server only.');
    const channels = message.guild.channels.cache.filter(c => c.type === 'GUILD_TEXT');
    const random = channels.random();
    await message.reply(`🎲 Random channel: ${random} (**${random.name}**)`);
  }

  // ========== GROUP DM ==========

  else if (command === 'groupcreate') {
    try {
      const users = message.mentions.users;
      if (users.size < 1) return message.reply('Usage: `groupcreate <@user1> <@user2> ...`');
      const group = await client.channels.createGroupDM(users.map(u => u.id));
      await message.reply(`Group DM created with ${users.size} users! ID: \`${group.id}\``);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'groupadd') {
    try {
      if (!message.channel.type === 'GROUP_DM') return message.reply('Use in a group DM.');
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      await message.channel.addMember(user.id);
      await message.reply(`Added **${user.tag}** to the group.`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'groupremove') {
    try {
      if (!message.channel.type === 'GROUP_DM') return message.reply('Use in a group DM.');
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      await message.channel.removeMember(user.id);
      await message.reply(`Removed **${user.tag}** from the group.`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'groupname') {
    try {
      if (!args.length) return message.reply('Usage: `groupname <name>`');
      await message.channel.setName(args.join(' '));
      await message.reply(`Group name set to **${args.join(' ')}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'groupicon') {
    try {
      if (!args[0]) return message.reply('Usage: `groupicon <url>`');
      await message.channel.setIcon(args[0]);
      await message.reply('Group icon updated!');
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'groupleave') {
    try {
      await message.channel.leave();
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'grouplist') {
    try {
      const groups = client.channels.cache.filter(c => c.type === 'GROUP_DM');
      if (!groups.size) return message.reply('No group DMs found.');
      const list = groups.map(g => `**${g.name || 'Unnamed'}** — ${g.recipients?.map(u=>u.tag).join(', ') || 'Unknown members'}`).slice(0, 15);
      await message.reply(`**Group DMs (${groups.size}):**\n${list.join('\n')}`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'groupowner') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      await message.channel.setOwner(user.id);
      await message.reply(`Group ownership transferred to **${user.tag}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  // ========== AUTOMATION (NEW) ==========

  else if (command === 'reactionrole') {
    try {
      const ref = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;
      if (!ref) return message.reply('Reply to a message. Usage: `reactionrole <emoji> <@role>`');
      const emoji = args[0];
      const role = message.mentions.roles.first();
      if (!emoji || !role) return message.reply('Usage: `reactionrole <emoji> <@role>` (reply to a message)');
      await ref.react(emoji);
      // Store for reaction role handling
      if (!client._reactionRoles) client._reactionRoles = new Map();
      client._reactionRoles.set(`${ref.id}-${emoji}`, role.id);
      await message.reply(`Reaction role set: ${emoji} -> **${role.name}**`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'autodelete') {
    const seconds = parseInt(args[0]);
    if (!seconds) {
      autoDeleteChannels.delete(message.channel.id);
      return message.reply('Auto-delete disabled for this channel.');
    }
    autoDeleteChannels.set(message.channel.id, seconds * 1000);
    await message.reply(`Your messages will be auto-deleted after **${seconds}s** in this channel.`);
  }

  else if (command === 'autopurge') {
    const minutes = parseInt(args[0]);
    if (!minutes) return message.reply('Usage: `autopurge <minutes>` (0 to disable)');
    if (minutes === 0) {
      if (client._autopurge) clearInterval(client._autopurge);
      return message.reply('Auto-purge disabled.');
    }
    if (client._autopurge) clearInterval(client._autopurge);
    client._autopurge = setInterval(async () => {
      try {
        const msgs = await message.channel.messages.fetch({ limit: 50 });
        const mine = msgs.filter(m => m.author.id === client.user.id);
        for (const m of mine.values()) await m.delete().catch(()=>{});
      } catch {}
    }, minutes * 60000);
    await message.reply(`Auto-purging this channel every **${minutes}** minutes.`);
  }

  else if (command === 'msgcount-user') {
    try {
      const user = message.mentions.users.first() || await client.users.fetch(args[0]);
      const msgs = await message.channel.messages.fetch({ limit: 100 });
      const count = msgs.filter(m => m.author.id === user.id).size;
      await message.reply(`**${user.tag}** has **${count}** messages in the last 100 messages of this channel.`);
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'afk-custom') {
    if (!args[0]) return message.reply('Usage: `afk-custom <emoji> <reason>`');
    const emoji = args[0];
    const reason = args.slice(1).join(' ') || 'AFK';
    config.afk = { enabled: true, reason, since: Date.now() };
    const custom = new CustomStatus(client).setEmoji(emoji).setState(`AFK: ${reason}`);
    client.user.setPresence({ status: 'idle', activities: [custom] });
    await message.reply(`${emoji} AFK set: **${reason}**`);
  }

  else if (command === 'copycat') {
    const user = message.mentions.users.first();
    if (!user) return message.reply('Usage: `copycat <@user>`');
    copycatTargets.set(message.channel.id, user.id);
    await message.reply(`Copying next message from **${user.tag}**...`);
    const filter = m => m.author.id === user.id && m.channel.id === message.channel.id;
    const collector = message.channel.createMessageCollector({ filter, max: 1, time: 60000 });
    collector.on('collect', async (m) => {
      copycatTargets.delete(message.channel.id);
      if (m.content) await message.channel.send(m.content);
    });
    collector.on('end', () => copycatTargets.delete(message.channel.id));
  }

  else if (command === 'annoy') {
    const user = message.mentions.users.first();
    const count = Math.min(parseInt(args[1]) || 3, 5);
    if (!user) return message.reply('Usage: `annoy <@user> <count>`');
    for (let i = 0; i < count; i++) {
      await message.channel.send(`<@${user.id}>`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  else if (command === 'echo') {
    const ch = message.mentions.channels.first() || client.channels.cache.get(args[0]);
    if (!ch) return message.reply('Usage: `echo <#channel> <text>`');
    const text = args.slice(message.mentions.channels.size ? 1 : 1).join(' ');
    if (!text) return message.reply('Provide text to send.');
    try { await ch.send(text); await message.reply(`Sent to ${ch}`); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'tts') {
    if (!args.length) return message.reply('Usage: `tts <text>`');
    try { await message.channel.send({ content: args.join(' '), tts: true }); }
    catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  else if (command === 'disableinvites') {
    if (!message.guild) return message.reply('Server only.');
    try {
      await message.guild.disableInvites(true);
      await message.reply('Server invites disabled.');
    } catch (e) { await message.reply(`Error: ${e.message}`); }
  }

  // ========== AI CHAT ==========

  else if (command === 'ask') {
    if (!args.length) return message.reply('Usage: `ask <question>`');
    const question = args.join(' ');
    if (!process.env.GROQ_API_KEY) return message.reply('Set GROQ_API_KEY in .env to enable AI chat.');
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (process.env.GROQ_API_KEY || '') },
        body: JSON.stringify({ model: 'llama3-8b-8192', messages: [{ role: 'user', content: question }], max_tokens: 500 })
      });
      const data = await res.json();
      const answer = (data.choices?.[0]?.message?.content || 'No response.').slice(0, 1900);
      await message.reply(answer);
    } catch (e) { await message.reply(`AI error: ${e.message}`); }
  }

  else if (command === 'translate') {
    if (args.length < 2) return message.reply('Usage: `translate <lang> <text>`');
    const lang = args[0];
    const text = args.slice(1).join(' ');
    if (!process.env.GROQ_API_KEY) return message.reply('Set GROQ_API_KEY in .env to enable AI chat.');
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (process.env.GROQ_API_KEY || '') },
        body: JSON.stringify({ model: 'llama3-8b-8192', messages: [{ role: 'user', content: `Translate the following to ${lang}: ${text}` }], max_tokens: 500 })
      });
      const data = await res.json();
      const answer = (data.choices?.[0]?.message?.content || 'No response.').slice(0, 1900);
      await message.reply(answer);
    } catch (e) { await message.reply(`AI error: ${e.message}`); }
  }

  else if (command === 'summarize') {
    const ref = message.reference?.messageId;
    if (!ref) return message.reply('Reply to a message to summarize it.');
    if (!process.env.GROQ_API_KEY) return message.reply('Set GROQ_API_KEY in .env to enable AI chat.');
    try {
      const orig = await message.channel.messages.fetch(ref);
      const text = orig.content;
      if (!text) return message.reply('That message has no text content.');
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (process.env.GROQ_API_KEY || '') },
        body: JSON.stringify({ model: 'llama3-8b-8192', messages: [{ role: 'user', content: `Summarize the following text concisely:\n\n${text}` }], max_tokens: 500 })
      });
      const data = await res.json();
      const answer = (data.choices?.[0]?.message?.content || 'No response.').slice(0, 1900);
      await message.reply(answer);
    } catch (e) { await message.reply(`AI error: ${e.message}`); }
  }

  else if (command === 'explain') {
    if (!args.length) return message.reply('Usage: `explain <topic>`');
    const topic = args.join(' ');
    if (!process.env.GROQ_API_KEY) return message.reply('Set GROQ_API_KEY in .env to enable AI chat.');
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (process.env.GROQ_API_KEY || '') },
        body: JSON.stringify({ model: 'llama3-8b-8192', messages: [{ role: 'user', content: `Explain the following topic simply and clearly: ${topic}` }], max_tokens: 500 })
      });
      const data = await res.json();
      const answer = (data.choices?.[0]?.message?.content || 'No response.').slice(0, 1900);
      await message.reply(answer);
    } catch (e) { await message.reply(`AI error: ${e.message}`); }
  }

  else if (command === 'code') {
    if (args.length < 2) return message.reply('Usage: `code <language> <task>`');
    const language = args[0];
    const task = args.slice(1).join(' ');
    if (!process.env.GROQ_API_KEY) return message.reply('Set GROQ_API_KEY in .env to enable AI chat.');
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (process.env.GROQ_API_KEY || '') },
        body: JSON.stringify({ model: 'llama3-8b-8192', messages: [{ role: 'user', content: `Write ${language} code for the following task. Only output the code in a code block:\n\n${task}` }], max_tokens: 500 })
      });
      const data = await res.json();
      const answer = (data.choices?.[0]?.message?.content || 'No response.').slice(0, 1900);
      await message.reply(answer);
    } catch (e) { await message.reply(`AI error: ${e.message}`); }
  }

  // ========== STEALTH ==========
  else if (command === 'ghost') {
    try {
      const stealth = require('./stealth');
      stealth.setState('ghostRead', !stealth.getState().ghostRead);
      await message.reply(`Ghost read: **${stealth.getState().ghostRead ? 'ON' : 'OFF'}**`);
    } catch { await message.reply('Stealth module not available.'); }
  }

  else if (command === 'invistype') {
    try {
      const stealth = require('./stealth');
      stealth.setState('invisibleTyping', !stealth.getState().invisibleTyping);
      await message.reply(`Invisible typing: **${stealth.getState().invisibleTyping ? 'ON' : 'OFF'}**`);
    } catch { await message.reply('Stealth module not available.'); }
  }

  else if (command === 'humanmode') {
    try {
      const stealth = require('./stealth');
      stealth.setState('delayedResponses', !stealth.getState().delayedResponses);
      await message.reply(`Human mode: **${stealth.getState().delayedResponses ? 'ON' : 'OFF'}**`);
    } catch { await message.reply('Stealth module not available.'); }
  }

  else if (command === 'stealthstatus') {
    try {
      const stealth = require('./stealth');
      const s = stealth.getState();
      await message.reply(`**Stealth Status:**\nGhost Read: ${s.ghostRead ? '\u2705' : '\u274c'}\nInvisible Typing: ${s.invisibleTyping ? '\u2705' : '\u274c'}\nHuman Mode: ${s.delayedResponses ? '\u2705' : '\u274c'}`);
    } catch { await message.reply('Stealth module not available.'); }
  }

  // ========== RAID PROTECTION ==========
  else if (command === 'raidprotect') {
    try {
      const rp = require('./raidprotect');
      if (!message.guild) return message.reply('Server only.');
      if (rp.isProtected(message.guild.id)) { rp.disable(message.guild.id); await message.reply('Raid protection **disabled**.'); }
      else { rp.enable(message.guild.id); await message.reply('Raid protection **enabled** for this server.'); }
    } catch { await message.reply('Module not available.'); }
  }

  else if (command === 'protectstatus') {
    try {
      const rp = require('./raidprotect');
      if (!message.guild) return message.reply('Server only.');
      const protected_ = rp.isProtected(message.guild.id);
      const events = rp.getEventLog(message.guild.id, 5);
      let reply = `**Raid Protection:** ${protected_ ? '\u2705 Enabled' : '\u274c Disabled'}`;
      if (events.length) reply += `\n**Recent events:**\n${events.map(e => `${e.type} — <t:${Math.floor(e.time/1000)}:R>`).join('\n')}`;
      await message.reply(reply);
    } catch { await message.reply('Module not available.'); }
  }

  // ========== TOKEN PROTECTOR ==========
  else if (command === 'tokenprotect') {
    try {
      const p = require('./protector');
      p.setState('enabled', !p.getState().enabled);
      await message.reply(`Token protection: **${p.getState().enabled ? 'ON' : 'OFF'}**`);
    } catch { await message.reply('Module not available.'); }
  }

  else if (command === 'protectorstatus') {
    try {
      const p = require('./protector');
      const s = p.getState();
      const alerts = p.getAlerts().slice(0, 5);
      let reply = `**Token Protector:** ${s.enabled ? '\u2705 ON' : '\u274c OFF'}\nAuto-block: ${s.autoBlock ? 'ON' : 'OFF'}\nAlerts: ${p.getAlerts().length}`;
      if (alerts.length) reply += `\n**Recent:**\n${alerts.map(a => `\u26a0\ufe0f ${a.from}: ${a.reason}`).join('\n')}`;
      await message.reply(reply);
    } catch { await message.reply('Module not available.'); }
  }

  // ========== EVASION ==========
  else if (command === 'evasion') {
    try {
      const ev = require('./evasion');
      ev.setState('enabled', !ev.getState().enabled);
      await message.reply(`Evasion mode: **${ev.getState().enabled ? 'ON' : 'OFF'}**`);
    } catch { await message.reply('Module not available.'); }
  }

  else if (command === 'evasionstatus') {
    try {
      const ev = require('./evasion');
      const s = ev.getState();
      const stats = ev.getStats();
      await message.reply(`**Evasion Status:**\nEnabled: ${s.enabled ? '\u2705' : '\u274c'}\nRate limit: ${s.maxCommandsPerMinute}/min\nCommands (last min): ${stats.commandsLastMinute}\nThrottled: ${stats.isThrottled ? '\u26a0\ufe0f YES' : 'No'}`);
    } catch { await message.reply('Module not available.'); }
  }

  // ========== MESSAGE LOGGER ==========
  else if (command === 'logserver') {
    try {
      const ml = require('./msglogger');
      if (!message.guild) return message.reply('Server only.');
      if (ml.isLogging(message.guild.id)) { ml.disableGuild(message.guild.id); await message.reply('Logging **disabled** for this server.'); }
      else { ml.enableGuild(message.guild.id); await message.reply('Logging **enabled** for this server.'); }
    } catch { await message.reply('Module not available.'); }
  }

  else if (command === 'logchannel') {
    try {
      const ml = require('./msglogger');
      const ch = message.mentions.channels.first() || message.channel;
      ml.enableChannel(ch.id);
      await message.reply(`Logging **enabled** for #${ch.name}.`);
    } catch { await message.reply('Module not available.'); }
  }

  else if (command === 'logsearch') {
    try {
      const ml = require('./msglogger');
      const query = args.join(' ');
      if (!query) return message.reply('Usage: `logsearch <text>`');
      const results = ml.search(query, { limit: 10 });
      if (!results.length) return message.reply('No results.');
      const lines = results.map(m => `**${m.authorTag}** in #${m.channelName}: ${m.content.slice(0, 80)}`);
      await message.reply(`**Search results for "${query}":**\n${lines.join('\n')}`);
    } catch { await message.reply('Module not available.'); }
  }

  else if (command === 'logstats') {
    try {
      const ml = require('./msglogger');
      const stats = ml.getStats();
      await message.reply(`**Message Logger:**\nTotal logged: ${stats.totalLogged.toLocaleString()}\nGuilds: ${Object.keys(stats.byGuild).length}\nEnabled: ${ml.getState().enabled ? '\u2705' : '\u274c'}`);
    } catch { await message.reply('Module not available.'); }
  }

  // ========== SERVER CLONER ==========
  else if (command === 'cloneserver') {
    try {
      const cloner = require('./cloner');
      const targetId = args[0];
      if (!message.guild || !targetId) return message.reply('Usage: `cloneserver <target server ID>`');
      const target = client.guilds.cache.get(targetId);
      if (!target) return message.reply('Target server not found.');
      await message.reply('\ud83d\udd04 Cloning server... This may take a while.');
      const result = await cloner.cloneServer(message.guild, target, { clearTarget: false, copyEmojis: true, copyIdentity: false });
      await message.reply(`\u2705 **Clone complete!**\nRoles: ${result.rolesCreated}\nChannels: ${result.channelsCreated}\nEmojis: ${result.emojisCreated}\nErrors: ${result.errors.length}`);
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'exportserver') {
    try {
      const cloner = require('./cloner');
      if (!message.guild) return message.reply('Server only.');
      const data = await cloner.exportServer(message.guild);
      await message.reply(`\ud83d\udce6 Server exported: ${data.roles.length} roles, ${data.channels.length} channels, ${data.emojis.length} emojis`);
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  // ========== WEBHOOK CLONER ==========
  else if (command === 'sendas') {
    try {
      const wc = require('./webhookcloner');
      const user = message.mentions.users.first();
      if (!user) return message.reply('Usage: `sendas @user <message>`');
      const text = args.slice(1).join(' ');
      if (!text) return message.reply('Provide a message.');
      await message.delete().catch(() => null);
      await wc.sendAs(message.channel, user, text);
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  else if (command === 'impersonate') {
    try {
      const wc = require('./webhookcloner');
      const user = message.mentions.users.first();
      const count = parseInt(args[1]) || 1;
      if (!user) return message.reply('Usage: `impersonate @user <count>`');
      await message.reply(`Impersonating **${user.tag}** for next ${count} messages they send.`);
      const collector = message.channel.createMessageCollector({ filter: m => m.author.id === user.id, max: count, time: 60000 });
      collector.on('collect', async (m) => {
        await wc.sendAs(message.channel, client.user, m.content).catch(() => null);
      });
    } catch (e) { await message.reply(`Failed: ${e.message}`); }
  }

  // ========== HELP ==========

  else if (command === 'help') {
    const page = parseInt(args[0], 10) || 1;
    const perPage = 15;
    const maxPage = Math.ceil(commandList.length / perPage);
    const p = Math.max(1, Math.min(page, maxPage));
    const slice = commandList.slice((p - 1) * perPage, p * perPage);
    const lines = slice.map(([cmd, desc]) => `\`${config.prefix}${cmd}\` — ${desc}`);
    await message.reply(`**Commands (${p}/${maxPage}) — ${commandList.length} total:**\n${lines.join('\n')}\n\n\`${config.prefix}help <page>\``);
  }
});

client.on('error', (e) => log('error', e.message));
client.on('warn', (w) => log('warn', w));

module.exports = { client, config, commandList, stats, setBroadcast, log };
