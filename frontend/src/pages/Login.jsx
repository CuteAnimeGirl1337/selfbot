import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Eye, EyeOff, AlertCircle, Loader, Shield } from 'lucide-react'

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
    <div style={s.root}>
      {/* Background grid */}
      <div style={s.gridBg} />
      {/* Ambient orbs */}
      <div style={s.orb1} />
      <div style={s.orb2} />

      <motion.div
        style={s.card}
        initial={{ opacity: 0, y: 30, scale: .96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: .7, ease: [.22, 1, .36, 1] }}
      >
        {/* Icon */}
        <motion.div
          style={s.iconRow}
          initial={{ opacity: 0, scale: .8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: .2, type: 'spring', stiffness: 300 }}
        >
          <div style={s.iconCircle}>
            <Shield size={24} color="#fff" />
          </div>
        </motion.div>

        <motion.h1 style={s.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .25 }}>
          Selfbot Dashboard
        </motion.h1>
        <motion.p style={s.sub} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }}>
          Paste your Discord token to connect
        </motion.p>

        {/* Input */}
        <motion.div style={s.inputGroup} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35 }}>
          <div style={{
            ...s.inputWrap,
            borderColor: error ? 'rgba(251,113,133,.3)' : token ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.06)',
            boxShadow: error ? '0 0 0 3px rgba(251,113,133,.06)' : token ? '0 0 0 3px rgba(99,102,241,.06)' : 'none',
          }}>
            <input
              type={show ? 'text' : 'password'}
              value={token}
              onChange={e => { setToken(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder="Discord token"
              style={s.input}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            <button style={s.eyeBtn} onClick={() => setShow(p => !p)} tabIndex={-1}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div style={s.error} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}

        {/* Button */}
        <motion.button
          style={{ ...s.btn, opacity: loading ? .6 : 1 }}
          onClick={submit}
          disabled={loading}
          whileHover={!loading ? { scale: 1.015, boxShadow: '0 8px 32px rgba(99,102,241,.35)' } : {}}
          whileTap={!loading ? { scale: .98 } : {}}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .4 }}
        >
          {loading ? (
            <><Loader size={16} style={{ animation: 'spin .8s linear infinite' }} /> Connecting...</>
          ) : (
            <><LogIn size={16} /> Connect</>
          )}
        </motion.button>

        {/* Divider */}
        <div style={s.divider}>
          <div style={s.divLine} />
          <span style={s.divText}>how to get your token</span>
          <div style={s.divLine} />
        </div>

        {/* Steps */}
        <motion.div style={s.steps} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}>
          <div style={s.step}><span style={s.stepNum}>1</span> Open Discord in browser, press <kbd style={s.kbd}>F12</kbd></div>
          <div style={s.step}><span style={s.stepNum}>2</span> Go to <kbd style={s.kbd}>Network</kbd> tab, send a message</div>
          <div style={s.step}><span style={s.stepNum}>3</span> Click any request, copy <kbd style={s.kbd}>Authorization</kbd> header</div>
        </motion.div>
      </motion.div>
    </div>
  )
}

const s = {
  root: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#050506', position: 'relative', overflow: 'hidden',
  },
  gridBg: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'linear-gradient(rgba(255,255,255,.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.015) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, black 20%, transparent 70%)',
    WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, black 20%, transparent 70%)',
  },
  orb1: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,.07) 0%, transparent 60%)',
    top: '15%', left: '25%', pointerEvents: 'none', filter: 'blur(60px)',
  },
  orb2: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,.05) 0%, transparent 60%)',
    bottom: '15%', right: '25%', pointerEvents: 'none', filter: 'blur(60px)',
  },

  card: {
    width: 380, position: 'relative', zIndex: 1,
    background: 'rgba(12,12,15,.85)',
    backdropFilter: 'blur(40px) saturate(150%)',
    WebkitBackdropFilter: 'blur(40px) saturate(150%)',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 24, padding: '40px 36px 36px',
    boxShadow: '0 32px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.03)',
    textAlign: 'center',
  },

  iconRow: { display: 'flex', justifyContent: 'center', marginBottom: 24 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 16,
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(99,102,241,.3)',
  },

  title: { fontSize: 22, fontWeight: 700, letterSpacing: '-.4px', color: '#f0f0f2', marginBottom: 6 },
  sub: { fontSize: 14, color: '#5a5a65', marginBottom: 28, lineHeight: 1.4 },

  inputGroup: { marginBottom: 16 },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    background: '#111114', border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 12, overflow: 'hidden', transition: 'border-color .2s, box-shadow .2s',
  },
  input: {
    flex: 1, padding: '14px 16px', background: 'transparent', border: 'none', outline: 'none',
    color: '#f0f0f2', fontSize: 15, fontFamily: 'var(--mono)', letterSpacing: '.3px',
  },
  eyeBtn: {
    background: 'transparent', border: 'none', color: '#3a3a42', padding: '12px 14px',
    cursor: 'pointer', display: 'flex', transition: 'color .15s',
  },

  error: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '10px 14px', marginBottom: 16, borderRadius: 10,
    background: 'rgba(251,113,133,.06)', border: '1px solid rgba(251,113,133,.1)',
    color: '#fb7185', fontSize: 13, fontWeight: 500,
  },

  btn: {
    width: '100%', padding: '14px 0', border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
    color: '#fff', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 4px 20px rgba(99,102,241,.25)',
    transition: 'box-shadow .2s', fontFamily: 'inherit',
  },

  divider: {
    display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 18px',
  },
  divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,.04)' },
  divText: { fontSize: 11, color: '#3a3a42', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' },

  steps: { display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' },
  step: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#5a5a65', lineHeight: 1.4 },
  stepNum: {
    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
    background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#818cf8',
  },
  kbd: {
    background: '#17171b', padding: '1px 7px', borderRadius: 5,
    fontFamily: 'var(--mono)', fontSize: 11, color: '#94949e',
    border: '1px solid rgba(255,255,255,.06)', fontWeight: 600,
  },
}
