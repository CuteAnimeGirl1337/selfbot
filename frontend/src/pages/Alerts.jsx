import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Bell, Plus, Trash2, MessageSquare, Forward, SmilePlus, BellRing } from 'lucide-react'

const ago = ts => {
  if (!ts) return ''
  const d = Date.now() - (typeof ts === 'number' ? ts : new Date(ts).getTime())
  if (d < 6e4) return 'just now'
  if (d < 36e5) return `${Math.floor(d / 6e4)}m ago`
  if (d < 864e5) return `${Math.floor(d / 36e5)}h ago`
  return `${Math.floor(d / 864e5)}d ago`
}

const actionColors = {
  notify: '#818cf8',
  react: '#fbbf24',
  reply: '#34d399',
  forward: '#22d3ee',
}

function Badge({ label }) {
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700,
      color: '#fff', textTransform: 'uppercase', letterSpacing: '.4px',
      background: actionColors[label] || '#5a5a65',
    }}>
      {label}
    </span>
  )
}

export default function Alerts({ api }) {
  const toast = useToast()
  const [alerts, setAlerts] = useState([])
  const [log, setLog] = useState([])
  const [keyword, setKeyword] = useState('')
  const [actions, setActions] = useState({ notify: true, react: false, reply: false, forward: false })
  const [reactEmoji, setReactEmoji] = useState('')
  const [replyText, setReplyText] = useState('')
  const [forwardChannel, setForwardChannel] = useState('')

  const fetchAlerts = useCallback(async () => {
    try {
      const a = await api('/api/alerts')
      if (Array.isArray(a)) setAlerts(a)
    } catch {}
  }, [api])

  const fetchLog = useCallback(async () => {
    try {
      const l = await api('/api/alerts/log?limit=30')
      if (Array.isArray(l)) setLog(l)
    } catch {}
  }, [api])

  useEffect(() => {
    fetchAlerts()
    fetchLog()
    const iv = setInterval(fetchLog, 15000)
    return () => clearInterval(iv)
  }, [fetchAlerts, fetchLog])

  const toggleAction = key => setActions(prev => ({ ...prev, [key]: !prev[key] }))

  const addAlert = async () => {
    if (!keyword.trim()) return
    const body = {
      keyword: keyword.trim(),
      actions: Object.entries(actions).filter(([, v]) => v).map(([k]) => k),
    }
    if (actions.react && reactEmoji.trim()) body.reactEmoji = reactEmoji.trim()
    if (actions.reply && replyText.trim()) body.replyText = replyText.trim()
    if (actions.forward && forwardChannel.trim()) body.forwardChannel = forwardChannel.trim()
    await api('/api/alerts', body)
    toast('Alert added')
    setKeyword('')
    setActions({ notify: true, react: false, reply: false, forward: false })
    setReactEmoji('')
    setReplyText('')
    setForwardChannel('')
    fetchAlerts()
  }

  const deleteAlert = async (id) => {
    try { await fetch(`/api/alerts/${id}`, { method: 'DELETE' }) } catch {}
    toast('Alert removed')
    fetchAlerts()
  }

  return (
    <div style={s.page}>
      {/* Hero header */}
      <motion.div style={s.hero} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <div style={s.heroGlow} />
        <div style={s.heroGlowAmber} />
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Keyword Alerts</h1>
            <p style={s.heroSub}>{alerts.length} active alerts · {log.length} triggered</p>
          </div>
        </div>
      </motion.div>

      <div style={s.cols}>
        {/* Create alert */}
        <motion.div style={s.createPanel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
          <div style={s.panelHead}><Plus size={14} style={{ marginRight: 6 }} /> Create Alert</div>
          <div style={s.panelBody}>
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAlert()}
              placeholder="Keyword..."
              style={{ ...s.input, marginBottom: 12, width: '100%', boxSizing: 'border-box' }}
            />

            <div style={s.checkRow}>
              {['notify', 'react', 'reply', 'forward'].map(a => (
                <label key={a} style={s.checkLabel}>
                  <input
                    type="checkbox"
                    checked={actions[a]}
                    onChange={() => toggleAction(a)}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span style={{ color: actionColors[a], fontWeight: 600, textTransform: 'capitalize' }}>{a}</span>
                </label>
              ))}
            </div>

            {actions.react && (
              <input
                value={reactEmoji}
                onChange={e => setReactEmoji(e.target.value)}
                placeholder="React emoji..."
                style={{ ...s.input, marginTop: 10, width: '100%', boxSizing: 'border-box' }}
              />
            )}
            {actions.reply && (
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Reply text..."
                style={{ ...s.input, marginTop: 10, width: '100%', boxSizing: 'border-box' }}
              />
            )}
            {actions.forward && (
              <input
                value={forwardChannel}
                onChange={e => setForwardChannel(e.target.value)}
                placeholder="Forward channel ID..."
                style={{ ...s.input, marginTop: 10, width: '100%', boxSizing: 'border-box' }}
              />
            )}

            <button onClick={addAlert} style={{ ...s.btn, marginTop: 14, width: '100%', justifyContent: 'center' }}>
              <BellRing size={13} /> Add Alert
            </button>
          </div>
        </motion.div>

        {/* Active alerts */}
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>
          <div style={s.panelHead}><Bell size={14} style={{ marginRight: 6 }} /> Active Alerts</div>
          <div style={s.panelBody}>
            {alerts.length === 0 && <div style={s.nil}>No active alerts</div>}
            {alerts.map((a, i) => (
              <motion.div
                key={a.id || i}
                style={s.alertCard}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * .03 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={s.keyword}>{a.keyword}</span>
                  <div style={s.badges}>
                    {(a.actions || []).map(act => <Badge key={act} label={act} />)}
                  </div>
                </div>
                <button onClick={() => deleteAlert(a.id)} style={s.removeBtn}>
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Alert log */}
      <motion.div style={{ ...s.panel, marginTop: 14 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}>
        <div style={s.panelHead}><MessageSquare size={14} style={{ marginRight: 6 }} /> Alert Log</div>
        <div style={{ ...s.panelBody, maxHeight: 450, overflowY: 'auto' }}>
          {log.length === 0 && <div style={s.nil}>No alerts triggered yet</div>}
          {log.map((entry, i) => (
            <motion.div
              key={entry.id || i}
              style={s.logRow}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * .02 }}
            >
              <div style={s.logTop}>
                <span style={s.logKeyword}>{entry.keyword}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px',
                  color: actionColors[entry.action] || '#5a5a65',
                }}>
                  {entry.action}
                </span>
                <span style={s.logTime}>{ago(entry.time)}</span>
              </div>
              <div style={s.logContent}>{entry.content}</div>
              <div style={s.logMeta}>
                {entry.author && <span>{entry.author}</span>}
                {entry.channel && <span>#{entry.channel}</span>}
              </div>
            </motion.div>
          ))}
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
  heroGlowAmber: {
    position: 'absolute', bottom: -40, left: -30, width: 180, height: 180, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(251,191,36,.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2' },
  heroSub: { fontSize: 14, color: '#5a5a65', marginTop: 6, fontWeight: 500 },

  cols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },

  // Create panel with gradient
  createPanel: {
    background: 'linear-gradient(160deg, #0c0c15 0%, #0c0c0f 40%, #0c0c0f 100%)',
    border: '1px solid rgba(99,102,241,.08)',
    borderRadius: 16, overflow: 'hidden',
  },
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
  panelBody: { padding: 16 },
  nil: { padding: 40, textAlign: 'center', color: '#3a3a42', fontSize: 14, fontWeight: 500 },

  input: {
    padding: '9px 12px', background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.04)', borderRadius: 10,
    color: '#f0f0f2', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    transition: 'border-color .2s',
  },
  btn: {
    padding: '10px 16px', background: 'linear-gradient(90deg, #6366f1, #818cf8)',
    border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
  },
  checkRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' },

  alertCard: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px',
    borderRadius: 12, borderBottom: '1px solid rgba(255,255,255,.03)',
    background: 'rgba(255,255,255,.01)', marginBottom: 4,
  },
  keyword: { fontSize: 14, fontWeight: 700, color: '#818cf8', fontFamily: 'var(--mono)' },
  badges: { display: 'flex', gap: 4, marginTop: 6 },
  removeBtn: {
    background: 'transparent', border: 'none', color: '#fb7185',
    cursor: 'pointer', display: 'flex', padding: 6, opacity: .7,
    borderRadius: 8, transition: 'opacity .15s',
  },

  logRow: {
    padding: '12px 12px', borderRadius: 10,
    borderBottom: '1px solid rgba(255,255,255,.03)', fontSize: 14, marginBottom: 4,
    background: 'rgba(255,255,255,.01)',
  },
  logTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  logKeyword: { fontWeight: 700, color: '#f0f0f2', fontFamily: 'var(--mono)', fontSize: 13 },
  logTime: { marginLeft: 'auto', color: '#3a3a42', fontSize: 12, fontFamily: 'var(--mono)' },
  logContent: { color: '#94949e', wordBreak: 'break-word', lineHeight: 1.5 },
  logMeta: { color: '#3a3a42', fontSize: 12, marginTop: 4, display: 'flex', gap: 10 },
}
