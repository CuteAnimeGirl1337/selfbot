import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Terminal as TermIcon, Send, ChevronDown, Zap, Hash, AlertCircle } from 'lucide-react'

export default function TerminalPage({ api, state }) {
  const toast = useToast()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [cmdHistory, setCmdHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [channels, setChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [showChannels, setShowChannels] = useState(false)
  const [running, setRunning] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const channelRef = useRef(null)

  const prefix = state?.config?.prefix || '!'

  useEffect(() => {
    api('/api/commands/channels').then(r => {
      if (Array.isArray(r)) setChannels(r)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  // Close channel dropdown on outside click
  useEffect(() => {
    if (!showChannels) return
    const handler = (e) => { if (channelRef.current && !channelRef.current.contains(e.target)) setShowChannels(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showChannels])

  const run = useCallback(async () => {
    const cmd = input.trim()
    if (!cmd) return

    setCmdHistory(prev => [cmd, ...prev].slice(0, 50))
    setHistoryIndex(-1)
    setInput('')
    setRunning(true)

    // Add command to history
    setHistory(prev => [...prev, { type: 'cmd', text: cmd, time: Date.now() }])

    try {
      const body = { command: cmd }
      if (selectedChannel) body.channelId = selectedChannel.id

      const res = await api('/api/commands/run', body)

      if (res.error) {
        setHistory(prev => [...prev, { type: 'error', text: res.error, time: Date.now() }])
      } else if (res.responses) {
        for (const r of res.responses) {
          setHistory(prev => [...prev, {
            type: r.isError ? 'error' : 'response',
            text: r.content,
            time: r.timestamp,
            edited: r.edited,
          }])
        }
        if (res.mode === 'channel') {
          setHistory(prev => [...prev, { type: 'info', text: `Executed in ${selectedChannel?.name || 'channel'}`, time: Date.now() }])
        }
      }
    } catch (e) {
      setHistory(prev => [...prev, { type: 'error', text: `Failed: ${e.message}`, time: Date.now() }])
    }

    setRunning(false)
    inputRef.current?.focus()
  }, [input, selectedChannel, api])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      run()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(historyIndex + 1, cmdHistory.length - 1)
      setHistoryIndex(next)
      if (cmdHistory[next]) setInput(cmdHistory[next])
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = historyIndex - 1
      if (next < 0) { setHistoryIndex(-1); setInput(''); }
      else { setHistoryIndex(next); setInput(cmdHistory[next] || ''); }
    }
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setHistory([])
    }
  }

  const formatText = (text) => {
    if (!text) return ''
    let safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    return safe
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
      .replace(/`([^`]+)`/g, '<code style="background:var(--bg-3);padding:1px 5px;border-radius:3px;font-family:var(--mono);font-size:12px">$1</code>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-2.5">
          <TermIcon size={18} className="text-accent" />
          <h1 className="text-lg font-bold tracking-tight">Terminal</h1>
          <span className="text-[10px] font-mono text-t4 bg-bg-3 px-2 py-0.5 rounded-[5px] font-semibold">{history.filter(h => h.type === 'cmd').length} commands</span>
        </div>

        {/* Channel selector */}
        <div className="relative" ref={channelRef}>
          <button
            onClick={() => setShowChannels(p => !p)}
            className="flex items-center gap-1.5 px-3 py-[7px] bg-bg-3 border border-white/[0.04] rounded-lg text-t2 text-xs font-medium cursor-pointer transition-all duration-150"
            style={{ fontFamily: 'var(--font)' }}
          >
            {selectedChannel ? (
              <><Hash size={12} /> {selectedChannel.name} <span className="text-[10px] text-t4">{selectedChannel.guild}</span></>
            ) : (
              <><Zap size={12} /> Virtual Mode</>
            )}
            <ChevronDown size={12} />
          </button>

          <AnimatePresence>
            {showChannels && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: .98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: .98 }}
                transition={{ duration: .15 }}
                className="absolute top-full right-0 mt-1 w-[260px] max-h-[300px] overflow-y-auto bg-bg-2 border border-white/[0.08] rounded-[10px] z-50 p-1"
                style={{ boxShadow: 'var(--shadow-lg)' }}
              >
                <button
                  className={`flex items-center gap-1.5 w-full px-2.5 py-[7px] rounded-md border-none bg-transparent text-xs font-medium cursor-pointer text-left transition-colors duration-100 ${!selectedChannel ? 'text-accent' : 'text-t2'}`}
                  style={{ fontFamily: 'var(--font)' }}
                  onClick={() => { setSelectedChannel(null); setShowChannels(false); }}
                >
                  <Zap size={12} /> Virtual Mode
                  {!selectedChannel && <span className="w-[5px] h-[5px] rounded-full bg-accent ml-auto shrink-0" />}
                </button>
                <div className="h-px bg-white/[0.04] mx-2 my-1" />
                {channels.map(ch => (
                  <button
                    key={ch.id}
                    className={`flex items-center gap-1.5 w-full px-2.5 py-[7px] rounded-md border-none bg-transparent text-xs font-medium cursor-pointer text-left transition-colors duration-100 ${selectedChannel?.id === ch.id ? 'text-accent' : 'text-t2'}`}
                    style={{ fontFamily: 'var(--font)' }}
                    onClick={() => { setSelectedChannel(ch); setShowChannels(false); }}
                  >
                    <Hash size={11} /> {ch.name}
                    <span className="ml-auto text-[10px] text-t4">{ch.guild}</span>
                    {selectedChannel?.id === ch.id && <span className="w-[5px] h-[5px] rounded-full bg-accent ml-auto shrink-0" />}
                  </button>
                ))}
                {channels.length === 0 && <div className="p-4 text-center text-t4 text-xs">No channels available</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Output area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-bg-0">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <TermIcon size={32} className="text-t5" />
            <p className="text-base font-semibold text-t3 mt-1">Command Runner</p>
            <p className="text-[13px] text-t4 leading-relaxed max-w-[360px]">
              Type commands to run them directly from the dashboard.<br />
              <b>Virtual mode</b> runs instantly without Discord.<br />
              <b>Channel mode</b> sends to a real channel.
            </p>
            <div className="flex gap-4 mt-3">
              <span><kbd className="bg-bg-3 px-[7px] py-0.5 rounded font-mono text-[10px] text-t2 border border-white/[0.04] font-semibold mr-1">Enter</kbd> Run</span>
              <span><kbd className="bg-bg-3 px-[7px] py-0.5 rounded font-mono text-[10px] text-t2 border border-white/[0.04] font-semibold mr-1">&uarr;&darr;</kbd> History</span>
              <span><kbd className="bg-bg-3 px-[7px] py-0.5 rounded font-mono text-[10px] text-t2 border border-white/[0.04] font-semibold mr-1">Ctrl+L</kbd> Clear</span>
            </div>
          </div>
        )}

        {history.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .15 }}
            className="mb-1.5"
          >
            {entry.type === 'cmd' && (
              <div className="flex items-center font-mono text-[13px] py-1">
                <span className="text-accent font-bold mr-0.5">{prefix}</span>
                <span className="text-t1 font-medium">{entry.text.startsWith(prefix) ? entry.text.slice(prefix.length) : entry.text}</span>
              </div>
            )}
            {entry.type === 'response' && (
              <div className="font-mono text-[13px] text-t2 leading-relaxed py-1 pl-4 border-l-2 border-bg-4 break-words" dangerouslySetInnerHTML={{ __html: formatText(entry.text) }} />
            )}
            {entry.type === 'error' && (
              <div className="flex items-center gap-1.5 font-mono text-xs text-red py-1 pl-4 border-l-2 border-red/20">
                <AlertCircle size={13} />
                <span>{entry.text}</span>
              </div>
            )}
            {entry.type === 'info' && (
              <div className="font-mono text-[11px] text-t4 py-0.5 pl-4 italic">{entry.text}</div>
            )}
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-6 pt-3 pb-4 border-t border-white/[0.04] bg-bg-1 shrink-0">
        <div className="flex items-center bg-bg-3 border border-white/[0.04] rounded-[10px] overflow-hidden transition-[border-color,box-shadow] duration-200">
          <span className="pl-3.5 pr-1 font-mono text-sm font-bold text-accent">{prefix}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedChannel ? `Run in ${selectedChannel.name}...` : 'Type a command...'}
            className="flex-1 px-2 py-3 bg-transparent border-none outline-none text-t1 text-sm font-mono"
            autoFocus
            spellCheck={false}
          />
          <button
            onClick={run}
            disabled={running || !input.trim()}
            className={`px-3.5 py-2.5 bg-transparent border-none text-accent cursor-pointer flex transition-opacity duration-150 ${running || !input.trim() ? 'opacity-30' : 'opacity-100'}`}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
