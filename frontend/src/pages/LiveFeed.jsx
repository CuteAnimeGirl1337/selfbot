import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Zap, MessageSquare, Filter } from 'lucide-react'

const ago = ts => {
  const d = Date.now() - ts
  if (d < 6e4) return 'now'
  if (d < 36e5) return `${Math.floor(d / 6e4)}m ago`
  return `${Math.floor(d / 36e5)}h ago`
}

const esc = s => s?.replace(/</g, '&lt;')?.replace(/>/g, '&gt;') || ''

export default function LiveFeed({ feed }) {
  const [filter, setFilter] = useState('')
  const [filterFocus, setFilterFocus] = useState(false)

  const filtered = filter
    ? feed.filter(f => f.command?.includes(filter.toLowerCase()) || f.response?.toLowerCase().includes(filter.toLowerCase()))
    : feed

  // Group command + response pairs
  const items = []
  for (let i = 0; i < filtered.length; i++) {
    const f = filtered[i]
    if (f.type === 'res') {
      items.push(f)
    } else if (f.type === 'cmd') {
      items.push(f)
    }
  }

  return (
    <div style={{ padding: '32px 40px 48px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 16px)' }}>
      {/* Hero header */}
      <motion.div style={s.hero} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <div style={s.heroGlow} />
        <div style={s.heroGlowLeft} />
        <div style={s.heroContent}>
          <div style={s.titleRow}>
            <div style={s.liveDot} />
            <h1 style={s.heroTitle}>Live Feed</h1>
            <span style={s.eventBadge}>{feed.length} events</span>
          </div>
          <div style={{
            ...s.searchWrap,
            borderColor: filterFocus ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.04)',
            boxShadow: filterFocus ? '0 0 20px rgba(99,102,241,.1)' : 'none',
          }}>
            <Filter size={13} color="#5a5a65" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              onFocus={() => setFilterFocus(true)}
              onBlur={() => setFilterFocus(false)}
              placeholder="Filter..."
              style={s.searchInput}
            />
          </div>
        </div>
      </motion.div>

      {/* Feed */}
      <div style={s.feed}>
        <AnimatePresence initial={false}>
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 20px' }}
            >
              <Radio size={48} color="var(--t4)" strokeWidth={1.5} />
              <span style={{ fontSize: 16, color: 'var(--t3)', fontWeight: 500 }}>Waiting for commands...</span>
              <span style={{ fontSize: 13, color: 'var(--t4)' }}>Commands and responses will stream here in real-time</span>
            </motion.div>
          )}
          {items.map((item, i) => (
            <motion.div
              key={item.time + '-' + i}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: .2 }}
              style={item.type === 'res' ? s.resCard : s.cmdCard}
            >
              {item.type === 'cmd' ? (
                <>
                  <div style={s.cardHeader}>
                    <Zap size={12} color="#818cf8" />
                    <span style={s.cmdName}>{item.name}</span>
                    <span style={s.cmdArgs}>{item.args}</span>
                    <span style={s.metaText}>{item.user} · #{item.channel}</span>
                    <span style={s.time}>{ago(item.time)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={s.cardHeader}>
                    <MessageSquare size={12} color="#34d399" />
                    <span style={s.cmdName}>{item.command}</span>
                    <span style={s.metaText}>{item.user} · #{item.channel}</span>
                    <span style={s.time}>{ago(item.time)}</span>
                  </div>
                  <div style={s.responseBody}>
                    {item.response}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

const s = {
  // Hero
  hero: {
    position: 'relative', borderRadius: 20, padding: '32px 36px',
    background: 'linear-gradient(135deg, #0c0c1a 0%, #12101f 50%, #0f0c18 100%)',
    border: '1px solid rgba(99,102,241,.08)',
    marginBottom: 20, overflow: 'hidden', flexShrink: 0,
  },
  heroGlow: {
    position: 'absolute', top: -60, right: -60, width: 250, height: 250, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroGlowLeft: {
    position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(251,113,133,.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 12,
  },
  titleRow: { display: 'flex', alignItems: 'center', gap: 10 },
  liveDot: {
    width: 8, height: 8, borderRadius: '50%', background: '#fb7185',
    boxShadow: '0 0 10px rgba(251,113,133,.4)',
    animation: 'pulse 2s ease-in-out infinite',
  },
  heroTitle: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2' },
  eventBadge: {
    fontSize: 12, color: '#5a5a65', fontFamily: 'var(--mono)',
    background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '4px 10px', fontWeight: 600,
  },

  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, padding: '8px 12px',
    transition: 'border-color .2s, box-shadow .2s',
  },
  searchInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: '#f0f0f2', fontSize: 14, width: 160, fontFamily: 'inherit',
  },

  feed: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
  nil: { padding: 48, textAlign: 'center', color: '#3a3a42', fontSize: 14, fontWeight: 500 },

  cmdCard: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.03)',
    borderLeft: '3px solid rgba(99,102,241,.3)',
    borderRadius: 12, padding: '12px 16px',
  },
  resCard: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.03)',
    borderLeft: '3px solid rgba(52,211,153,.3)',
    borderRadius: 12, padding: '12px 16px',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
  cmdName: { fontFamily: 'var(--mono)', fontWeight: 600, color: '#818cf8', fontSize: 13 },
  cmdArgs: { color: '#94949e', fontFamily: 'var(--mono)', fontSize: 13 },
  metaText: { color: '#3a3a42', fontSize: 12, marginLeft: 'auto' },
  time: { color: '#25252b', fontSize: 11, fontFamily: 'var(--mono)' },
  responseBody: {
    marginTop: 8, padding: '10px 12px', background: 'rgba(255,255,255,.02)',
    borderRadius: 10, fontSize: 13, color: '#94949e',
    fontFamily: 'var(--mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    maxHeight: 120, overflowY: 'auto', lineHeight: 1.5,
    border: '1px solid rgba(255,255,255,.03)',
  },
}
