# CLAUDE.md

## Project Overview

**Selfbot Dashboard** — a Discord selfbot (`discord.js-selfbot-v13`) with 331 commands, a 24-page React web dashboard, and an Electron desktop app. Features include an economy/gambling system, user tracking, analytics, auto-moderation, stealth mode, raid protection, server cloning, nitro sniping, and plugin hot-reloading.

**Version:** 1.3.0  
**Stack:** Node.js (CommonJS) + React 19 + Vite + Electron  

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (:3000)  or  Electron App                      │
│  React 19 + Vite + Framer Motion                        │
└──────────────┬──────────────────────────────┬───────────┘
               │ HTTP REST (/api/*)           │ WebSocket (/ws)
               ▼                              ▼
┌─────────────────────────────────────────────────────────┐
│  server.js — Express + WS                               │
│  ~60 API endpoints, 2s stat broadcast, lazy module load │
└──────────────┬──────────────────────────────────────────┘
               │ require()
               ▼
┌─────────────────────────────────────────────────────────┐
│  bot.js — Discord Client (selfbot-v13)                  │
│  331 commands, event handlers, command router            │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────┐    ┌─────────────────────────┐
│  stats.js (singleton)    │    │  19 optional modules     │
│  Economy, XP, gambling   │    │  Lazy-loaded, fail-safe  │
└──────────────────────────┘    └─────────────────────────┘
               │
               ▼
         data.json + per-module JSON files (persistence)
```

## Project Structure

```
selfbot/
├── index.js                  # Entry point — loads .env, starts server, Discord login
│
├── src/                      # ── Backend core ─────────────────────────────────
│   ├── bot.js                # Core bot — 331 commands, event handlers, command router (4.6K lines)
│   ├── server.js             # Express + WebSocket server — REST API, WS broadcast (1.5K lines)
│   ├── stats.js              # Economy singleton — players, XP, gambling log, leaderboard
│   ├── format.js             # Discord message formatter — progress bars, box drawing, cards
│   ├── token.js              # Token manager — login/logout, masked storage
│   ├── datadir.js            # Data directory resolver (Electron vs CLI)
│   │
│   └── modules/              # ── Optional modules (lazy-loaded with try/catch) ─
│       ├── persist.js        # Auto-save data.json every 60s + graceful shutdown
│       ├── auth.js           # Dashboard auth — random token, cookie/header/query param
│       ├── macros.js         # Named command sequences with configurable delay
│       ├── scheduler.js      # Timed messages — one-time + recurring (hourly/daily)
│       ├── automod.js        # Banned words, anti-spam rate limiting, anti-link filter
│       ├── plugins.js        # Hot-reloadable plugins from plugins/*.js
│       ├── nitro.js          # Auto-claim Discord Nitro gift links
│       ├── tracker.js        # User presence/status/avatar change monitoring
│       ├── alerts.js         # Keyword notifications — notify, reply, forward, react
│       ├── analytics.js      # Message stats — hourly/daily, per-server/channel, word freq
│       ├── archive.js        # Persistent deleted message vault with search
│       ├── accounts.js       # Multi-account token switching
│       ├── stealth.js        # Ghost read, invisible typing, delayed responses
│       ├── protector.js      # Token protection — phishing/IP logger/grabber detection
│       ├── evasion.js        # Selfbot detection evasion — random delays, rate limiting
│       ├── raidprotect.js    # Raid protection — ban/kick/delete thresholds per guild
│       ├── msglogger.js      # Message logging with search and per-guild stats
│       ├── cloner.js         # Server structure cloner — roles, channels, emojis
│       └── webhookcloner.js  # Impersonate users via webhooks
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Router + page rendering
│   │   ├── index.css                 # CSS custom properties, theme variables
│   │   ├── hooks/
│   │   │   ├── useSocket.js          # WebSocket connection + all real-time state
│   │   │   ├── useTheme.js           # 6 themes (Midnight, Ocean, Rose, Emerald, Sunset, AMOLED)
│   │   │   ├── useKeyboard.js        # Shortcuts (Alt+1-9 pages, Cmd+K palette)
│   │   │   └── useNotifications.js   # Desktop notification manager
│   │   ├── components/
│   │   │   ├── Sidebar.jsx           # Section-grouped nav with animated pill
│   │   │   ├── CommandPalette.jsx    # Cmd+K quick navigation
│   │   │   ├── TitleBar.jsx          # Custom frameless window title bar
│   │   │   ├── StatusBar.jsx         # Bottom status bar
│   │   │   ├── Toast.jsx             # Context-based toast notifications
│   │   │   ├── NotificationCenter.jsx
│   │   │   └── NotificationBell.jsx
│   │   └── pages/                    # 24 pages (+ Login)
│   │       ├── Overview.jsx          # Real-time stats, top commands, now playing
│   │       ├── Discord.jsx           # Full Discord client (servers, DMs, send, emoji)
│   │       ├── LiveFeed.jsx          # Real-time command/message stream
│   │       ├── Terminal.jsx          # Run bot commands from browser
│   │       ├── Commands.jsx          # Search/toggle all 331 commands
│   │       ├── Gambling.jsx          # Economy overview, leaderboard, player mgmt
│   │       ├── Tracker.jsx           # User presence/status tracking
│   │       ├── Alerts.jsx            # Keyword alert management
│   │       ├── Analytics.jsx         # Hourly/daily charts, word frequency
│   │       ├── Archive.jsx           # Deleted message vault
│   │       ├── Logger.jsx            # Message log search and stats
│   │       ├── Macros.jsx            # Macro editor
│   │       ├── Scheduler.jsx         # Schedule messages
│   │       ├── AutoMod.jsx           # Auto-moderation rules
│   │       ├── Spy.jsx               # Spy targets + auto-reply rules
│   │       ├── DMs.jsx               # Send DMs, browse friends
│   │       ├── Channels.jsx          # Browse/message any channel
│   │       ├── Servers.jsx           # Server list and management
│   │       ├── Webhooks.jsx          # Webhook message sender
│   │       ├── Plugins.jsx           # Plugin viewer + reload
│   │       ├── Backup.jsx            # Export/import all data
│   │       ├── Account.jsx           # Profile info, quick actions
│   │       ├── SettingsPage.jsx      # Prefix, presence, theme, shortcuts
│   │       ├── Console.jsx           # Live log viewer
│   │       └── Login.jsx             # Auth login page
│   └── vite.config.js
│
├── # ── Electron ───────────────────────────────────────────────────
├── electron/
│   ├── main.js                       # Frameless window, system tray, in-process server
│   └── preload.js                    # IPC bridge
│
├── # ── Plugins ────────────────────────────────────────────────────
├── plugins/
│   └── example.js                    # Plugin template
│
├── # ── CI/CD ──────────────────────────────────────────────────────
├── .github/workflows/
│   └── release.yml                   # Auto-build Linux + Windows on tag push
│
├── # ── Build Output ───────────────────────────────────────────────
├── public/                           # Vite build output (Express serves this)
│
├── # ── Config & Data ──────────────────────────────────────────────
├── .env                              # TOKEN, PORT
├── auth.json                         # Auto-generated dashboard auth token
├── data.json                         # Persisted state (economy, settings, macros, etc.)
├── package.json
└── README.md
```

## Quick Start

```bash
# Install
cd ~/selfbot && npm install
cd ~/selfbot/frontend && npm install

# Run (backend + dashboard at :3000)
cd ~/selfbot && node index.js

# Run as desktop app
cd ~/selfbot && npm run app

# Frontend dev (hot reload on :5173, proxy to :3000)
cd ~/selfbot/frontend && npm run dev

# Build frontend for production
cd ~/selfbot/frontend && npx vite build

# Build Electron distributables
npm run build-linux    # .AppImage
npm run build-win      # .exe (NSIS)
npm run build-all      # Both
```

Auth token is printed to console on first run. Dashboard at `http://localhost:3000`.

## Command Categories (331 total)

| Category | Count | Examples |
|----------|-------|---------|
| Fun Text & Transforms | ~48 | reverse, mock, ascii, leet, vaporwave, morse, binary, gothic, smallcaps |
| Fun & Games | ~26 | 8ball, trivia, hangman, tictactoe, connect4, duel, battle, numberguess |
| Gambling | ~15 | blackjack, roulette, crash, slots, horse, scratch, highlow, dice |
| Economy | ~15 | bal, daily, work, deposit, withdraw, give, rob, shop, sell, leaderboard |
| Guild Management | ~20 | kick, ban, timeout, createrole, createchannel, auditlog, prune |
| User Info | ~19 | serverinfo, userinfo, avatar, banner, whois, roleinfo, friends |
| Profile | ~15 | setavatar, setbanner, setname, copybio, clearstatus |
| Messages | ~21 | say, purge, forward, search, pin, thread, crosspost, massforward |
| Friends | ~11 | addfriend, removefriend, block, friendlist, pendingfriends, note |
| Moderation | ~7 | react, massreact, stealemoji, slowmode, nuke |
| DM & Group DM | ~11 | dm, embed, spam, groupcreate, groupadd, groupremove |
| Status & Presence | ~6 | status, presence, afk, activity, bio, hypesquad |
| Utility | ~19 | calc, color, timestamp, hash, prefix, togglecmd, eval |
| Spy & Auto | ~3 | autoreply, spy, remind |
| AI | ~5 | ask, translate, summarize, explain, code |
| Stealth & Evasion | ~6 | ghost, invistype, humanmode, evasion |
| Protection | ~4 | raidprotect, tokenprotect, protectstatus |
| Logging & Cloning | ~8 | logserver, logsearch, cloneserver, exportserver, sendas |
| System | ~4+ | macro, schedule, automod, nitrosniper |

## Economy & Gambling System

**Stats singleton** (`stats.js`) manages all player data:
- `getPlayer(userId, tag)` — get or create player (starts with 1,000 coins)
- `addXp(userId, amount)` — XP system, level up at `level * 100`
- `logGamble(userId, tag, game, bet, result, profit)` — gambling history (max 300 entries)
- Leaderboard tracks top 15 by total wealth (balance + bank)

**Cooldowns:** `!daily` = 24h (500-2,000 coins), `!work` = 30m (100-500 coins)  
**Gambling:** coinflip (2x), slots (3x/10x), blackjack (1.5x natural), roulette, crash, dice, horse (4x), scratch, highlow  
**Items:** fishing/hunting/mining produce items with rarity tiers (common → legendary)

## Key Patterns

- **Mutable shared config** — `config.prefix`, `config.afk`, `config.disabledCommands` (Set) are modified at runtime by both bot commands and the dashboard.
- **Stats singleton** — `require('./stats')` is shared between `src/bot.js` and `src/server.js`. All economy, spy, auto-reply state lives here.
- **Broadcast injection** — `setBroadcast(fn)` injects the WebSocket broadcast from `src/server.js` into `src/bot.js`. Bot events reach WS clients through this.
- **Command router** — single large `messageCreate` listener with if/else chain in `src/bot.js`. New commands go before the `help` command. Add to `commandList` array for dashboard visibility.
- **Lazy module loading** — all optional modules in `src/modules/` are loaded with try/catch in `src/server.js`. Bot works even if modules are missing or broken.
- **Persistence** — `src/modules/persist.js` saves to `data.json` every 60s and on SIGINT/SIGTERM. Each optional module also has its own `*-data.json` file.
- **Plugins** — export `{ name, description, execute(message, args, client, stats) }`. Drop in `plugins/` and reload from dashboard.

## Data Files

| File | Contents |
|------|----------|
| `data.json` | Economy, config, macros, scheduler, automod rules |
| `auth.json` | Dashboard auth token (auto-generated) |
| `token.json` | Current Discord token (masked) |
| `stealth-data.json` | Stealth mode state |
| `protector-data.json` | Protection alerts + whitelist |
| `raidprotect-data.json` | Raid protection state per guild |
| `tracker-data.json` | User presence/status history |
| `msglogger-data.json` | Message logs (50K max in-memory) |
| `alerts-data.json` | Keyword alert config + logs |
| `analytics-data.json` | Message analytics (hourly, daily, per-server) |
| `archive-data.json` | Deleted message vault |

## Adding a New Bot Command

1. Add `['commandname', 'Description']` to `commandList` array in `src/bot.js` (~line 20-200)
2. Add `else if (command === 'commandname') { ... }` handler before the help command
3. Economy: `stats.getPlayer(userId, tag)` to get/create player, `stats.addXp(userId, amount)` for XP
4. Gambling: use `stats.logGamble(...)` to record results
5. Formatted responses: use helpers from `format.js`

## Adding a New Dashboard Page

1. Create `frontend/src/pages/PageName.jsx` — receives `{ state, api }` props from App.jsx
2. Add import and route in `frontend/src/App.jsx`
3. Add nav entry in `frontend/src/components/Sidebar.jsx` (import icon from lucide-react)
4. Add API endpoints in `src/server.js` if needed (before SPA fallback)
5. Rebuild: `cd frontend && npx vite build`

## Environment

- `.env` — `TOKEN` (Discord user token), `PORT` (default 3000)
- Requires Node.js >= 20.18.0
- Electron 41 for desktop app builds
