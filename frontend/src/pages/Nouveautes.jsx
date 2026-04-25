// pages/Nouveautes.jsx — Dernier run
import { useState, useEffect } from 'react'
import api from '../utils/api'
import { ScoreBadge, SignalBadge, fmtDate } from '../components/ui/index'
import { useT } from '../i18n/useT'

const fmtDuration = (ms) => {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60), rs = s % 60
  if (m < 60) return rs > 0 ? `${m}min ${rs}s` : `${m}min`
  const h = Math.floor(m / 60), rm = m % 60
  return rm > 0 ? `${h}h ${rm}min` : `${h}h`
}

const lnk = (color) => ({
  fontSize: 10, padding: '3px 9px', fontWeight: 700,
  background: `${color}12`, color, border: `1px solid ${color}30`,
  borderRadius: 6, textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
})

function LeadCard({ lead, noname }) {
  const sc = lead.signal === 'nouvelle' ? '#4ade80'
    : lead.signal === 'reouverture' ? '#2dd4bf'
    : lead.signal === 'demenagement' ? '#fb923c'
    : '#f87171'
  return (
    <div style={{
      background: '#ffffff04', borderRadius: 11, padding: '0.85rem',
      border: '1px solid var(--border)', borderLeft: `3px solid ${sc}`,
      transition: 'border-color 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <ScoreBadge score={lead.score} />
        <SignalBadge signal={lead.signal} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>
        {lead.nom || <span style={{ color:'var(--text3)', fontStyle:'italic', fontWeight:400 }}>{noname}</span>}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 1 }}>{lead.ville} · {lead.secteurMatch}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 1 }}>{lead.adresse}{lead.codePostal ? ` · ${lead.codePostal}` : ''}</div>
      {lead.signal === 'demenagement' && lead.previousData?.adresse && (
        <div style={{ fontSize: 11, color: '#fb923c', marginBottom: 1 }}>
          ← {lead.previousData.adresse}
        </div>
      )}
      <div style={{ fontSize: 10, color: 'var(--text3)', opacity: 0.6, marginBottom: 9 }}>
        {fmtDate(lead.dateCreation)} · NEQ {lead.neq}
      </div>
      {lead.signal !== 'fermeture' && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <a href={`https://www.google.com/search?q=${encodeURIComponent([lead.adresse,lead.ville,'QC',lead.codePostal].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer" style={lnk('#4285f4')}>📍 Maps</a>
          <a href={`https://www.facebook.com/search/top?q=${encodeURIComponent(lead.nom||lead.secteurMatch)}`} target="_blank" rel="noreferrer" style={lnk('#3b82f6')}>📘 FB</a>
          <a href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(lead.nom||lead.secteurMatch)}`} target="_blank" rel="noreferrer" style={lnk('#e879f9')}>📸 IG</a>
          <a href={`https://www.google.com/search?q=${encodeURIComponent(lead.nom||lead.secteurMatch)}`} target="_blank" rel="noreferrer" style={lnk('#4ade80')}>🌐 Web</a>
        </div>
      )}
    </div>
  )
}

export default function Nouveautes() {
  const t = useT()

  const SECTIONS = [
    { signal: 'nouvelle',     label: t('lastrun.nouvelles'), color: '#4ade80', icon: '✦' },
    { signal: 'reouverture',  label: t('lastrun.reouv'),     color: '#2dd4bf', icon: '↺' },
    { signal: 'demenagement', label: t('lastrun.demen'),     color: '#fb923c', icon: '→' },
    { signal: 'fermeture',    label: t('lastrun.ferm'),      color: '#f87171', icon: '✕' },
  ]

  const [leads,   setLeads]   = useState([])
  const [version, setVersion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [runs,    setRuns]    = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const [leadsRes, runsRes] = await Promise.all([
        api.get('/leads/nouveautes'),
        api.get('/runs/latest'),
      ])
      setLeads(leadsRes.data.leads || [])
      setVersion(leadsRes.data.version)
      setRuns(runsRes.data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const grouped  = {}
  for (const s of SECTIONS) grouped[s.signal] = leads.filter(l => l.signal === s.signal)
  const total    = leads.length
  const lastRun  = runs[0] || null
  const prevRun  = runs[1] || null
  const runDate  = version ? new Date(version).toLocaleString('fr-CA') : null
  const diff     = (sig) => lastRun && prevRun ? (lastRun.counts?.[sig]||0) - (prevRun.counts?.[sig]||0) : null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Hero Header */}
      <div style={{
        background: 'var(--bg2)', borderRadius: 18,
        border: '1px solid #fbbf2420',
        padding: '1.5rem 2rem', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden', flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ position:'absolute', top:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'#fbbf24', opacity:0.06, filter:'blur(65px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, right:180, width:150, height:150, borderRadius:'50%', background:'#fbbf24', opacity:0.03, filter:'blur(40px)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:18, zIndex:1 }}>
          <div style={{
            width:52, height:52, borderRadius:14,
            background:'#fbbf2418', border:'1px solid #fbbf2430',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, color:'#fbbf24', boxShadow:'0 0 24px #fbbf2422',
          }}>⚡</div>
          <div>
            <div style={{ fontSize:9, color:'#fbbf24', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:6, opacity:0.9 }}>
              {runDate || t('lastrun.waiting')}
            </div>
            <div style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1 }}>
              {t('lastrun.title')}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:20, zIndex:1 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:42, fontWeight:900, color:'var(--text)', lineHeight:1, letterSpacing:'-0.04em', textShadow:'0 0 40px #fbbf2425' }}>
              {loading ? '—' : total}
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
              {total !== 1 ? t('lastrun.changes') : t('lastrun.change')}
            </div>
          </div>
          <button onClick={load} style={{
            padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            border: '1px solid #fbbf2430', background: '#fbbf2412', color: '#fbbf24',
            cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 0 16px #fbbf2412',
          }}>
            <span style={{ display:'inline-block', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>↺</span>
            {t('lastrun.refresh')}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, opacity: 0.2, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 13 }}>{t('lastrun.loading')}</div>
        </div>
      ) : total === 0 ? (
        <div style={{
          background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border)',
          textAlign: 'center', padding: '4rem 2rem',
        }}>
          <div style={{ fontSize: 40, opacity: 0.15, marginBottom: 14 }}>⚡</div>
          <div style={{ fontSize: 15, color: 'var(--text2)', fontWeight: 600 }}>{t('lastrun.none')}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>{t('lastrun.launch')}</div>
        </div>
      ) : (
        <>
          {/* Hero run info */}
          {lastRun && (
            <div style={{
              background: 'var(--bg2)', borderRadius: 14,
              border: '1px solid #fbbf2420',
              padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
              display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap',
              boxShadow: '0 0 30px #fbbf2408',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'#fbbf24', opacity:0.04, filter:'blur(40px)', pointerEvents:'none' }}/>
              <div>
                <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>{t('lastrun.duration')}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>⏱ {fmtDuration(lastRun.durationMs)}</div>
              </div>
              <div style={{ width: 1, height: 36, background: 'var(--border)' }}/>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>{t('lastrun.started')}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{new Date(lastRun.startedAt).toLocaleString('fr-CA')}</div>
              </div>
              {prevRun && (
                <>
                  <div style={{ width: 1, height: 36, background: 'var(--border)' }}/>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>
                      {t('lastrun.vs')} {new Date(prevRun.startedAt).toLocaleDateString('fr-CA')}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {SECTIONS.map(({ signal, color, icon }) => {
                        const d = diff(signal)
                        if (d === null) return null
                        return (
                          <span key={signal} style={{
                            fontSize: 13, fontWeight: 800,
                            color: d > 0 ? color : d < 0 ? '#f87171' : 'var(--text3)',
                          }}>
                            {icon} {d > 0 ? `+${d}` : d}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 4 stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.75rem' }}>
            {SECTIONS.map(({ signal, label, color, icon }) => {
              const count = grouped[signal]?.length || 0
              const d = diff(signal)
              const pct = total > 0 ? Math.round((count/total)*100) : 0
              return (
                <div key={signal} style={{
                  background: 'var(--bg2)', borderRadius: 14,
                  border: `1px solid ${color}25`,
                  padding: '1.1rem 1.2rem',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position:'absolute', bottom:-20, right:-20, width:80, height:80, borderRadius:'50%', background:color, opacity:0.07, filter:'blur(24px)' }}/>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 8,
                    background: `${color}18`, border: `1px solid ${color}35`,
                    color, fontSize: 13, fontWeight: 700, marginBottom: 10,
                  }}>{icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{count.toLocaleString('fr-CA')}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{label}</div>
                  <div style={{ marginTop: 10, background: `${color}15`, borderRadius: 99, height: 3 }}>
                    <div style={{ height:'100%', borderRadius:99, background:color, width:`${pct}%`, transition:'width 0.8s ease' }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                    <span style={{ fontSize:10, color:`${color}88` }}>{pct}%</span>
                    {d !== null && prevRun && (
                      <span style={{ fontSize:10, fontWeight:700, color: d>0 ? color : d<0 ? '#f87171' : 'var(--text3)' }}>
                        {d>0 ? `▲ +${d}` : d<0 ? `▼ ${d}` : '='}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sections leads */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {SECTIONS.map(({ signal, label, color, icon }) => {
              const items = grouped[signal] || []
              if (items.length === 0) return null
              return (
                <div key={signal}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem',
                    paddingBottom: '0.75rem', borderBottom: `1px solid ${color}20`,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      background: `${color}18`, border: `1px solid ${color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color, fontSize: 15, fontWeight: 800,
                    }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{label}</div>
                    </div>
                    <div style={{
                      marginLeft: 4,
                      background: `${color}18`, color, border: `1px solid ${color}35`,
                      borderRadius: 99, padding: '2px 12px', fontSize: 12, fontWeight: 700,
                    }}>{items.length}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10 }}>
                    {items.map(lead => <LeadCard key={lead._id} lead={lead} noname={t('signal.noname')} />)}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
