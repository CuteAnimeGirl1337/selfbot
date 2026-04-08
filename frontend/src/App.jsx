import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from './hooks/useSocket'
import { useTheme } from './hooks/useTheme'
import { useNotifications } from './hooks/useNotifications'
import { useKeyboard } from './hooks/useKeyboard'
import { ToastProvider } from './components/Toast'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import CommandPalette from './components/CommandPalette'
import NotificationCenter from './components/NotificationCenter'
import StatusBar from './components/StatusBar'
import Login from './pages/Login'
import Overview from './pages/Overview'

// Lazy load all other pages — only loaded when first navigated to
const Discord = lazy(() => import('./pages/Discord'))
const LiveFeed = lazy(() => import('./pages/LiveFeed'))
const TerminalPage = lazy(() => import('./pages/Terminal'))
const Commands = lazy(() => import('./pages/Commands'))
const Gambling = lazy(() => import('./pages/Gambling'))
const Macros = lazy(() => import('./pages/Macros'))
const Scheduler = lazy(() => import('./pages/Scheduler'))
const Logger = lazy(() => import('./pages/Logger'))
const Spy = lazy(() => import('./pages/Spy'))
const Tracker = lazy(() => import('./pages/Tracker'))
const Alerts = lazy(() => import('./pages/Alerts'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Archive = lazy(() => import('./pages/Archive'))
const AutoMod = lazy(() => import('./pages/AutoMod'))
const DMs = lazy(() => import('./pages/DMs'))
const Channels = lazy(() => import('./pages/Channels'))
const Webhooks = lazy(() => import('./pages/Webhooks'))
const Servers = lazy(() => import('./pages/Servers'))
const Plugins = lazy(() => import('./pages/Plugins'))
const Backup = lazy(() => import('./pages/Backup'))
const Account = lazy(() => import('./pages/Account'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const Console = lazy(() => import('./pages/Console'))

function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '28px 36px' }}
    >
      <div className="skeleton" style={{ height: 32, width: 160, borderRadius: 8, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        <div className="skeleton" style={{ height: 80, borderRadius: 14 }} />
        <div className="skeleton" style={{ height: 80, borderRadius: 14 }} />
        <div className="skeleton" style={{ height: 80, borderRadius: 14 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
      </div>
    </motion.div>
  )
}

function AppInner() {
  const [page, setPage] = useState('overview')
  const [loginState, setLoginState] = useState('checking')
  const [paletteOpen, setPaletteOpen] = useState(false)

  const { state, logs, snipes, editSnipes, spyLog, feed, discordEvents, lastCmd, connected, api, fetchSnipes, fetchLogs } = useSocket()
  const { theme, setTheme, themes } = useTheme()
  const { notifications, unreadCount, clearNotification, clearAll } = useNotifications(feed, discordEvents)

  const navigate = useCallback((pageId) => {
    setPage(pageId)
    setPaletteOpen(false)
  }, [])

  useKeyboard({
    onTogglePalette: useCallback(() => setPaletteOpen(p => !p), []),
    onNavigate: navigate,
  })

  // Login flow
  useEffect(() => {
    fetch('/api/login/status')
      .then(r => r.json())
      .then(data => setLoginState(data.loggedIn ? 'ready' : data.hasToken ? 'checking' : 'login'))
      .catch(() => setLoginState('login'))
  }, [])

  useEffect(() => {
    if (state?.user && loginState !== 'ready') setLoginState('ready')
  }, [state?.user])

  useEffect(() => {
    if (loginState === 'checking') {
      const interval = setInterval(() => {
        fetch('/api/login/status')
          .then(r => r.json())
          .then(data => {
            if (data.loggedIn) setLoginState('ready')
            else if (!data.hasToken) setLoginState('login')
          })
          .catch(() => {})
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [loginState])

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    window.location.reload()
  }

  const uptime = useMemo(() => {
    if (!state?.stats) return '00:00:00'
    const ms = state.stats.uptime
    const h = String(Math.floor(ms / 36e5)).padStart(2, '0')
    const m = String(Math.floor(ms / 6e4) % 60).padStart(2, '0')
    const s = String(Math.floor(ms / 1e3) % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }, [state?.stats?.uptime])

  const renderPage = () => {
    switch (page) {
      case 'overview': return <Overview state={state} logs={logs} />
      case 'discord': return <Discord state={state} api={api} feed={discordEvents} />
      case 'live': return <LiveFeed feed={feed} />
      case 'terminal': return <TerminalPage api={api} state={state} />
      case 'commands': return <Commands state={state} lastCmd={lastCmd} api={api} />
      case 'gambling': return <Gambling state={state} api={api} />
      case 'macros': return <Macros api={api} />
      case 'scheduler': return <Scheduler api={api} />
      case 'logger': return <Logger snipes={snipes} editSnipes={editSnipes} fetchSnipes={fetchSnipes} api={api} />
      case 'spy': return <Spy api={api} spyLog={spyLog} />
      case 'tracker': return <Tracker api={api} />
      case 'alerts': return <Alerts api={api} />
      case 'analytics': return <Analytics api={api} />
      case 'archive': return <Archive api={api} />
      case 'automod': return <AutoMod api={api} />
      case 'dms': return <DMs api={api} />
      case 'channels': return <Channels state={state} api={api} />
      case 'webhooks': return <Webhooks state={state} api={api} />
      case 'servers': return <Servers state={state} api={api} />
      case 'plugins': return <Plugins api={api} />
      case 'backup': return <Backup state={state} api={api} />
      case 'account': return <Account state={state} api={api} />
      case 'settings': return <SettingsPage state={state} api={api} theme={theme} setTheme={setTheme} themes={themes} />
      case 'console': return <Console logs={logs} fetchLogs={fetchLogs} />
      default: return null
    }
  }

  // Login screen
  if (loginState === 'login') {
    return (
      <div style={styles.root}>
        <TitleBar />
        <Login onLogin={() => setLoginState('ready')} />
      </div>
    )
  }

  // Loading screen
  if (loginState === 'checking') {
    return (
      <div style={styles.root}>
        <TitleBar />
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span style={{ color: 'var(--t3)', fontSize: 14, marginTop: 12 }}>Connecting to Discord...</span>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Main app
  return (
    <div style={styles.root}>
      <TitleBar
        notifications={unreadCount}
        onNotifications={() => {}}
      />

      <div style={styles.body}>
        <Sidebar
          active={page}
          setActive={navigate}
          user={state?.user}
          uptime={uptime}
          connected={connected}
          onLogout={handleLogout}
        />
        <div style={styles.mainCol}>
          <main style={styles.main}>
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: .2, ease: [.22, 1, .36, 1] }}
                style={{ minHeight: '100%' }}
              >
                <Suspense fallback={<PageLoader />}>
                  {renderPage()}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <NotificationCenter
          notifications={notifications}
          onClear={clearNotification}
          onClearAll={clearAll}
        />
      </div>

      <StatusBar state={state} connected={connected} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigate}
        state={state}
      />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: 'var(--bg-0)',
  },
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    minWidth: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    background: 'var(--bg-0)',
  },
  loading: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 28,
    height: 28,
    border: '3px solid var(--border)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin .8s linear infinite',
  },
}
