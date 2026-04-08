import { useState, useEffect } from 'react'
import { Minus, Maximize2, Minimize2, X } from 'lucide-react'

export default function TitleBar() {
  const [isElectron, setIsElectron] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    const el = window.electronAPI
    if (!el?.isElectron) return
    setIsElectron(true)
    el.isMaximized?.().then(setMaximized)
    const unsub = el.onWindowState?.((state) => setMaximized(state === 'maximized'))
    return () => unsub?.()
  }, [])

  if (!isElectron) return null

  return (
    <div className="h-[38px] min-h-[38px] bg-bg-1 border-b border-white/[0.04] flex items-stretch z-[200] shrink-0 w-full">
      <div
        className="flex-1 flex items-center gap-[9px] pl-3.5 select-none"
        style={{ WebkitAppRegion: 'drag', appRegion: 'drag' }}
      >
        <div
          className="w-4 h-4 rounded-[5px] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/85" />
        </div>
        <span className="text-[11px] font-semibold text-t4 tracking-wide">Selfbot Dashboard</span>
      </div>
      <div
        className="flex items-stretch shrink-0"
        style={{ WebkitAppRegion: 'no-drag', appRegion: 'no-drag' }}
      >
        {['min', 'max', 'close'].map(id => (
          <button
            key={id}
            className={`w-[46px] border-none cursor-pointer flex items-center justify-center p-0 transition-[background,color] duration-[120ms] ${
              hovered === id
                ? id === 'close' ? 'bg-red/[0.15] text-red' : 'bg-white/[0.05] text-t1'
                : 'bg-transparent text-t4'
            }`}
            onClick={() => window.electronAPI[id === 'min' ? 'minimize' : id === 'max' ? 'maximize' : 'close']()}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
          >
            {id === 'min' && <Minus size={14} strokeWidth={1.5} />}
            {id === 'max' && (maximized ? <Minimize2 size={12} strokeWidth={1.5} /> : <Maximize2 size={12} strokeWidth={1.5} />)}
            {id === 'close' && <X size={15} strokeWidth={1.5} />}
          </button>
        ))}
      </div>
    </div>
  )
}
