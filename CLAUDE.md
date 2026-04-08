# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discord selfbot (discord.js-selfbot-v13) with a React web dashboard. 155 commands, economy/gambling system, auto-moderation, plugin system, scheduled messaging, nitro sniper, macro system, and data persistence.

## Architecture

```
Browser (:3000) ←→ Express + WebSocket ←→ Discord Client (selfbot-v13)
                         ↕
                    data.json (persistence)
```

**Backend** (Node.js, CommonJS):
- `index.js` — Entry point. Loads `.env`, starts server, logs into Discord.
- `bot.js` — Core bot: 155 commands in `commandList` array, event handlers (messageCreate, messageDelete, messageUpdate), command handler with prefix routing. Exports `{ client, config, commandList, stats, setBroadcast, log }`.
- `server.js` — Express HTTP + WebSocket server. Serves React build from `public/`, REST API under `/api/*`, broadcasts state to WS clients every 2s. Lazy-loads optional modules (macros, scheduler, automod, plugins, nitro, auth, persist).
- `stats.js` — Singleton tracker. Economy system with `getPlayer(userId, tag)`, XP/leveling, gambling log, leaderboard. Message rate tracking, snipe storage, spy log.
- `format.js` — Discord message formatter. Progress bars, balance cards, gambling result displays with Unicode box drawing.

**Optional modules** (all loaded with try/catch in server.js):
- `persist.js` — Save/load `data.json` with auto-save interval + graceful shutdown
- `auth.js` — Dashboard auth via random token in `auth.json`. Middleware checks query param, Bearer header, or cookie.
- `macros.js` — Named command sequences with configurable delay
- `scheduler.js` — Timed message sending with recurring support (hourly/daily)
- `automod.js` — Banned words, anti-spam rate limiting, anti-link filtering
- `plugins.js` — Hot-reloadable command plugins from `plugins/*.js`
- `nitro.js` — Auto-claim Discord Nitro gift links

**Frontend** (React 19 + Vite + Framer Motion + Lucide icons):
- `frontend/src/hooks/useSocket.js` — Single WebSocket hook managing all real-time state
- `frontend/src/components/Sidebar.jsx` — 18-tab nav with animated pill indicator
- `frontend/src/components/Toast.jsx` — Context-based toast notification system
- 18 page components in `frontend/src/pages/`
- All styles are inline JS objects using CSS custom properties from `index.css`

## Commands

### Start everything (production)
```bash
cd ~/selfbot && node index.js
```
Dashboard at http://localhost:3000. Auth token printed to console on first run.

### Frontend development (hot reload)
```bash
cd ~/selfbot/frontend && npm run dev
```
Vite dev server on :5173, proxies `/api` and `/ws` to backend on :3000. Requires backend running separately.

### Build frontend for production
```bash
cd ~/selfbot/frontend && npx vite build
```
Outputs to `selfbot/public/` which Express serves statically.

### Install dependencies
```bash
cd ~/selfbot && npm install
cd ~/selfbot/frontend && npm install
```

## Key Patterns

- **Bot config** is mutable at runtime: `config.prefix`, `config.afk`, `config.autoDeleteCommands`, `config.disabledCommands` (Set). Dashboard and bot commands both modify this shared object.
- **Stats singleton** (`require('./stats')`) is shared between bot.js and server.js. All economy, spy, auto-reply state lives here.
- **Broadcast function** is injected into bot.js from server.js via `setBroadcast(fn)` — this is how bot events reach WebSocket clients.
- **Command handler** in bot.js is a single large `messageCreate` listener with if/else chain. New commands go before the `help` command. Add entries to `commandList` array for dashboard visibility.
- **Optional modules** are loaded with try/catch in server.js so the bot works even if some modules are missing or broken.
- **Persistence** saves economy, config, macros, scheduler, automod rules to `data.json` every 60s and on SIGINT/SIGTERM. The `startAutoSave` callback returns `{ stats, config, macros, scheduledMessages }`.
- **Plugins** export `{ name, description, execute(message, args, client, stats) }`. Drop in `plugins/` and reload from dashboard.

## Environment

- `.env` — `TOKEN` (Discord user token), `PORT` (default 3000)
- `auth.json` — Auto-generated dashboard auth token
- `data.json` — Persisted state (economy, settings, macros, scheduler, automod)
- Requires Node.js >= 20.18.0

## Adding a New Bot Command

1. Add `['commandname', 'Description']` to `commandList` array in `bot.js` (~line 20-200)
2. Add `else if (command === 'commandname') { ... }` handler before the help command
3. Use `stats.incCommand(command)` (automatic) and `stats.logGamble(...)` for gambling commands
4. Economy: `stats.getPlayer(userId, tag)` to get/create player, `stats.addXp(userId, amount)` for XP
5. Formatted responses: use helpers from `format.js`

## Adding a New Dashboard Page

1. Create `frontend/src/pages/PageName.jsx` — receives `{ state, api }` or other props from App.jsx
2. Add import and route in `frontend/src/App.jsx`
3. Add nav entry in `frontend/src/components/Sidebar.jsx` (import icon from lucide-react)
4. Add API endpoints in `server.js` if needed (before SPA fallback)
5. Rebuild: `cd frontend && npx vite build`
