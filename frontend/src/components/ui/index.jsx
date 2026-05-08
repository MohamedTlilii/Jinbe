// components/ui/index.jsx — Composants UI réutilisables
/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react'
import { useT } from '../../i18n/useT'

export function ConfirmModal({ title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', color = '#ef4444', onConfirm, onCancel }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(7px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg2)', borderRadius: 20, padding: '1.75rem',
        width: 380, border: `1px solid ${color}28`,
        boxShadow: `0 28px 90px rgba(0,0,0,0.65), 0 0 0 1px ${color}12`,
        animation: 'cfmFadeUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: color, opacity: 0.06, filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20, position: 'relative' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: `${color}15`, border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: `0 0 20px ${color}20`,
          }}>⚠</div>
          <div style={{ paddingTop: 2 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 5 }}>{title}</div>
            {message && <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>{message}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 700,
            background: 'var(--bg3)', color: 'var(--text2)',
            border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s',
          }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 700,
            background: `${color}20`, color,
            border: `1px solid ${color}45`, cursor: 'pointer',
            boxShadow: `0 4px 18px ${color}25`, transition: 'all 0.15s',
          }}>{confirmLabel}</button>
        </div>
        <style>{`@keyframes cfmFadeUp { from { opacity:0; transform:translateY(18px) scale(0.96); } to { opacity:1; transform:none; } }`}</style>
      </div>
    </div>
  )
}

// Badge score coloré
export function ScoreBadge({ score }) {
  const colors = {
    6: { bg: '#ef44441a', color: '#ef4444', label: '🔥🔥🔥' },
    5: { bg: '#f973161a', color: '#f97316', label: '🔥🔥' },
    4: { bg: '#eab3081a', color: '#eab308', label: '🔥' },
    3: { bg: '#3b82f61a', color: '#3b82f6', label: '●' },
    2: { bg: '#6c63ff1a', color: '#6c63ff', label: '●' },
    1: { bg: '#55557220', color: '#8b90a7', label: '●' },
  }
  const c = colors[score] || colors[1]
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      border: `1px solid ${c.color}33`,
    }}>
      {score}/6
    </span>
  )
}

// Badge signal
export function SignalBadge({ signal }) {
  const t = useT()
  const colors = {
    nouvelle:          '#4ade80',
    reouverture:       '#2dd4bf',
    demenagement:      '#fb923c',
    fermeture:         '#f87171',
  }
  const color = colors[signal] || colors['nouvelle']
  return (
    <span style={{ fontSize: 11, color, fontWeight: 500 }}>
      ● {t(`signal.badge.${signal}`, signal)}
    </span>
  )
}

// Barre de progression
export function ProgressBar({ percent, step }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
        <span>{step}</span><span>{Math.round(percent)}%</span>
      </div>
      <div style={{ background: 'var(--bg3)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
          width: `${percent}%`, transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  )
}

// Formatage date
export function fmtDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-CA')
}

export function fmtRelative(date, lang = 'fr') {
  if (!date) return '—'
  const diff = Math.floor((Date.now() - new Date(date)) / 86400000)
  if (lang === 'en') {
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 30)  return `${diff} days ago`
    if (diff < 365) return `${Math.floor(diff/30)} months ago`
    return `${Math.floor(diff/365)} year(s) ago`
  }
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  if (diff < 30)  return `Il y a ${diff} jours`
  if (diff < 365) return `Il y a ${Math.floor(diff/30)} mois`
  return `Il y a ${Math.floor(diff/365)} an(s)`
}
