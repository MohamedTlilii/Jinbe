import { useEffect } from 'react'
import { generateLeadPDF } from '../../utils/pdf'
import { useT } from '../../i18n/useT'
import { useUiStore } from '../../store/uiStore'

const SIG_COLOR = {
  nouvelle:     '#4ade80',
  reouverture:  '#2dd4bf',
  demenagement: '#fb923c',
  fermeture:    '#f87171',
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #ffffff08' }}>
      <span style={{ fontSize: 11, color: '#8b90a7' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: color || 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6c63ff', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

function CompareBlock({ lead, t, c }) {
  const prev = lead.previousData || {}

  if (lead.signal === 'nouvelle') return (
    <div style={{ background: `${c}12`, border: `1px solid ${c}30`, borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: c, marginBottom: 6 }}>✦ {t('modal.comp.nouvelle')}</div>
      <div style={{ fontSize: 11, color: '#8b90a7' }}>{t('modal.comp.dcreation')} : <span style={{ color: 'var(--text)', fontWeight: 600 }}>{lead.dateCreation ? new Date(lead.dateCreation).toLocaleDateString('fr-CA') : '—'}</span></div>
      {lead.scoreDetails && (
        <div style={{ fontSize: 11, color: '#8b90a7', marginTop: 4 }}>
          {t('modal.comp.sfraich')} : <span style={{ color: c, fontWeight: 700 }}>{lead.scoreDetails.fraicheur}/3</span>
          {' · '}
          {t('modal.comp.ssec')} : <span style={{ color: c, fontWeight: 700 }}>{lead.scoreDetails.secteur}/3</span>
        </div>
      )}
    </div>
  )

  if (lead.signal === 'demenagement') return (
    <div style={{ background: `${c}12`, border: `1px solid ${c}30`, borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: c, marginBottom: 10 }}>→ {t('modal.comp.adchange')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, color: '#f87171', textDecoration: 'line-through', opacity: 0.8 }}>
          {prev.adresse || '—'}{prev.ville ? `, ${prev.ville}` : ''}
        </div>
        <div style={{ fontSize: 13, color: c, fontWeight: 600 }}>
          {lead.adresse}{lead.ville ? `, ${lead.ville}` : ''}
        </div>
      </div>
    </div>
  )

  if (lead.signal === 'reouverture') return (
    <div style={{ background: `${c}12`, border: `1px solid ${c}30`, borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: c, marginBottom: 10 }}>↺ {t('modal.comp.statchange')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600, background: '#f8717118', padding: '3px 10px', borderRadius: 6 }}>{prev.statutREQ || 'Inactif'}</span>
        <span style={{ color: '#8b90a7', fontSize: 14 }}>→</span>
        <span style={{ fontSize: 12, color: c, fontWeight: 600, background: `${c}18`, padding: '3px 10px', borderRadius: 6 }}>{lead.statutREQ || 'Actif'}</span>
      </div>
    </div>
  )

  if (lead.signal === 'fermeture') return (
    <div style={{ background: `${c}12`, border: `1px solid ${c}30`, borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: c, marginBottom: 10 }}>✕ {t('modal.comp.fermee')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600, background: '#4ade8018', padding: '3px 10px', borderRadius: 6 }}>{prev.statutREQ || 'Actif'}</span>
        <span style={{ color: '#8b90a7', fontSize: 14 }}>→</span>
        <span style={{ fontSize: 12, color: c, fontWeight: 600, background: `${c}18`, padding: '3px 10px', borderRadius: 6 }}>{lead.statutREQ || 'Fermé'}</span>
      </div>
    </div>
  )

  return null
}

export function LeadDetailModal({ lead, onClose }) {
  const t    = useT()
  const { lang } = useUiStore()
  const locale   = lang === 'fr' ? 'fr-CA' : 'en-CA'

  const fmt   = (d) => d ? new Date(d).toLocaleDateString(locale) : '—'
  const fmtDt = (d) => d ? new Date(d).toLocaleString(locale)     : '—'

  const c    = SIG_COLOR[lead.signal] || '#a78bfa'
  const addr = [lead.adresse, lead.ville, 'QC', lead.codePostal].filter(Boolean).join(', ')
  const nom  = (lead.nom && lead.nom !== 'Non déclaré') ? lead.nom : (lead.secteurMatch || '')

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)', padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg2)', borderRadius: 20,
        border: `1px solid ${c}28`,
        width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: `0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px ${c}14`,
        animation: 'modalUp 0.22s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem 1rem',
          borderBottom: `1px solid ${c}18`,
          position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 1,
          borderRadius: '20px 20px 0 0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <div style={{ fontSize: 10, color: c, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>
                {t(`modal.siglabel.${lead.signal}`, lead.signal)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}>
                {lead.nom || <span style={{ color: 'var(--text3)', fontStyle: 'italic', fontWeight: 400, fontSize: 14 }}>{t('modal.noname')}</span>}
              </div>
              <div style={{ fontSize: 11, color: '#8b90a7', marginTop: 4 }}>
                {t('modal.score')} {lead.score}/6 · {t('modal.neq')} {lead.neq}
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text3)', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem' }}>
          <CompareBlock lead={lead} t={t} c={c} />

          <Section title={t('modal.coord')}>
            <Row label={t('modal.adresse')}  value={lead.adresse} />
            <Row label={t('modal.ville')}    value={lead.ville} />
            <Row label={t('modal.postal')}   value={lead.codePostal} />
            <Row label={t('modal.province')} value={lead.province || 'QC'} />
            <Row label={t('modal.neq')}      value={lead.neq} />
          </Section>

          <Section title={t('modal.inforeq')}>
            <Row label={t('modal.statreq')}  value={lead.statutREQ} />
            <Row label={t('modal.secreq')}   value={lead.secteurActivite} />
            <Row label={t('modal.secmatch')} value={lead.secteurMatch} />
            <Row label={t('modal.region')}   value={lead.groupe} />
          </Section>

          <Section title={t('modal.scored')}>
            <Row label={t('modal.stotal')}  value={`${lead.score}/6`}                                            color={c} />
            <Row label={t('modal.sfraich')} value={lead.scoreDetails ? `${lead.scoreDetails.fraicheur}/3` : '—'} color={c} />
            <Row label={t('modal.ssec')}    value={lead.scoreDetails ? `${lead.scoreDetails.secteur}/3` : '—'}   color={c} />
          </Section>

          <Section title={t('modal.dates')}>
            <Row label={t('modal.datecreq')} value={fmt(lead.dateCreation)} />
            <Row label={t('modal.datedec')}  value={fmtDt(lead.dateTrouve)} />
            <Row label={t('modal.datevreq')} value={fmt(lead.versionREQ)} />
            <Row label={t('modal.datebd')}   value={fmtDt(lead.createdAt)} />
          </Section>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
            {[
              { href: `https://www.google.com/maps/search/?q=${encodeURIComponent(addr)}`, color: '#4285f4', label: '📍 Maps' },
              { href: `https://www.google.com/search?q=${encodeURIComponent(addr)}`,        color: '#0f9d58', label: '🔍 Google' },
              { href: `https://www.facebook.com/search/top?q=${encodeURIComponent(nom)}`,   color: '#3b82f6', label: '📘 FB' },
              { href: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(nom)}`, color: '#e879f9', label: '📸 IG' },
              { href: `https://www.google.com/search?q=${encodeURIComponent(nom)}`,         color: '#4ade80', label: '🌐 Web' },
            ].map(({ href, color, label }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" style={{
                fontSize: 11, padding: '5px 12px', fontWeight: 700,
                background: `${color}14`, color, border: `1px solid ${color}30`,
                borderRadius: 8, textDecoration: 'none',
              }}>{label}</a>
            ))}
            <button onClick={() => generateLeadPDF(lead)} style={{
              fontSize: 11, padding: '5px 12px', fontWeight: 700,
              background: '#6c63ff14', color: '#6c63ff', border: '1px solid #6c63ff30',
              borderRadius: 8, cursor: 'pointer',
            }}>↓ PDF</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes modalUp { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}
