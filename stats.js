// =============================================================================
// Stats Tracker — Singleton with Economy System
// =============================================================================

class Stats {
  constructor() {
    this.startedAt = Date.now();
    this.messagesSeen = 0;
    this.commandsRun = 0;
    this.commandUsage = {};
    this.snipes = [];
    this.editSnipes = [];
    this.logs = [];
    this.maxLogSize = 300;
    this.maxSnipeSize = 150;
    this.msgTimestamps = [];
    this.autoReplies = {};
    this.reminders = [];
    this.spyTargets = new Set();
    this.spyLog = [];
    this.maxSpyLog = 200;

    // Economy
    this.economy = {}; // { odId: { balance, bank, daily, worked, xp, level, wins, losses, biggestWin, inventory: [] } }
    this.gamblingLog = []; // { userId, userTag, game, bet, result, profit, time }
    this.maxGamblingLog = 300;
  }

  // Economy helpers
  getPlayer(userId, tag) {
    if (!this.economy[userId]) {
      this.economy[userId] = {
        balance: 1000, bank: 0, daily: 0, worked: 0,
        xp: 0, level: 1, wins: 0, losses: 0, biggestWin: 0,
        inventory: [], tag: tag || 'Unknown',
      };
    }
    if (tag) this.economy[userId].tag = tag;
    return this.economy[userId];
  }

  addXp(userId, amount) {
    const p = this.economy[userId];
    if (!p) return;
    p.xp += amount;
    const needed = p.level * 100;
    if (p.xp >= needed) {
      p.xp -= needed;
      p.level++;
      return p.level; // return new level for level-up msg
    }
    return null;
  }

  logGamble(userId, userTag, game, bet, result, profit) {
    this.gamblingLog.unshift({ userId, userTag, game, bet, result, profit, time: Date.now() });
    if (this.gamblingLog.length > this.maxGamblingLog) this.gamblingLog.pop();
  }

  getLeaderboard(type = 'balance') {
    return Object.entries(this.economy)
      .map(([id, p]) => ({ id, tag: p.tag, balance: p.balance, bank: p.bank, total: p.balance + p.bank, wins: p.wins, level: p.level }))
      .sort((a, b) => b[type] || b.total - (a[type] || a.total))
      .slice(0, 15);
  }

  getEconomyStats() {
    const players = Object.values(this.economy);
    const totalMoney = players.reduce((s, p) => s + p.balance + p.bank, 0);
    const totalWins = players.reduce((s, p) => s + p.wins, 0);
    const totalLosses = players.reduce((s, p) => s + p.losses, 0);
    return {
      playerCount: players.length,
      totalMoney,
      totalWins,
      totalLosses,
      recentGambles: this.gamblingLog.slice(0, 20),
    };
  }

  // Existing methods
  incMessages() {
    this.messagesSeen++;
    const now = Date.now();
    this.msgTimestamps.push(now);
    this.msgTimestamps = this.msgTimestamps.filter(t => now - t < 300000);
  }

  getMsgRate() {
    const now = Date.now();
    return this.msgTimestamps.filter(t => now - t < 60000).length;
  }

  incCommand(name) {
    this.commandsRun++;
    this.commandUsage[name] = (this.commandUsage[name] || 0) + 1;
  }

  addSnipe(data) {
    this.snipes.unshift({ ...data, time: Date.now() });
    if (this.snipes.length > this.maxSnipeSize) this.snipes.pop();
  }

  addEditSnipe(data) {
    this.editSnipes.unshift({ ...data, time: Date.now() });
    if (this.editSnipes.length > this.maxSnipeSize) this.editSnipes.pop();
  }

  addLog(level, message) {
    this.logs.unshift({ level, message, time: Date.now() });
    if (this.logs.length > this.maxLogSize) this.logs.pop();
  }

  addSpyLog(data) {
    this.spyLog.unshift({ ...data, time: Date.now() });
    if (this.spyLog.length > this.maxSpyLog) this.spyLog.pop();
  }

  getUptime() { return Date.now() - this.startedAt; }

  getAll() {
    return {
      uptime: this.getUptime(),
      messagesSeen: this.messagesSeen,
      commandsRun: this.commandsRun,
      commandUsage: this.commandUsage,
      snipeCount: this.snipes.length,
      editSnipeCount: this.editSnipes.length,
      msgRate: this.getMsgRate(),
      autoReplyCount: Object.keys(this.autoReplies).length,
      spyCount: this.spyTargets.size,
      economy: this.getEconomyStats(),
    };
  }
}

module.exports = new Stats();
