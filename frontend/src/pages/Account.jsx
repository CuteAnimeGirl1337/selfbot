import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Shield, Zap, Moon, Sun, Coffee } from 'lucide-react'
import { useToast } from '../components/Toast'

const fmt = n => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

const actions = [
  { label: 'Go Invisible', icon: Moon, color: '#818cf8', body: { presence: 'invisible' }, msg: 'Set to invisible' },
  { label: 'Go Online', icon: Sun, color: '#34d399', body: { presence: 'online' }, msg: 'Set to online' },
  { label: 'Go Idle', icon: Coffee, color: '#fbbf24', body: { presence: 'idle' }, msg: 'Set to idle' },
  { label: 'Clear Status', icon: Zap, color: '#22d3ee', body: { customStatus: '' }, msg: 'Status cleared' },
  { label: 'Enable AFK', icon: Shield, color: '#818cf8', body: { afk: { enabled: true, reason: 'AFK' } }, msg: 'AFK enabled' },
  { label: 'Disable AFK', icon: User, color: '#fb7185', body: { afk: { enabled: false, reason: '' } }, msg: 'AFK disabled' },
]

export default function Account({ state, api }) {
  const toast = useToast()
  const [loading, setLoading] = useState(null)

  if (!state) return null
  const { user, stats, guilds } = state

  const createdAt = user?.id
    ? new Date(Number(BigInt(user.id) >> 22n) + 1420070400000).toLocaleDateString()
    : '—'

  const handleAction = async (action, i) => {
    setLoading(i)
    try {
      await api('/api/settings', action.body)
      toast(action.msg)
    } catch {
      toast('Action failed')
    }
    setLoading(null)
  }

  const statItems = [
    { label: 'Guilds', value: fmt(guilds?.length ?? 0) },
    { label: 'Friends', value: fmt(stats?.friendCount ?? 0) },
    { label: 'Commands Run', value: fmt(stats?.commandsRun ?? 0) },
    { label: 'Messages Seen', value: fmt(stats?.messagesSeen ?? 0) },
    { label: 'Msg/min', value: (stats?.msgRate ?? 0).toFixed(1) },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .35 }}
      style={{ padding: '32px 40px 48px' }}
    >
      <h1 style={s.title}>Account</h1>

      {/* Profile Card */}
      <div style={s.panel}>
        <div style={s.profileRow}>
          <img
            src={user?.avatar
              ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
              : `https://cdn.discordapp.com/embed/avatars/0.png`}
            alt=""
            style={s.avatar}
          />
          <div>
            <div style={s.tag}>{user?.username ?? 'Unknown'}
              {user?.discriminator && user.discriminator !== '0' && (
                <span style={{ color: '#5a5a65' }}>#{user.discriminator}</span>
              )}
            </div>
            <div style={s.sub}>ID: {user?.id ?? '—'}</div>
            <div style={s.sub}>Created: {createdAt}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ ...s.panel, marginTop: 18 }}>
        <div style={s.sectionHeader}>STATS</div>
        <div style={s.statsGrid}>
          {statItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * .04, duration: .3 }}
              style={s.statCard}
            >
              <div style={s.statVal}>{item.value}</div>
              <div style={s.statLabel}>{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ ...s.panel, marginTop: 18 }}>
        <div style={s.sectionHeader}>QUICK ACTIONS</div>
        <div style={s.actionsGrid}>
          {actions.map((action, i) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * .04, duration: .3 }}
                whileHover={{ scale: 1.04, background: 'rgba(255,255,255,.03)' }}
                whileTap={{ scale: .97 }}
                onClick={() => handleAction(action, i)}
                disabled={loading === i}
                style={s.actionBtn}
              >
                <Icon size={16} color={action.color} />
                <span>{action.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

const s = {
  title: {
    fontSize: 28, fontWeight: 700, letterSpacing: '-.6px',
    color: '#f0f0f2', margin: '0 0 24px',
  },
  panel: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, padding: '22px 26px',
  },
  profileRow: { display: 'flex', alignItems: 'center', gap: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
    border: '2px solid rgba(255,255,255,.04)',
  },
  tag: { fontSize: 20, fontWeight: 700, color: '#f0f0f2', letterSpacing: '-.3px' },
  sub: { fontSize: 13, color: '#5a5a65', marginTop: 3 },
  sectionHeader: {
    fontSize: 12, fontWeight: 700, color: '#3a3a42',
    textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 16,
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12,
  },
  statCard: {
    background: '#17171b', border: '1px solid rgba(255,255,255,.03)',
    borderRadius: 12, padding: '16px 18px', textAlign: 'center',
  },
  statVal: { fontSize: 22, fontWeight: 700, color: '#f0f0f2' },
  statLabel: { fontSize: 12, color: '#5a5a65', marginTop: 4 },
  actionsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
    background: '#17171b', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 12, padding: '13px 18px', color: '#f0f0f2',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    transition: 'border-color .15s, background .15s',
  },
}
