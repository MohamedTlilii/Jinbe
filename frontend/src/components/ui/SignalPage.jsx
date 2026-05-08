import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'
import { ScoreBadge, fmtDate } from './index'
import { generateLeadPDF } from '../../utils/pdf'
import { useT } from '../../i18n/useT'
import { useUiStore } from '../../store/uiStore'
import { LeadDetailModal } from './LeadDetailModal'

const SCORES = [2, 3, 4, 5, 6]

const ANIMATIONS = `
  @keyframes shimmer { 0%,100% { opacity:0.25; } 50% { opacity:0.55; } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes pulse   { 0%,100% { transform:scale(1); opacity:0.6; } 50% { transform:scale(1.15); opacity:1; } }
`

function Lnk({ href, color, label }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{
      fontSize: 10, padding: '3px 9px', fontWeight: 700,
      background: `${color}14`, color, border: `1px solid ${color}2e`,
      borderRadius: 6, textDecoration: 'none',
    }}>{label}</a>
  )
}

function Btn({ onClick, color, label }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 10, padding: '3px 9px', fontWeight: 700,
      background: `${color}14`, color, border: `1px solid ${color}2e`,
      borderRadius: 6, cursor: 'pointer',
    }}>{label}</button>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg2)', borderRadius: 14, padding: '1rem',
      border: '1px solid var(--border)', borderLeft: '3px solid #1e2433',
    }}>
      {[55, 100, 75, 55, 40].map((w, i) => (
        <div key={i} style={{
          height: i === 1 ? 13 : 9, width: `${w}%`, borderRadius: 5,
          background: 'var(--bg3)', marginBottom: 10,
          animation: `shimmer 1.6s ease-in-out ${i * 0.12}s infinite`,
        }} />
      ))}
      <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
        {[40, 30, 30, 30].map((w, i) => (
          <div key={i} style={{
            height: 22, width: w, borderRadius: 6,
            background: 'var(--bg3)',
            animation: `shimmer 1.6s ease-in-out ${0.5 + i * 0.1}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

function LeadCard({ lead, color, signal, onOpen }) {
  const t   = useT()
  const [hov, setHov] = useState(false)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onOpen}
      style={{
        background: 'var(--bg2)',
        borderRadius: 14,
        border: `1px solid ${hov ? color + '35' : 'var(--border)'}`,
        borderLeft: `3px solid ${color}`,
        padding: '1rem',
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 8px 30px ${color}12` : 'none',
        position: 'relative', overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* hover glow orb */}
      {hov && (
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 110, height: 110, borderRadius: '50%',
          background: color, opacity: 0.05, filter: 'blur(28px)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Score + feu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <ScoreBadge score={lead.score} />
        {lead.score >= 5 && (
          <span style={{ fontSize: 13, animation: 'pulse 2s ease-in-out infinite' }}>🔥</span>
        )}
      </div>

      {/* Nom */}
      <div style={{
        fontWeight: 700, fontSize: 13.5, color: 'var(--text)',
        marginBottom: 8, lineHeight: 1.3, letterSpacing: '-0.01em',
      }}>
        {lead.nom || (
          <span style={{ color: 'var(--text3)', fontStyle: 'italic', fontWeight: 400, fontSize: 12 }}>
            {t('signal.noname')}
          </span>
        )}
      </div>

      {/* Ville + secteur */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: color, display: 'inline-block',
          boxShadow: `0 0 5px ${color}80`,
        }} />
        {lead.ville}{lead.secteurMatch ? ` · ${lead.secteurMatch}` : ''}
      </div>

      {/* Adresse */}
      {lead.adresse && (
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2, paddingLeft: 12 }}>
          {lead.adresse}{lead.codePostal ? ` · ${lead.codePostal}` : ''}
        </div>
      )}

      {/* Ancienne adresse déménagement */}
      {signal === 'demenagement' && lead.previousData?.adresse && (
        <div style={{ fontSize: 10, color: '#fb923c', opacity: 0.85, marginBottom: 4, paddingLeft: 12 }}>
          ← {lead.previousData.adresse}
        </div>
      )}

      {/* Date + NEQ */}
      <div style={{ fontSize: 10, color: 'var(--text3)', opacity: 0.55, marginBottom: 12, paddingLeft: 12 }}>
        {fmtDate(lead.dateCreation)} · NEQ {lead.neq}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <Lnk href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([lead.adresse, lead.ville, 'QC'].filter(Boolean).join(', '))}`} color="#4285f4" label="📍 Maps" />
        <Lnk href={`https://www.google.com/search?q=${encodeURIComponent([lead.adresse, lead.ville, 'QC', lead.codePostal].filter(Boolean).join(', '))}`} color="#0f9d58" label="🔍 Google" />
        <Lnk href={`https://www.facebook.com/search/top?q=${encodeURIComponent(lead.nom || lead.secteurMatch || '')}`} color="#3b82f6" label="📘 FB" />
        <Lnk href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(lead.nom || lead.secteurMatch || '')}`} color="#e879f9" label="📸 IG" />
        <Lnk href={`https://www.google.com/search?q=${encodeURIComponent(lead.nom || lead.secteurMatch || '')}`} color="#4ade80" label="🌐 Web" />
        <Btn onClick={() => generateLeadPDF(lead)} color="#a78bfa" label="↓ PDF" />
      </div>
    </div>
  )
}

export default function SignalPage({ signal, color, icon, label, emptyMsg }) {
  const t      = useT()
  const { lang } = useUiStore()
  const locale   = lang === 'fr' ? 'fr-CA' : 'en-CA'
  const [modalLead, setModalLead] = useState(null)
  const REGIONS = [
    { value: '',          label: t('filter.all'), color: '#94a3b8' },
    { value: 'montreal',  label: t('filter.mtl'), color: '#f87171' },
    { value: 'mauricie',  label: t('filter.mau'), color: '#fbbf24' },
    { value: 'outaouais', label: t('filter.out'), color: '#fb923c' },
    { value: 'quebec',    label: t('filter.qc'),  color: '#60a5fa' },
  ]
  const [leads,   setLeads]   = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ groupe: '', ville: '', secteur: '', score: '', nom: '' })

  const LIMIT = 50

  const load = useCallback(async (p = 1, reset = false) => {
    setLoading(true)
    try {
      const params = { signal, page: p, limit: LIMIT }
      if (filters.groupe)  params.groupe  = filters.groupe
      if (filters.ville)   params.ville   = filters.ville
      if (filters.secteur) params.secteur = filters.secteur
      if (filters.score)   params.score   = filters.score
      if (filters.nom)     params.nom     = filters.nom
      const { data } = await api.get('/leads', { params })
      setLeads(prev => reset ? (data.leads || []) : [...prev, ...(data.leads || [])])
      setTotal(data.total || 0)
      setPage(p)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filters, signal])

  useEffect(() => { load(1, true) }, [load])

  const hasFilters = filters.groupe || filters.ville || filters.secteur || filters.score || filters.nom
  const remaining  = total - leads.length
  const pct        = total > 0 ? Math.round((leads.length / total) * 100) : 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <style>{ANIMATIONS}</style>

      {/* ── Hero ── */}
      <div style={{
        background: 'var(--bg2)', borderRadius: 18,
        border: `1px solid ${color}22`,
        padding: '1.75rem 2rem', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-70, left:-70, width:240, height:240, borderRadius:'50%', background:color, opacity:0.06, filter:'blur(70px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, right:100, width:170, height:170, borderRadius:'50%', background:color, opacity:0.04, filter:'blur(45px)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:18, zIndex:1 }}>
          <div style={{
            width:58, height:58, borderRadius:16,
            background:`${color}18`, border:`1px solid ${color}35`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:24, color, fontWeight:800,
            boxShadow:`0 0 28px ${color}22`,
          }}>{icon}</div>
          <div>
            <div style={{ fontSize:9, color, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:6, opacity:0.9 }}>
              signal · {signal}
            </div>
            <div style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1 }}>
              {label}
            </div>
          </div>
        </div>

        <div style={{ textAlign:'right', zIndex:1 }}>
          <div style={{
            fontSize:46, fontWeight:900, color:'var(--text)',
            lineHeight:1, letterSpacing:'-0.04em',
            textShadow:`0 0 50px ${color}25`,
          }}>
            {loading && leads.length === 0 ? '—' : total.toLocaleString(locale)}
          </div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:5 }}>{t('signal.total')}</div>
          {leads.length > 0 && leads.length < total && (
            <div style={{ fontSize:10, color:`${color}99`, marginTop:3 }}>
              {leads.length.toLocaleString(locale)} {t('signal.loaded')} · {pct}%
            </div>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{
        background:'var(--bg2)', borderRadius:14,
        border:'1px solid var(--border)', padding:'0.85rem 1.25rem',
        marginBottom:'1.25rem',
        display:'flex', gap:10, flexWrap:'wrap', alignItems:'center',
      }}>
        {/* Region segmented */}
        <div style={{ display:'flex', gap:3, background:'var(--bg3)', borderRadius:10, padding:4 }}>
          {REGIONS.map(r => {
            const active = filters.groupe === r.value
            return (
              <button key={r.value}
                onClick={() => setFilters(f => ({...f, groupe: r.value, ville:''}))}
                style={{
                  padding:'4px 12px', borderRadius:7, fontSize:11, fontWeight:600,
                  border:'none', cursor:'pointer', transition:'all 0.15s',
                  background: active ? `${r.color}22` : 'transparent',
                  color: active ? r.color : 'var(--text3)',
                  boxShadow: active ? `0 0 8px ${r.color}22` : 'none',
                }}>
                {r.label}
              </button>
            )
          })}
        </div>

        {/* Score pills */}
        <div style={{ display:'flex', gap:3 }}>
          {SCORES.map(s => {
            const active = filters.score === String(s)
            return (
              <button key={s}
                onClick={() => setFilters(f => ({...f, score: active ? '' : String(s)}))}
                style={{
                  width:30, height:30, borderRadius:8, fontSize:10, fontWeight:700,
                  border:`1px solid ${active ? color+'55' : 'var(--border)'}`,
                  background: active ? `${color}20` : 'var(--bg3)',
                  color: active ? color : 'var(--text3)',
                  cursor:'pointer', transition:'all 0.15s',
                  boxShadow: active ? `0 0 10px ${color}20` : 'none',
                }}>
                {s}★
              </button>
            )
          })}
        </div>

        <div style={{ width:1, height:22, background:'var(--border)', flexShrink:0 }} />

        {!filters.groupe && (
          <input placeholder={t('filter.city')} value={filters.ville}
            onChange={e => setFilters(f => ({...f, ville: e.target.value}))}
            style={{
              background:'var(--bg3)',
              border:`1px solid ${filters.ville ? color+'55' : 'var(--border)'}`,
              borderRadius:8, color:'var(--text)', padding:'6px 12px',
              fontSize:11, width:100, outline:'none', transition:'border-color 0.15s',
            }}
          />
        )}
        <input placeholder={t('filter.sector')} value={filters.secteur}
          onChange={e => setFilters(f => ({...f, secteur: e.target.value}))}
          style={{
            background:'var(--bg3)',
            border:`1px solid ${filters.secteur ? color+'55' : 'var(--border)'}`,
            borderRadius:8, color:'var(--text)', padding:'6px 12px',
            fontSize:11, width:120, outline:'none', transition:'border-color 0.15s',
          }}
        />
        <input placeholder={t('filter.name')} value={filters.nom}
          onChange={e => setFilters(f => ({...f, nom: e.target.value}))}
          style={{
            background:'var(--bg3)',
            border:`1px solid ${filters.nom ? color+'55' : 'var(--border)'}`,
            borderRadius:8, color:'var(--text)', padding:'6px 12px',
            fontSize:11, width:140, outline:'none', transition:'border-color 0.15s',
          }}
        />

        {hasFilters && (
          <button
            onClick={() => setFilters({ groupe:'', ville:'', secteur:'', score:'', nom:'' })}
            style={{
              marginLeft:'auto', padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:700,
              border:'1px solid #f8717130', background:'#f8717110', color:'#f87171', cursor:'pointer',
            }}>
            {t('filter.reset')}
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {loading && leads.length === 0 ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:10 }}>
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : leads.length === 0 ? (
        <div style={{
          background:'var(--bg2)', borderRadius:18, border:'1px solid var(--border)',
          textAlign:'center', padding:'5rem 2rem',
          animation:'fadeUp 0.35s ease',
        }}>
          <div style={{ fontSize:56, opacity:0.1, marginBottom:18, color, lineHeight:1 }}>{icon}</div>
          <div style={{ fontSize:16, color:'var(--text2)', fontWeight:700, marginBottom:8 }}>{t('signal.noResult')}</div>
          <div style={{ fontSize:13, color:'var(--text3)' }}>{emptyMsg}</div>
        </div>
      ) : (
        <>
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))',
            gap:10, marginBottom:'1.25rem',
            animation:'fadeUp 0.3s ease',
          }}>
            {leads.map(lead => (
              <LeadCard key={lead._id} lead={lead} color={color} signal={signal} onOpen={() => setModalLead(lead)} />
            ))}
          </div>

          {remaining > 0 && (
            <div style={{ textAlign:'center', marginTop:4, marginBottom:24 }}>
              {/* progress bar */}
              <div style={{ height:2, background:'var(--bg3)', borderRadius:99, maxWidth:340, margin:'0 auto 16px', overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:99, width:`${pct}%`,
                  background:`linear-gradient(90deg, ${color}88, ${color})`,
                  transition:'width 0.4s ease',
                }} />
              </div>
              <button onClick={() => load(page + 1)} disabled={loading} style={{
                padding:'10px 32px', borderRadius:12, fontSize:13, fontWeight:700,
                border:`1px solid ${color}30`, background:`${color}0d`, color,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1, transition:'all 0.2s',
                boxShadow:`0 0 24px ${color}10`,
              }}>
                {loading ? t('signal.loading') : `${t('signal.loadMore')} ${remaining.toLocaleString(locale)} ${t('signal.more')}`}
              </button>
            </div>
          )}
        </>
      )}
      {modalLead && <LeadDetailModal lead={modalLead} onClose={() => setModalLead(null)} />}
    </div>
  )
}
