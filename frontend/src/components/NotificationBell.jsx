import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Info, Crosshair, Zap, Eye, CheckCheck } from 'lucide-react'

const TYPE_CONFIG = {
  log:     { icon: Info,      color: 'var(--accent)' },
  info:    { icon: Info,      color: 'var(--accent)' },
  snipe:   { icon: Crosshair, color: 'var(--amber)' },
  alert:   { icon: Bell,      color: 'var(--red)' },
  command: { icon: Zap,       color: 'var(--green)' },
  spy:     { icon: Eye,       color: '#c084fc' },
}

const DEFAULT_CONFIG = { icon: Info, color: 'var(--t3)' }
const MAX_NOTIFICATIONS = 50

function relativeTime(ts) {
  if (!ts) return 'just now'
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

let idCounter = 0

export default function NotificationBell({ logs = [], alerts = [], state }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(new Set())
  const panelRef = useRef(null)
  const buttonRef = useRef(null)
  const prevLogsLen = useRef(0)
  const prevAlertsLen = useRef(0)
  const timeRef = useRef(null)

  // Ingest new logs
  useEffect(() => {
    if (logs.length > prevLogsLen.current) {
      const newItems = logs.slice(prevLogsLen.current).map(l => ({
        id: ++idCounter,
        type: l.type || 'log',
        message: l.message || '',
        timestamp: l.timestamp || Date.now(),
      }))
      setNotifications(prev =>
        [...newItems.reverse(), ...prev].slice(0, MAX_NOTIFICATIONS)
      )
    }
    prevLogsLen.current = logs.length
  }, [logs])

  // Ingest new alerts
  useEffect(() => {
    if (alerts.length > prevAlertsLen.current) {
      const newItems = alerts.slice(prevAlertsLen.current).map(a => ({
        id: ++idCounter,
        type: a.type || 'alert',
        message: a.message || '',
        timestamp: a.timestamp || Date.now(),
      }))
      setNotifications(prev =>
        [...newItems.reverse(), ...prev].slice(0, MAX_NOTIFICATIONS)
      )
    }
    prevAlertsLen.current = alerts.length
  }, [alerts])

  // Update relative times every 30s
  useEffect(() => {
    timeRef.current = setInterval(() => {
      // Force re-render for relative time updates
      setNotifications(prev => [...prev])
    }, 30000)
    return () => clearInterval(timeRef.current)
  }, [])

  // Close on outside click
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

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const markAllRead = useCallback(() => {
    setReadIds(new Set(notifications.map(n => n.id)))
  }, [notifications])

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
          {unreadCount > 0 && (
            <motion.span
              style={styles.badge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              key="badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            style={styles.panel}
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Header */}
            <div style={styles.header}>
              <span style={styles.title}>
                Notifications
                {unreadCount > 0 && (
                  <span style={styles.titleCount}>{unreadCount}</span>
                )}
              </span>
              {notifications.length > 0 && unreadCount > 0 && (
                <button
                  style={styles.markReadBtn}
                  onClick={markAllRead}
                  title="Mark all read"
                >
                  <CheckCheck size={12} />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notification list */}
            <div style={styles.list}>
              {notifications.length === 0 ? (
                <div style={styles.empty}>
                  <Bell size={28} style={{ color: 'var(--t4)', marginBottom: 8, opacity: 0.4 }} />
                  <span>No notifications</span>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => {
                    const cfg = TYPE_CONFIG[n.type] || DEFAULT_CONFIG
                    const Icon = cfg.icon
                    const isRead = readIds.has(n.id)
                    return (
                      <motion.div
                        key={n.id}
                        style={{
                          ...styles.item,
                          opacity: isRead ? 0.45 : 1,
                        }}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: isRead ? 0.45 : 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                          if (!isRead) setReadIds(prev => new Set([...prev, n.id]))
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-3)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-2)'
                        }}
                      >
                        <div style={styles.itemRow}>
                          <div style={{ ...styles.iconWrap, color: cfg.color }}>
                            <Icon size={14} />
                          </div>
                          <div style={styles.itemContent}>
                            <div style={styles.itemMessage}>
                              {n.message.length > 100 ? n.message.slice(0, 100) + '...' : n.message}
                            </div>
                            <div style={styles.itemMeta}>
                              <span style={{ ...styles.typeBadge, color: cfg.color }}>
                                {n.type}
                              </span>
                              <span style={styles.itemTime}>{relativeTime(n.timestamp)}</span>
                            </div>
                          </div>
                          {!isRead && <span style={styles.unreadDot} />}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
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
    border: '1px solid rgba(255,255,255,.06)',
    background: 'var(--bg-2)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    padding: '0 4px',
    borderRadius: 999,
    background: 'var(--red)',
    color: '#fff',
    fontSize: 9,
    fontWeight: 700,
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
    width: 360,
    maxHeight: 400,
    background: 'var(--bg-1)',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 16px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.02)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transformOrigin: 'top right',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,.06)',
    flexShrink: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--t1)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  titleCount: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--red)',
    background: 'rgba(239,68,68,0.12)',
    padding: '1px 6px',
    borderRadius: 6,
  },
  markReadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    fontSize: 10,
    fontWeight: 500,
    color: 'var(--t3)',
    background: 'var(--bg-2)',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'color 0.15s, background 0.15s',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: 6,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 16px',
    color: 'var(--t4)',
    fontSize: 12,
  },
  item: {
    padding: '10px 12px',
    borderRadius: 10,
    background: 'var(--bg-2)',
    cursor: 'pointer',
    marginBottom: 3,
    transition: 'background 0.12s, opacity 0.2s',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    flexShrink: 0,
    marginTop: 2,
    opacity: 0.85,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemMessage: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--t1)',
    lineHeight: 1.4,
    marginBottom: 4,
    wordBreak: 'break-word',
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  itemTime: {
    fontSize: 10,
    color: 'var(--t4)',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent)',
    flexShrink: 0,
    marginTop: 6,
  },
}
