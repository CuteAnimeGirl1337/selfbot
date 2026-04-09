import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function Servers({ state, api }) {
  const toast = useToast()
  if (!state) return null

  const sorted = [...state.guilds].sort((a, b) => b.memberCount - a.memberCount)

  const leave = async (id, name) => {
    if (!confirm(`Leave "${name}"?`)) return
    await api(`/api/guilds/${id}/leave`)
    toast(`Left ${name}`)
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Servers</h1>
        <span style={s.count}>{sorted.length} servers</span>
      </div>

      <div style={s.grid}>
        {sorted.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * .02, duration: .3 }}
            style={s.card}
            whileHover={{ borderColor: 'rgba(255,255,255,.08)', y: -2 }}
          >
            <div style={s.cardTop}>
              {g.icon
                ? <img src={g.icon} alt="" style={s.icon} />
                : <div style={s.letter}>{g.name.charAt(0)}</div>
              }
              <div style={s.info}>
                <span style={s.name}>{g.name}</span>
                <span style={s.members}>{g.memberCount.toLocaleString()} members</span>
              </div>
            </div>
            <button
              onClick={() => leave(g.id, g.name)}
              style={s.leaveBtn}
              onMouseEnter={e => { e.target.style.background = 'rgba(251,113,133,.06)' }}
              onMouseLeave={e => { e.target.style.background = 'transparent' }}
            >
              Leave
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const s = {
  page: { padding: '32px 40px 48px' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-.6px', color: '#f0f0f2' },
  count: { fontSize: 13, color: '#5a5a65', fontWeight: 500 },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 10,
  },
  card: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, padding: 16,
    display: 'flex', flexDirection: 'column', gap: 14,
    transition: 'border-color .2s, transform .2s',
    cursor: 'default',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 12 },
  icon: {
    width: 40, height: 40, borderRadius: 10,
    objectFit: 'cover', background: '#17171b', flexShrink: 0,
  },
  letter: {
    width: 40, height: 40, borderRadius: 10,
    background: '#17171b', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 16, fontWeight: 700, color: '#5a5a65', flexShrink: 0,
  },
  info: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  name: {
    fontWeight: 600, fontSize: 14, letterSpacing: '-.1px', color: '#f0f0f2',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  members: { fontSize: 12, color: '#5a5a65', fontWeight: 500 },
  leaveBtn: {
    padding: '6px 0', background: 'transparent', border: 'none',
    color: '#fb7185', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', borderRadius: 8, transition: 'background .15s',
    fontFamily: 'inherit',
  },
}
