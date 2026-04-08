import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Trash2, Plus, Terminal, Hash } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function Macros({ api }) {
  const toast = useToast()
  const [macros, setMacros] = useState([])
  const [name, setName] = useState('')
  const [commands, setCommands] = useState('')
  const [delay, setDelay] = useState('500')

  const fetch_ = async () => {
    const res = await api('/api/macros')
    if (res && typeof res === 'object') {
      // API returns { name: { commands, delay } } — convert to array
      const arr = Object.entries(res).map(([name, data]) => ({ name, ...data }))
      setMacros(arr)
    }
  }

  useEffect(() => { fetch_() }, [])

  const create = async () => {
    if (!name.trim() || !commands.trim()) return toast('Name and commands required')
    const lines = commands.split('\n').map(l => l.trim()).filter(Boolean)
    await api('/api/macros', { name: name.trim(), commands: lines, delay: parseInt(delay) || 500 })
    toast('Macro created')
    setName('')
    setCommands('')
    setDelay('500')
    fetch_()
  }

  const run = async (n) => {
    await api(`/api/macros/${n}/run`, {})
    toast(`Running "${n}"`)
  }

  const del = async (n) => {
    try { await fetch(`/api/macros/${n}`, { method: 'DELETE' }) } catch {}
    toast('Macro deleted')
    fetch_()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '32px 40px 48px' }}
    >
      <h1 style={s.title}>Macros</h1>

      <div style={s.panel}>
        <h2 style={s.sectionHeader}>CREATE MACRO</h2>
        <div style={s.formRow}>
          <div style={s.field}>
            <label style={s.label}>Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. greet-all"
              style={s.input}
              onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)'; e.target.style.borderColor = 'rgba(99,102,241,.3)' }}
              onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'rgba(255,255,255,.04)' }}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Delay (ms)</label>
            <input
              value={delay}
              onChange={e => setDelay(e.target.value)}
              placeholder="500"
              type="number"
              style={{ ...s.input, width: 100 }}
              onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)'; e.target.style.borderColor = 'rgba(99,102,241,.3)' }}
              onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'rgba(255,255,255,.04)' }}
            />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={s.label}>Commands (one per line)</label>
          <textarea
            value={commands}
            onChange={e => setCommands(e.target.value)}
            rows={5}
            placeholder={'.say Hello\n.say World\n.purge 5'}
            style={s.textarea}
            onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)'; e.target.style.borderColor = 'rgba(99,102,241,.3)' }}
            onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'rgba(255,255,255,.04)' }}
          />
        </div>
        <button onClick={create} style={s.btn}>
          <Plus size={14} /> Create Macro
        </button>
      </div>

      <div style={s.panel}>
        <h2 style={s.sectionHeader}>
          <Terminal size={14} style={{ marginRight: 8, opacity: 0.5 }} />
          SAVED MACROS
          <span style={s.badge}>{macros.length}</span>
        </h2>
        <AnimatePresence mode="popLayout">
          {macros.length === 0 && (
            <p style={s.empty}>No macros yet. Create one above.</p>
          )}
          {macros.map(m => (
            <motion.div
              key={m.name}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={s.macroRow}
            >
              <div style={{ flex: 1 }}>
                <span style={s.macroName}>{m.name}</span>
                <span style={s.cmdCount}>
                  <Hash size={11} /> {m.commands?.length || 0} commands
                </span>
              </div>
              <button onClick={() => run(m.name)} style={s.runBtn}>
                <Play size={13} /> Run
              </button>
              <button onClick={() => del(m.name)} style={s.delBtn}>
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const s = {
  title: {
    fontSize: 28, fontWeight: 700, letterSpacing: '-.6px',
    color: '#f0f0f2', marginBottom: 28,
  },
  panel: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, padding: '22px 26px', marginBottom: 22,
  },
  sectionHeader: {
    fontSize: 12, fontWeight: 700, color: '#3a3a42',
    textTransform: 'uppercase', letterSpacing: '.8px',
    marginBottom: 18, display: 'flex', alignItems: 'center',
  },
  formRow: {
    display: 'flex', gap: 14, flexWrap: 'wrap',
  },
  field: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 160 },
  label: {
    fontSize: 12, fontWeight: 700, color: '#3a3a42',
    textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8,
  },
  input: {
    background: '#17171b', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, padding: '10px 14px', color: '#f0f0f2',
    fontSize: 13, outline: 'none', transition: 'box-shadow .2s, border-color .2s',
  },
  textarea: {
    background: '#17171b', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, padding: '10px 14px', color: '#f0f0f2',
    fontSize: 13, fontFamily: 'monospace', outline: 'none',
    width: '100%', resize: 'vertical', boxSizing: 'border-box',
    transition: 'box-shadow .2s, border-color .2s',
  },
  btn: {
    marginTop: 16, background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
    color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    boxShadow: '0 2px 12px rgba(99,102,241,.25)',
  },
  macroRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px', borderRadius: 12,
    background: '#17171b', marginBottom: 8,
    border: '1px solid rgba(255,255,255,.03)',
  },
  macroName: {
    fontSize: 14, fontWeight: 600, color: '#f0f0f2',
    fontFamily: 'monospace',
  },
  cmdCount: {
    fontSize: 11, color: '#5a5a65', marginLeft: 10,
    display: 'inline-flex', alignItems: 'center', gap: 3,
  },
  runBtn: {
    background: 'rgba(52,211,153,.08)', color: '#34d399',
    border: '1px solid rgba(52,211,153,.15)', borderRadius: 10,
    padding: '7px 14px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
  },
  delBtn: {
    background: 'rgba(251,113,133,.08)', color: '#fb7185',
    border: '1px solid rgba(251,113,133,.15)', borderRadius: 10,
    padding: '7px 12px', fontSize: 12, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center',
  },
  badge: {
    marginLeft: 8, fontSize: 11, fontWeight: 600,
    background: 'rgba(99,102,241,.08)', color: '#818cf8',
    padding: '2px 9px', borderRadius: 10,
    border: '1px solid rgba(99,102,241,.12)',
  },
  empty: { fontSize: 13, color: '#5a5a65', fontStyle: 'italic' },
}
