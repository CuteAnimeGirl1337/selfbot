import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Trash2 } from 'lucide-react'

const typeColors = {
  alert: 'var(--amber)',
  snipe: 'var(--red)',
  spy: 'var(--purple)',
  dm: 'var(--accent)',
  tracker: 'var(--cyan)',
  system: 'var(--t3)',
}

function relativeTime(ts) {
  if (!ts) return 'just now'
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationCenter({ notifications = [], onClear, onClearAll }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)

  const unread = notifications.filter(n => !n.read)
  const sorted = [...notifications].sort((a, b) => new Date(b.time) - new Date(a.time))

  // close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div style={styles.wrapper}>
      <button
        ref={buttonRef}
        style={styles.bellBtn}
        onClick={() => setOpen(o => !o)}
        title="Notifications"
      >
        <Bell size={17} style={{ color: 'var(--t2)' }} />
        <AnimatePresence>
          {unread.length > 0 && (
            <motion.span
              style={styles.badge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              key="badge"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
              >
                {unread.length > 99 ? '99+' : unread.length}
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            style={styles.panel}
            initial={{ opacity: 0, x: 20, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div style={styles.header}>
              <span style={styles.title}>Notifications</span>
              {notifications.length > 0 && (
                <button
                  style={styles.clearAllBtn}
                  onClick={() => { onClearAll?.(); }}
                  title="Clear all"
                >
                  <Trash2 size={12} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            <div style={styles.list}>
              <AnimatePresence initial={false}>
                {sorted.length === 0 && (
                  <motion.div
                    style={styles.empty}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Bell size={28} style={{ color: 'var(--t5)', marginBottom: 8 }} />
                    <span>No notifications</span>
                  </motion.div>
                )}
                {sorted.map((n) => {
                  const borderColor = typeColors[n.type] || 'var(--t4)'
                  return (
                    <motion.div
                      key={n.id}
                      style={{
                        ...styles.item,
                        borderLeft: `3px solid ${borderColor}`,
                        opacity: n.read ? 0.45 : 1,
                      }}
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: n.read ? 0.45 : 1, height: 'auto', marginBottom: 4 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => !n.read && onClear?.(n.id)}
                      layout
                    >
                      <div style={styles.itemTop}>
                        <span style={styles.itemTitle}>{n.title}</span>
                        <span style={styles.itemTime}>{relativeTime(n.time)}</span>
                      </div>
                      {n.body && (
                        <div style={styles.itemBody}>
                          {n.body.length > 80 ? n.body.slice(0, 80) + '...' : n.body}
                        </div>
                      )}
                      <div style={styles.itemType}>
                        <span style={{
                          ...styles.typeDot,
                          background: borderColor,
                        }} />
                        {n.type}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const styles = {
  wrapper: {
    position: 'relative',
  },
  bellBtn: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-2)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    padding: '0 4px',
    borderRadius: 999,
    background: 'var(--red)',
    color: '#fff',
    fontSize: 9,
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    boxShadow: '0 0 0 2px var(--bg-1)',
  },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 280,
    maxHeight: 'calc(100vh - 80px)',
    background: 'var(--bg-1)',
    border: '1px solid var(--border-h)',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderBottom: '1px solid var(--border)',
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--t1)',
    fontFamily: 'var(--font)',
  },
  clearAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    fontSize: 10,
    fontWeight: 500,
    fontFamily: 'var(--font)',
    color: 'var(--t3)',
    background: 'var(--bg-3)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: 8,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    color: 'var(--t4)',
    fontSize: 12,
    fontFamily: 'var(--font)',
  },
  item: {
    padding: '10px 12px',
    borderRadius: 8,
    background: 'var(--bg-2)',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'opacity 0.2s',
  },
  itemTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--t1)',
    fontFamily: 'var(--font)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
  },
  itemTime: {
    fontSize: 10,
    color: 'var(--t4)',
    fontFamily: 'var(--mono)',
    flexShrink: 0,
  },
  itemBody: {
    fontSize: 11,
    color: 'var(--t3)',
    fontFamily: 'var(--font)',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  itemType: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 9,
    fontWeight: 500,
    color: 'var(--t4)',
    fontFamily: 'var(--mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  typeDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    flexShrink: 0,
  },
}
