import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Download, Trash2, Search, Eye } from 'lucide-react'

const ago = ts => {
  const d = Date.now() - ts
  if (d < 6e4) return 'now'
  if (d < 36e5) return `${Math.floor(d / 6e4)}m`
  if (d < 864e5) return `${Math.floor(d / 36e5)}h`
  return `${Math.floor(d / 864e5)}d`
}

function SnipeItem({ item }) {
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={s.item}>
      <div style={s.row}>
        <span style={s.author}>{item.author}</span>
        <span style={s.meta}>#{item.channel} · {item.guild} · {ago(item.time)}</span>
      </div>
      <div style={s.content}>{item.content || '[no text]'}</div>
      {item.attachment && <div style={{ ...s.content, color: '#818cf8' }}>[attachment]</div>}
    </motion.div>
  )
}

function EditItem({ item }) {
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={s.item}>
      <div style={s.row}>
        <span style={s.author}>{item.author}</span>
        <span style={s.meta}>#{item.channel} · {ago(item.time)}</span>
      </div>
      <div style={{ ...s.content, color: '#fb7185', textDecoration: 'line-through', opacity: .7 }}>{item.oldContent}</div>
      <div style={{ ...s.content, color: '#34d399' }}>{item.newContent}</div>
    </motion.div>
  )
}

export default function Logger({ snipes, editSnipes, fetchSnipes, api }) {
  const toast = useToast()
  const [tab, setTab] = useState('deleted')
  const [search, setSearch] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)

  useEffect(() => { fetchSnipes() }, [])

  const clearLogs = async () => {
    if (!confirm('Clear all snipe logs?')) return
    await api('/api/snipes/clear')
    toast('Snipe logs cleared')
  }

  const exportLogs = () => {
    window.open('/api/export/snipes', '_blank')
    toast('Exporting snipes...')
  }

  const items = tab === 'deleted' ? snipes : editSnipes
  const filtered = search
    ? items.filter(i => {
        const text = (i.content || i.oldContent || i.newContent || '').toLowerCase()
        const author = (i.author || '').toLowerCase()
        return text.includes(search.toLowerCase()) || author.includes(search.toLowerCase())
      })
    : items

  return (
    <div style={s.page}>
      {/* Hero header */}
      <motion.div style={s.hero} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <div style={s.heroGlow} />
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Logger</h1>
            <p style={s.heroSub}>{snipes.length} deleted · {editSnipes.length} edited</p>
          </div>
          <div style={s.actions}>
            <div style={{
              ...s.searchWrap,
              borderColor: searchFocus ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.04)',
              boxShadow: searchFocus ? '0 0 20px rgba(99,102,241,.1)' : 'none',
            }}>
              <Search size={13} color="#5a5a65" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                placeholder="Search..."
                style={s.searchInput}
              />
            </div>
            <div style={s.seg}>
              {['deleted', 'edited'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{ ...s.segBtn, ...(tab === t ? s.segActive : {}) }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  <span style={s.badge}>{t === 'deleted' ? snipes.length : editSnipes.length}</span>
                </button>
              ))}
            </div>
            <button onClick={exportLogs} style={s.iconBtn} title="Export"><Download size={14} /></button>
            <button onClick={clearLogs} style={{ ...s.iconBtn, color: '#fb7185' }} title="Clear"><Trash2 size={14} /></button>
          </div>
        </div>
      </motion.div>

      {/* Feed */}
      <div style={s.feed}>
        {filtered.length === 0 && (
          search
            ? <div style={s.nil}>No matches</div>
            : <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 20px' }}
              >
                <Eye size={48} color="var(--t4)" strokeWidth={1.5} />
                <span style={{ fontSize: 16, color: 'var(--t3)', fontWeight: 500 }}>No messages captured</span>
                <span style={{ fontSize: 13, color: 'var(--t4)' }}>Deleted and edited messages will be logged here</span>
              </motion.div>
        )}
        {tab === 'deleted' && filtered.map((item, i) => <SnipeItem key={item.time + '-' + i} item={item} />)}
        {tab === 'edited' && filtered.map((item, i) => <EditItem key={item.time + '-' + i} item={item} />)}
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
  heroContent: {
    position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 12,
  },
  heroTitle: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2' },
  heroSub: { fontSize: 14, color: '#5a5a65', marginTop: 6, fontWeight: 500 },

  actions: { display: 'flex', alignItems: 'center', gap: 8 },

  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, padding: '8px 12px',
    transition: 'border-color .2s, box-shadow .2s',
  },
  searchInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: '#f0f0f2', fontSize: 14, width: 140, fontFamily: 'inherit',
  },
  seg: {
    display: 'inline-flex', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, padding: 3, gap: 2,
  },
  segBtn: {
    padding: '7px 16px', border: 'none', borderRadius: 8, background: 'transparent',
    color: '#5a5a65', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all .15s',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  segActive: {
    background: 'rgba(99,102,241,.08)', color: '#f0f0f2',
  },
  badge: {
    fontSize: 11, fontFamily: 'var(--mono)', color: '#5a5a65',
    background: 'rgba(255,255,255,.04)', borderRadius: 6, padding: '1px 6px',
  },
  iconBtn: {
    width: 34, height: 34, border: '1px solid rgba(255,255,255,.04)', borderRadius: 10,
    background: 'rgba(255,255,255,.03)', color: '#5a5a65', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .15s',
  },

  feed: {
    maxHeight: 'calc(100vh - 220px)', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  item: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.03)',
    borderRadius: 16, padding: '12px 16px', fontSize: 14,
  },
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  author: { fontWeight: 600, color: '#f0f0f2' },
  meta: { fontSize: 12, color: '#3a3a42' },
  content: { color: '#94949e', marginTop: 6, wordBreak: 'break-word', lineHeight: 1.5 },
  nil: { padding: 48, textAlign: 'center', color: '#3a3a42', fontSize: 14, fontWeight: 500 },
}
