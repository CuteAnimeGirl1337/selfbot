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

  const isEmpty = token.trim().length === 0

  return (
    <div style={s.root}>
      {/* Injected keyframes */}
      <style>{keyframes}</style>

      {/* Animated gradient mesh background */}
      <div style={s.gradientMesh} />
      {/* Grid overlay */}
      <div style={s.gridBg} />
      {/* Ambient orbs */}
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.orb3} />

      <motion.div
        style={s.card}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Glow border effect */}
        <div style={s.cardGlow} />

        {/* Shield Icon */}
        <motion.div
          style={s.iconRow}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div style={s.iconCircle}>
            <Shield size={28} color="#fff" />
          </div>
        </motion.div>

        <motion.h1
          style={s.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          Selfbot Dashboard
        </motion.h1>
        <motion.p
          style={s.sub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Authenticate with your Discord token to continue
        </motion.p>

        {/* Token Input */}
        <motion.div
          style={s.inputGroup}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div style={{
            ...s.inputWrap,
            borderColor: error
              ? 'rgba(251,113,133,.35)'
              : token
                ? 'rgba(99,102,241,.3)'
                : 'rgba(255,255,255,.06)',
            boxShadow: error
              ? '0 0 0 3px rgba(251,113,133,.08), 0 0 20px rgba(251,113,133,.05)'
              : token
                ? '0 0 0 3px rgba(99,102,241,.08), 0 0 20px rgba(99,102,241,.05)'
                : 'none',
          }}>
            <input
              type={show ? 'text' : 'password'}
              value={token}
              onChange={e => { setToken(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder="Paste your Discord token"
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
          <motion.div
            style={s.error}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}

        {/* Connect Button */}
        <motion.button
          style={{
            ...s.btn,
            opacity: loading ? 0.6 : isEmpty ? 0.4 : 1,
            cursor: loading || isEmpty ? 'not-allowed' : 'pointer',
          }}
          onClick={submit}
          disabled={loading || isEmpty}
          whileHover={!loading && !isEmpty ? {
            scale: 1.02,
            boxShadow: '0 8px 40px rgba(99,102,241,.4), 0 0 60px rgba(99,102,241,.15)',
            filter: 'brightness(1.1)',
          } : {}}
          whileTap={!loading && !isEmpty ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {loading ? (
            <><Loader size={16} style={{ animation: 'spin .8s linear infinite' }} /> Connecting...</>
          ) : (
            <><LogIn size={16} /> Connect</>
          )}
        </motion.button>

        {/* Separator */}
        <div style={s.divider}>
          <div style={s.divLine} />
          <span style={s.divText}>how to get your token</span>
          <div style={s.divLine} />
        </div>

        {/* Steps */}
        <motion.div
          style={s.steps}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div style={s.step}>
            <span style={s.stepNum}>1</span>
            <span>Open Discord in browser, press <kbd style={s.kbd}>F12</kbd></span>
          </div>
          <div style={s.step}>
            <span style={s.stepNum}>2</span>
            <span>Go to <kbd style={s.kbd}>Network</kbd> tab, send a message</span>
          </div>
          <div style={s.step}>
            <span style={s.stepNum}>3</span>
            <span>Click any request, copy <kbd style={s.kbd}>Authorization</kbd> header</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        style={s.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Selfbot Dashboard v1.2.0
      </motion.div>
    </div>
  )
}

const keyframes = `
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    25% { background-position: 50% 100%; }
    50% { background-position: 100% 50%; }
    75% { background-position: 50% 0%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes iconPulse {
    0%, 100% { box-shadow: 0 8px 32px rgba(99,102,241,.35); }
    50% { box-shadow: 0 8px 48px rgba(99,102,241,.55), 0 0 24px rgba(124,58,237,.2); }
  }
  @keyframes borderGlow {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(30px, -20px); }
    66% { transform: translate(-20px, 15px); }
  }
  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(-25px, 25px); }
    66% { transform: translate(15px, -30px); }
  }
`

const s = {
  root: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column',
    background: 'var(--bg-0)', position: 'relative', overflow: 'hidden',
    minHeight: '100vh',
  },
  gradientMesh: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at 20% 30%, rgba(99,102,241,.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(124,58,237,.05) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(99,102,241,.03) 0%, transparent 70%)',
    backgroundSize: '200% 200%',
    animation: 'gradientShift 20s ease infinite',
  },
  gridBg: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%)',
    WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%)',
  },
  orb1: {
    position: 'absolute', width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,.08) 0%, transparent 60%)',
    top: '10%', left: '20%', pointerEvents: 'none', filter: 'blur(80px)',
    animation: 'orbFloat1 25s ease-in-out infinite',
  },
  orb2: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,.06) 0%, transparent 60%)',
    bottom: '10%', right: '20%', pointerEvents: 'none', filter: 'blur(80px)',
    animation: 'orbFloat2 30s ease-in-out infinite',
  },
  orb3: {
    position: 'absolute', width: 350, height: 350, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(129,140,248,.04) 0%, transparent 60%)',
    top: '50%', left: '55%', pointerEvents: 'none', filter: 'blur(60px)',
    animation: 'orbFloat1 35s ease-in-out infinite reverse',
  },

  card: {
    width: 440, position: 'relative', zIndex: 1,
    background: 'rgba(12,12,15,.65)',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    border: '1px solid rgba(99,102,241,.1)',
    borderRadius: 28, padding: '48px 44px 40px',
    boxShadow: '0 40px 100px rgba(0,0,0,.5), 0 0 80px rgba(99,102,241,.04), inset 0 1px 0 rgba(255,255,255,.04)',
    textAlign: 'center',
  },
  cardGlow: {
    position: 'absolute', inset: -1, borderRadius: 28, pointerEvents: 'none',
    border: '1px solid rgba(99,102,241,.12)',
    animation: 'borderGlow 4s ease-in-out infinite',
  },

  iconRow: { display: 'flex', justifyContent: 'center', marginBottom: 28 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 18,
    background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'iconPulse 3s ease-in-out infinite',
  },

  title: {
    fontSize: 26, fontWeight: 700, letterSpacing: '-.5px',
    color: 'var(--t1)', marginBottom: 8,
  },
  sub: {
    fontSize: 14, color: 'var(--t3)', marginBottom: 32, lineHeight: 1.5,
  },

  inputGroup: { marginBottom: 18 },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(17,17,20,.8)', border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 14, overflow: 'hidden',
    transition: 'border-color .25s, box-shadow .25s',
  },
  input: {
    flex: 1, padding: '16px 18px', background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--t1)', fontSize: 15, fontFamily: 'var(--mono)', letterSpacing: '.3px',
  },
  eyeBtn: {
    background: 'transparent', border: 'none', color: 'var(--t4)', padding: '14px 16px',
    cursor: 'pointer', display: 'flex', transition: 'color .15s',
  },

  error: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '10px 16px', marginBottom: 18, borderRadius: 12,
    background: 'rgba(251,113,133,.06)', border: '1px solid rgba(251,113,133,.12)',
    color: 'var(--red)', fontSize: 13, fontWeight: 500,
  },

  btn: {
    width: '100%', padding: '16px 0', border: 'none', borderRadius: 14,
    background: 'linear-gradient(135deg, var(--accent), var(--accent-h))',
    color: '#fff', fontSize: 15, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 4px 24px rgba(99,102,241,.3)',
    transition: 'box-shadow .25s, filter .25s, opacity .25s',
    fontFamily: 'inherit',
  },

  divider: {
    display: 'flex', alignItems: 'center', gap: 14, margin: '28px 0 22px',
  },
  divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,.05)' },
  divText: {
    fontSize: 11, color: 'var(--t4)', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap',
  },

  steps: { display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' },
  step: {
    display: 'flex', alignItems: 'center', gap: 12,
    fontSize: 13, color: 'var(--t3)', lineHeight: 1.5,
  },
  stepNum: {
    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: 'var(--accent-h)',
  },
  kbd: {
    background: 'var(--bg-3)', padding: '2px 8px', borderRadius: 6,
    fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)',
    border: '1px solid rgba(255,255,255,.08)', fontWeight: 600,
    boxShadow: '0 1px 2px rgba(0,0,0,.2)',
  },

  footer: {
    position: 'absolute', bottom: 24, left: 0, right: 0,
    textAlign: 'center', fontSize: 12, color: 'var(--t4)',
    fontWeight: 500, letterSpacing: '.3px', zIndex: 1,
  },
}
