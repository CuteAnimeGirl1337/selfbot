import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Terminal } from 'lucide-react'

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 38, height: 20, borderRadius: 10, border: 'none',
        background: checked ? '#6366f1' : '#25252b',
        cursor: 'pointer', position: 'relative', padding: 0,
        transition: 'background .2s',
      }}
    >
      <motion.div
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 16, height: 16, borderRadius: '50%',
          background: '#f0f0f2', position: 'absolute', top: 2, left: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        }}
      />
    </button>
  )
}

export default function Commands({ state, lastCmd, api }) {
  const [filter, setFilter] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)
  if (!state) return null

  const { commands, config } = state
  const filtered = commands.filter(c => c.name.includes(filter.toLowerCase()))

  const toggle = async (name) => {
    await api(`/api/commands/${name}/toggle`)
  }

  return (
    <div style={s.page}>
      {/* Hero header */}
      <motion.div style={s.hero} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <div style={s.heroGlow} />
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Commands</h1>
            <p style={s.heroSub}>{commands.length} commands registered · {filtered.length} shown</p>
          </div>
          <div style={{
            ...s.search,
            borderColor: searchFocus ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.04)',
            boxShadow: searchFocus ? '0 0 20px rgba(99,102,241,.1)' : 'none',
          }}>
            <Search size={14} color="#5a5a65" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              placeholder="Search commands..."
              style={s.input}
            />
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div style={s.table} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>
        <div style={s.thead}>
          <span style={{ ...s.th, width: 160 }}>Command</span>
          <span style={{ ...s.th, flex: 1 }}>Description</span>
          <span style={{ ...s.th, width: 60, textAlign: 'right' }}>Uses</span>
          <span style={{ ...s.th, width: 50, textAlign: 'right' }}>On</span>
        </div>
        <div style={s.tbody}>
          {filtered.map((cmd, i) => {
            const flash = lastCmd?.name === cmd.name && Date.now() - lastCmd.at < 800
            return (
              <motion.div
                key={cmd.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: cmd.enabled ? 1 : .3 }}
                style={{
                  ...s.tr,
                  ...(flash ? { boxShadow: 'inset 3px 0 0 #34d399' } : {}),
                }}
              >
                <span style={s.cmdName}>{config.prefix}{cmd.name}</span>
                <span style={s.cmdDesc}>{cmd.description}</span>
                <span style={s.cmdUses}>{cmd.uses}</span>
                <span style={{ width: 50, display: 'flex', justifyContent: 'flex-end' }}>
                  <Toggle checked={cmd.enabled} onChange={() => toggle(cmd.name)} />
                </span>
              </motion.div>
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
  heroContent: { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2' },
  heroSub: { fontSize: 14, color: '#5a5a65', marginTop: 6, fontWeight: 500 },

  search: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, padding: '9px 14px',
    transition: 'border-color .2s, box-shadow .2s',
  },
  input: {
    background: 'transparent', border: 'none', outline: 'none',
    color: '#f0f0f2', fontSize: 14, width: 200, fontFamily: 'inherit',
  },

  table: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, overflow: 'hidden',
  },
  thead: {
    display: 'flex', padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,.04)',
  },
  th: {
    fontSize: 12, fontWeight: 700, color: '#3a3a42',
    textTransform: 'uppercase', letterSpacing: '.8px',
  },
  tbody: { maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' },
  tr: {
    display: 'flex', alignItems: 'center', padding: '10px 20px',
    borderBottom: '1px solid rgba(255,255,255,.03)',
    transition: 'background .12s',
  },
  cmdName: {
    fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600,
    color: '#818cf8', width: 160, flexShrink: 0,
  },
  cmdDesc: { flex: 1, fontSize: 14, color: '#94949e' },
  cmdUses: {
    fontFamily: 'var(--mono)', fontSize: 13, color: '#5a5a65',
    width: 60, textAlign: 'right', flexShrink: 0,
  },
}
