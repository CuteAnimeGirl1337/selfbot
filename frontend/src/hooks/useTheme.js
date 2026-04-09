import { useState, useEffect, useCallback } from 'react'

const THEMES = {
  midnight: {
    name: 'Midnight',
    '--bg-0': '#08080a', '--bg-1': '#0e0e12', '--bg-2': '#141418',
    '--bg-3': '#1a1a20', '--bg-4': '#222228',
    '--accent': '#6366f1', '--accent-h': '#818cf8',
    '--green': '#22c55e', '--red': '#ef4444', '--amber': '#f59e0b',
    '--purple': '#a78bfa', '--cyan': '#22d3ee',
    '--glow': 'rgba(99,102,241,.12)', '--accent-soft': 'rgba(99,102,241,.08)',
  },
  ocean: {
    name: 'Ocean',
    '--bg-0': '#0a0e14', '--bg-1': '#0d1520', '--bg-2': '#111d2b',
    '--bg-3': '#162336', '--bg-4': '#1c2d42',
    '--accent': '#0ea5e9', '--accent-h': '#38bdf8',
    '--green': '#10b981', '--red': '#f43f5e', '--amber': '#f59e0b',
    '--purple': '#8b5cf6', '--cyan': '#06b6d4',
    '--glow': 'rgba(14,165,233,.12)', '--accent-soft': 'rgba(14,165,233,.08)',
  },
  rose: {
    name: 'Rose',
    '--bg-0': '#0c0a0b', '--bg-1': '#141012', '--bg-2': '#1c1618',
    '--bg-3': '#241c1f', '--bg-4': '#2e2326',
    '--accent': '#f43f5e', '--accent-h': '#fb7185',
    '--green': '#34d399', '--red': '#ef4444', '--amber': '#fbbf24',
    '--purple': '#c084fc', '--cyan': '#22d3ee',
    '--glow': 'rgba(244,63,94,.12)', '--accent-soft': 'rgba(244,63,94,.08)',
  },
  emerald: {
    name: 'Emerald',
    '--bg-0': '#080a09', '--bg-1': '#0c110e', '--bg-2': '#111814',
    '--bg-3': '#172019', '--bg-4': '#1e2a21',
    '--accent': '#10b981', '--accent-h': '#34d399',
    '--green': '#22c55e', '--red': '#ef4444', '--amber': '#f59e0b',
    '--purple': '#a78bfa', '--cyan': '#06b6d4',
    '--glow': 'rgba(16,185,129,.12)', '--accent-soft': 'rgba(16,185,129,.08)',
  },
  sunset: {
    name: 'Sunset',
    '--bg-0': '#0c0808', '--bg-1': '#140e0e', '--bg-2': '#1c1414',
    '--bg-3': '#241a1a', '--bg-4': '#2e2121',
    '--accent': '#f97316', '--accent-h': '#fb923c',
    '--green': '#22c55e', '--red': '#ef4444', '--amber': '#eab308',
    '--purple': '#d946ef', '--cyan': '#06b6d4',
    '--glow': 'rgba(249,115,22,.12)', '--accent-soft': 'rgba(249,115,22,.08)',
  },
  amoled: {
    name: 'AMOLED',
    '--bg-0': '#000000', '--bg-1': '#050505', '--bg-2': '#0a0a0a',
    '--bg-3': '#111111', '--bg-4': '#1a1a1a',
    '--accent': '#6366f1', '--accent-h': '#818cf8',
    '--green': '#22c55e', '--red': '#ef4444', '--amber': '#f59e0b',
    '--purple': '#a78bfa', '--cyan': '#22d3ee',
    '--glow': 'rgba(99,102,241,.12)', '--accent-soft': 'rgba(99,102,241,.08)',
  },
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem('dashboard-theme') || 'midnight'; } catch { return 'midnight'; }
  })

  const applyTheme = useCallback((id) => {
    const t = THEMES[id]
    if (!t) return
    const root = document.documentElement
    Object.entries(t).forEach(([k, v]) => {
      if (k.startsWith('--')) root.style.setProperty(k, v)
    })
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  const setTheme = useCallback((id) => {
    setThemeState(id)
    try { localStorage.setItem('dashboard-theme', id); } catch {}
  }, [])

  return { theme, setTheme, themes: THEMES }
}
