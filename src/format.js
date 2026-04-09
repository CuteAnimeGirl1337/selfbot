// =============================================================================
// Response Formatter — Clean Discord message formatting
// =============================================================================

const THEME = {
  line: '─',
  corner: { tl: '┌', tr: '┐', bl: '└', br: '┘' },
  vert: '│',
  dot: '•',
  arrow: '›',
  bar: { full: '█', half: '▓', empty: '░' },
  check: '✓',
  cross: '✗',
  coin: '🪙',
  bank: '🏦',
  star: '⭐',
  trophy: '🏆',
  dice: '🎲',
  cards: '🃏',
  slots: '🎰',
  chart: '📊',
  up: '📈',
  down: '📉',
};

function header(title, emoji = '') {
  const e = emoji ? `${emoji} ` : '';
  return `**${e}${title}**\n${'─'.repeat(Math.min(title.length + 4, 28))}`;
}

function box(title, lines, emoji = '') {
  const e = emoji ? `${emoji} ` : '';
  const content = lines.map(l => `${THEME.vert} ${l}`).join('\n');
  const w = 30;
  return `\`\`\`\n${e}${title}\n${'─'.repeat(w)}\n${lines.map(l => `  ${l}`).join('\n')}\n${'─'.repeat(w)}\`\`\``;
}

function codeBlock(title, lines) {
  return `**${title}**\n\`\`\`\n${lines.join('\n')}\`\`\``;
}

function progressBar(current, max, length = 10) {
  const filled = Math.round((current / max) * length);
  return THEME.bar.full.repeat(filled) + THEME.bar.empty.repeat(length - filled);
}

function statLine(label, value, width = 14) {
  return `${label.padEnd(width)} ${value}`;
}

function moneyFormat(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

// Economy formatters
function balanceCard(player, tag) {
  const xpBar = progressBar(player.xp, player.level * 100, 12);
  return [
    header(`${tag}'s Wallet`, '💰'),
    '```',
    statLine('  Balance:', `${moneyFormat(player.balance)} coins`),
    statLine('  Bank:', `${moneyFormat(player.bank)} coins`),
    statLine('  Net Worth:', `${moneyFormat(player.balance + player.bank)} coins`),
    '',
    statLine('  Level:', `${player.level}`),
    `  XP: [${xpBar}] ${player.xp}/${player.level * 100}`,
    '',
    statLine('  Wins:', `${player.wins}`),
    statLine('  Losses:', `${player.losses}`),
    statLine('  Best Win:', `${moneyFormat(player.biggestWin)}`),
    '```',
  ].join('\n');
}

function dailyResult(amount, newBal) {
  return `${THEME.coin} **Daily Reward**\n> You received **${moneyFormat(amount)}** coins!\n> Balance: **${moneyFormat(newBal)}** coins`;
}

function workResult(job, amount, newBal) {
  return `💼 **Work Complete**\n> You worked as a **${job}** and earned **${moneyFormat(amount)}** coins!\n> Balance: **${moneyFormat(newBal)}** coins`;
}

function transferResult(fromTag, toTag, amount) {
  return `💸 **Transfer**\n> **${fromTag}** → **${toTag}**\n> Amount: **${moneyFormat(amount)}** coins`;
}

function robResult(success, thief, victim, amount) {
  if (success) {
    return `🔫 **Rob Successful**\n> Stole **${moneyFormat(amount)}** coins from **${victim}**!`;
  }
  return `🚔 **Rob Failed**\n> You got caught and lost **${moneyFormat(amount)}** coins!`;
}

// Gambling formatters
function gambleResult(game, won, bet, profit, emoji = '🎲') {
  const status = won ? '**WIN**' : '**LOSS**';
  const profitStr = won ? `+${moneyFormat(profit)}` : `-${moneyFormat(Math.abs(profit))}`;
  const color = won ? '🟢' : '🔴';
  return `${emoji} **${game}** ${color} ${status}\n> Bet: **${moneyFormat(bet)}** → ${profitStr} coins`;
}

function slotsDisplay(reels, won, bet, profit) {
  const display = `**${THEME.slots} SLOTS**\n\n> ╔═══╦═══╦═══╗\n> ║ ${reels[0]} ║ ${reels[1]} ║ ${reels[2]} ║\n> ╚═══╩═══╩═══╝`;
  const result = won
    ? `\n> 🟢 **WIN!** +${moneyFormat(profit)} coins`
    : `\n> 🔴 **Lost** -${moneyFormat(bet)} coins`;
  return display + result;
}

function blackjackDisplay(playerHand, dealerHand, playerTotal, dealerTotal, status, bet, profit) {
  let result = '';
  if (status === 'win') result = `🟢 **You win!** +${moneyFormat(profit)}`;
  else if (status === 'lose') result = `🔴 **Dealer wins.** -${moneyFormat(bet)}`;
  else if (status === 'push') result = `🟡 **Push.** Bet returned.`;
  else if (status === 'blackjack') result = `⭐ **BLACKJACK!** +${moneyFormat(profit)}`;
  else if (status === 'bust') result = `🔴 **Bust!** -${moneyFormat(bet)}`;
  else result = '`[HIT]` or `[STAND]`';

  return [
    `${THEME.cards} **Blackjack** — Bet: ${moneyFormat(bet)}`,
    '',
    `> **Your hand:** ${playerHand} (${playerTotal})`,
    `> **Dealer:** ${dealerHand} (${dealerTotal})`,
    '',
    `> ${result}`,
  ].join('\n');
}

function horseRace(positions, finished, winner, bet, picked, profit) {
  const track = positions.map((pos, i) => {
    const num = i + 1;
    const emoji = ['🐎', '🏇', '🐴', '🎠'][i];
    const bar = '▬'.repeat(pos) + emoji + '▬'.repeat(Math.max(0, 15 - pos));
    const flag = finished && i === winner ? ' 🏁' : '';
    return `> \`${num}\` ${bar}${flag}`;
  }).join('\n');

  let result = '';
  if (finished) {
    if (winner === picked) result = `\n> 🟢 **Horse ${picked + 1} wins!** +${moneyFormat(profit)}`;
    else result = `\n> 🔴 **Horse ${winner + 1} wins.** You bet on ${picked + 1}. -${moneyFormat(bet)}`;
  }

  return `🏇 **Horse Race**\n${track}${result}`;
}

function crashDisplay(multiplier, cashedOut, bet, profit) {
  const bar = progressBar(Math.min(multiplier, 10), 10, 15);
  let status = `> Multiplier: **${multiplier.toFixed(2)}x** [${bar}]`;
  if (cashedOut) {
    status += `\n> 🟢 **Cashed out!** +${moneyFormat(profit)}`;
  }
  return `💥 **Crash**\n${status}`;
}

function leaderboardDisplay(entries) {
  const medals = ['🥇', '🥈', '🥉'];
  const lines = entries.map((e, i) => {
    const medal = medals[i] || `\`${String(i + 1).padStart(2)}\``;
    return `${medal} **${e.tag}** — ${moneyFormat(e.total)} coins (Lv.${e.level})`;
  });
  return `${THEME.trophy} **Leaderboard**\n${'─'.repeat(28)}\n${lines.join('\n')}`;
}

function levelUp(level) {
  return `\n> ⭐ **Level Up!** You are now level **${level}**!`;
}

function itemDrop(activity, item, rarity) {
  const rarityColors = { common: '⬜', uncommon: '🟩', rare: '🟦', legendary: '🟨' };
  return `${rarityColors[rarity] || '⬜'} You found: **${item}** (${rarity}) while ${activity}!`;
}

module.exports = {
  THEME, header, box, codeBlock, progressBar, statLine, moneyFormat,
  balanceCard, dailyResult, workResult, transferResult, robResult,
  gambleResult, slotsDisplay, blackjackDisplay, horseRace, crashDisplay,
  leaderboardDisplay, levelUp, itemDrop,
};
