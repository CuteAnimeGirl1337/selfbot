import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trash2, Plus, CalendarClock, Repeat } from 'lucide-react'
import { useToast } from '../components/Toast'

function relativeTime(ts) {
  const diff = ts - Date.now()
  if (diff < 0) return 'overdue'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `in ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `in ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `in ${days}d`
}

export default function Scheduler({ api }) {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [channelId, setChannelId] = useState('')
  const [message, setMessage] = useState('')
  const [sendAt, setSendAt] = useState('')
  const [recurring, setRecurring] = useState('none')

  const fetch_ = async () => {
    const res = await api('/api/scheduler')
    if (res) setItems(res)
  }

  useEffect(() => { fetch_() }, [])

  const create = async () => {
    if (!channelId.trim() || !message.trim() || !sendAt) {
      return toast('All fields required')
    }
    const timestamp = new Date(sendAt).getTime()
    if (isNaN(timestamp)) return toast('Invalid date/time')
    await api('/api/scheduler', { channelId: channelId.trim(), message: message.trim(), sendAt: timestamp, recurring })
    toast('Scheduled message created')
    setChannelId('')
    setMessage('')
    setSendAt('')
    setRecurring('none')
    fetch_()
  }

  const del = async (id) => {
    try { await fetch(`/api/scheduler/${id}`, { method: 'DELETE' }) } catch {}
    toast('Scheduled message deleted')
    fetch_()
  }

  const focusStyle = (e) => { e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)'; e.target.style.borderColor = 'rgba(99,102,241,.3)' }
  const blurStyle = (e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'rgba(255,255,255,.04)' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '32px 40px 48px' }}
    >
      <h1 style={s.title}>Scheduler</h1>

      <div style={s.panel}>
        <h2 style={s.sectionHeader}>
          <CalendarClock size={14} style={{ marginRight: 8, opacity: 0.5 }} />
          SCHEDULE A MESSAGE
        </h2>
        <div style={s.formGrid}>
          <div style={s.field}>
            <label style={s.label}>Channel ID</label>
            <input
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              placeholder="123456789012345678"
              style={s.input}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Date & Time</label>
            <input
              type="datetime-local"
              value={sendAt}
              onChange={e => setSendAt(e.target.value)}
              style={s.input}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Recurring</label>
            <select
              value={recurring}
              onChange={e => setRecurring(e.target.value)}
              style={s.input}
              onFocus={focusStyle}
              onBlur={blurStyle}
            >
              <option value="none">None</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={s.label}>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Message to send..."
            style={s.textarea}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>
        <button onClick={create} style={s.btn}>
          <Plus size={14} /> Schedule
        </button>
      </div>

      <div style={s.panel}>
        <h2 style={s.sectionHeader}>
          <Clock size={14} style={{ marginRight: 8, opacity: 0.5 }} />
          SCHEDULED MESSAGES
          <span style={s.badge}>{items.length}</span>
        </h2>
        <AnimatePresence mode="popLayout">
          {items.length === 0 && (
            <p style={s.empty}>No scheduled messages.</p>
          )}
          {items.map(item => {
            const rel = relativeTime(item.sendAt)
            const overdue = rel === 'overdue'
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={s.row}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.rowTop}>
                    <span style={s.channel}>#{item.channelId}</span>
                    {item.recurring !== 'none' && (
                      <span style={s.recurBadge}>
                        <Repeat size={10} /> {item.recurring}
                      </span>
                    )}
                    <span style={{ ...s.timeBadge, color: overdue ? '#fb7185' : '#34d399' }}>
                      {rel}
                    </span>
                  </div>
                  <p style={s.preview}>
                    {item.message?.length > 80 ? item.message.slice(0, 80) + '...' : item.message}
                  </p>
                  <span style={s.dateText}>
                    {new Date(item.sendAt).toLocaleString()}
                  </span>
                </div>
                <button onClick={() => del(item.id)} style={s.delBtn}>
                  <Trash2 size={13} />
                </button>
              </motion.div>
            )
          })}
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
  formGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14,
  },
  field: { display: 'flex', flexDirection: 'column' },
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
    fontSize: 13, outline: 'none',
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
  row: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 16px', borderRadius: 12,
    background: '#17171b', marginBottom: 8,
    border: '1px solid rgba(255,255,255,.03)',
  },
  rowTop: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
  },
  channel: {
    fontSize: 13, fontWeight: 600, color: '#818cf8',
    fontFamily: 'monospace',
  },
  recurBadge: {
    fontSize: 10, fontWeight: 600, color: '#818cf8',
    background: 'rgba(99,102,241,.08)', padding: '2px 8px',
    borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3,
    border: '1px solid rgba(99,102,241,.12)',
  },
  timeBadge: {
    fontSize: 11, fontWeight: 600,
  },
  preview: {
    fontSize: 13, color: '#94949e', margin: 0,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  dateText: {
    fontSize: 11, color: '#3a3a42', marginTop: 2, display: 'block',
  },
  delBtn: {
    background: 'rgba(251,113,133,.08)', color: '#fb7185',
    border: '1px solid rgba(251,113,133,.15)', borderRadius: 10,
    padding: '7px 12px', fontSize: 12, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', flexShrink: 0,
  },
  badge: {
    marginLeft: 8, fontSize: 11, fontWeight: 600,
    background: 'rgba(99,102,241,.08)', color: '#818cf8',
    padding: '2px 9px', borderRadius: 10,
    border: '1px solid rgba(99,102,241,.12)',
  },
  empty: { fontSize: 13, color: '#5a5a65', fontStyle: 'italic' },
}
