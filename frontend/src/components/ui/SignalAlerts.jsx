import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'

const SIGNALS = [
  { key: 'nouvelle',     color: '#4ade80', icon: '✦', label: 'Nouvelles',      route: '/nouvelles',     sound: 'discover' },
  { key: 'reouverture',  color: '#2dd4bf', icon: '↺', label: 'Réouvertures',   route: '/reouvertures',  sound: 'bell'     },
  { key: 'demenagement', color: '#fb923c', icon: '→', label: 'Déménagements',  route: '/demenagements', sound: 'swoosh'   },
  { key: 'fermeture',    color: '#f87171', icon: '✕', label: 'Fermetures',     route: '/fermetures',    sound: 'drop'     },
]

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const t = ctx.currentTime

    const note = (freq, start, dur, vol = 0.22, wave = 'sine') => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = wave
      o.frequency.setValueAtTime(freq, start)
      g.gain.setValueAtTime(0, start)
      g.gain.linearRampToValueAtTime(vol, start + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, start + dur)
      o.start(start); o.stop(start + dur)
    }

    if (type === 'discover') {
      // Ascending major arpeggio — discovery, positive
      note(523.25, t,       0.18, 0.22) // C5
      note(659.25, t + 0.1, 0.18, 0.22) // E5
      note(783.99, t + 0.2, 0.18, 0.22) // G5
      note(1046.5, t + 0.3, 0.55, 0.3)  // C6
    } else if (type === 'bell') {
      // Bell with harmonics — revival
      note(880,  t,       1.6, 0.28) // A5
      note(1320, t,       1.0, 0.1)  // E6
      note(1760, t,       0.6, 0.05) // A6
      note(440,  t + 0.3, 1.0, 0.1)  // A4
    } else if (type === 'swoosh') {
      // Frequency glide — movement
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      const f = ctx.createBiquadFilter()
      o.connect(f); f.connect(g); g.connect(ctx.destination)
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 3
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(100, t)
      o.frequency.exponentialRampToValueAtTime(1400, t + 0.16)
      o.frequency.exponentialRampToValueAtTime(350,  t + 0.38)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.18, t + 0.04)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.42)
      o.start(t); o.stop(t + 0.42)
    } else if (type === 'drop') {
      // Descending minor — closure
      note(220,    t,       0.3,  0.25, 'triangle') // A3
      note(196,    t + 0.2, 0.32, 0.18, 'triangle') // G3
      note(174.61, t + 0.4, 0.6,  0.12, 'triangle') // F3
    }

    setTimeout(() => ctx.close(), 3000)
  } catch {}
}

const DURATION = 6000

function Toast({ toast, onDismiss }) {
  const navigate = useNavigate()
  const [show, setShow]   = useState(false)
  const [leave, setLeave] = useState(false)
  const timerRef = useRef(null)

  const sig = SIGNALS.find(s => s.key === toast.signal)

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)))
    timerRef.current = setTimeout(startLeave, DURATION)
    return () => clearTimeout(timerRef.current)
  }, [])

  const startLeave = () => {
    setLeave(true)
    setTimeout(onDismiss, 420)
  }

  const handleClick = () => {
    navigate(sig.route)
    startLeave()
  }

  if (!sig) return null

  const visible = show && !leave
  return (
    <div
      onClick={handleClick}
      style={{
        width: 308,
        background: 'var(--bg2)',
        border: `1px solid ${sig.color}2e`,
        borderLeft: `4px solid ${sig.color}`,
        borderRadius: 15, padding: '0.95rem 1.1rem',
        cursor: 'pointer', userSelect: 'none',
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${sig.color}10`,
        transform: visible
          ? 'translateX(0) scale(1)'
          : 'translateX(115%) scale(0.9)',
        opacity: visible ? 1 : 0,
        transition: leave
          ? 'transform 0.42s cubic-bezier(0.4,0,1,1), opacity 0.4s ease'
          : 'transform 0.52s cubic-bezier(0.16,1,0.3,1), opacity 0.45s ease',
        backdropFilter: 'blur(14px)',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at top left, ${sig.color}0a 0%, transparent 60%)`,
      }} />

      {/* Progress timer bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `${sig.color}18` }}>
        <div style={{
          height: '100%', transformOrigin: 'left',
          background: `linear-gradient(90deg, ${sig.color}60, ${sig.color})`,
          animation: show ? `toastTimer ${DURATION}ms linear forwards` : 'none',
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 13, position: 'relative', zIndex: 1 }}>

        {/* Icon box */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: `${sig.color}16`, border: `1px solid ${sig.color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: sig.color,
          boxShadow: `0 0 24px ${sig.color}28`,
        }}>{sig.icon}</div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: sig.color, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 3, opacity: 0.85 }}>
            Signal détecté
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 5 }}>
            {sig.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: sig.color, lineHeight: 1 }}>
              +{toast.diff.toLocaleString('fr-CA')}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              · {toast.total.toLocaleString('fr-CA')} total
            </span>
          </div>
        </div>

        {/* Go arrow */}
        <div style={{ fontSize: 18, color: sig.color, opacity: 0.5, flexShrink: 0 }}>›</div>
      </div>
    </div>
  )
}

export default function SignalAlerts() {
  const [toasts, setToasts] = useState([])
  const prevRef  = useRef(null)
  const readyRef = useRef(false)

  const check = async () => {
    try {
      const { data } = await api.get('/stats/signals')

      if (!readyRef.current) {
        prevRef.current = data
        readyRef.current = true
        return
      }

      const prev  = prevRef.current || {}
      const batch = []
      const sounds = []

      SIGNALS.forEach(sig => {
        const diff = (data[sig.key] || 0) - (prev[sig.key] || 0)
        if (diff > 0) {
          batch.push({ id: `${sig.key}_${Date.now()}_${Math.random().toString(36).slice(2)}`, signal: sig.key, diff, total: data[sig.key] || 0 })
          sounds.push(sig.sound)
        }
      })

      prevRef.current = data

      if (batch.length > 0) {
        setToasts(t => [...t, ...batch])
        sounds.forEach((s, i) => setTimeout(() => playSound(s), i * 380))
      }
    } catch {}
  }

  useEffect(() => {
    check()
    const interval = setInterval(check, 15000)
    const onDone = () => setTimeout(check, 800)
    window.addEventListener('engine:done', onDone)
    return () => {
      clearInterval(interval)
      window.removeEventListener('engine:done', onDone)
    }
  }, [])

  const dismiss = (id) => setToasts(t => t.filter(x => x.id !== id))

  return (
    <>
      <style>{`@keyframes toastTimer { from { transform:scaleX(1); } to { transform:scaleX(0); } }`}</style>
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        alignItems: 'flex-end',
        pointerEvents: toasts.length ? 'auto' : 'none',
      }}>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </>
  )
}
