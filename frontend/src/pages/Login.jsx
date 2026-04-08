import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Eye, EyeOff, AlertCircle, Loader } from 'lucide-react'

export default function Login({ onLogin }) {
  const [token, setToken] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const t = token.trim()
    if (!t) return setError('Enter your Discord token')
    if (t.length < 20) return setError('Token is too short')
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
      })
      const data = await res.json()
      if (data.ok && data.user) onLogin(data.user)
      else setError(data.error || 'Login failed')
    } catch { setError('Connection failed') }
    setLoading(false)
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-bg-0 relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none top-[20%] left-[15%]" style={{ background: 'radial-gradient(circle, rgba(99,102,241,.05) 0%, transparent 65%)', filter: 'blur(40px)' }} />
      <div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none bottom-[10%] right-[20%]" style={{ background: 'radial-gradient(circle, rgba(124,58,237,.04) 0%, transparent 65%)', filter: 'blur(40px)' }} />
      <div className="absolute w-[300px] h-[300px] rounded-full pointer-events-none top-[60%] left-[60%]" style={{ background: 'radial-gradient(circle, rgba(34,211,238,.03) 0%, transparent 65%)', filter: 'blur(40px)' }} />

      <motion.div
        className="w-[400px] relative z-[1] border border-white/[0.04] rounded-[20px] px-9 py-10"
        style={{
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          boxShadow: '0 24px 80px rgba(0,0,0,.4), 0 0 1px rgba(255,255,255,.05) inset',
        }}
        initial={{ opacity: 0, y: 24, scale: .97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: .6, ease: [.22, 1, .36, 1] }}
      >
        {/* Brand */}
        <motion.div
          className="flex items-center gap-2.5 mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .15 }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)', boxShadow: '0 4px 12px rgba(99,102,241,.25)' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
          </div>
          <span className="text-[15px] font-bold text-t2 tracking-tight">Selfbot</span>
        </motion.div>

        <motion.h1
          className="text-[28px] font-bold tracking-tight text-t1 leading-none"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .2 }}
        >
          Welcome back
        </motion.h1>
        <motion.p
          className="text-sm text-t3 mt-2 mb-8 leading-snug"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: .25 }}
        >
          Enter your Discord token to continue
        </motion.p>

        {/* Input */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .3 }}
        >
          <label className="block text-xs font-semibold text-t2 mb-2 tracking-wide">Token</label>
          <div className={`flex items-center bg-bg-3 border rounded-[10px] overflow-hidden transition-[border-color,box-shadow] duration-200 ${error ? 'border-red/30 shadow-[0_0_0_3px_rgba(251,113,133,.08)]' : 'border-white/[0.04]'}`}>
            <input
              type={show ? 'text' : 'password'}
              value={token}
              onChange={e => { setToken(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              placeholder="Paste your token here"
              className="flex-1 px-3.5 py-[13px] bg-transparent border-none outline-none text-t1 text-sm font-mono tracking-wide"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            <button className="bg-transparent border-none text-t4 px-3.5 py-3 cursor-pointer flex transition-colors duration-150" onClick={() => setShow(p => !p)} type="button" tabIndex={-1}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            className="flex items-center gap-[7px] px-[13px] py-2.5 mb-4 border border-red/[0.12] rounded-[9px] text-red text-[13px] font-medium"
            style={{ background: 'var(--red-soft)' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <AlertCircle size={13} />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Button */}
        <motion.button
          className={`w-full py-[13px] border-none rounded-[10px] text-white text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-shadow duration-200 mb-6 ${loading ? 'opacity-60' : 'opacity-100'}`}
          style={{
            background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
            boxShadow: '0 4px 16px rgba(99,102,241,.2)',
            fontFamily: 'var(--font)',
          }}
          onClick={submit}
          disabled={loading}
          whileHover={{ scale: 1.01, boxShadow: '0 6px 24px rgba(99,102,241,.3)' }}
          whileTap={{ scale: .98 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .35 }}
        >
          {loading ? (
            <><Loader size={15} style={{ animation: 'spin .8s linear infinite' }} /> Connecting...</>
          ) : (
            <><LogIn size={15} /> Continue</>
          )}
        </motion.button>

        {/* Help */}
        <motion.div
          className="border-t border-white/[0.04] pt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: .45 }}
        >
          <details className="cursor-pointer">
            <summary className="text-xs font-semibold text-t3 list-none flex items-center gap-1.5">How to find your token</summary>
            <ol className="text-xs text-t4 leading-8 pl-5 mt-2.5">
              <li>Open Discord in your browser</li>
              <li>Press <kbd className="bg-bg-4 px-[7px] py-px rounded-[5px] font-mono text-[11px] text-t2 border border-white/[0.04] font-medium">F12</kbd> → Network tab</li>
              <li>Send any message, click a request to discord.com</li>
              <li>Copy the <kbd className="bg-bg-4 px-[7px] py-px rounded-[5px] font-mono text-[11px] text-t2 border border-white/[0.04] font-medium">Authorization</kbd> header value</li>
            </ol>
          </details>
        </motion.div>
      </motion.div>
    </div>
  )
}
