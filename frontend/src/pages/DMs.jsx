import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Send, Users } from 'lucide-react'

export default function DMs({ api }) {
  const toast = useToast()
  const [friends, setFriends] = useState([])
  const [dms, setDms] = useState([])
  const [userId, setUserId] = useState('')
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [tab, setTab] = useState('send')

  useEffect(() => {
    fetch('/api/friends').then(r => r.json()).then(setFriends)
    fetch('/api/dms').then(r => r.json()).then(setDms)
  }, [])

  const sendDM = async () => {
    if (!userId.trim() || !msg.trim()) return toast('Fill in both fields')
    setSending(true)
    try {
      const res = await api('/api/dm', { userId: userId.trim(), message: msg.trim() })
      if (res.ok) {
        toast(`DM sent to ${res.tag}`)
        setMsg('')
      } else {
        toast(`Error: ${res.error}`)
      }
    } catch (e) {
      toast(`Failed: ${e.message}`)
    }
    setSending(false)
  }

  const selectUser = (id) => {
    setUserId(id)
    setTab('send')
  }

  const statusColor = { online: '#34d399', idle: '#fbbf24', dnd: '#fb7185', offline: '#3a3a42' }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Direct Messages</h1>
        <div style={s.seg}>
          <button onClick={() => setTab('send')} style={{ ...s.segBtn, ...(tab === 'send' ? s.segActive : {}) }}>
            <Send size={12} /> Send
          </button>
          <button onClick={() => setTab('friends')} style={{ ...s.segBtn, ...(tab === 'friends' ? s.segActive : {}) }}>
            <Users size={12} /> Friends
          </button>
        </div>
      </div>

      {tab === 'send' && (
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Recipient</label>
              <input
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="User ID or pick from friends..."
                style={s.input}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Message</label>
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                placeholder="Type your message..."
                style={s.textarea}
                rows={4}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) sendDM() }}
              />
            </div>
            <div style={s.formFooter}>
              <span style={s.hint}>Ctrl+Enter to send</span>
              <button onClick={sendDM} disabled={sending} style={{ ...s.sendBtn, opacity: sending ? .5 : 1 }}>
                <Send size={14} /> {sending ? 'Sending...' : 'Send DM'}
              </button>
            </div>
          </div>

          {/* Recent DMs */}
          {dms.length > 0 && (
            <>
              <div style={s.divider} />
              <div style={s.sectionHead}>Recent DMs</div>
              <div style={s.dmList}>
                {dms.slice(0, 20).map(dm => (
                  <button key={dm.id} onClick={() => selectUser(dm.recipient.id)} style={s.dmRow}>
                    <img src={dm.recipient.avatar} alt="" style={s.dmAvatar} />
                    <span style={s.dmTag}>{dm.recipient.tag}</span>
                    <span style={s.dmId}>{dm.recipient.id}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {tab === 'friends' && (
        <motion.div style={s.panel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={s.sectionHead}>Friends ({friends.length})</div>
          <div style={s.friendGrid}>
            {friends.length === 0 && <div style={s.nil}>No friends found</div>}
            {friends.map(f => (
              <button key={f.id} onClick={() => selectUser(f.id)} style={s.friendCard}>
                <div style={s.friendAvatarWrap}>
                  <img src={f.avatar} alt="" style={s.friendAvatar} />
                  <div style={{ ...s.statusDot, background: statusColor[f.status] || statusColor.offline }} />
                </div>
                <div style={s.friendInfo}>
                  <span style={s.friendTag}>{f.tag}</span>
                  <span style={s.friendStatus}>{f.status}</span>
                </div>
                <Send size={12} color="#3a3a42" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

const s = {
  page: { padding: '32px 40px 48px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2' },
  seg: { display: 'inline-flex', background: '#17171b', borderRadius: 10, padding: 3, gap: 2 },
  segBtn: { padding: '6px 14px', border: 'none', borderRadius: 8, background: 'transparent', color: '#5a5a65', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' },
  segActive: { background: 'rgba(99,102,241,.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,.12)' },
  panel: { background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)', borderRadius: 16, overflow: 'hidden', maxWidth: 640 },
  form: { padding: 20 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#3a3a42', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.8px' },
  input: { width: '100%', padding: '10px 14px', background: '#17171b', border: '1px solid rgba(255,255,255,.04)', borderRadius: 10, color: '#f0f0f2', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 14px', background: '#17171b', border: '1px solid rgba(255,255,255,.04)', borderRadius: 10, color: '#f0f0f2', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' },
  formFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  hint: { fontSize: 11, color: '#3a3a42' },
  sendBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(99,102,241,.2)' },
  divider: { height: 1, background: 'rgba(255,255,255,.03)', margin: '0 20px' },
  sectionHead: { padding: '12px 20px', fontSize: 12, fontWeight: 700, color: '#3a3a42', textTransform: 'uppercase', letterSpacing: '.8px' },
  dmList: { padding: '0 10px 10px' },
  dmRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', fontFamily: 'inherit', transition: 'background .12s', textAlign: 'left', color: '#f0f0f2' },
  dmAvatar: { width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', background: '#17171b' },
  dmTag: { fontSize: 13, fontWeight: 500, flex: 1 },
  dmId: { fontSize: 11, color: '#3a3a42', fontFamily: 'var(--mono)' },
  nil: { padding: 32, textAlign: 'center', color: '#3a3a42', fontSize: 13 },
  friendGrid: { padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 500, overflowY: 'auto' },
  friendCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', fontFamily: 'inherit', transition: 'background .12s', textAlign: 'left', color: '#f0f0f2' },
  friendAvatarWrap: { position: 'relative', flexShrink: 0 },
  friendAvatar: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: '#17171b' },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', border: '2px solid #0c0c0f' },
  friendInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
  friendTag: { fontSize: 13, fontWeight: 500 },
  friendStatus: { fontSize: 11, color: '#3a3a42', textTransform: 'capitalize' },
}
