import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Eye, EyeOff, UserPlus } from 'lucide-react'

const ago = ts => {
  const d = Date.now() - ts
  if (d < 6e4) return 'now'
  if (d < 36e5) return `${Math.floor(d / 6e4)}m`
  if (d < 864e5) return `${Math.floor(d / 36e5)}h`
  return `${Math.floor(d / 864e5)}d`
}

export default function Spy({ api, spyLog }) {
  const toast = useToast()
  const [targets, setTargets] = useState([])
  const [newId, setNewId] = useState('')
  const [autoReplies, setAutoReplies] = useState({})
  const [arId, setArId] = useState('')
  const [arText, setArText] = useState('')

  useEffect(() => {
    fetch('/api/spy/targets').then(r => r.json()).then(setTargets)
    fetch('/api/autoreplies').then(r => r.json()).then(setAutoReplies)
  }, [])

  const toggleSpy = async (id) => {
    const res = await api('/api/spy/toggle', { userId: id })
    if (res.active) {
      setTargets(prev => [...prev, id])
      toast(`Spying on ${id}`)
    } else {
      setTargets(prev => prev.filter(t => t !== id))
      toast(`Stopped spying on ${id}`)
    }
  }

  const addSpy = async () => {
    if (!newId.trim()) return
    await toggleSpy(newId.trim())
    setNewId('')
  }

  const addAutoReply = async () => {
    if (!arId.trim() || !arText.trim()) return
    await api('/api/autoreplies', { userId: arId.trim(), reply: arText.trim() })
    setAutoReplies(prev => ({ ...prev, [arId.trim()]: arText.trim() }))
    toast(`Auto-reply set for ${arId.trim()}`)
    setArId(''); setArText('')
  }

  const removeAutoReply = async (id) => {
    await api('/api/autoreplies', { userId: id, reply: '' })
    setAutoReplies(prev => { const n = { ...prev }; delete n[id]; return n })
    toast('Auto-reply removed')
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Spy & Auto-Reply</h1>

      <div style={s.cols}>
        {/* Spy Targets */}
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={s.panelHead}>
            <Eye size={14} /> Spy Targets
          </div>
          <div style={s.panelBody}>
            <div style={s.addRow}>
              <input
                value={newId}
                onChange={e => setNewId(e.target.value)}
                placeholder="User ID..."
                style={s.input}
              />
              <button onClick={addSpy} style={s.btn}><UserPlus size={13} /></button>
            </div>
            {targets.length === 0 && <div style={s.nil}>No spy targets</div>}
            {targets.map(id => (
              <div key={id} style={s.targetRow}>
                <span style={s.targetId}>{id}</span>
                <button onClick={() => toggleSpy(id)} style={s.removeBtn}>
                  <EyeOff size={13} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Auto Replies */}
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}>
          <div style={s.panelHead}>Auto-Replies</div>
          <div style={s.panelBody}>
            <div style={s.addRow}>
              <input value={arId} onChange={e => setArId(e.target.value)} placeholder="User ID..." style={{ ...s.input, width: 120 }} />
              <input value={arText} onChange={e => setArText(e.target.value)} placeholder="Reply text..." style={s.input} />
              <button onClick={addAutoReply} style={s.btn}>Add</button>
            </div>
            {Object.entries(autoReplies).length === 0 && <div style={s.nil}>No auto-replies</div>}
            {Object.entries(autoReplies).map(([id, text]) => (
              <div key={id} style={s.targetRow}>
                <span style={s.targetId}>{id}</span>
                <span style={s.arText}>{text}</span>
                <button onClick={() => removeAutoReply(id)} style={s.removeBtn}>×</button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Spy Log */}
      <motion.div style={{ ...s.panel, marginTop: 12 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
        <div style={s.panelHead}>Spy Log</div>
        <div style={{ ...s.panelBody, maxHeight: 400, overflowY: 'auto' }}>
          {spyLog.length === 0 && <div style={s.nil}>No messages captured</div>}
          {spyLog.map((l, i) => (
            <div key={i} style={s.logRow}>
              <span style={s.logAuthor}>{l.author}</span>
              <span style={s.logMeta}>#{l.channel} · {ago(l.time)}</span>
              <div style={s.logContent}>{l.content}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

const s = {
  page: { padding: '32px 40px 48px' },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2', marginBottom: 24 },
  cols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  panel: { background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)', borderRadius: 16, overflow: 'hidden' },
  panelHead: { padding: '13px 18px', fontSize: 12, fontWeight: 700, color: '#3a3a42', textTransform: 'uppercase', letterSpacing: '.8px', borderBottom: '1px solid rgba(255,255,255,.03)', display: 'flex', alignItems: 'center', gap: 6 },
  panelBody: { padding: 10 },
  nil: { padding: 24, textAlign: 'center', color: '#3a3a42', fontSize: 13 },
  addRow: { display: 'flex', gap: 6, marginBottom: 8 },
  input: { flex: 1, padding: '10px 14px', background: '#17171b', border: '1px solid rgba(255,255,255,.04)', borderRadius: 10, color: '#f0f0f2', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  btn: { padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(99,102,241,.2)' },
  targetRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, fontSize: 13 },
  targetId: { fontFamily: 'var(--mono)', fontSize: 12, color: '#94949e', flex: 1 },
  arText: { fontSize: 12, color: '#5a5a65', flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  removeBtn: { background: 'transparent', border: 'none', color: '#fb7185', cursor: 'pointer', fontSize: 16, display: 'flex', padding: 4 },
  logRow: { padding: '8px 10px', borderRadius: 8, fontSize: 12, borderBottom: '1px solid rgba(255,255,255,.03)' },
  logAuthor: { fontWeight: 600, color: '#f0f0f2' },
  logMeta: { color: '#3a3a42', fontSize: 11, marginLeft: 6 },
  logContent: { color: '#94949e', marginTop: 3, wordBreak: 'break-word' },
}
