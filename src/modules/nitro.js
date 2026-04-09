// =============================================================================
// Nitro Sniper — Auto-claim Nitro gift links
// =============================================================================

const NITRO_REGEX = /(discord\.gift|discord\.com\/gifts)\/([a-zA-Z0-9]+)/;

let enabled = true;
let claimed = [];
const maxLog = 50;

function isEnabled() { return enabled; }
function setEnabled(val) { enabled = !!val; }
function getClaimed() { return claimed; }

async function checkMessage(message, client, broadcast, log) {
  if (!enabled) return;
  if (message.author.id === client.user.id) return;

  const match = message.content.match(NITRO_REGEX);
  if (!match) return;

  const code = match[2];
  log('info', `Nitro gift detected: ${code} from ${message.author.tag} in #${message.channel.name || 'DM'}`);

  try {
    // Try to claim
    await client.api.entitlements['gift-codes'](code).redeem.post({
      data: { channel_id: message.channel.id }
    });

    const entry = {
      code,
      from: message.author.tag,
      channel: message.channel.name || 'DM',
      guild: message.guild?.name || 'DM',
      status: 'claimed',
      time: Date.now(),
    };
    claimed.unshift(entry);
    if (claimed.length > maxLog) claimed.pop();

    log('info', `Nitro CLAIMED: ${code}`);
    broadcast({ type: 'nitro', data: entry });
  } catch (e) {
    const entry = {
      code,
      from: message.author.tag,
      channel: message.channel.name || 'DM',
      guild: message.guild?.name || 'DM',
      status: e.message?.includes('redeemed') ? 'already_claimed' : 'failed',
      error: e.message,
      time: Date.now(),
    };
    claimed.unshift(entry);
    if (claimed.length > maxLog) claimed.pop();

    log('warn', `Nitro failed: ${code} — ${e.message}`);
    broadcast({ type: 'nitro', data: entry });
  }
}

module.exports = { isEnabled, setEnabled, checkMessage, getClaimed };
