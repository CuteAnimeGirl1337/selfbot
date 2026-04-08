import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Activity, Zap, Globe, Clock, Cpu } from 'lucide-react'

function formatUptime(seconds) {
  if (!seconds || seconds < 0) return '0m'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatMemory(bytes) {
  if (!bytes) return null
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`
}

function Dot({ color }) {
  return (
    <motion.span
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        boxShadow: `0 0 6px ${color}40`,
      }}
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

function Divider() {
  return <span style={styles.divider} />
}

function Item({ icon: Icon, children }) {
  return (
    <span style={styles.item}>
      {Icon && <Icon size={11} style={{ opacity: 0.5, flexShrink: 0 }} />}
      {children}
    </span>
  )
}

export default function StatusBar({ state = {}, connected }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const stats = state.stats || {}
  const guilds = state.guilds || []
  const uptime = stats.uptime || state.uptime || 0
  const memory = stats.memory || state.memory
  const msgRate = stats.msgRate ?? stats.messageRate ?? 0
  const commandsRun = stats.commandsRun ?? stats.totalCommands ?? 0

  const timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })

  return (
    <div style={styles.bar}>
      <div style={styles.section}>
        <span style={styles.item}>
          <Dot color={connected ? 'var(--green)' : 'var(--red)'} />
          <span style={{ color: connected ? 'var(--green)' : 'var(--red)' }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </span>
      </div>

      <div style={styles.section}>
        <Item icon={Activity}>{msgRate} msg/min</Item>
        <Divider />
        <Item icon={Zap}>{commandsRun} cmds</Item>
        <Divider />
        <Item icon={Globe}>{guilds.length} guilds</Item>
      </div>

      <div style={styles.section}>
        <Item icon={Clock}>{formatUptime(uptime)}</Item>
        {memory && (
          <>
            <Divider />
            <Item icon={Cpu}>{formatMemory(memory)}</Item>
          </>
        )}
        <Divider />
        <span style={{ ...styles.item, fontVariantNumeric: 'tabular-nums' }}>
          {timeStr}
        </span>
      </div>
    </div>
  )
}

const styles = {
  bar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    background: 'var(--bg-1)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    zIndex: 900,
    userSelect: 'none',
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontFamily: 'var(--mono)',
    color: 'var(--t3)',
    whiteSpace: 'nowrap',
  },
  divider: {
    width: 1,
    height: 12,
    background: 'var(--border)',
    flexShrink: 0,
  },
}
