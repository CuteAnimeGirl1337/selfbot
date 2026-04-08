import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Link, User, MessageSquare, Hash } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function Webhooks({ state, api }) {
  const toast = useToast()
  const [channelId, setChannelId] = useState('')
  const [name, setName] = useState('Dashboard')
  const [avatar, setAvatar] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState([])

  const handleSend = async () => {
    if (!channelId.trim() || !content.trim()) {
      toast('Channel ID and message are required')
      return
    }
    setSending(true)
    try {
      await api('/api/webhook', {
        channelId: channelId.trim(),
        name: name.trim() || 'Dashboard',
        avatar: avatar.trim() || undefined,
        content: content.trim(),
      })
      setHistory(prev => [
        { id: Date.now(), channelId: channelId.trim(), name: name.trim() || 'Dashboard', content: content.trim(), ts: Date.now() },
        ...prev,
      ])
      setContent('')
      toast('Webhook sent')
    } catch {
      toast('Failed to send webhook')
    }
    setSending(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .35 }}
      style={s.page}
    >
      <h1 style={s.title}>Webhooks</h1>

      {/* Send Form */}
      <div style={s.panel}>
        <div style={s.sectionLabel}>Send Webhook</div>
        <div style={s.formGrid}>
          <div style={s.field}>
            <label style={s.label}><Hash size={12} /> Channel ID</label>
            <input
              style={s.input}
              placeholder="Channel ID"
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}><User size={12} /> Webhook Name</label>
            <input
              style={s.input}
              placeholder="Dashboard"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div style={{ ...s.field, gridColumn: '1 / -1' }}>
            <label style={s.label}><Link size={12} /> Avatar URL (optional)</label>
            <input
              style={s.input}
              placeholder="https://..."
              value={avatar}
              onChange={e => setAvatar(e.target.value)}
            />
          </div>
          <div style={{ ...s.field, gridColumn: '1 / -1' }}>
            <label style={s.label}><MessageSquare size={12} /> Message</label>
            <textarea
              style={s.textarea}
              placeholder="Message content..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: .97 }}
          onClick={handleSend}
          disabled={sending}
          style={s.sendBtn}
        >
          <Send size={14} />
          {sending ? 'Sending...' : 'Send Webhook'}
        </motion.button>
      </div>

      {/* History */}
      <div style={{ ...s.panel, marginTop: 16 }}>
        <div style={s.sectionLabel}>Recent Webhooks</div>
        {history.length === 0 && (
          <div style={{ fontSize: 13, color: '#5a5a65' }}>No webhooks sent yet</div>
        )}
        <AnimatePresence>
          {history.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * .03, duration: .25 }}
              style={s.historyItem}
            >
              <div style={s.historyHeader}>
                <span style={{ color: '#818cf8', fontWeight: 600, fontSize: 13 }}>{entry.name}</span>
                <span style={{ color: '#3a3a42', fontSize: 11 }}>#{entry.channelId}</span>
                <span style={{ color: '#3a3a42', fontSize: 11, marginLeft: 'auto' }}>
                  {new Date(entry.ts).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#94949e', marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {entry.content.length > 200 ? entry.content.slice(0, 200) + '...' : entry.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const s = {
  page: { padding: '32px 40px 48px' },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2', margin: '0 0 20px' },
  panel: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)', borderRadius: 16, padding: '20px 24px',
  },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: '#3a3a42', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 14 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, color: '#5a5a65', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 },
  input: {
    background: '#17171b', border: '1px solid rgba(255,255,255,.04)', borderRadius: 10,
    padding: '10px 14px', color: '#f0f0f2', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', transition: 'border-color .15s',
  },
  textarea: {
    background: '#17171b', border: '1px solid rgba(255,255,255,.04)', borderRadius: 10,
    padding: '10px 14px', color: '#f0f0f2', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', resize: 'vertical', minHeight: 80, transition: 'border-color .15s',
  },
  sendBtn: {
    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)', border: 'none', borderRadius: 10,
    padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', marginTop: 14, width: '100%',
    boxShadow: '0 2px 8px rgba(99,102,241,.2)',
  },
  historyItem: {
    background: '#17171b', border: '1px solid rgba(255,255,255,.04)', borderRadius: 12,
    padding: '12px 14px', marginBottom: 8,
  },
  historyHeader: { display: 'flex', alignItems: 'center', gap: 8 },
}
