import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, X, Plus, Link, MessageSquare, Hash } from 'lucide-react'
import { useToast } from '../components/Toast'

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none',
        background: checked ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : '#3a3a42',
        cursor: 'pointer', position: 'relative', padding: 0,
        transition: 'background .2s',
      }}
    >
      <motion.div
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', position: 'absolute', top: 2, left: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        }}
      />
    </button>
  )
}

export default function AutoMod({ api }) {
  const toast = useToast()
  const [words, setWords] = useState([])
  const [newWord, setNewWord] = useState('')
  const [antiSpam, setAntiSpam] = useState(false)
  const [maxMessages, setMaxMessages] = useState('5')
  const [interval, setInterval_] = useState('5000')
  const [antiLink, setAntiLink] = useState(false)
  const [whitelist, setWhitelist] = useState('')
  const [logChannel, setLogChannel] = useState('')

  useEffect(() => {
    (async () => {
      const w = await api('/api/automod/words')
      if (w) setWords(w)
      const spam = await api('/api/automod/antispam')
      if (spam) {
        setAntiSpam(spam.enabled || false)
        setMaxMessages(String(spam.maxMessages || 5))
        setInterval_(String(spam.interval || 5000))
      }
      const link = await api('/api/automod/antilink')
      if (link) {
        setAntiLink(link.enabled || false)
        setWhitelist((link.whitelist || []).join('\n'))
      }
      const log = await api('/api/automod/logchannel')
      if (log) setLogChannel(log.channelId || '')
    })()
  }, [])

  const addWord = async () => {
    if (!newWord.trim()) return
    await api('/api/automod/words', { action: 'add', word: newWord.trim() })
    setWords(prev => [...prev, newWord.trim()])
    setNewWord('')
    toast('Word added')
  }

  const removeWord = async (word) => {
    await api('/api/automod/words', { action: 'remove', word })
    setWords(prev => prev.filter(w => w !== word))
    toast('Word removed')
  }

  const saveAntiSpam = async () => {
    await api('/api/automod/antispam', {
      enabled: antiSpam, maxMessages: parseInt(maxMessages) || 5,
      interval: parseInt(interval) || 5000,
    })
    toast('Anti-spam settings saved')
  }

  const saveAntiLink = async () => {
    await api('/api/automod/antilink', {
      enabled: antiLink,
      whitelist: whitelist.split('\n').map(l => l.trim()).filter(Boolean),
    })
    toast('Anti-link settings saved')
  }

  const saveLogChannel = async () => {
    await api('/api/automod/logchannel', { channelId: logChannel.trim() })
    toast('Log channel saved')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={s.page}
    >
      <h1 style={s.title}>Auto-Mod</h1>

      {/* Banned Words */}
      <div style={s.panel}>
        <h2 style={s.panelTitle}>
          <Shield size={16} style={{ marginRight: 8 }} />
          Banned Words
        </h2>
        <div style={s.wordList}>
          {words.map(w => (
            <span key={w} style={s.wordChip}>
              {w}
              <button onClick={() => removeWord(w)} style={s.chipX}>
                <X size={10} />
              </button>
            </span>
          ))}
          {words.length === 0 && <span style={s.empty}>No banned words</span>}
        </div>
        <div style={s.addRow}>
          <input
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addWord()}
            placeholder="Add a word..."
            style={{ ...s.input, flex: 1 }}
          />
          <button onClick={addWord} style={s.addBtn}>
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Anti-Spam */}
      <div style={s.panel}>
        <h2 style={s.panelTitle}>
          <MessageSquare size={16} style={{ marginRight: 8 }} />
          Anti-Spam
        </h2>
        <div style={s.settingsRow}>
          <span style={s.settingLabel}>Enabled</span>
          <Toggle checked={antiSpam} onChange={() => setAntiSpam(!antiSpam)} />
        </div>
        <div style={s.settingsRow}>
          <span style={s.settingLabel}>Max Messages</span>
          <input
            value={maxMessages}
            onChange={e => setMaxMessages(e.target.value)}
            type="number"
            style={{ ...s.input, width: 80 }}
          />
        </div>
        <div style={s.settingsRow}>
          <span style={s.settingLabel}>Interval (ms)</span>
          <input
            value={interval}
            onChange={e => setInterval_(e.target.value)}
            type="number"
            style={{ ...s.input, width: 100 }}
          />
        </div>
        <button onClick={saveAntiSpam} style={s.saveBtn}>Save</button>
      </div>

      {/* Anti-Link */}
      <div style={s.panel}>
        <h2 style={s.panelTitle}>
          <Link size={16} style={{ marginRight: 8 }} />
          Anti-Link
        </h2>
        <div style={s.settingsRow}>
          <span style={s.settingLabel}>Enabled</span>
          <Toggle checked={antiLink} onChange={() => setAntiLink(!antiLink)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={s.label}>Whitelist (one domain per line)</label>
          <textarea
            value={whitelist}
            onChange={e => setWhitelist(e.target.value)}
            rows={3}
            placeholder={'youtube.com\ndiscord.gg'}
            style={s.textarea}
          />
        </div>
        <button onClick={saveAntiLink} style={s.saveBtn}>Save</button>
      </div>

      {/* Log Channel */}
      <div style={s.panel}>
        <h2 style={s.panelTitle}>
          <Hash size={16} style={{ marginRight: 8 }} />
          Log Channel
        </h2>
        <div style={s.settingsRow}>
          <span style={s.settingLabel}>Channel ID</span>
          <input
            value={logChannel}
            onChange={e => setLogChannel(e.target.value)}
            placeholder="123456789012345678"
            style={{ ...s.input, width: 220 }}
          />
        </div>
        <button onClick={saveLogChannel} style={s.saveBtn}>Save</button>
      </div>
    </motion.div>
  )
}

const s = {
  page: { padding: '32px 40px 48px' },
  title: {
    fontSize: 28, fontWeight: 700, letterSpacing: '-.6px',
    color: '#f0f0f2', marginBottom: 24,
  },
  panel: {
    background: '#0c0c0f', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 16, padding: '20px 24px', marginBottom: 20,
  },
  panelTitle: {
    fontSize: 14, fontWeight: 600, color: '#f0f0f2',
    marginBottom: 16, display: 'flex', alignItems: 'center',
  },
  label: {
    fontSize: 12, fontWeight: 700, color: '#3a3a42',
    textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6,
    display: 'block',
  },
  input: {
    background: '#17171b', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, padding: '10px 14px', color: '#f0f0f2',
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
  },
  textarea: {
    background: '#17171b', border: '1px solid rgba(255,255,255,.04)',
    borderRadius: 10, padding: '10px 14px', color: '#f0f0f2',
    fontSize: 14, fontFamily: 'var(--mono)', outline: 'none',
    width: '100%', resize: 'vertical', boxSizing: 'border-box',
  },
  wordList: {
    display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12,
  },
  wordChip: {
    background: 'rgba(251,113,133,.06)', color: '#fb7185',
    border: '1px solid rgba(251,113,133,.12)', borderRadius: 8,
    padding: '4px 10px', fontSize: 12, fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  chipX: {
    background: 'none', border: 'none', color: '#fb7185',
    cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center',
  },
  addRow: {
    display: 'flex', gap: 8, alignItems: 'center',
  },
  addBtn: {
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', border: 'none',
    borderRadius: 10, width: 38, height: 38, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(99,102,241,.2)',
  },
  settingsRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.03)',
  },
  settingLabel: {
    fontSize: 13, color: '#94949e', fontWeight: 500,
  },
  saveBtn: {
    marginTop: 14, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff',
    border: 'none', borderRadius: 10, padding: '10px 20px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(99,102,241,.2)',
  },
  empty: { fontSize: 12, color: '#3a3a42', fontStyle: 'italic' },
}
