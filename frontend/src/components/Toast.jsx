import { useState, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Ctx = createContext()

export function useToast() { return useContext(Ctx) }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500)
  }, [])

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div style={styles.container}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: .95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: .95 }}
              transition={{ duration: .2 }}
              style={styles.toast}
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    alignItems: 'center',
  },
  toast: {
    background: 'var(--bg-4)',
    color: 'var(--t1)',
    padding: '10px 20px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid var(--border-h)',
    boxShadow: '0 12px 40px rgba(0,0,0,.5)',
    whiteSpace: 'nowrap',
  },
}
