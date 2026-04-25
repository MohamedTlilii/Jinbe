// components/ui/index.jsx — Composants UI réutilisables
/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react'
import { generateLeadPDF } from '../../utils/pdf'

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

// Carte stat avec chiffre animé
export function StatCard({ label, value, color = 'var(--text)', sub }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '1.25rem',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
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

// Badge statut CRM
export function StatusBadge({ status }) {
  const map = {
    bon_lead:     { label: 'Bon lead',     bg: '#3b82f61a', color: '#3b82f6' },
    contacte:     { label: 'Contacté',     bg: '#eab3081a', color: '#eab308' },
    rdv_planifie: { label: 'RDV planifié', bg: '#f973161a', color: '#f97316' },
    vendu:        { label: 'Vendu',        bg: '#22c55e1a', color: '#22c55e' },
    perdu:        { label: 'Perdu',        bg: '#ef44441a', color: '#ef4444' },
    nouveau:      { label: 'Nouveau',      bg: '#6c63ff1a', color: '#6c63ff' },
    plus_tard:    { label: 'Plus tard',    bg: '#55557220', color: '#8b90a7' },
    verifie:      { label: '✓ Vérifié',   bg: '#22c55e1a', color: '#22c55e' },
  }
  const s = map[status] || map['nouveau']
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
    }}>
      {s.label}
    </span>
  )
}

// Badge signal
export function SignalBadge({ signal }) {
  const map = {
    nouvelle:         { label: 'Nouvelle',      color: '#22c55e' },
    reouverture:      { label: 'Réouverture',   color: '#f97316' },
    demenagement:     { label: 'Déménagement',  color: '#3b82f6' },
    nouvelle_activite: { label: 'Nouv. activité', color: '#6c63ff' },
    fermeture:         { label: 'Fermeture',      color: '#ef4444' },
  }
  const s = map[signal] || map['nouvelle']
  return (
    <span style={{ fontSize: 11, color: s.color, fontWeight: 500 }}>● {s.label}</span>
  )
}

// Bouton principal
export function Btn({ children, onClick, color = 'var(--accent)', disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? 'var(--bg3)' : color,
      color: disabled ? 'var(--text3)' : '#fff',
      border: 'none', borderRadius: 'var(--radius-sm)',
      padding: '0.5rem 1rem', fontSize: 13, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s',
      ...style,
    }}>
      {children}
    </button>
  )
}

// Card conteneur
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '1.25rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

// Page header
export function PageHeader({ title, sub, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{sub}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: 8 }}>{children}</div>}
    </div>
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

// Carte lead réutilisable
export function LeadCard({ lead }) {
  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <ScoreBadge score={lead.score} />
        <SignalBadge signal={lead.signal} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
        {lead.nom || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Nom non disponible</span>}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 1 }}>{lead.ville} · {lead.secteurMatch}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{lead.adresse}{lead.codePostal ? ` · ${lead.codePostal}` : ''}</div>
      {lead.signal === 'demenagement' && lead.previousData?.adresse && (
        <div style={{ fontSize: 11, color: '#f97316', marginBottom: 2 }}>Ancienne adresse : {lead.previousData.adresse}</div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
        Créée {fmtDate(lead.dateCreation)} · NEQ {lead.neq}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <a href={`https://www.google.com/search?q=${encodeURIComponent([lead.adresse, lead.ville, 'QC', lead.codePostal].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '3px 8px', background: '#1a73e81a', color: '#1a73e8', border: '1px solid #1a73e844', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>📍 Google</a>
        <a href={`https://www.facebook.com/search/top?q=${encodeURIComponent(lead.nom || lead.secteurMatch)}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '3px 8px', background: '#18529d1a', color: '#18529d', border: '1px solid #18529d44', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>📘 Facebook</a>
        <a href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(lead.nom || lead.secteurMatch)}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '3px 8px', background: '#e10a7d1a', color: '#e10a7d', border: '1px solid #e10a7d44', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>📸 Instagram</a>
        <a href={`https://www.google.com/search?q=${encodeURIComponent(lead.nom || lead.secteurMatch)}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '3px 8px', background: '#22c55e1a', color: '#22c55e', border: '1px solid #22c55e44', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>🌐 Site web</a>
        <button onClick={() => generateLeadPDF(lead)} style={{ fontSize: 11, padding: '3px 8px', background: '#6c63ff1a', color: '#6c63ff', border: '1px solid #6c63ff44', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>↓ PDF</button>
      </div>
    </div>
  )
}

// Formatage date
export function fmtDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-CA')
}

export function fmtRelative(date) {
  if (!date) return '—'
  const diff = Math.floor((Date.now() - new Date(date)) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  if (diff < 30)  return `Il y a ${diff} jours`
  if (diff < 365) return `Il y a ${Math.floor(diff/30)} mois`
  return `Il y a ${Math.floor(diff/365)} an(s)`
}
