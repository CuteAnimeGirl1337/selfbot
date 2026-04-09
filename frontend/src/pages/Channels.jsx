import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, Volume2, Send, Megaphone } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function Channels({ state, api }) {
  const toast = useToast()
  const [selectedGuild, setSelectedGuild] = useState(null)
  const [channels, setChannels] = useState([])
  const [expandedChannel, setExpandedChannel] = useState(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!state) return null
  const { guilds } = state

  const selectGuild = async (guildId) => {
    setSelectedGuild(guildId)
    setExpandedChannel(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/guilds/${guildId}/channels`)
      const data = await res.json()
      setChannels(data.filter(c => !['GUILD_CATEGORY'].includes(c.type)))
    } catch {
      setChannels([])
    }
    setLoading(false)
  }

  const handleSend = async (channelId) => {
    if (!message.trim()) return toast('Message cannot be empty')
    setSending(true)
    try {
      const res = await api('/api/send', { channelId, message: message.trim() })
      if (res.ok) {
        toast('Message sent')
        setMessage('')
        setExpandedChannel(null)
      } else {
        toast(`Error: ${res.error}`)
      }
    } catch (e) {
      toast(`Failed: ${e.message}`)
    }
    setSending(false)
  }

  const iconForType = (type) => {
    if (type === 'GUILD_VOICE') return <Volume2 size={13} color="#5a5a65" />
    if (type === 'GUILD_NEWS') return <Megaphone size={13} color="#5a5a65" />
    return <Hash size={13} color="#5a5a65" />
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Channels</h1>

      {/* Guild selector */}
      <div style={s.guildScroll}>
        {guilds.map(g => (
          <button
            key={g.id}
            onClick={() => selectGuild(g.id)}
            style={{
              ...s.guildBtn,
              ...(selectedGuild === g.id ? s.guildActive : {}),
            }}
          >
            {g.icon
              ? <img src={g.icon} alt="" style={s.guildIcon} />
              : <div style={s.guildLetter}>{g.name.charAt(0)}</div>
            }
            <span style={s.guildName}>{g.name}</span>
          </button>
        ))}
        {guilds.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 20px' }}
          >
            <Hash size={48} color="var(--t4)" strokeWidth={1.5} />
            <span style={{ fontSize: 16, color: 'var(--t3)', fontWeight: 500 }}>No servers</span>
            <span style={{ fontSize: 13, color: 'var(--t4)' }}>Connect to Discord to browse server channels</span>
          </motion.div>
        )}
      </div>

      {/* Channels */}
      {selectedGuild && (
        <motion.div
          style={s.panel}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {loading && <div style={s.nil}>Loading channels...</div>}
          {!loading && channels.length === 0 && <div style={s.nil}>No channels</div>}
          {!loading && channels.map(ch => (
            <div key={ch.id}>
              <button
                onClick={() => {
                  if (ch.type === 'GUILD_VOICE') return
                  setExpandedChannel(expandedChannel === ch.id ? null : ch.id)
                  setMessage('')
                }}
                style={{
                  ...s.chRow,
                  ...(expandedChannel === ch.id ? { background: 'rgba(255,255,255,.03)' } : {}),
                }}
              >
                {iconForType(ch.type)}
                <span style={s.chName}>{ch.name}</span>
                {ch.parent && <span style={s.chParent}>{ch.parent}</span>}
                {ch.topic && <span style={s.chTopic}>{ch.topic.slice(0, 60)}</span>}
                {ch.type !== 'GUILD_VOICE' && <Send size={11} color="#5a5a65" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
              </button>

              <AnimatePresence>
                {expandedChannel === ch.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: .2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={s.sendForm}>
                      <input
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSend(ch.id) }}
                        placeholder={`Message #${ch.name}...`}
                        style={s.input}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSend(ch.id)}
                        disabled={sending}
                        style={{ ...s.sendBtn, opacity: sending ? .5 : 1 }}
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

const s = {
  page: { padding: '32px 40px 48px' },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2', marginBottom: 20 },
  guildScroll: {
    display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, marginBottom: 16,
    scrollbarWidth: 'thin',
  },
  guildBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 14px', background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, cursor: 'pointer', flexShrink: 0,
    color: '#94949e', fontSize: 12, fontWeight: 500,
    fontFamily: 'inherit', transition: 'all .15s',
  },
  guildActive: { borderColor: 'rgba(99,102,241,.12)', color: '#818cf8', background: 'rgba(99,102,241,.08)' },
  guildIcon: { width: 20, height: 20, borderRadius: 6, objectFit: 'cover', background: '#17171b' },
  guildLetter: {
    width: 20, height: 20, borderRadius: 6, background: '#17171b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, color: '#5a5a65',
  },
  guildName: { whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' },
  panel: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, overflow: 'hidden', maxHeight: 'calc(100vh - 240px)', overflowY: 'auto',
  },
  chRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 16px', width: '100%',
    border: 'none', background: 'transparent',
    cursor: 'pointer', fontFamily: 'inherit',
    borderBottom: '1px solid rgba(255,255,255,.03)',
    color: '#f0f0f2', fontSize: 13, textAlign: 'left',
    transition: 'background .12s',
  },
  chName: { fontWeight: 500, flexShrink: 0 },
  chParent: { fontSize: 11, color: '#3a3a42', flexShrink: 0 },
  chTopic: { fontSize: 11, color: '#3a3a42', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  sendForm: {
    display: 'flex', gap: 6, padding: '8px 16px 10px',
    background: '#17171b', borderBottom: '1px solid rgba(255,255,255,.03)',
  },
  input: {
    flex: 1, padding: '10px 14px', background: '#0c0c0f',
    border: '1px solid rgba(255,255,255,.04)', borderRadius: 10,
    color: '#f0f0f2', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  },
  sendBtn: {
    padding: '10px 14px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', border: 'none',
    borderRadius: 10, color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    boxShadow: '0 2px 8px rgba(99,102,241,.2)',
  },
  nil: { padding: 32, textAlign: 'center', color: '#3a3a42', fontSize: 13, fontWeight: 500 },
}
