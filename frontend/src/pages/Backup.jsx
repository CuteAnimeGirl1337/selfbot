import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Upload, AlertTriangle, Server, FileJson, Settings, Coins } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function Backup({ state, api }) {
  const toast = useToast()
  const fileRef = useRef(null)
  const [importing, setImporting] = useState(false)
  const [selectedGuild, setSelectedGuild] = useState('')

  const openExport = (path) => {
    window.open(path, '_blank')
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await api('/api/import', data)
      toast('Data imported successfully')
    } catch {
      toast('Import failed — invalid JSON')
    }
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const backupGuild = async () => {
    if (!selectedGuild) return toast('Select a server first')
    const res = await api('/api/backup/guild', { guildId: selectedGuild })
    if (res) {
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${selectedGuild}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast('Server backup downloaded')
    }
  }

  const guilds = state?.guilds || []

  const focusStyle = (e) => { e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)'; e.target.style.borderColor = 'rgba(99,102,241,.3)' }
  const blurStyle = (e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'rgba(255,255,255,.04)' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '32px 40px 48px' }}
    >
      <h1 style={s.title}>Backup & Restore</h1>

      {/* Export */}
      <div style={s.panel}>
        <h2 style={s.sectionHeader}>
          <Download size={14} style={{ marginRight: 8, opacity: 0.5 }} />
          EXPORT DATA
        </h2>
        <div style={s.btnGrid}>
          <button onClick={() => openExport('/api/export/all')} style={s.exportBtn}>
            <FileJson size={18} color="#818cf8" />
            <span style={s.exportLabel}>Export All Data</span>
            <span style={s.exportSub}>Full backup — settings, economy, etc.</span>
          </button>
          <button onClick={() => openExport('/api/export/economy')} style={s.exportBtn}>
            <Coins size={18} color="#818cf8" />
            <span style={s.exportLabel}>Export Economy</span>
            <span style={s.exportSub}>Balances, inventory, transactions</span>
          </button>
          <button onClick={() => openExport('/api/export/settings')} style={s.exportBtn}>
            <Settings size={18} color="#818cf8" />
            <span style={s.exportLabel}>Export Settings</span>
            <span style={s.exportSub}>Config, preferences, modules</span>
          </button>
        </div>
      </div>

      {/* Import */}
      <div style={s.panel}>
        <h2 style={s.sectionHeader}>
          <Upload size={14} style={{ marginRight: 8, opacity: 0.5 }} />
          IMPORT DATA
        </h2>
        <div style={s.warning}>
          <AlertTriangle size={14} style={{ flexShrink: 0, color: '#fbbf24' }} />
          <span>Importing will overwrite existing data. Make sure to export a backup first.</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          style={s.importBtn}
        >
          <Upload size={14} />
          {importing ? 'Importing...' : 'Select JSON File'}
        </button>
      </div>

      {/* Server Backup */}
      <div style={s.panel}>
        <h2 style={s.sectionHeader}>
          <Server size={14} style={{ marginRight: 8, opacity: 0.5 }} />
          SERVER BACKUP
        </h2>
        <p style={s.desc}>
          Backup a server's roles, channels, and emojis info to JSON.
        </p>
        <div style={s.guildRow}>
          <select
            value={selectedGuild}
            onChange={e => setSelectedGuild(e.target.value)}
            style={s.select}
            onFocus={focusStyle}
            onBlur={blurStyle}
          >
            <option value="">Select a server...</option>
            {guilds.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <button onClick={backupGuild} style={s.backupBtn}>
            <Download size={14} /> Backup Server
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const s = {
  title: {
    fontSize: 28, fontWeight: 700, letterSpacing: '-.6px',
    color: '#f0f0f2', marginBottom: 28,
  },
  panel: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, padding: '22px 26px', marginBottom: 22,
  },
  sectionHeader: {
    fontSize: 12, fontWeight: 700, color: '#3a3a42',
    textTransform: 'uppercase', letterSpacing: '.8px',
    marginBottom: 18, display: 'flex', alignItems: 'center',
  },
  btnGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  exportBtn: {
    background: '#17171b', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: 4, textAlign: 'left',
    transition: 'border-color .15s, background .15s',
  },
  exportLabel: {
    fontSize: 13, fontWeight: 600, color: '#f0f0f2', marginTop: 6,
  },
  exportSub: {
    fontSize: 11, color: '#5a5a65', lineHeight: 1.3,
  },
  warning: {
    background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.15)',
    borderRadius: 12, padding: '12px 16px', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 12, color: '#fbbf24',
  },
  importBtn: {
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff',
    border: 'none', borderRadius: 10, padding: '10px 20px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    boxShadow: '0 2px 12px rgba(99,102,241,.25)',
  },
  desc: {
    fontSize: 13, color: '#5a5a65', margin: '0 0 16px',
  },
  guildRow: {
    display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
  },
  select: {
    background: '#17171b', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, padding: '10px 14px', color: '#f0f0f2',
    fontSize: 13, outline: 'none', minWidth: 220,
    transition: 'box-shadow .2s, border-color .2s',
  },
  backupBtn: {
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff',
    border: 'none', borderRadius: 10, padding: '10px 20px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    boxShadow: '0 2px 12px rgba(99,102,241,.25)',
  },
}
