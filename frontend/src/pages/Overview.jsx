import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare, Zap, Globe, Crosshair, Activity, Eye,
  TrendingUp, Clock, ArrowRight, ChevronRight
} from 'lucide-react'

const fmt = n => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

const ago = ts => {
  const d = Date.now() - ts
  if (d < 6e4) return 'now'
  if (d < 36e5) return `${Math.floor(d / 6e4)}m`
  if (d < 864e5) return `${Math.floor(d / 36e5)}h`
  return `${Math.floor(d / 864e5)}d`
}

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const cards = [
  { key: 'messages', icon: MessageSquare, color: '#818cf8', label: 'Messages' },
  { key: 'commands', icon: Zap, color: '#c084fc', label: 'Commands' },
  { key: 'servers', icon: Globe, color: '#34d399', label: 'Servers' },
  { key: 'snipes', icon: Crosshair, color: '#fbbf24', label: 'Sniped' },
  { key: 'msgRate', icon: Activity, color: '#22d3ee', label: 'Msg/min' },
  { key: 'spy', icon: Eye, color: '#f472b6', label: 'Spying' },
]

export default function Overview({ state, logs }) {
  if (!state) return (
    <div style={s.page}>
      <div style={{ ...s.skeleton, height: 120, borderRadius: 20, marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {[1,2,3,4,5,6].map(i => <div key={i} style={{ ...s.skeleton, height: 100, borderRadius: 16 }} />)}
      </div>
    </div>
  )

  const { stats, guilds } = state
  const values = { messages: stats.messagesSeen, commands: stats.commandsRun, servers: guilds.length, snipes: stats.snipeCount, msgRate: stats.msgRate, spy: stats.spyCount }
  const top = useMemo(() => Object.entries(stats.commandUsage).sort((a, b) => b[1] - a[1]).slice(0, 8), [stats.commandUsage])
  const maxCmd = top[0]?.[1] || 1
  const upMs = stats.uptime
  const upH = Math.floor(upMs / 36e5)
  const upM = Math.floor(upMs / 6e4) % 60
  const econ = stats.economy || {}

  return (
    <div style={s.page}>
      {/* Hero banner */}
      <motion.div style={s.hero} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <div style={s.heroGlow} />
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Welcome back</h1>
            <p style={s.heroSub}>{guilds.length} servers · {fmt(stats.messagesSeen)} messages · {fmt(stats.commandsRun)} commands</p>
          </div>
          <div style={s.heroPills}>
            <div style={s.pill}><Clock size={13} /> {upH}h {upM}m uptime</div>
            <div style={{ ...s.pill, ...s.pillGreen }}><Activity size={13} /> {stats.msgRate} msg/min</div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        style={s.statsGrid}
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: .06 } } }}
      >
        {cards.map(({ key, icon: Icon, color, label }) => (
          <motion.div
            key={key}
            variants={item}
            transition={{ duration: .35, ease: [.22,1,.36,1] }}
            style={s.statCard}
            whileHover={{ y: -4, boxShadow: `0 8px 30px ${color}15` }}
          >
            <div style={{ ...s.statIcon, background: `${color}12`, color }}>
              <Icon size={20} />
            </div>
            <div style={s.statVal}>{fmt(values[key])}</div>
            <div style={s.statLabel}>{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Economy strip */}
      {econ.playerCount > 0 && (
        <motion.div style={s.econStrip} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <TrendingUp size={15} color="#fbbf24" />
          <span><b>{econ.playerCount}</b> players</span>
          <span style={s.econDot}>·</span>
          <span><b>{fmt(econ.totalMoney)}</b> coins</span>
          <span style={s.econDot}>·</span>
          <span style={{ color: '#34d399' }}><b>{econ.totalWins}</b> wins</span>
          <span style={s.econDot}>·</span>
          <span style={{ color: '#fb7185' }}><b>{econ.totalLosses}</b> losses</span>
        </motion.div>
      )}

      {/* Two columns */}
      <div style={s.columns}>
        {/* Commands */}
        <motion.div style={s.panel} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 }}>
          <div style={s.panelHeader}>
            <span>Top Commands</span>
            <span style={s.panelCount}>{top.length}</span>
          </div>
          <div style={s.panelContent}>
            {top.length === 0 && <div style={s.empty}>No commands yet</div>}
            {top.map(([name, count], i) => (
              <motion.div
                key={name}
                style={s.cmdRow}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: .3 + i * .04 }}
              >
                <span style={s.cmdRank}>{i + 1}</span>
                <span style={s.cmdName}>{name}</span>
                <div style={s.cmdBarBg}>
                  <motion.div
                    style={s.cmdBarFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCmd) * 100}%` }}
                    transition={{ duration: .7, delay: .3 + i * .04, ease: [.22,1,.36,1] }}
                  />
                </div>
                <span style={s.cmdCount}>{count}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Activity */}
        <motion.div style={s.panel} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}>
          <div style={s.panelHeader}>
            <span>Activity</span>
            <span style={s.panelCount}>{logs.length}</span>
          </div>
          <div style={{ ...s.panelContent, maxHeight: 380, overflowY: 'auto' }}>
            {logs.length === 0 && <div style={s.empty}>Waiting for events...</div>}
            {logs.slice(0, 20).map((l, i) => (
              <motion.div
                key={l.time + '-' + i}
                style={s.actRow}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: .35 + i * .015 }}
              >
                <div style={{
                  ...s.actDot,
                  background: l.level === 'error' ? '#fb7185' : l.level === 'warn' ? '#fbbf24' : '#818cf8',
                  boxShadow: `0 0 8px ${l.level === 'error' ? 'rgba(251,113,133,.4)' : l.level === 'warn' ? 'rgba(251,191,36,.3)' : 'rgba(129,140,248,.3)'}`,
                }} />
                <span style={s.actTime}>{ago(l.time)}</span>
                <span style={s.actMsg}>{l.message}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const s = {
  page: { padding: '32px 40px 48px' },

  skeleton: {
    background: 'linear-gradient(90deg, #0e0e12 25%, #17171b 50%, #0e0e12 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
  },

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
  heroContent: { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2' },
  heroSub: { fontSize: 14, color: '#5a5a65', marginTop: 6, fontWeight: 500 },
  heroPills: { display: 'flex', gap: 8 },
  pill: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)',
    fontSize: 12, color: '#94949e', fontFamily: 'var(--mono)', fontWeight: 600,
  },
  pillGreen: { background: 'rgba(52,211,153,.06)', borderColor: 'rgba(52,211,153,.1)', color: '#34d399' },

  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 },
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

  // Economy
  econStrip: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 18px', borderRadius: 12, marginBottom: 20,
    background: 'rgba(251,191,36,.03)', border: '1px solid rgba(251,191,36,.06)',
    fontSize: 13, color: '#94949e', fontWeight: 500,
  },
  econDot: { color: '#3a3a42' },

  // Columns
  columns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },

  // Panel
  panel: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.04)',
    fontSize: 12, fontWeight: 700, color: '#3a3a42', textTransform: 'uppercase', letterSpacing: '.8px',
  },
  panelCount: {
    fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600,
    background: '#17171b', color: '#5a5a65', padding: '2px 8px', borderRadius: 6,
  },
  panelContent: { padding: 8 },
  empty: { padding: 40, textAlign: 'center', color: '#3a3a42', fontSize: 14, fontWeight: 500 },

  // Commands
  cmdRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8 },
  cmdRank: { fontFamily: 'var(--mono)', fontSize: 11, color: '#3a3a42', width: 18, textAlign: 'right', fontWeight: 700 },
  cmdName: { fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: '#818cf8', width: 80 },
  cmdBarBg: { flex: 1, height: 4, background: '#17171b', borderRadius: 2, overflow: 'hidden' },
  cmdBarFill: { height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: 2 },
  cmdCount: { fontFamily: 'var(--mono)', fontSize: 12, color: '#5a5a65', width: 36, textAlign: 'right', fontWeight: 600 },

  // Activity
  actRow: { display: 'flex', gap: 10, padding: '6px 14px', fontSize: 13, color: '#94949e', alignItems: 'center' },
  actDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  actTime: { fontFamily: 'var(--mono)', fontSize: 11, color: '#3a3a42', width: 28, textAlign: 'right', fontWeight: 600 },
  actMsg: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
}
