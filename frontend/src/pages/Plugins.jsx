import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Puzzle, RefreshCw, Info, Package } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function Plugins({ api }) {
  const toast = useToast()
  const [plugins, setPlugins] = useState([])
  const [loading, setLoading] = useState(false)

  const fetch_ = useCallback(async () => {
    const res = await api('/api/plugins')
    if (Array.isArray(res)) setPlugins(res)
  }, [api])

  useEffect(() => { fetch_() }, [fetch_])

  const reload = async () => {
    setLoading(true)
    await api('/api/plugins/reload', {})
    toast('Plugins reloaded')
    await fetch_()
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '32px 40px 48px' }}
    >
      <div style={s.header}>
        <h1 style={s.title}>Plugins</h1>
        <button onClick={reload} disabled={loading} style={s.reloadBtn}>
          <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          Reload All
        </button>
      </div>

      <div style={s.infoBar}>
        <Info size={14} style={{ flexShrink: 0, color: '#818cf8' }} />
        <span>
          Place plugin files in the <code style={s.code}>plugins/</code> folder
          and click Reload to load them. {plugins.length} plugin{plugins.length !== 1 ? 's' : ''} loaded.
        </span>
      </div>

      <div style={s.grid}>
        {plugins.length === 0 && (
          <div style={s.emptyPanel}>
            <Package size={32} color="#3a3a42" />
            <p style={s.emptyText}>No plugins loaded</p>
          </div>
        )}
        {plugins.map((p, i) => (
          <motion.div
            key={p.name || i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={s.card}
          >
            <div style={s.cardIcon}>
              <Puzzle size={18} color="#818cf8" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={s.pluginName}>{p.name}</h3>
              {p.description && (
                <p style={s.pluginDesc}>{p.description}</p>
              )}
              {p.version && (
                <span style={s.versionBadge}>v{p.version}</span>
              )}
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: p.enabled !== false ? '#34d399' : '#3a3a42',
              flexShrink: 0,
            }} />
          </motion.div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </motion.div>
  )
}

const s = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 28, fontWeight: 700, letterSpacing: '-.6px',
    color: '#f0f0f2', margin: 0,
  },
  reloadBtn: {
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff',
    border: 'none', borderRadius: 10, padding: '10px 18px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    boxShadow: '0 2px 12px rgba(99,102,241,.25)',
  },
  infoBar: {
    background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.12)',
    borderRadius: 12, padding: '13px 18px', marginBottom: 22,
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13, color: '#94949e',
  },
  code: {
    fontFamily: 'monospace', background: 'rgba(255,255,255,.04)',
    padding: '2px 7px', borderRadius: 6, fontSize: 12, color: '#f0f0f2',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
  },
  card: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, padding: '18px 20px',
    display: 'flex', alignItems: 'flex-start', gap: 14,
  },
  cardIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: 'rgba(99,102,241,.08)',
    border: '1px solid rgba(99,102,241,.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  pluginName: {
    fontSize: 14, fontWeight: 600, color: '#f0f0f2', margin: 0,
  },
  pluginDesc: {
    fontSize: 12, color: '#5a5a65', margin: '4px 0 0',
    lineHeight: 1.4,
  },
  versionBadge: {
    fontSize: 10, fontWeight: 600, color: '#3a3a42',
    background: 'rgba(255,255,255,.04)', padding: '2px 7px',
    borderRadius: 6, marginTop: 6, display: 'inline-block',
    fontFamily: 'monospace',
  },
  emptyPanel: {
    gridColumn: '1 / -1', textAlign: 'center', padding: '52px 0',
  },
  emptyText: {
    fontSize: 14, color: '#3a3a42', marginTop: 12,
  },
}
