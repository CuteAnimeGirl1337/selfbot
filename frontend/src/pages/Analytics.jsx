import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { BarChart3, Users, Hash, MessageSquare, ArrowUp, TrendingUp, Cloud } from 'lucide-react'

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function Analytics({ api }) {
  const toast = useToast()
  const [data, setData] = useState(null)

  useEffect(() => {
    api('/api/analytics')
      .then(d => { if (d && typeof d === 'object') setData(d) })
      .catch(() => toast('Failed to load analytics'))
  }, [api])

  if (!data) {
    return (
      <div style={s.page}>
        <motion.div style={s.hero} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={s.heroGlow} />
          <div style={{ position: 'relative' }}>
            <h1 style={s.heroTitle}>Analytics</h1>
            <p style={s.heroSub}>Loading analytics...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  const totalSent = data.totalSent || 0
  const totalReceived = data.totalReceived || 0
  const avgDay = data.days && data.days.length > 0
    ? Math.round((totalSent + totalReceived) / data.days.length)
    : 0
  const topServer = data.topServer || 'N/A'

  const hourly = data.hourly || new Array(24).fill(0)
  const hourMax = Math.max(...hourly, 1)

  const days = data.days || []
  const dayMax = Math.max(...days.map(d => d.count || 0), 1)

  const topUsers = (data.topUsers || []).slice(0, 20)
  const topUserMax = topUsers.length > 0 ? topUsers[0].count || 1 : 1

  const topChannels = (data.topChannels || []).slice(0, 20)
  const topChMax = topChannels.length > 0 ? topChannels[0].count || 1 : 1

  const words = (data.topWords || []).slice(0, 50)

  const statCards = [
    { label: 'Total Sent', value: totalSent.toLocaleString(), icon: ArrowUp, color: '#34d399' },
    { label: 'Total Received', value: totalReceived.toLocaleString(), icon: MessageSquare, color: '#818cf8' },
    { label: 'Avg / Day', value: avgDay.toLocaleString(), icon: TrendingUp, color: '#fbbf24' },
    { label: 'Top Server', value: topServer, icon: Hash, color: '#c084fc' },
  ]

  return (
    <div style={s.page}>
      {/* Hero header */}
      <motion.div style={s.hero} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <div style={s.heroGlow} />
        <div style={s.heroGlowGreen} />
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Analytics</h1>
            <p style={s.heroSub}>{totalSent.toLocaleString()} sent · {totalReceived.toLocaleString()} received · {days.length} days tracked</p>
          </div>
        </div>
      </motion.div>

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

      {/* Hourly activity */}
      <motion.div style={{ ...s.panel, marginTop: 14 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}>
        <div style={s.panelHead}><BarChart3 size={14} style={{ marginRight: 6 }} /> Hourly Activity</div>
        <div style={s.panelBody}>
          <div style={s.chartRow}>
            {hourly.map((val, h) => (
              <div key={h} style={s.barCol}>
                <div
                  style={{
                    height: `${(val / hourMax) * 200}px`,
                    width: 24,
                    background: 'linear-gradient(to top, #6366f1, #818cf8)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: val > 0 ? 2 : 0,
                    transition: 'height .3s ease',
                  }}
                  title={`${h}:00 — ${val}`}
                />
                <span style={s.barLabel}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Daily activity */}
      <motion.div style={{ ...s.panel, marginTop: 14 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 }}>
        <div style={s.panelHead}><TrendingUp size={14} style={{ marginRight: 6 }} /> Daily Activity (Last 30 Days)</div>
        <div style={s.panelBody}>
          <div style={s.chartRow}>
            {days.map((d, i) => (
              <div key={i} style={s.barCol}>
                <div
                  style={{
                    height: `${((d.count || 0) / dayMax) * 160}px`,
                    width: Math.max(Math.floor(680 / Math.max(days.length, 1)) - 4, 8),
                    background: 'linear-gradient(to top, #34d399, #22d3ee)',
                    borderRadius: '3px 3px 0 0',
                    minHeight: (d.count || 0) > 0 ? 2 : 0,
                    transition: 'height .3s ease',
                  }}
                  title={`${d.date || ''} — ${d.count || 0}`}
                />
                {i % 5 === 0 && <span style={s.barLabel}>{(d.date || '').slice(5)}</span>}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div style={s.cols}>
        {/* Top users */}
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}>
          <div style={s.panelHead}><Users size={14} style={{ marginRight: 6 }} /> Top Users</div>
          <div style={{ ...s.panelBody, maxHeight: 400, overflowY: 'auto' }}>
            {topUsers.length === 0 && <div style={s.nil}>No data</div>}
            {topUsers.map((u, i) => (
              <div key={u.name || i} style={s.rankRow}>
                <span style={s.rankNum}>{i + 1}</span>
                <span style={s.rankName}>{u.name}</span>
                <div style={s.rankBarWrap}>
                  <div style={{
                    ...s.rankBar,
                    width: `${(u.count / topUserMax) * 100}%`,
                    background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                  }} />
                </div>
                <span style={s.rankCount}>{(u.count || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top channels */}
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35 }}>
          <div style={s.panelHead}><Hash size={14} style={{ marginRight: 6 }} /> Top Channels</div>
          <div style={{ ...s.panelBody, maxHeight: 400, overflowY: 'auto' }}>
            {topChannels.length === 0 && <div style={s.nil}>No data</div>}
            {topChannels.map((c, i) => (
              <div key={c.name || i} style={s.rankRow}>
                <span style={s.rankNum}>{i + 1}</span>
                <span style={s.rankName}>#{c.name}</span>
                <div style={s.rankBarWrap}>
                  <div style={{
                    ...s.rankBar,
                    width: `${(c.count / topChMax) * 100}%`,
                    background: 'linear-gradient(90deg, #22d3ee, #34d399)',
                  }} />
                </div>
                <span style={s.rankCount}>{(c.count || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Word cloud */}
      <motion.div style={{ ...s.panel, marginTop: 14 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .4 }}>
        <div style={s.panelHead}><Cloud size={14} style={{ marginRight: 6 }} /> Word Cloud</div>
        <div style={{ ...s.panelBody, display: 'flex', flexWrap: 'wrap', gap: 8, padding: 20 }}>
          {words.length === 0 && <div style={s.nil}>No data</div>}
          {words.map((w, i) => {
            const size = Math.round(28 - (i / Math.max(words.length - 1, 1)) * 16)
            const colors = ['#818cf8', '#a78bfa', '#c084fc', '#22d3ee', '#34d399', '#fbbf24']
            return (
              <motion.span
                key={w.word || i}
                initial={{ opacity: 0, scale: .8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * .01 }}
                style={{
                  fontSize: size,
                  fontWeight: size > 20 ? 700 : 500,
                  color: colors[i % colors.length],
                  padding: '2px 6px',
                  lineHeight: 1.3,
                  cursor: 'default',
                }}
                title={`${w.word}: ${w.count}`}
              >
                {w.word}
              </motion.span>
            )
          })}
        </div>
      </motion.div>
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
  heroGlowGreen: {
    position: 'absolute', bottom: -50, left: -30, width: 200, height: 200, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(52,211,153,.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2' },
  heroSub: { fontSize: 14, color: '#5a5a65', marginTop: 6, fontWeight: 500 },

  // Stat cards (centered vertical like Overview)
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
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

  cols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 },

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
  panelBody: { padding: 14 },
  nil: { padding: 40, textAlign: 'center', color: '#3a3a42', fontSize: 14, fontWeight: 500, width: '100%' },

  chartRow: { display: 'flex', alignItems: 'flex-end', gap: 4, minHeight: 220, padding: '10px 0' },
  barCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 },
  barLabel: { fontSize: 10, color: '#3a3a42', fontFamily: 'var(--mono)' },

  rankRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px',
    fontSize: 14, borderBottom: '1px solid rgba(255,255,255,.03)',
  },
  rankNum: { width: 20, fontSize: 11, fontWeight: 700, color: '#3a3a42', textAlign: 'center', flexShrink: 0 },
  rankName: {
    width: 130, fontSize: 14, color: '#f0f0f2', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
  },
  rankBarWrap: { flex: 1, height: 6, background: '#17171b', borderRadius: 3, overflow: 'hidden' },
  rankBar: { height: '100%', borderRadius: 3, transition: 'width .3s ease' },
  rankCount: {
    fontSize: 12, color: '#5a5a65', fontFamily: 'var(--mono)',
    flexShrink: 0, width: 55, textAlign: 'right', fontWeight: 600,
  },
}
