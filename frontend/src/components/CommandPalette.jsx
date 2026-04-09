import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutDashboard, MessageCircle, Radio, Terminal, Zap, Dices,
  Repeat, CalendarClock, UserSearch, Bell, BarChart3, Trash2,
  Eye, Radar, Shield, Send, Hash, Webhook, Globe, Puzzle,
  Database, User, Settings
} from 'lucide-react'

const PAGES = [
  { id: 'overview',   label: 'Dashboard',     icon: LayoutDashboard, category: 'Navigation' },
  { id: 'discord',    label: 'Discord',        icon: MessageCircle,   category: 'Navigation' },
  { id: 'live',       label: 'Live Feed',      icon: Radio,           category: 'Navigation' },
  { id: 'terminal',   label: 'Run Commands',   icon: Terminal,        category: 'Bot' },
  { id: 'commands',   label: 'Commands',        icon: Zap,             category: 'Bot' },
  { id: 'gambling',   label: 'Gambling',        icon: Dices,           category: 'Bot' },
  { id: 'macros',     label: 'Macros',          icon: Repeat,          category: 'Bot' },
  { id: 'scheduler',  label: 'Scheduler',       icon: CalendarClock,   category: 'Bot' },
  { id: 'tracker',    label: 'Tracker',         icon: UserSearch,      category: 'Intelligence' },
  { id: 'alerts',     label: 'Alerts',          icon: Bell,            category: 'Intelligence' },
  { id: 'analytics',  label: 'Analytics',       icon: BarChart3,       category: 'Intelligence' },
  { id: 'archive',    label: 'Archive',         icon: Trash2,          category: 'Intelligence' },
  { id: 'logger',     label: 'Logger',          icon: Eye,             category: 'Intelligence' },
  { id: 'spy',        label: 'Spy & Auto',      icon: Radar,           category: 'Intelligence' },
  { id: 'automod',    label: 'AutoMod',         icon: Shield,          category: 'Tools' },
  { id: 'dms',        label: 'DMs',             icon: Send,            category: 'Tools' },
  { id: 'channels',   label: 'Channels',        icon: Hash,            category: 'Tools' },
  { id: 'webhooks',   label: 'Webhooks',        icon: Webhook,         category: 'Tools' },
  { id: 'servers',    label: 'Servers',          icon: Globe,           category: 'Tools' },
  { id: 'plugins',    label: 'Plugins',          icon: Puzzle,          category: 'System' },
  { id: 'backup',     label: 'Backup',           icon: Database,        category: 'System' },
  { id: 'account',    label: 'Account',          icon: User,            category: 'System' },
  { id: 'settings',   label: 'Settings',         icon: Settings,        category: 'System' },
  { id: 'console',    label: 'Console',          icon: Terminal,        category: 'System' },
]

export default function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return PAGES
    const q = query.toLowerCase()
    return PAGES.filter(p => p.label.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // parent should handle opening, but we call onClose to toggle
          // This is handled externally via isOpen prop
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Scroll selected item into view
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
      setSelected(s => Math.min(s + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, 0))
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
      {isOpen && (
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
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div style={styles.inputWrap}>
              <Search size={20} style={{ color: 'var(--t3)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                style={styles.input}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages..."
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            <div style={styles.divider} />

            {/* Results */}
            <div style={styles.results} ref={listRef}>
              {filtered.length === 0 && (
                <div style={styles.empty}>No results</div>
              )}
              {filtered.map((item, i) => {
                const Icon = item.icon
                const isSel = i === selected
                return (
                  <div
                    key={item.id}
                    style={{
                      ...styles.item,
                      background: isSel ? 'var(--accent-soft, rgba(99,102,241,0.15))' : 'transparent',
                    }}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelected(i)}
                  >
                    <div style={styles.itemLeft}>
                      <Icon
                        size={16}
                        style={{
                          color: isSel ? 'var(--accent)' : 'var(--t3)',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{
                        ...styles.itemLabel,
                        color: isSel ? 'var(--t1)' : 'var(--t2)',
                      }}>
                        {item.label}
                      </span>
                    </div>
                    <span style={styles.categoryTag}>{item.category}</span>
                  </div>
                )
              })}
            </div>

            <div style={styles.divider} />

            {/* Footer hints */}
            <div style={styles.footer}>
              <span style={styles.hint}>
                <kbd style={styles.kbd}>&uarr;&darr;</kbd> Navigate
              </span>
              <span style={styles.hintDot}>&middot;</span>
              <span style={styles.hint}>
                <kbd style={styles.kbd}>&crarr;</kbd> Select
              </span>
              <span style={styles.hintDot}>&middot;</span>
              <span style={styles.hint}>
                <kbd style={styles.kbd}>esc</kbd> Close
              </span>
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
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 120,
  },
  panel: {
    width: 560,
    maxWidth: 'calc(100vw - 32px)',
    background: 'var(--bg-1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--bg-3)',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 18px',
    gap: 12,
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--t1)',
    fontSize: 18,
    fontFamily: 'var(--font)',
    letterSpacing: '-0.01em',
  },
  divider: {
    height: 1,
    background: 'var(--bg-3)',
  },
  results: {
    maxHeight: 400,
    overflowY: 'auto',
    padding: 6,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 12px',
    borderRadius: 10,
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
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'var(--font)',
  },
  categoryTag: {
    fontSize: 11,
    fontFamily: 'var(--mono)',
    color: 'var(--t4)',
    background: 'var(--bg-2)',
    padding: '2px 8px',
    borderRadius: 6,
    letterSpacing: '0.02em',
  },
  empty: {
    padding: '32px 16px',
    textAlign: 'center',
    color: 'var(--t4)',
    fontSize: 14,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  hintDot: {
    color: 'var(--t4)',
    fontSize: 11,
  },
  kbd: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    height: 20,
    padding: '0 5px',
    fontSize: 11,
    fontFamily: 'var(--mono)',
    color: 'var(--t3)',
    background: 'var(--bg-3)',
    border: '1px solid var(--bg-3)',
    borderRadius: 4,
  },
}
