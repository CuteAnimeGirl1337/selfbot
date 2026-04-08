import { useEffect } from 'react'

const PAGE_SHORTCUTS = {
  '1': 'overview',
  '2': 'discord',
  '3': 'live',
  '4': 'commands',
  '5': 'gambling',
  '6': 'tracker',
  '7': 'alerts',
  '8': 'analytics',
  '9': 'archive',
}

export function useKeyboard({ onTogglePalette, onNavigate }) {
  useEffect(() => {
    const handler = (e) => {
      // Don't capture when typing in inputs
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape') e.target.blur()
        return
      }

      // Ctrl+K or Cmd+K → Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        onTogglePalette()
        return
      }

      // Alt+Number → Navigate to page
      if (e.altKey && PAGE_SHORTCUTS[e.key]) {
        e.preventDefault()
        onNavigate(PAGE_SHORTCUTS[e.key])
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onTogglePalette, onNavigate])
}
