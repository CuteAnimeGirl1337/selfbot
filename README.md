# Selfbot Dashboard

A Discord selfbot with **300 commands**, a **React web dashboard**, and an **Electron desktop app**.

## Features

### Bot (300 Commands)
- **Economy & Gambling** — balance, daily, work, blackjack, roulette, crash, slots, horse racing, scratch cards, fishing, hunting, mining
- **Text Transforms** — morse, binary, zalgo, uwu, fancy unicode fonts, vaporwave, pig latin, gradient text, boxtext
- **Server Management** — kick, ban, timeout, role management, channel creation, audit logs, prune
- **Profile** — set avatar/banner/bio/pronouns, copy profiles, HypeSquad house
- **Friends** — add/remove/block, friend nicknames, notes, friend invites
- **Messages** — forward, crosspost, pin, thread creation, super reactions, mass forward
- **Fun** — trivia, riddles, would-you-rather, truth/dare, fortune, haiku, hangman, battle, heist
- **Automation** — macros, scheduler, auto-reply, auto-delete, copycat, keyword alerts
- **AI** — ask questions, translate, summarize, explain, code generation (requires GROQ_API_KEY)
- **Utility** — snowflake decoder, permissions, member export, server stats

### Dashboard (24 Pages)
- **Overview** — real-time stats, top commands, activity feed
- **Discord Client** — browse servers/DMs, read/send messages, emoji picker, file upload
- **Run Commands** — terminal to execute commands from the dashboard
- **Gambling** — economy overview, leaderboard, player management
- **Tracker** — monitor user online/offline status changes
- **Alerts** — keyword notifications with auto-react/reply/forward
- **Analytics** — hourly/daily charts, top users/channels, word cloud
- **Archive** — persistent deleted message vault with search
- **Live Feed** — real-time command I/O stream
- **Macros, Scheduler, AutoMod, Spy, Channels, Webhooks, DMs, Servers, Plugins, Backup, Account, Settings, Console**

### App
- **Electron desktop app** with custom title bar, system tray, single instance
- **6 color themes** — Midnight, Ocean, Rose, Emerald, Sunset, AMOLED
- **Command palette** (Ctrl+K), keyboard shortcuts, notifications with sound
- **Persistent data** — economy, settings, alerts, analytics survive restarts
- **Auth** — token-based dashboard authentication
- **Plugin system** — drop .js files in `plugins/` for custom commands

## Quick Start

```bash
cd ~/selfbot
npm install
cd frontend && npm install && npx vite build && cd ..
node index.js
```

Open **http://localhost:3000** — enter your Discord token on first run.

## Desktop App

```bash
npx electron .
```

## Build Distributable

```bash
npm run build-linux    # .AppImage
npm run build-win      # .exe (NSIS + portable)
```

## Auto-Start (Linux)

```bash
chmod +x install-service.sh
./install-service.sh
```

## Environment

| Variable | Description |
|----------|-------------|
| `TOKEN` | Discord user token (or set via dashboard) |
| `PORT` | Dashboard port (default: 3000) |
| `GROQ_API_KEY` | Optional — enables AI commands |

## Structure

```
selfbot/
├── index.js              Entry point
├── bot.js                300 commands
├── server.js             Express + WebSocket + REST API
├── stats.js              Economy + stats tracker
├── format.js             Discord message formatter
├── persist.js            JSON file persistence
├── auth.js               Dashboard authentication
├── token.js              Token manager
├── macros.js             Command macros
├── scheduler.js          Message scheduler
├── automod.js            Auto-moderation
├── plugins.js            Plugin loader
├── nitro.js              Nitro sniper
├── tracker.js            User activity tracker
├── alerts.js             Keyword alerts
├── analytics.js          Message analytics
├── archive.js            Deleted message archive
├── accounts.js           Multi-account manager
├── electron/             Electron main + preload
├── frontend/             React + Vite + Tailwind
│   └── src/
│       ├── pages/        24 page components
│       ├── components/   Sidebar, TitleBar, Toast, CommandPalette, etc.
│       └── hooks/        useSocket, useTheme, useNotifications, useKeyboard
├── plugins/              Custom command plugins
└── public/               Built frontend (served by Express)
```

## Disclaimer

Using selfbots violates Discord's Terms of Service. Use at your own risk.
