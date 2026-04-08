import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import {
  Hash, ChevronDown, ChevronRight, Send, Paperclip, Smile, X,
  Reply, Trash2, AtSign, Volume2, Users, MessageSquare
} from 'lucide-react'

// ── Emoji data ──────────────────────────────────────────────────────
const EMOJI_CATEGORIES = {
  'Smileys': ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','🤯','😬','😵','🥴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥳','😱','😨','😰','😢','😭','😤','😠','😡','🤬','💀','☠️','💩','🤡','👹','👺','👻','👽','🤖'],
  'Gestures': ['👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤝','🙏','✌️','🤞','🤟','🤘','👌','🤙','💪','🖕','✋','🤚','👋','🤏','👈','👉','👆','👇','☝️','👀','👁️','👅','💋'],
  'Hearts': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟'],
  'Objects': ['🔥','⭐','🌟','✨','💫','🎉','🎊','🎈','🎁','🏆','🥇','🥈','🥉','⚽','🏀','🎮','🎯','🎵','🎶','💰','💎','🔔','📌','📍','✅','❌','⚠️','💡','🔑','🔒'],
}

// ── Helpers ──────────────────────────────────────────────────────────
function escapeHtml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function formatContent(text) {
  if (!text) return ''
  let html = escapeHtml(text)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background:var(--bg-0);padding:8px 12px;border-radius:6px;overflow-x:auto;font-family:var(--mono);font-size:13px;margin:4px 0"><code>$2</code></pre>')
  html = html.replace(/`([^`]+)`/g, '<code style="background:var(--bg-0);padding:2px 6px;border-radius:3px;font-family:var(--mono);font-size:13px">$1</code>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<u>$1</u>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')
  html = html.replace(/\n/g, '<br/>')
  return html
}

function formatTimestamp(ts) {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Today at ${time}`
  if (isYesterday) return `Yesterday at ${time}`
  return `${d.toLocaleDateString()} ${time}`
}

function avatarUrl(user) {
  if (!user) return null
  if (user.avatar) {
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png'
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=64`
  }
  const idx = user.discriminator === '0' ? (BigInt(user.id) >> 22n) % 6n : parseInt(user.discriminator || '0') % 5
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`
}

function guildIcon(guild) {
  if (!guild || !guild.icon) return null
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=48`
}

function isImage(name) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || '')
}

function fileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function shouldGroup(prev, curr) {
  if (!prev || !curr) return false
  if (prev.author?.id !== curr.author?.id) return false
  if (curr.replyTo) return false
  const diff = new Date(curr.timestamp) - new Date(prev.timestamp)
  return diff < 300000
}

// ── Component ───────────────────────────────────────────────────────
export default function Discord({ state, api, feed }) {
  const toast = useToast()

  // Data
  const [conversations, setConversations] = useState([])
  const [guilds, setGuilds] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [channelInfo, setChannelInfo] = useState(null)

  // UI
  const [expandedGuilds, setExpandedGuilds] = useState({})
  const [guildChannels, setGuildChannels] = useState({})
  const [inputText, setInputText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiTab, setEmojiTab] = useState('Smileys')
  const [hoveredMsg, setHoveredMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileRef = useRef(null)
  const emojiRef = useRef(null)
  const typingTimer = useRef(null)

  const myId = state?.user?.id

  // ── Fetch conversations + guilds on mount ──
  useEffect(() => {
    api('/api/discord/conversations').then(r => {
      if (r && r.dms) setConversations(r.dms)
      if (r && r.guilds) {
        setGuilds(r.guilds)
        // Pre-populate guild channels from the conversations response
        const chMap = {}
        for (const g of r.guilds) {
          if (g.channels?.length) chMap[g.id] = g.channels
        }
        setGuildChannels(prev => ({ ...prev, ...chMap }))
      }
    }).catch(() => {})
  }, [])

  // ── Fetch messages when channel changes ──
  useEffect(() => {
    if (!selectedChannel) return
    setMessages([])
    setLoading(true)
    api(`/api/discord/channels/${selectedChannel}/messages?limit=50`).then(r => {
      if (Array.isArray(r)) setMessages(r)
    }).catch(() => toast('Failed to load messages')).finally(() => setLoading(false))
  }, [selectedChannel])

  // ── Fetch guild channels when expanded ──
  const toggleGuild = useCallback((guildId) => {
    setExpandedGuilds(prev => {
      const next = { ...prev, [guildId]: !prev[guildId] }
      if (next[guildId] && !guildChannels[guildId]) {
        api(`/api/discord/guilds/${guildId}/channels`).then(r => {
          if (Array.isArray(r)) {
            const text = r.filter(c => ['GUILD_TEXT', 'GUILD_NEWS', 0, 5].includes(c.type)).sort((a, b) => (a.position || 0) - (b.position || 0))
            setGuildChannels(prev => ({ ...prev, [guildId]: text }))
          }
        }).catch(() => {})
      }
      return next
    })
  }, [guildChannels, api])

  // ── Real-time feed ──
  useEffect(() => {
    if (!feed?.length) return
    const latest = feed[0] // newest is first
    if (!latest || !latest.data) return
    const d = latest.data

    if (latest.type === 'discord-message' && d.channelId === selectedChannel) {
      setMessages(prev => {
        if (prev.find(m => m.id === d.message.id)) return prev
        return [...prev, d.message]
      })
    }
    if (latest.type === 'discord-delete' && d.channelId === selectedChannel) {
      setMessages(prev => prev.filter(m => m.id !== d.messageId))
    }
    if (latest.type === 'discord-edit' && d.channelId === selectedChannel) {
      setMessages(prev => prev.map(m => m.id === d.messageId ? { ...m, content: d.content, editedTimestamp: d.editedTimestamp } : m))
    }
  }, [feed, selectedChannel])

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Close emoji on outside click ──
  useEffect(() => {
    if (!showEmoji) return
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmoji])

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    const text = inputText.trim()
    if (!text || !selectedChannel) return
    const body = { content: text }
    if (replyTo) body.replyTo = replyTo.id
    setInputText('')
    setReplyTo(null)
    try {
      await api(`/api/discord/channels/${selectedChannel}/messages`, body)
    } catch {
      toast('Failed to send message')
    }
  }, [inputText, selectedChannel, replyTo, api])

  // ── Typing indicator ──
  const handleTyping = useCallback(() => {
    if (typingTimer.current) return
    api(`/api/discord/channels/${selectedChannel}/typing`, {}).catch(() => {})
    typingTimer.current = setTimeout(() => { typingTimer.current = null }, 3000)
  }, [selectedChannel, api])

  // ── File upload ──
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedChannel) return
    const reader = new FileReader()
    reader.onload = async () => {
      const fileData = reader.result.split(',')[1]
      try {
        await api(`/api/discord/channels/${selectedChannel}/upload`, {
          fileName: file.name,
          fileData,
          content: inputText.trim() || undefined
        })
        setInputText('')
        toast('File uploaded')
      } catch {
        toast('Upload failed')
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [selectedChannel, inputText, api])

  // ── Delete message ──
  const deleteMessage = useCallback(async (msgId) => {
    try {
      await fetch(`/api/discord/messages/${selectedChannel}/${msgId}`, { method: 'DELETE' })
      setMessages(prev => prev.filter(m => m.id !== msgId))
    } catch {
      toast('Failed to delete')
    }
  }, [selectedChannel])

  // ── Insert emoji ──
  const insertEmoji = useCallback((emoji) => {
    const el = inputRef.current
    if (!el) { setInputText(prev => prev + emoji); return }
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = inputText
    setInputText(text.slice(0, start) + emoji + text.slice(end))
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + emoji.length; el.focus() }, 0)
  }, [inputText])

  // ── Channel display name ──
  const channelName = useMemo(() => {
    if (channelInfo?.name) return channelInfo.name
    const dm = conversations.find(c => c.id === selectedChannel)
    if (dm) return dm.name || dm.recipients?.[0]?.tag || 'DM'
    for (const gid of Object.keys(guildChannels)) {
      const ch = guildChannels[gid]?.find(c => c.id === selectedChannel)
      if (ch) return ch.name
    }
    return 'channel'
  }, [selectedChannel, channelInfo, conversations, guildChannels])

  const selectChannel = useCallback((id, info) => {
    setSelectedChannel(id)
    setChannelInfo(info || null)
    setReplyTo(null)
    setShowEmoji(false)
  }, [])

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      {/* ── LEFT SIDEBAR ── */}
      <div style={s.sidebar}>
        <div style={s.sidebarInner}>
          {/* DM section */}
          <div style={s.sectionHeader}>
            <MessageSquare size={14} style={{ color: 'var(--t2)' }} />
            <span style={s.sectionTitle}>Direct Messages</span>
          </div>
          <div style={s.dmList}>
            {conversations.map(conv => (
              <div
                key={conv.id}
                style={{
                  ...s.dmItem,
                  ...(selectedChannel === conv.id ? s.dmActive : {}),
                }}
                onClick={() => selectChannel(conv.id, { name: conv.name, isDM: true, avatar: conv.avatar })}
              >
                {conv.avatar ? (
                  <img src={conv.avatar} style={s.dmAvatar} alt="" onError={e => { e.target.style.display = 'none' }} />
                ) : (
                  <div style={{ ...s.dmAvatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--t3)' }}>
                    {(conv.name || '?')[0]}
                  </div>
                )}
                <div style={s.dmInfo}>
                  <div style={s.dmName}>{conv.name || 'Unknown'}</div>
                  <div style={s.dmPreview}>{conv.type === 'group_dm' ? 'Group DM' : 'Direct Message'}</div>
                </div>
              </div>
            ))}
            {!conversations.length && <div style={s.empty}>No conversations</div>}
          </div>

          {/* Divider */}
          <div style={s.divider} />

          {/* Servers */}
          <div style={s.sectionHeader}>
            <Users size={14} style={{ color: 'var(--t2)' }} />
            <span style={s.sectionTitle}>Servers</span>
          </div>
          <div style={s.serverList}>
            {guilds.map(g => (
              <div key={g.id}>
                <div
                  style={s.serverRow}
                  onClick={() => toggleGuild(g.id)}
                >
                  {expandedGuilds[g.id]
                    ? <ChevronDown size={14} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                    : <ChevronRight size={14} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                  }
                  {guildIcon(g)
                    ? <img src={guildIcon(g)} style={s.guildIcon} alt="" onError={e => { e.target.style.display = 'none' }} />
                    : <div style={s.guildIconFallback}>{(g.name || '?')[0]}</div>
                  }
                  <span style={s.serverName}>{g.name}</span>
                </div>
                <AnimatePresence>
                  {expandedGuilds[g.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {(guildChannels[g.id] || []).map(ch => (
                        <div
                          key={ch.id}
                          style={{
                            ...s.channelRow,
                            ...(selectedChannel === ch.id ? s.channelActive : {}),
                          }}
                          onClick={() => selectChannel(ch.id, { name: ch.name, topic: ch.topic, guildName: g.name })}
                        >
                          <Hash size={14} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                          <span style={s.channelName}>{ch.name}</span>
                        </div>
                      ))}
                      {!guildChannels[g.id]?.length && (
                        <div style={{ ...s.empty, paddingLeft: 38 }}>Loading...</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MESSAGE AREA ── */}
      <div style={s.main}>
        {/* Header */}
        <div style={s.header}>
          {channelInfo?.isDM ? (
            <>
              <AtSign size={18} style={{ color: 'var(--t2)' }} />
              {channelInfo.avatar && <img src={channelInfo.avatar} style={s.headerAvatar} alt="" />}
              <span style={s.headerName}>{channelName}</span>
            </>
          ) : (
            <>
              <Hash size={18} style={{ color: 'var(--t2)' }} />
              <span style={s.headerName}>{channelName}</span>
              {channelInfo?.topic && <span style={s.headerTopic}>{channelInfo.topic}</span>}
            </>
          )}
        </div>

        {/* Messages */}
        <div style={s.messageArea}>
          {!selectedChannel && (
            <div style={s.placeholder}>
              <MessageSquare size={48} style={{ color: 'var(--t4)' }} />
              <div style={{ color: 'var(--t3)', marginTop: 12, fontSize: 15 }}>Select a conversation or channel</div>
            </div>
          )}
          {loading && <div style={s.loadingBar} />}
          {selectedChannel && messages.map((msg, i) => {
            const grouped = shouldGroup(messages[i - 1], msg)
            const isOwn = msg.author?.id === myId
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  ...s.msgRow,
                  paddingTop: grouped ? 2 : 16,
                  ...(hoveredMsg === msg.id ? { background: 'rgba(255,255,255,.02)' } : {}),
                }}
                onMouseEnter={() => setHoveredMsg(msg.id)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                {/* Reply indicator */}
                {msg.replyTo && (
                  <div style={s.replyIndicator}>
                    <Reply size={12} style={{ color: 'var(--t3)', transform: 'scaleX(-1)' }} />
                    <span style={s.replyText}>Replying to <strong>{msg.replyTo.author?.tag || 'Unknown'}</strong></span>
                  </div>
                )}

                <div style={s.msgBody}>
                  {/* Avatar */}
                  {!grouped ? (
                    <img
                      src={avatarUrl(msg.author)}
                      style={s.msgAvatar}
                      alt=""
                      onError={e => { e.target.src = 'https://cdn.discordapp.com/embed/avatars/0.png' }}
                    />
                  ) : (
                    <div style={s.msgAvatarSpacer}>
                      {hoveredMsg === msg.id && (
                        <span style={s.compactTime}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  )}

                  <div style={s.msgContent}>
                    {/* Author + timestamp */}
                    {!grouped && (
                      <div style={s.msgMeta}>
                        <span style={{ ...s.msgAuthor, color: isOwn ? 'var(--accent)' : 'var(--t1)' }}>
                          {msg.author?.tag || msg.author?.username || 'Unknown'}
                        </span>
                        {msg.author?.bot && <span style={s.botBadge}>BOT</span>}
                        <span style={s.msgTime}>{formatTimestamp(msg.timestamp)}</span>
                      </div>
                    )}

                    {/* Text */}
                    {msg.content && (
                      <div
                        style={s.msgText}
                        dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                      />
                    )}

                    {/* Attachments */}
                    {msg.attachments?.map((att, j) => (
                      <div key={j} style={{ marginTop: 4 }}>
                        {isImage(att.name || att.url) ? (
                          <img
                            src={att.proxyURL || att.url}
                            alt={att.name}
                            style={s.attachImg}
                            loading="lazy"
                          />
                        ) : (
                          <div style={s.attachFile}>
                            <Paperclip size={14} style={{ color: 'var(--t2)' }} />
                            <a href={att.url} target="_blank" rel="noopener noreferrer" style={s.attachLink}>
                              {att.name || 'file'}
                            </a>
                            {att.size && <span style={s.attachSize}>{fileSize(att.size)}</span>}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Embeds */}
                    {msg.embeds?.map((emb, j) => (
                      <div key={j} style={{ ...s.embed, borderLeftColor: emb.color ? `#${emb.color.toString(16).padStart(6, '0')}` : 'var(--accent)' }}>
                        {emb.title && <div style={s.embedTitle}>{emb.title}</div>}
                        {emb.description && (
                          <div style={s.embedDesc} dangerouslySetInnerHTML={{ __html: formatContent(emb.description) }} />
                        )}
                        {emb.fields?.map((f, k) => (
                          <div key={k} style={{ ...s.embedField, ...(f.inline ? { display: 'inline-block', width: '33%', verticalAlign: 'top' } : {}) }}>
                            <div style={s.embedFieldName}>{f.name}</div>
                            <div style={s.embedFieldValue}>{f.value}</div>
                          </div>
                        ))}
                        {emb.image && <img src={emb.image} style={s.attachImg} alt="" loading="lazy" />}
                        {emb.thumbnail && <img src={emb.thumbnail} style={{ ...s.attachImg, maxWidth: 80 }} alt="" loading="lazy" />}
                      </div>
                    ))}

                    {/* Reactions */}
                    {msg.reactions?.length > 0 && (
                      <div style={s.reactions}>
                        {msg.reactions.map((r, j) => (
                          <div key={j} style={s.reaction}>
                            <span>{r.emoji || '?'}</span>
                            <span style={s.reactionCount}>{r.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover actions */}
                  {hoveredMsg === msg.id && (
                    <div style={s.msgActions}>
                      <button
                        style={s.msgActionBtn}
                        title="Reply"
                        onClick={() => { setReplyTo(msg); inputRef.current?.focus() }}
                      >
                        <Reply size={14} />
                      </button>
                      {isOwn && (
                        <button
                          style={{ ...s.msgActionBtn, color: 'var(--red)' }}
                          title="Delete"
                          onClick={() => deleteMessage(msg.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT AREA ── */}
        {selectedChannel && (
          <div style={s.inputArea}>
            {/* Reply bar */}
            <AnimatePresence>
              {replyTo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={s.replyBar}
                >
                  <Reply size={14} style={{ color: 'var(--accent)', transform: 'scaleX(-1)' }} />
                  <span style={{ color: 'var(--t2)', fontSize: 13 }}>
                    Replying to <strong style={{ color: 'var(--t1)' }}>{replyTo.author?.tag || 'Unknown'}</strong>
                  </span>
                  <button style={s.replyCancelBtn} onClick={() => setReplyTo(null)}><X size={14} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={s.inputRow}>
              {/* Attach */}
              <button style={s.inputBtn} onClick={() => fileRef.current?.click()}>
                <Paperclip size={18} />
              </button>
              <input
                type="file"
                ref={fileRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              {/* Text input */}
              <textarea
                ref={inputRef}
                style={s.textInput}
                rows={1}
                placeholder={`Message #${channelName}`}
                value={inputText}
                onChange={e => {
                  setInputText(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  handleTyping()
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />

              {/* Emoji */}
              <div style={{ position: 'relative' }} ref={emojiRef}>
                <button style={s.inputBtn} onClick={() => setShowEmoji(p => !p)}>
                  <Smile size={18} />
                </button>
                <AnimatePresence>
                  {showEmoji && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={s.emojiPicker}
                    >
                      <div style={s.emojiTabs}>
                        {Object.keys(EMOJI_CATEGORIES).map(cat => (
                          <button
                            key={cat}
                            style={{ ...s.emojiTab, ...(emojiTab === cat ? s.emojiTabActive : {}) }}
                            onClick={() => setEmojiTab(cat)}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div style={s.emojiGrid}>
                        {(EMOJI_CATEGORIES[emojiTab] || []).map((em, i) => (
                          <button
                            key={i}
                            style={s.emojiBtn}
                            onClick={() => insertEmoji(em)}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Send */}
              <button
                style={{ ...s.inputBtn, ...(inputText.trim() ? { color: 'var(--accent)' } : {}) }}
                onClick={sendMessage}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────
const s = {
  root: {
    display: 'flex',
    height: '100%',
    background: 'var(--bg-1)',
    fontFamily: 'var(--font)',
    color: 'var(--t1)',
    overflow: 'hidden',
  },

  // Sidebar
  sidebar: {
    width: 260,
    minWidth: 260,
    background: 'var(--bg-2)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarInner: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '12px 0',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px 6px',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--t3)',
  },
  dmList: {
    padding: '2px 8px',
  },
  dmItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background .12s',
  },
  dmActive: {
    background: 'rgba(99,102,241,.15)',
  },
  dmAvatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
    background: 'var(--bg-4)',
  },
  dmInfo: {
    minWidth: 0,
    flex: 1,
  },
  dmName: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--t1)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dmPreview: {
    fontSize: 11,
    color: 'var(--t3)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: 1,
  },
  divider: {
    height: 1,
    background: 'var(--border)',
    margin: '10px 14px',
  },
  serverList: {
    padding: '2px 8px',
  },
  serverRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background .12s',
  },
  guildIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    objectFit: 'cover',
    flexShrink: 0,
    background: 'var(--bg-4)',
  },
  guildIconFallback: {
    width: 24,
    height: 24,
    borderRadius: 6,
    background: 'var(--bg-4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--t2)',
    flexShrink: 0,
  },
  serverName: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--t1)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  channelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px 4px 38px',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'background .12s',
  },
  channelActive: {
    background: 'rgba(99,102,241,.15)',
  },
  channelName: {
    fontSize: 13,
    color: 'var(--t2)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  empty: {
    fontSize: 12,
    color: 'var(--t4)',
    padding: '8px 14px',
  },

  // Main area
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    background: 'var(--bg-1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 18px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-1)',
    flexShrink: 0,
    minHeight: 48,
  },
  headerAvatar: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  headerName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--t1)',
  },
  headerTopic: {
    fontSize: 12,
    color: 'var(--t3)',
    marginLeft: 8,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  // Messages
  messageArea: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '0 0 8px',
    position: 'relative',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  loadingBar: {
    height: 2,
    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
    animation: 'loadSlide 1s infinite',
  },
  msgRow: {
    padding: '2px 18px',
    position: 'relative',
    transition: 'background .1s',
  },
  replyIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginLeft: 52,
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: 'var(--t3)',
  },
  msgBody: {
    display: 'flex',
    gap: 12,
    position: 'relative',
  },
  msgAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
    marginTop: 2,
    background: 'var(--bg-4)',
    cursor: 'pointer',
  },
  msgAvatarSpacer: {
    width: 36,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTime: {
    fontSize: 10,
    color: 'var(--t4)',
    fontFamily: 'var(--mono)',
  },
  msgContent: {
    flex: 1,
    minWidth: 0,
  },
  msgMeta: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 2,
  },
  msgAuthor: {
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  botBadge: {
    fontSize: 10,
    fontWeight: 600,
    background: 'var(--accent)',
    color: '#fff',
    padding: '1px 5px',
    borderRadius: 3,
    lineHeight: '14px',
  },
  msgTime: {
    fontSize: 11,
    color: 'var(--t4)',
  },
  msgText: {
    fontSize: 14,
    lineHeight: 1.45,
    color: 'var(--t1)',
    wordBreak: 'break-word',
  },

  // Attachments
  attachImg: {
    maxWidth: 400,
    maxHeight: 300,
    borderRadius: 8,
    marginTop: 4,
    display: 'block',
  },
  attachFile: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'var(--bg-3)',
    borderRadius: 6,
    border: '1px solid var(--border)',
    marginTop: 4,
  },
  attachLink: {
    fontSize: 13,
    color: 'var(--accent)',
    textDecoration: 'none',
  },
  attachSize: {
    fontSize: 11,
    color: 'var(--t4)',
  },

  // Embeds
  embed: {
    borderLeft: '4px solid var(--accent)',
    background: 'var(--bg-3)',
    borderRadius: '0 6px 6px 0',
    padding: '10px 14px',
    marginTop: 6,
    maxWidth: 520,
  },
  embedTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--t1)',
    marginBottom: 4,
  },
  embedDesc: {
    fontSize: 13,
    color: 'var(--t2)',
    lineHeight: 1.4,
  },
  embedField: {
    marginTop: 8,
  },
  embedFieldName: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--t1)',
  },
  embedFieldValue: {
    fontSize: 13,
    color: 'var(--t2)',
  },

  // Reactions
  reactions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  reaction: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    background: 'var(--bg-3)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    fontSize: 13,
    cursor: 'pointer',
  },
  reactionCount: {
    fontSize: 12,
    color: 'var(--t2)',
    fontWeight: 500,
  },

  // Hover actions
  msgActions: {
    position: 'absolute',
    top: -8,
    right: 0,
    display: 'flex',
    gap: 2,
    background: 'var(--bg-3)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: 2,
    zIndex: 5,
  },
  msgActionBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--t2)',
    padding: '4px 6px',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background .1s',
  },

  // Input area
  inputArea: {
    flexShrink: 0,
    padding: '0 18px 18px',
  },
  replyBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'var(--bg-3)',
    borderRadius: '8px 8px 0 0',
    borderBottom: '1px solid var(--border)',
    overflow: 'hidden',
  },
  replyCancelBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: 'var(--t3)',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 4,
    background: 'var(--bg-3)',
    borderRadius: 8,
    padding: '6px 8px',
    border: '1px solid var(--border)',
  },
  textInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--t1)',
    fontSize: 14,
    fontFamily: 'var(--font)',
    resize: 'none',
    lineHeight: 1.4,
    padding: '6px 4px',
    maxHeight: 120,
    minHeight: 20,
  },
  inputBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--t3)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color .12s',
  },

  // Emoji picker
  emojiPicker: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 8,
    width: 340,
    maxHeight: 340,
    background: 'var(--bg-2)',
    border: '1px solid var(--border-h)',
    borderRadius: 10,
    boxShadow: '0 8px 32px rgba(0,0,0,.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 50,
  },
  emojiTabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    padding: '4px 4px 0',
    gap: 2,
    overflowX: 'auto',
    flexShrink: 0,
  },
  emojiTab: {
    background: 'none',
    border: 'none',
    color: 'var(--t3)',
    fontSize: 11,
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: '6px 6px 0 0',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color .1s, background .1s',
  },
  emojiTabActive: {
    color: 'var(--t1)',
    background: 'var(--bg-3)',
  },
  emojiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: 2,
    padding: 8,
    overflowY: 'auto',
    flex: 1,
  },
  emojiBtn: {
    background: 'none',
    border: 'none',
    fontSize: 22,
    padding: 4,
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background .1s',
  },
}
