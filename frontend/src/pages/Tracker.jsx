import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { UserPlus, Trash2, Circle, Clock, Activity, Palette, AtSign, Gamepad2 } from 'lucide-react'

const ago = ts => {
  if (!ts) return 'never'
  const d = Date.now() - (typeof ts === 'number' ? ts : new Date(ts).getTime())
  if (d < 0) return 'now'
  if (d < 6e4) return 'just now'
  if (d < 36e5) return `${Math.floor(d / 6e4)}m ago`
  if (d < 864e5) return `${Math.floor(d / 36e5)}h ago`
  return `${Math.floor(d / 864e5)}d ago`
}

const statusColor = status => {
  if (status === 'online') return '#34d399'
  if (status === 'idle') return '#fbbf24'
  if (status === 'dnd') return '#fb7185'
  return '#3a3a42'
}

const eventIcon = type => {
  if (type === 'online') return { icon: Circle, color: '#34d399' }
  if (type === 'offline') return { icon: Circle, color: '#3a3a42' }
  if (type === 'status') return { icon: Activity, color: '#c084fc' }
  if (type === 'avatar') return { icon: Palette, color: '#3b82f6' }
  if (type === 'username') return { icon: AtSign, color: '#fbbf24' }
  if (type === 'activity') return { icon: Gamepad2, color: '#22d3ee' }
  return { icon: Circle, color: '#5a5a65' }
}

const fmtDuration = ms => {
  if (!ms || ms <= 0) return '0m'
  const h = Math.floor(ms / 36e5)
  const m = Math.floor((ms % 36e5) / 6e4)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function Tracker({ api }) {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [history, setHistory] = useState([])
  const [newId, setNewId] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [u, h] = await Promise.all([
        api('/api/tracker/users'),
        api('/api/tracker/history?limit=50'),
      ])
      if (Array.isArray(u)) setUsers(u)
      if (Array.isArray(h)) setHistory(h)
    } catch {}
  }, [api])

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 10000)
    return () => clearInterval(iv)
  }, [fetchData])

  const addUser = async () => {
    const id = newId.trim()
    if (!id) return
    await api('/api/tracker/add', { userId: id })
    toast('User tracked')
    setNewId('')
    fetchData()
  }

  const removeUser = async (userId) => {
    await api('/api/tracker/remove', { userId })
    toast('User removed')
    fetchData()
  }

  return (
    <div style={s.page}>
      {/* Hero header */}
      <motion.div style={s.hero} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <div style={s.heroGlow} />
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>User Tracker</h1>
            <p style={s.heroSub}>{users.length} users tracked · {history.length} events recorded</p>
          </div>
        </div>
      </motion.div>

      {/* Add user form */}
      <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
        <div style={s.panelHead}><UserPlus size={14} style={{ marginRight: 6 }} /> Track a User</div>
        <div style={s.panelBody}>
          <div style={s.addRow}>
            <input
              value={newId}
              onChange={e => setNewId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addUser()}
              placeholder="User ID..."
              style={s.input}
            />
            <button onClick={addUser} style={s.btn}>Track</button>
          </div>
        </div>
      </motion.div>

      <div style={s.cols}>
        {/* Tracked users */}
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>
          <div style={s.panelHead}><Clock size={14} style={{ marginRight: 6 }} /> Tracked Users</div>
          <div style={s.panelBody}>
            {users.length === 0 && <div style={s.nil}>No tracked users</div>}
            {users.map((u, i) => (
              <motion.div
                key={u.userId || i}
                style={s.userCard}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * .03 }}
              >
                <div style={{
                  ...s.statusDot,
                  background: statusColor(u.status),
                  boxShadow: `0 0 8px ${statusColor(u.status)}4d`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.userTag}>{u.tag || u.userId}</div>
                  <div style={s.userMeta}>
                    <span style={s.userId}>{u.userId}</span>
                    <span style={s.sep}>·</span>
                    <span>Last seen: {ago(u.lastSeen)}</span>
                    <span style={s.sep}>·</span>
                    <span>Today: {fmtDuration(u.sessionToday)}</span>
                  </div>
                </div>
                <button onClick={() => removeUser(u.userId)} style={s.removeBtn}>
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Activity timeline */}
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}>
          <div style={s.panelHead}><Activity size={14} style={{ marginRight: 6 }} /> Activity Timeline</div>
          <div style={{ ...s.panelBody, maxHeight: 500, overflowY: 'auto' }}>
            {history.length === 0 && <div style={s.nil}>No activity recorded</div>}
            {history.map((ev, i) => {
              const { icon: Icon, color } = eventIcon(ev.type)
              return (
                <motion.div
                  key={ev.id || i}
                  style={s.eventRow}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * .02 }}
                >
                  <div style={{ ...s.eventIcon, background: `${color}18`, color }}>
                    <Icon size={12} fill={ev.type === 'online' || ev.type === 'offline' ? color : 'none'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={s.eventTag}>{ev.tag || ev.userId}</span>
                    <span style={s.eventDesc}>{ev.description}</span>
                  </div>
                  <span style={s.eventTime}>{ago(ev.time)}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
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
  panelBody: { padding: 12 },
  nil: { padding: 40, textAlign: 'center', color: '#3a3a42', fontSize: 14, fontWeight: 500 },

  addRow: { display: 'flex', gap: 8 },
  input: {
    flex: 1, padding: '9px 12px', background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.04)', borderRadius: 10,
    color: '#f0f0f2', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    transition: 'border-color .2s',
  },
  btn: {
    padding: '9px 18px', background: '#6366f1', border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },

  userCard: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
    borderRadius: 12, borderBottom: '1px solid rgba(255,255,255,.03)',
    background: 'rgba(255,255,255,.01)',
    marginBottom: 4,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
  },
  userTag: { fontSize: 14, fontWeight: 600, color: '#f0f0f2' },
  userMeta: {
    fontSize: 12, color: '#5a5a65', marginTop: 3,
    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
  },
  userId: { fontFamily: 'var(--mono)', fontSize: 11, color: '#3a3a42' },
  sep: { color: '#25252b' },
  removeBtn: {
    background: 'transparent', border: 'none', color: '#fb7185',
    cursor: 'pointer', display: 'flex', padding: 6, opacity: .7,
    borderRadius: 8, transition: 'opacity .15s',
  },

  eventRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
    borderRadius: 10, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,.03)',
  },
  eventIcon: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
  },
  eventTag: { fontWeight: 600, color: '#f0f0f2', marginRight: 6 },
  eventDesc: { color: '#94949e' },
  eventTime: { fontSize: 12, color: '#3a3a42', flexShrink: 0, marginLeft: 'auto', fontFamily: 'var(--mono)' },
}
