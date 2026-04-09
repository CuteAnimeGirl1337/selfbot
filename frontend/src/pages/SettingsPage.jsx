import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none',
        background: checked ? 'linear-gradient(135deg, var(--accent), var(--accent-h))' : 'var(--t4)',
        cursor: 'pointer', position: 'relative', padding: 0,
        transition: 'background .2s', flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', position: 'absolute', top: 3, left: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        }}
      />
    </button>
  )
}

function ActionBtn({ onClick, children, id }) {
  const [done, setDone] = useState(false)
  const handleClick = async () => {
    await onClick()
    setDone(true)
    setTimeout(() => setDone(false), 1200)
  }
  return (
    <button onClick={handleClick} style={{
      ...s.btn,
      background: done ? 'var(--green)' : 'linear-gradient(135deg, var(--accent), var(--accent-h))',
      boxShadow: done ? '0 2px 12px rgba(52,211,153,.25)' : '0 2px 12px rgba(99,102,241,.25)',
    }}>
      {done ? 'Done' : children}
    </button>
  )
}

export default function SettingsPage({ state, api, theme, setTheme, themes }) {
  const toast = useToast()
  const [prefix, setPrefix] = useState('!')
  const [status, setStatus] = useState('')
  const [afkReason, setAfkReason] = useState('')
  const [afkOn, setAfkOn] = useState(false)
  const [autoDel, setAutoDel] = useState(false)
  const [presence, setPresence] = useState('online')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (state?.config && !loaded) {
      setPrefix(state.config.prefix)
      setAfkOn(state.config.afk.enabled)
      setAfkReason(state.config.afk.reason || '')
      setAutoDel(state.config.autoDeleteCommands)
      setLoaded(true)
    }
  }, [state])

  const save = async (type) => {
    let body = {}
    let msg = ''
    switch (type) {
      case 'prefix':
        if (!prefix.trim()) return toast('Prefix cannot be empty')
        body = { prefix: prefix.trim() }
        msg = `Prefix → ${prefix.trim()}`
        break
      case 'presence':
        body = { presence }
        msg = `Presence → ${presence}`
        break
      case 'status':
        body = { customStatus: status }
        msg = 'Status updated'
        break
      case 'afk':
        body = { afk: { enabled: !afkOn, reason: afkReason } }
        setAfkOn(!afkOn)
        msg = !afkOn ? `AFK: ${afkReason || 'AFK'}` : 'AFK off'
        break
      case 'autodel':
        body = { autoDeleteCommands: !autoDel }
        setAutoDel(!autoDel)
        msg = !autoDel ? 'Auto-delete on' : 'Auto-delete off'
        break
    }
    await api('/api/settings', body)
    toast(msg)
  }

  const focusStyle = (e) => { e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)'; e.target.style.borderColor = 'rgba(99,102,241,.3)' }
  const blurStyle = (e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'rgba(255,255,255,.04)' }

  return (
    <div style={{ padding: '32px 40px 48px' }}>
      <h1 style={s.title}>Settings</h1>

      <motion.div
        style={s.panel}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Prefix */}
        <div style={s.row}>
          <div style={s.rowLeft}>
            <span style={s.label}>Prefix</span>
            <span style={s.hint}>Command trigger character</span>
          </div>
          <div style={s.rowRight}>
            <input
              value={prefix}
              onChange={e => setPrefix(e.target.value)}
              maxLength={5}
              style={{ ...s.input, width: 60, textAlign: 'center' }}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <ActionBtn onClick={() => save('prefix')}>Save</ActionBtn>
          </div>
        </div>

        <div style={s.divider} />

        {/* Presence */}
        <div style={s.row}>
          <div style={s.rowLeft}>
            <span style={s.label}>Presence</span>
            <span style={s.hint}>Discord online status</span>
          </div>
          <div style={s.rowRight}>
            <select value={presence} onChange={e => setPresence(e.target.value)} style={s.select}
              onFocus={focusStyle} onBlur={blurStyle}>
              <option value="online">Online</option>
              <option value="idle">Idle</option>
              <option value="dnd">Do Not Disturb</option>
              <option value="invisible">Invisible</option>
            </select>
            <ActionBtn onClick={() => save('presence')}>Apply</ActionBtn>
          </div>
        </div>

        <div style={s.divider} />

        {/* Custom Status */}
        <div style={s.row}>
          <div style={s.rowLeft}>
            <span style={s.label}>Custom Status</span>
            <span style={s.hint}>Shown on your profile</span>
          </div>
          <div style={s.rowRight}>
            <input
              value={status}
              onChange={e => setStatus(e.target.value)}
              placeholder="Playing something..."
              style={s.input}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <ActionBtn onClick={() => save('status')}>Set</ActionBtn>
          </div>
        </div>

        <div style={s.divider} />

        {/* AFK */}
        <div style={s.row}>
          <div style={s.rowLeft}>
            <span style={s.label}>AFK</span>
            <span style={s.hint}>Auto-reply when mentioned</span>
          </div>
          <div style={s.rowRight}>
            <input
              value={afkReason}
              onChange={e => setAfkReason(e.target.value)}
              placeholder="Reason..."
              style={{ ...s.input, width: 120 }}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <Toggle checked={afkOn} onChange={() => save('afk')} />
          </div>
        </div>

        <div style={s.divider} />

        {/* Auto-delete */}
        <div style={{ ...s.row, borderBottom: 'none' }}>
          <div style={s.rowLeft}>
            <span style={s.label}>Auto-delete commands</span>
            <span style={s.hint}>Remove your command messages</span>
          </div>
          <div style={s.rowRight}>
            <Toggle checked={autoDel} onChange={() => save('autodel')} />
          </div>
        </div>
      </motion.div>

      {/* Theme Picker */}
      {themes && (
        <motion.div
          style={{ ...s.panel, marginTop: 22 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .1 }}
        >
          <div style={{ padding: '0 0 6px' }}>
            <div style={s.sectionHeader}>THEME</div>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Choose a color scheme</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 0 4px' }}>
            {Object.entries(themes).map(([id, t]) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: theme === id ? `2px solid ${t['--accent']}` : '2px solid rgba(255,255,255,.04)',
                  background: theme === id ? 'var(--accent-soft)' : 'var(--bg-3)',
                  color: 'var(--t1)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all .15s',
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: t['--accent'] }} />
                {t.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Keyboard Shortcuts */}
      <motion.div
        style={{ ...s.panel, marginTop: 22 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: .15 }}
      >
        <div style={s.sectionHeader}>KEYBOARD SHORTCUTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          {[
            ['Ctrl+K', 'Command Palette'],
            ['Alt+1-9', 'Jump to page'],
            ['Escape', 'Close modal / blur input'],
          ].map(([key, desc]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--t2)' }}>
              <code style={{
                background: 'var(--bg-3)', padding: '3px 10px', borderRadius: 6,
                fontFamily: 'monospace', fontSize: 11, color: 'var(--t1)',
                border: '1px solid rgba(255,255,255,.04)',
              }}>{key}</code>
              {desc}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

const s = {
  title: {
    fontSize: 28, fontWeight: 700, letterSpacing: '-.6px',
    color: 'var(--t1)', marginBottom: 28,
  },
  panel: {
    background: 'var(--bg-1)', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, maxWidth: 580, overflow: 'hidden', padding: '4px 0',
  },
  sectionHeader: {
    fontSize: 12, fontWeight: 700, color: 'var(--t4)',
    textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4,
    padding: '0 22px',
  },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 22px', gap: 16,
  },
  rowLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  rowRight: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  label: { fontSize: 14, fontWeight: 500, color: 'var(--t1)' },
  hint: { fontSize: 12, color: 'var(--t3)' },
  divider: { height: 1, background: 'rgba(255,255,255,.03)', margin: '0 22px' },
  input: {
    padding: '10px 14px', background: 'var(--bg-3)',
    border: '1px solid rgba(255,255,255,.04)', borderRadius: 10,
    color: 'var(--t1)', fontSize: 13, outline: 'none', width: 160,
    transition: 'box-shadow .2s, border-color .2s',
  },
  select: {
    padding: '10px 30px 10px 14px', background: 'var(--bg-3)',
    border: '1px solid rgba(255,255,255,.04)', borderRadius: 10,
    color: 'var(--t1)', fontSize: 13, outline: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='%235a5a65'%3E%3Cpath d='M0 0l5 6 5-6z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
    cursor: 'pointer', transition: 'box-shadow .2s, border-color .2s',
  },
  btn: {
    padding: '8px 16px', border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    transition: 'all .15s', whiteSpace: 'nowrap',
  },
}
