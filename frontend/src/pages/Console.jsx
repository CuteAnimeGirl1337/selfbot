import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const levelColor = { info: 'var(--t2)', warn: 'var(--amber)', error: 'var(--red)' }

export default function Console({ logs, fetchLogs }) {
  const [autoScroll, setAutoScroll] = useState(true)
  const endRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => { fetchLogs() }, [])

  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const reversed = [...logs].reverse()

  return (
    <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 16px)' }}>
      <div style={s.header}>
        <h1 style={s.title}>Console</h1>
        <div style={s.actions}>
          <button
            onClick={() => {/* logs are in state, we just clear view */ }}
            style={s.ghostBtn}
          >
            Clear
          </button>
          <label style={s.checkLabel}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              style={s.checkbox}
            />
            <span style={s.checkBox}>{autoScroll ? '✓' : ''}</span>
            Auto-scroll
          </label>
        </div>
      </div>

      <motion.div
        ref={containerRef}
        style={s.console}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {reversed.map((l, i) => (
          <div key={i} style={{ ...s.line, color: levelColor[l.level] || 'var(--t2)' }}>
            <span style={s.time}>{new Date(l.time).toLocaleTimeString()}</span>
            <span style={s.level}>{l.level}</span>
            {l.message}
          </div>
        ))}
        <div ref={endRef} />
      </motion.div>
    </div>
  )
}

const s = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: '-.5px' },
  actions: { display: 'flex', alignItems: 'center', gap: 12 },
  ghostBtn: {
    padding: '6px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--t2)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all .15s',
  },
  checkLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, color: 'var(--t3)', cursor: 'pointer', fontWeight: 500,
    userSelect: 'none',
  },
  checkbox: { display: 'none' },
  checkBox: {
    width: 16, height: 16, borderRadius: 4,
    background: 'var(--bg-3)', border: '1px solid var(--border-h)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, color: 'var(--accent)', fontWeight: 700,
  },
  console: {
    flex: 1, background: 'var(--bg-1)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '16px 18px',
    overflowY: 'auto',
    fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.8,
    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
  },
  line: { display: 'block' },
  time: { color: 'var(--t4)', marginRight: 10 },
  level: { fontWeight: 600, marginRight: 6 },
}
