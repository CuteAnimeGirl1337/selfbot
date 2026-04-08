import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Trophy, TrendingUp, TrendingDown, Coins, Users, Dices, Gift, RotateCcw } from 'lucide-react'

const ago = ts => {
  const d = Date.now() - ts
  if (d < 6e4) return 'now'
  if (d < 36e5) return `${Math.floor(d / 6e4)}m`
  if (d < 864e5) return `${Math.floor(d / 36e5)}h`
  return `${Math.floor(d / 864e5)}d`
}

const fmt = n => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function Gambling({ state, api }) {
  const toast = useToast()
  const [tab, setTab] = useState('overview')
  const [leaderboard, setLeaderboard] = useState([])
  const [players, setPlayers] = useState([])
  const [log, setLog] = useState([])
  const [giveId, setGiveId] = useState('')
  const [giveAmt, setGiveAmt] = useState('')

  const econ = state?.stats?.economy || { playerCount: 0, totalMoney: 0, totalWins: 0, totalLosses: 0, recentGambles: [] }

  const refresh = async () => {
    try {
      const [lb, p, l] = await Promise.all([
        api('/api/economy/leaderboard'),
        api('/api/economy/players'),
        api('/api/economy/log'),
      ])
      if (Array.isArray(lb)) setLeaderboard(lb)
      if (Array.isArray(p)) setPlayers(p)
      if (Array.isArray(l)) setLog(l)
    } catch {}
  }

  useEffect(() => { refresh() }, [tab])

  const giveCoins = async () => {
    if (!giveId.trim() || !giveAmt.trim()) return toast('Fill both fields')
    const res = await api('/api/economy/give', { userId: giveId.trim(), amount: parseInt(giveAmt) })
    if (res.ok) toast(`Gave ${giveAmt} coins → balance: ${res.balance}`)
    else toast(`Error: ${res.error}`)
    setGiveId(''); setGiveAmt('')
    refresh()
  }

  const resetAll = async () => {
    if (!confirm('Reset ALL economy data?')) return
    await api('/api/economy/reset', {})
    toast('Economy reset')
    refresh()
  }

  const resetPlayer = async (id) => {
    if (!confirm(`Reset economy for ${id}?`)) return
    await api('/api/economy/reset', { userId: id })
    toast('Player reset')
    refresh()
  }

  const statCards = [
    { icon: Users, color: '#818cf8', value: econ.playerCount, label: 'Players' },
    { icon: Coins, color: '#fbbf24', value: fmt(econ.totalMoney), label: 'Total Money' },
    { icon: TrendingUp, color: '#34d399', value: fmt(econ.totalWins), label: 'Total Wins' },
    { icon: TrendingDown, color: '#fb7185', value: fmt(econ.totalLosses), label: 'Total Losses' },
  ]

  return (
    <div style={s.page}>
      {/* Hero header */}
      <motion.div style={s.hero} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <div style={s.heroGlow} />
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Gambling</h1>
            <p style={s.heroSub}>{econ.playerCount} players · {fmt(econ.totalMoney)} coins in circulation</p>
          </div>
          <div style={s.seg}>
            {['overview', 'leaderboard', 'players', 'log'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ ...s.segBtn, ...(tab === t ? s.segActive : {}) }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Stat cards */}
          <motion.div
            style={s.statsGrid}
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: .06 } } }}
          >
            {statCards.map(({ icon: Icon, color, value, label }) => (
              <motion.div
                key={label}
                variants={item}
                transition={{ duration: .35, ease: [.22,1,.36,1] }}
                style={s.statCard}
                whileHover={{ y: -4, boxShadow: `0 8px 30px ${color}15` }}
              >
                <div style={{ ...s.statIcon, background: `${color}12`, color }}>
                  <Icon size={20} />
                </div>
                <div style={s.statVal}>{value}</div>
                <div style={s.statLabel}>{label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Admin actions */}
          <motion.div style={{ ...s.panel, marginTop: 16 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
            <div style={s.panelHead}>Admin Actions</div>
            <div style={{ padding: '16px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={giveId} onChange={e => setGiveId(e.target.value)} placeholder="User ID" style={{ ...s.input, width: 180 }} />
              <input value={giveAmt} onChange={e => setGiveAmt(e.target.value)} placeholder="Amount" style={{ ...s.input, width: 110 }} />
              <button onClick={giveCoins} style={s.btn}><Gift size={13} /> Give Coins</button>
              <button onClick={resetAll} style={{ ...s.btn, background: '#fb7185' }}><RotateCcw size={13} /> Reset All</button>
            </div>
          </motion.div>

          {/* Recent gambles */}
          <motion.div style={{ ...s.panel, marginTop: 12 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>
            <div style={s.panelHead}>Recent Gambles</div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {econ.recentGambles?.length === 0 && <div style={s.nil}>No gambles yet</div>}
              {econ.recentGambles?.map((g, i) => (
                <div key={i} style={s.logRow}>
                  <span style={s.logTag}>{g.userTag}</span>
                  <span style={s.logGame}>{g.game}</span>
                  <span style={s.logBet}>bet {fmt(g.bet)}</span>
                  <span style={{ ...s.logResult, color: g.profit >= 0 ? '#34d399' : '#fb7185' }}>
                    {g.profit >= 0 ? '+' : ''}{fmt(g.profit)}
                  </span>
                  <span style={s.logTime}>{ago(g.time)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* LEADERBOARD */}
      {tab === 'leaderboard' && (
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={s.panelHead}><Trophy size={13} style={{ marginRight: 6 }} /> Top 15</div>
          <div>
            {leaderboard.length === 0 && <div style={s.nil}>No players yet</div>}
            {leaderboard.map((p, i) => (
              <div key={p.id} style={s.lbRow}>
                <span style={s.lbRank}>#{i + 1}</span>
                <span style={s.lbTag}>{p.tag}</span>
                <div style={s.lbBarWrap}>
                  <motion.div
                    style={s.lbBar}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((p.total / (leaderboard[0]?.total || 1)) * 100, 100)}%` }}
                    transition={{ duration: .5, delay: i * .03 }}
                  />
                </div>
                <span style={s.lbTotal}>{fmt(p.total)}</span>
                <span style={s.lbLvl}>Lv.{p.level}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* PLAYERS */}
      {tab === 'players' && (
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={s.panelHead}>All Players ({players.length})</div>
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {players.length === 0 && <div style={s.nil}>No players</div>}
            {players.map(p => (
              <div key={p.id} style={s.playerRow}>
                <div style={s.playerInfo}>
                  <span style={s.playerTag}>{p.tag}</span>
                  <span style={s.playerId}>{p.id}</span>
                </div>
                <span style={s.playerStat}>💰 {fmt(p.balance)}</span>
                <span style={s.playerStat}>🏦 {fmt(p.bank)}</span>
                <span style={s.playerStat}>Lv.{p.level}</span>
                <span style={{ ...s.playerStat, color: '#34d399' }}>W:{p.wins}</span>
                <span style={{ ...s.playerStat, color: '#fb7185' }}>L:{p.losses}</span>
                <button onClick={() => resetPlayer(p.id)} style={s.resetBtn}>Reset</button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* LOG */}
      {tab === 'log' && (
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={s.panelHead}>Gambling Log ({log.length})</div>
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {log.length === 0 && <div style={s.nil}>No gambling history</div>}
            {log.map((g, i) => (
              <motion.div key={i} style={s.logRow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * .01 }}>
                <span style={s.logTag}>{g.userTag}</span>
                <span style={s.logGame}>{g.game}</span>
                <span style={s.logBet}>bet {fmt(g.bet)}</span>
                <span style={{ ...s.logResult, color: g.profit >= 0 ? '#34d399' : '#fb7185' }}>
                  {g.profit >= 0 ? '+' : ''}{fmt(g.profit)}
                </span>
                <span style={s.logTime}>{ago(g.time)}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

const s = {
  page: { padding: '32px 40px 48px' },

  // Hero
  hero: {
    position: 'relative', borderRadius: 20, padding: '32px 36px',
    background: 'linear-gradient(135deg, #0c0c1a 0%, #12101f 50%, #0f0c18 100%)',
    border: '1px solid rgba(99,102,241,.08)',
    marginBottom: 20, overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: -60, right: -60, width: 250, height: 250, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  heroTitle: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2' },
  heroSub: { fontSize: 14, color: '#5a5a65', marginTop: 6, fontWeight: 500 },

  seg: {
    display: 'inline-flex', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, padding: 3, gap: 2,
  },
  segBtn: {
    padding: '7px 16px', border: 'none', borderRadius: 8, background: 'transparent',
    color: '#5a5a65', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all .15s',
  },
  segActive: {
    background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.12)',
    color: '#f0f0f2',
  },

  // Stat cards (centered vertical like Overview)
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 },
  statCard: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, padding: '20px 16px', textAlign: 'center',
    cursor: 'default', transition: 'transform .25s, box-shadow .25s',
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 12px',
  },
  statVal: { fontSize: 24, fontWeight: 700, letterSpacing: '-1px', color: '#f0f0f2', lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
  statLabel: { fontSize: 12, color: '#5a5a65', marginTop: 4, fontWeight: 500 },

  // Panels
  panel: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, overflow: 'hidden',
  },
  panelHead: {
    padding: '16px 20px', fontSize: 12, fontWeight: 700, color: '#3a3a42',
    textTransform: 'uppercase', letterSpacing: '.8px',
    borderBottom: '1px solid rgba(255,255,255,.04)',
    display: 'flex', alignItems: 'center',
  },
  nil: { padding: 40, textAlign: 'center', color: '#3a3a42', fontSize: 14, fontWeight: 500 },

  input: {
    padding: '9px 12px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, color: '#f0f0f2', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    transition: 'border-color .2s',
  },
  btn: {
    padding: '9px 16px', background: '#6366f1', border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
    transition: 'opacity .15s',
  },

  // Log rows
  logRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
    borderBottom: '1px solid rgba(255,255,255,.03)', fontSize: 14,
  },
  logTag: {
    fontWeight: 600, color: '#f0f0f2', width: 130, overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
  },
  logGame: { fontFamily: 'var(--mono)', color: '#818cf8', fontSize: 13, width: 80, flexShrink: 0 },
  logBet: { color: '#5a5a65', fontFamily: 'var(--mono)', fontSize: 13, width: 80, flexShrink: 0 },
  logResult: { fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, width: 80, flexShrink: 0 },
  logTime: { color: '#3a3a42', fontFamily: 'var(--mono)', fontSize: 12, marginLeft: 'auto' },

  // Leaderboard
  lbRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
    borderBottom: '1px solid rgba(255,255,255,.03)',
  },
  lbRank: { fontFamily: 'var(--mono)', fontSize: 12, color: '#5a5a65', width: 30, flexShrink: 0, fontWeight: 700 },
  lbTag: {
    fontSize: 14, fontWeight: 600, color: '#f0f0f2', width: 130,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
  },
  lbBarWrap: { flex: 1, height: 6, background: '#17171b', borderRadius: 3, overflow: 'hidden' },
  lbBar: { height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: 3 },
  lbTotal: {
    fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: '#fbbf24',
    width: 60, textAlign: 'right', flexShrink: 0,
  },
  lbLvl: { fontFamily: 'var(--mono)', fontSize: 12, color: '#5a5a65', width: 40, textAlign: 'right', flexShrink: 0 },

  // Players
  playerRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
    borderBottom: '1px solid rgba(255,255,255,.03)', fontSize: 14,
  },
  playerInfo: { display: 'flex', flexDirection: 'column', width: 160, flexShrink: 0 },
  playerTag: { fontWeight: 600, fontSize: 14, color: '#f0f0f2' },
  playerId: { fontFamily: 'var(--mono)', fontSize: 11, color: '#3a3a42' },
  playerStat: { fontFamily: 'var(--mono)', fontSize: 12, color: '#94949e', width: 70, textAlign: 'center', flexShrink: 0 },
  resetBtn: {
    padding: '4px 10px', background: 'transparent', border: '1px solid rgba(251,113,133,.15)',
    color: '#fb7185', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', marginLeft: 'auto', transition: 'background .15s',
  },
}
