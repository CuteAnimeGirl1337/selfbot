import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutDashboard, MessageCircle, Radio, Zap, Dices,
  UserSearch, Bell, BarChart3, Trash2, Repeat, CalendarClock,
  Eye, Radar, Shield, Send, Hash, Webhook, Globe, Puzzle,
  Database, User, Settings, Terminal
} from 'lucide-react'

const iconMap = {
  LayoutDashboard, MessageCircle, Radio, Zap, Dices, UserSearch,
  Bell, BarChart3, Trash2, Repeat, CalendarClock, Eye, Radar,
  Shield, Send, Hash, Webhook, Globe, Puzzle, Database, User,
  Settings, Terminal, Search
}

const pages = [
  { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', keys: 'overview dashboard home' },
  { id: 'discord', label: 'Discord', icon: 'MessageCircle', keys: 'discord chat messages dm' },
  { id: 'live', label: 'Live Feed', icon: 'Radio', keys: 'live feed events' },
  { id: 'commands', label: 'Commands', icon: 'Zap', keys: 'commands bot' },
  { id: 'gambling', label: 'Gambling', icon: 'Dices', keys: 'gambling casino economy' },
  { id: 'tracker', label: 'Tracker', icon: 'UserSearch', keys: 'tracker users online' },
  { id: 'alerts', label: 'Alerts', icon: 'Bell', keys: 'alerts keywords notify' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3', keys: 'analytics stats charts' },
  { id: 'archive', label: 'Archive', icon: 'Trash2', keys: 'archive deleted messages' },
  { id: 'macros', label: 'Macros', icon: 'Repeat', keys: 'macros automation' },
  { id: 'scheduler', label: 'Scheduler', icon: 'CalendarClock', keys: 'scheduler schedule messages' },
  { id: 'logger', label: 'Logger', icon: 'Eye', keys: 'logger snipe deleted edited' },
  { id: 'spy', label: 'Spy & Auto', icon: 'Radar', keys: 'spy autoreply' },
  { id: 'automod', label: 'AutoMod', icon: 'Shield', keys: 'automod moderation' },
  { id: 'dms', label: 'DMs', icon: 'Send', keys: 'dm direct messages' },
  { id: 'channels', label: 'Channels', icon: 'Hash', keys: 'channels server' },
  { id: 'webhooks', label: 'Webhooks', icon: 'Webhook', keys: 'webhooks' },
  { id: 'servers', label: 'Servers', icon: 'Globe', keys: 'servers guilds' },
  { id: 'plugins', label: 'Plugins', icon: 'Puzzle', keys: 'plugins extensions' },
  { id: 'backup', label: 'Backup', icon: 'Database', keys: 'backup export import' },
  { id: 'account', label: 'Account', icon: 'User', keys: 'account profile' },
  { id: 'settings', label: 'Settings', icon: 'Settings', keys: 'settings config' },
  { id: 'console', label: 'Console', icon: 'Terminal', keys: 'console logs terminal' },
]

export default function CommandPalette({ open, onClose, onNavigate, state }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return pages
    const q = query.toLowerCase()
    return pages.filter(p =>
      p.label.toLowerCase().includes(q) || p.keys.toLowerCase().includes(q)
    )
  }, [query])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[selected]
    if (item) item.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const handleSelect = useCallback((item) => {
    onNavigate(item.id)
    onClose()
  }, [onNavigate, onClose])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.max(0, Math.min(s + 1, filtered.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(0, Math.min(s - 1, filtered.length - 1)))
    } else if (e.key === 'Enter' && filtered[selected]) {
      e.preventDefault()
      handleSelect(filtered[selected])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [filtered, selected, handleSelect, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            style={styles.panel}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={styles.inputWrap}>
              <Search size={16} style={styles.searchIcon} />
              <input
                ref={inputRef}
                style={styles.input}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search or jump to..."
                spellCheck={false}
              />
            </div>

            <div style={styles.divider} />

            <div style={styles.results} ref={listRef}>
              {filtered.length === 0 && (
                <div style={styles.empty}>No results found</div>
              )}
              {filtered.length > 0 && (
                <div style={styles.groupLabel}>Pages</div>
              )}
              {filtered.map((item, i) => {
                const Icon = iconMap[item.icon]
                const isSelected = i === selected
                return (
                  <motion.div
                    key={item.id}
                    style={{
                      ...styles.item,
                      background: isSelected ? 'var(--accent)' : 'transparent',
                      color: isSelected ? '#fff' : 'var(--t2)',
                    }}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelected(i)}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1, delay: i * 0.01 }}
                  >
                    <div style={styles.itemLeft}>
                      {Icon && <Icon size={15} style={{ opacity: isSelected ? 1 : 0.6, flexShrink: 0 }} />}
                      <span style={styles.itemLabel}>{item.label}</span>
                    </div>
                    <span style={{
                      ...styles.shortcut,
                      color: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--t4)',
                    }}>
                      {item.id}
                    </span>
                  </motion.div>
                )
              })}
            </div>

            <div style={styles.divider} />

            <div style={styles.footer}>
              <span style={styles.hint}><kbd style={styles.kbd}>↑↓</kbd> Navigate</span>
              <span style={styles.hint}><kbd style={styles.kbd}>↵</kbd> Open</span>
              <span style={styles.hint}><kbd style={styles.kbd}>esc</kbd> Close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 120,
  },
  panel: {
    width: 500,
    maxWidth: 'calc(100vw - 32px)',
    background: 'var(--bg-1)',
    border: '1px solid var(--border-h)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    gap: 10,
  },
  searchIcon: {
    color: 'var(--t3)',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--t1)',
    fontSize: 14,
    fontFamily: 'var(--font)',
    letterSpacing: '-0.01em',
  },
  divider: {
    height: 1,
    background: 'var(--border)',
  },
  results: {
    maxHeight: 400,
    overflowY: 'auto',
    padding: '6px 6px',
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--t4)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '8px 10px 4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 0.1s',
    userSelect: 'none',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'var(--font)',
  },
  shortcut: {
    fontSize: 11,
    fontFamily: 'var(--mono)',
    opacity: 0.7,
  },
  empty: {
    padding: '24px 16px',
    textAlign: 'center',
    color: 'var(--t4)',
    fontSize: 13,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '10px 16px',
  },
  hint: {
    fontSize: 11,
    color: 'var(--t4)',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: 'var(--font)',
  },
  kbd: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    height: 18,
    padding: '0 5px',
    fontSize: 10,
    fontFamily: 'var(--mono)',
    color: 'var(--t3)',
    background: 'var(--bg-3)',
    border: '1px solid var(--border)',
    borderRadius: 4,
  },
}
