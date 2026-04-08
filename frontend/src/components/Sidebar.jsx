import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Terminal, Eye, Globe, Settings, Zap,
  Send, Radar, User, Webhook, Hash, Dices, Radio,
  Repeat, CalendarClock, Shield, Puzzle, Database, MessageCircle, LogOut,
  UserSearch, Bell, BarChart3, Trash2
} from 'lucide-react'

const sections = [
  { items: [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'discord', icon: MessageCircle, label: 'Discord' },
    { id: 'live', icon: Radio, label: 'Live Feed' },
  ]},
  { label: 'Bot', items: [
    { id: 'terminal', icon: Terminal, label: 'Run Commands' },
    { id: 'commands', icon: Zap, label: 'Commands' },
    { id: 'gambling', icon: Dices, label: 'Gambling' },
    { id: 'macros', icon: Repeat, label: 'Macros' },
    { id: 'scheduler', icon: CalendarClock, label: 'Scheduler' },
  ]},
  { label: 'Intelligence', items: [
    { id: 'tracker', icon: UserSearch, label: 'Tracker' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'archive', icon: Trash2, label: 'Archive' },
    { id: 'logger', icon: Eye, label: 'Logger' },
    { id: 'spy', icon: Radar, label: 'Spy & Auto' },
  ]},
  { label: 'Tools', items: [
    { id: 'automod', icon: Shield, label: 'AutoMod' },
    { id: 'dms', icon: Send, label: 'DMs' },
    { id: 'channels', icon: Hash, label: 'Channels' },
    { id: 'webhooks', icon: Webhook, label: 'Webhooks' },
    { id: 'servers', icon: Globe, label: 'Servers' },
  ]},
  { label: 'System', items: [
    { id: 'plugins', icon: Puzzle, label: 'Plugins' },
    { id: 'backup', icon: Database, label: 'Backup' },
    { id: 'account', icon: User, label: 'Account' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'console', icon: Terminal, label: 'Console' },
  ]},
]

export default function Sidebar({ active, setActive, user, uptime, connected, onLogout }) {
  const [hov, setHov] = useState(null)
  const [logHov, setLogHov] = useState(false)

  return (
    <aside style={st.bar}>
      {/* User */}
      <div style={st.user}>
        {user ? (
          <>
            <div style={st.avatarBox}>
              <img src={user.avatar} alt="" style={st.avatar} />
              <div style={{ ...st.dot, background: { online:'#34d399', idle:'#fbbf24', dnd:'#fb7185', invisible:'#3a3a42' }[user.status] || '#34d399' }} />
            </div>
            <div style={st.userInfo}>
              <div style={st.tag}>{user.tag}</div>
              <div style={st.uid}>{user.id}</div>
            </div>
          </>
        ) : (
          <span style={{ ...st.tag, color: '#5a5a65' }}>{connected ? 'Logging in...' : 'Connecting...'}</span>
        )}
      </div>

      {/* Nav */}
      <nav style={st.nav}>
        {sections.map((sec, si) => (
          <div key={si} style={si > 0 ? { marginTop: 4 } : undefined}>
            {sec.label && <div style={st.label}>{sec.label}</div>}
            {sec.items.map(({ id, icon: Icon, label }) => {
              const isActive = active === id
              const isHov = hov === id && !isActive
              return (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  onMouseEnter={() => setHov(id)}
                  onMouseLeave={() => setHov(null)}
                  style={{
                    ...st.item,
                    ...(isActive ? st.itemActive : {}),
                    ...(isHov ? st.itemHov : {}),
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="pill"
                      style={st.pill}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon size={16} style={{ position: 'relative', zIndex: 1, opacity: isActive ? 1 : .4 }} />
                  <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={st.footer}>
        <div style={st.footerRow}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#34d399' : '#fb7185' }} />
          <span style={st.uptime}>{uptime}</span>
          <kbd style={st.kbd}>⌘K</kbd>
        </div>
        {onLogout && (
          <button
            onClick={() => { if (confirm('Logout and disconnect?')) onLogout() }}
            onMouseEnter={() => setLogHov(true)}
            onMouseLeave={() => setLogHov(false)}
            style={{
              ...st.logout,
              background: logHov ? 'rgba(251,113,133,.06)' : 'transparent',
              borderColor: logHov ? 'rgba(251,113,133,.15)' : 'rgba(255,255,255,.04)',
              color: logHov ? '#fb7185' : '#3a3a42',
            }}
          >
            <LogOut size={13} /> Logout
          </button>
        )}
      </div>
    </aside>
  )
}

const st = {
  bar: {
    width: 240, minWidth: 240, flexShrink: 0,
    background: 'linear-gradient(180deg, #0a0a0e 0%, #08080c 100%)',
    borderRight: '1px solid rgba(255,255,255,.03)',
    display: 'flex', flexDirection: 'column', height: '100%',
    userSelect: 'none',
  },
  user: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '18px 18px 16px',
    borderBottom: '1px solid rgba(255,255,255,.03)',
  },
  avatarBox: { position: 'relative', flexShrink: 0 },
  avatar: { width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', background: '#17171b' },
  dot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 11, height: 11, borderRadius: '50%',
    border: '2.5px solid #0a0a0e',
  },
  userInfo: { overflow: 'hidden' },
  tag: { fontSize: 14, fontWeight: 600, letterSpacing: '-.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#f0f0f2' },
  uid: { fontSize: 11, color: '#3a3a42', fontFamily: 'var(--mono)', marginTop: 1 },

  nav: { flex: 1, padding: '8px 8px', overflowY: 'auto', overflowX: 'hidden' },
  label: {
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '1.2px', color: '#3a3a42',
    padding: '12px 12px 6px',
  },
  item: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', borderRadius: 10, width: '100%', textAlign: 'left',
    border: 'none', background: 'transparent',
    color: '#94949e', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', position: 'relative',
    letterSpacing: '-.1px', transition: 'color .12s, background .12s',
    fontFamily: 'var(--font)',
  },
  itemActive: { color: '#f0f0f2' },
  itemHov: { color: '#f0f0f2', background: 'rgba(255,255,255,.03)' },
  pill: {
    position: 'absolute', inset: 0, borderRadius: 10,
    background: 'rgba(99,102,241,.08)',
    border: '1px solid rgba(99,102,241,.12)',
  },

  footer: {
    padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.03)',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  footerRow: { display: 'flex', alignItems: 'center', gap: 8 },
  uptime: { fontSize: 12, fontFamily: 'var(--mono)', color: '#3a3a42', fontWeight: 600 },
  kbd: {
    marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--mono)',
    color: '#25252b', background: '#17171b', padding: '2px 6px',
    borderRadius: 4, fontWeight: 600, border: '1px solid rgba(255,255,255,.04)',
  },
  logout: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '7px 0', border: '1px solid rgba(255,255,255,.04)', borderRadius: 8,
    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
    fontFamily: 'var(--font)',
  },
}
