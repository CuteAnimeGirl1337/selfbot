import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Trash2, Search, Paperclip, ChevronDown, Database } from 'lucide-react'

const ago = ts => {
  if (!ts) return ''
  const d = Date.now() - (typeof ts === 'number' ? ts : new Date(ts).getTime())
  if (d < 6e4) return 'just now'
  if (d < 36e5) return `${Math.floor(d / 6e4)}m ago`
  if (d < 864e5) return `${Math.floor(d / 36e5)}h ago`
  return `${Math.floor(d / 864e5)}d ago`
}

const fmtTime = ts => {
  if (!ts) return ''
  const d = new Date(typeof ts === 'number' ? ts : ts)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Archive({ api }) {
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [stats, setStats] = useState({ total: 0, servers: [] })
  const [query, setQuery] = useState('')
  const [author, setAuthor] = useState('')
  const [guild, setGuild] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const limit = 50

  const fetchStats = useCallback(async () => {
    try {
      const s = await api('/api/archive/stats')
      if (s && typeof s === 'object') setStats({ total: s.total || 0, servers: s.byServer || [] })
    } catch {}
  }, [api])

  const fetchMessages = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const off = reset ? 0 : offset
      let data
      if (query.trim() || author.trim() || guild.trim()) {
        data = await api('/api/archive/search', {
          query: query.trim() || undefined,
          author: author.trim() || undefined,
          guild: guild.trim() || undefined,
          limit,
          offset: off,
        })
      } else {
        data = await api(`/api/archive?limit=${limit}&offset=${off}`)
      }
      const arr = Array.isArray(data) ? data : (data?.messages || [])
      if (reset) {
        setMessages(arr)
        setOffset(arr.length)
      } else {
        setMessages(prev => [...prev, ...arr])
        setOffset(off + arr.length)
      }
      setHasMore(arr.length >= limit)
    } catch {
      toast('Failed to load archive')
    }
    setLoading(false)
  }, [api, query, author, guild, offset, toast])

  useEffect(() => {
    fetchStats()
    fetchMessages(true)
  }, [])

  // Auto-refresh every 15s
  useEffect(() => {
    const iv = setInterval(() => {
      fetchStats()
      // Refresh first page
      const doRefresh = async () => {
        try {
          const data = await api(`/api/archive?limit=${limit}&offset=0`)
          const arr = Array.isArray(data) ? data : (data?.messages || [])
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMsgs = arr.filter(m => !existingIds.has(m.id))
            return newMsgs.length > 0 ? [...newMsgs, ...prev] : prev
          })
        } catch {}
      }
      if (!query.trim() && !author.trim() && !guild.trim()) doRefresh()
    }, 15000)
    return () => clearInterval(iv)
  }, [api, query, author, guild])

  const doSearch = () => {
    setOffset(0)
    fetchMessages(true)
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Message Archive</h1>

      {/* Stats bar */}
      <motion.div style={s.statsBar} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={s.statMain}>
          <Database size={14} color="#fb7185" />
          <span style={s.statCount}>{(stats.total || 0).toLocaleString()}</span>
          <span style={s.statLabel}>archived messages</span>
        </div>
        <div style={s.statServers}>
          {stats.servers.slice(0, 5).map((sv, i) => (
            <span key={i} style={s.serverChip}>{sv.name}: {sv.count}</span>
          ))}
        </div>
      </motion.div>

      {/* Search form */}
      <motion.div style={{ ...s.panel, marginTop: 12 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}>
        <div style={s.panelHead}><Search size={14} /> Search Archive</div>
        <div style={s.panelBody}>
          <div style={s.searchRow}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Search content..."
              style={{ ...s.input, flex: 2 }}
            />
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Author filter..."
              style={s.input}
            />
            <input
              value={guild}
              onChange={e => setGuild(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Server filter..."
              style={s.input}
            />
            <button onClick={doSearch} style={s.btn}>
              <Search size={13} /> Search
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <div style={{ marginTop: 12 }}>
        {messages.length === 0 && !loading && (
          <div style={{ ...s.panel, ...s.nil }}>No archived messages found</div>
        )}
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id || i}
            style={s.msgCard}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * .02, .5) }}
          >
            <div style={s.msgHeader}>
              {msg.avatar && (
                <img src={msg.avatar} alt="" style={s.avatar} />
              )}
              {!msg.avatar && <div style={s.avatarPlaceholder} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={s.msgAuthor}>{msg.author || 'Unknown'}</span>
                <span style={s.msgChannel}>
                  #{msg.channel || '?'} {msg.guild ? `- ${msg.guild}` : ''}
                </span>
              </div>
              <div style={s.msgTimes}>
                <span style={s.msgOrigTime}>{fmtTime(msg.createdAt)}</span>
                <span style={s.msgDelTime}>
                  <Trash2 size={10} /> deleted {ago(msg.deletedAt)}
                </span>
              </div>
            </div>
            <div style={s.msgContent}>{msg.content || '[no text content]'}</div>
            {msg.attachments && msg.attachments > 0 && (
              <div style={s.attachIndicator}>
                <Paperclip size={11} /> {msg.attachments} attachment{msg.attachments > 1 ? 's' : ''}
              </div>
            )}
          </motion.div>
        ))}

        {hasMore && messages.length > 0 && (
          <button
            onClick={() => fetchMessages(false)}
            disabled={loading}
            style={s.loadMore}
          >
            <ChevronDown size={14} />
            {loading ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { padding: '32px 40px 48px' },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2', marginBottom: 24 },
  statsBar: { background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  statMain: { display: 'flex', alignItems: 'center', gap: 8 },
  statCount: { fontSize: 18, fontWeight: 700, color: '#f0f0f2' },
  statLabel: { fontSize: 12, color: '#5a5a65' },
  statServers: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  serverChip: { padding: '3px 8px', background: 'rgba(99,102,241,.08)', borderRadius: 6, fontSize: 11, color: '#818cf8', border: '1px solid rgba(99,102,241,.12)' },
  panel: { background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)', borderRadius: 16, overflow: 'hidden' },
  panelHead: { padding: '13px 18px', fontSize: 12, fontWeight: 700, color: '#3a3a42', textTransform: 'uppercase', letterSpacing: '.8px', borderBottom: '1px solid rgba(255,255,255,.03)', display: 'flex', alignItems: 'center', gap: 6 },
  panelBody: { padding: 14 },
  nil: { padding: 24, textAlign: 'center', color: '#3a3a42', fontSize: 13 },
  searchRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  input: { flex: 1, minWidth: 120, padding: '10px 14px', background: '#17171b', border: '1px solid rgba(255,255,255,.04)', borderRadius: 10, color: '#f0f0f2', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  btn: { padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, boxShadow: '0 2px 8px rgba(99,102,241,.2)' },
  msgCard: { background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)', borderRadius: 16, borderLeft: '3px solid #fb7185', padding: '14px 18px', marginBottom: 6, overflow: 'hidden' },
  msgHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: { width: 28, height: 28, borderRadius: '50%', flexShrink: 0 },
  avatarPlaceholder: { width: 28, height: 28, borderRadius: '50%', background: '#17171b', flexShrink: 0 },
  msgAuthor: { fontSize: 13, fontWeight: 600, color: '#f0f0f2', marginRight: 8 },
  msgChannel: { fontSize: 11, color: '#5a5a65' },
  msgTimes: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 },
  msgOrigTime: { fontSize: 11, color: '#5a5a65' },
  msgDelTime: { fontSize: 10, color: '#fb7185', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, opacity: .8 },
  msgContent: { fontSize: 13, color: '#94949e', lineHeight: 1.5, wordBreak: 'break-word' },
  attachIndicator: { marginTop: 6, fontSize: 11, color: '#5a5a65', display: 'flex', alignItems: 'center', gap: 4 },
  loadMore: { width: '100%', padding: '10px 0', background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)', borderRadius: 10, color: '#94949e', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', marginTop: 4 },
}
