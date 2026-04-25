// pages/Leads.jsx — Calendrier leads
import { useState, useEffect } from 'react'
import api from '../utils/api'
import { ScoreBadge, SignalBadge, fmtDate } from '../components/ui/index'
import { generateLeadPDF } from '../utils/pdf'
import { useT } from '../i18n/useT'
import { useUiStore } from '../store/uiStore'

const DAYS_FR   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const DAYS_EN   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

const lnk = (color) => ({
  fontSize: 10, padding: '3px 9px', fontWeight: 700,
  background: `${color}12`, color, border: `1px solid ${color}30`,
  borderRadius: 6, textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center',
})

export default function Leads() {
  const t    = useT()
  const { lang } = useUiStore()

  const DAYS    = lang === 'fr' ? DAYS_FR : DAYS_EN
  const MONTHS  = lang === 'fr' ? MONTHS_FR : MONTHS_EN

  const SIG = {
    fermeture:    { color: '#f87171', label: t('fermeture.label') },
    demenagement: { color: '#fb923c', label: t('demenagement.label') },
    reouverture:  { color: '#2dd4bf', label: t('reouverture.label') },
    nouvelle:     { color: '#4ade80', label: t('nouvelle.label') },
  }

  const FILTERS = [
    { value: '',             label: t('leads.all'),          color: '#a78bfa' },
    { value: 'nouvelle',     label: t('nouvelle.label'),     color: '#4ade80' },
    { value: 'reouverture',  label: t('reouverture.label'),  color: '#2dd4bf' },
    { value: 'demenagement', label: t('demenagement.label'), color: '#fb923c' },
    { value: 'fermeture',    label: t('fermeture.label'),    color: '#f87171' },
  ]

  const [currentDate, setCurrentDate] = useState(new Date())
  const [calData,     setCalData]     = useState({})
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayLeads,    setDayLeads]    = useState([])
  const [loadingDay,  setLoadingDay]  = useState(false)
  const [filters, setFilters] = useState({ signal: '', ville: '', score: '' })

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const loadCalendar = async () => {
    try {
      const params = { month: month + 1, year }
      if (filters.signal) params.signal = filters.signal
      if (filters.ville)  params.ville  = filters.ville
      if (filters.score)  params.score  = filters.score
      const { data } = await api.get('/leads/calendar', { params })
      const map = {}
      data.forEach(d => { map[d._id.day] = d })
      setCalData(map)
    } catch (e) { console.error(e) }
  }

  const selectDay = async (day) => {
    setSelectedDay(day)
    setLoadingDay(true)
    try {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      const params = { date: dateStr, limit: 100 }
      if (filters.signal) params.signal = filters.signal
      if (filters.ville)  params.ville  = filters.ville
      if (filters.score)  params.score  = filters.score
      const { data } = await api.get('/leads', { params })
      setDayLeads(data.leads || [])
    } catch { /* ignore */ }
    setLoadingDay(false)
  }

  useEffect(() => { loadCalendar() }, [currentDate, filters])
  useEffect(() => { selectDay(new Date().getDate()) }, [])
  useEffect(() => { if (selectedDay) selectDay(selectedDay) }, [filters])

  const prevMonth = () => { const d = new Date(currentDate); d.setMonth(d.getMonth()-1); setCurrentDate(d); setSelectedDay(null) }
  const nextMonth = () => { const d = new Date(currentDate); d.setMonth(d.getMonth()+1); setCurrentDate(d); setSelectedDay(null) }

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const offset      = firstDay === 0 ? 6 : firstDay - 1
  const cells       = Array(offset).fill(null).concat(Array.from({length: daysInMonth}, (_,i) => i+1))
  while (cells.length % 7 !== 0) cells.push(null)

  const today    = new Date()
  const isToday  = (d) => d && today.getFullYear()===year && today.getMonth()===month && today.getDate()===d
  const maxCount = Math.max(...Object.values(calData).map(d => d.count || 0), 1)
  const totalMonth = Object.values(calData).reduce((s, d) => s + (d.count || 0), 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Hero Header */}
      <div style={{
        background: 'var(--bg2)', borderRadius: 18,
        border: '1px solid #38bdf820',
        padding: '1.5rem 2rem', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden', flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ position:'absolute', top:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'#38bdf8', opacity:0.05, filter:'blur(65px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, right:200, width:160, height:160, borderRadius:'50%', background:'#38bdf8', opacity:0.03, filter:'blur(45px)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:18, zIndex:1 }}>
          <div style={{
            width:52, height:52, borderRadius:14,
            background:'#38bdf818', border:'1px solid #38bdf830',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, color:'#38bdf8', boxShadow:'0 0 24px #38bdf822',
          }}>◈</div>
          <div>
            <div style={{ fontSize:9, color:'#38bdf8', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:6, opacity:0.9 }}>
              {MONTHS[month]} {year}
            </div>
            <div style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1 }}>
              {t('leads.title')}
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:5 }}>
              <span style={{ color:'#38bdf8', fontWeight:700 }}>{totalMonth.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}</span> {t('leads.thisMonth')}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', zIndex:1 }}>
          <div style={{ display:'flex', gap:4, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:4 }}>
            {FILTERS.map(s => (
              <button key={s.value} onClick={() => setFilters(f => ({...f, signal: s.value}))} style={{
                padding: '5px 13px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                border: 'none',
                background: filters.signal === s.value ? `${s.color}22` : 'transparent',
                color: filters.signal === s.value ? s.color : 'var(--text3)',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: filters.signal === s.value ? `0 0 8px ${s.color}25` : 'none',
              }}>{s.label}</button>
            ))}
          </div>
          <input placeholder={t('filter.city')} value={filters.ville}
            onChange={e => setFilters(f => ({...f, ville: e.target.value}))}
            style={{
              background: 'var(--bg3)', border: `1px solid ${filters.ville ? '#38bdf855' : 'var(--border)'}`,
              borderRadius: 9, color: 'var(--text)', padding: '6px 12px',
              fontSize: 12, width: 110, outline: 'none', transition: 'border-color 0.15s',
            }}
          />
          <select value={filters.score} onChange={e => setFilters(f => ({...f, score: e.target.value}))} style={{
            background: 'var(--bg3)', border: `1px solid ${filters.score ? '#38bdf855' : 'var(--border)'}`,
            borderRadius: 9, color: 'var(--text)', padding: '6px 10px', fontSize: 12,
          }}>
            <option value="">★ {t('leads.score')}</option>
            {[2,3,4,5,6].map(s => <option key={s} value={s}>★ ≥ {s}</option>)}
          </select>
          {(filters.signal || filters.ville || filters.score) && (
            <button onClick={() => setFilters({ signal: '', ville: '', score: '' })} style={{
              padding: '6px 11px', borderRadius: 9, fontSize: 11, fontWeight: 700,
              border: '1px solid #f8717135', background: '#f8717110', color: '#f87171', cursor: 'pointer',
            }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 390px' : '1fr', gap: 14, alignItems: 'start' }}>

        {/* Calendrier */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '1.5rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}>
          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <button onClick={prevMonth} style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text2)', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
            }}>‹</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.01em' }}>{MONTHS[month]}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{year}</div>
            </div>
            <button onClick={nextMonth} style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text2)', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
            }}>›</button>
          </div>

          {/* Noms jours */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 8 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.1em', padding: '3px 0' }}>{d}</div>
            ))}
          </div>

          {/* Cellules */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
            {cells.map((day, i) => {
              const info     = day ? calData[day] : null
              const count    = info?.count || 0
              const selected = day === selectedDay
              const todayDay = isToday(day)
              const intensity = count > 0 ? Math.min(count / maxCount, 1) : 0
              const topSig   = info?.topSignal
              const sigCol   = SIG[topSig]?.color || '#a78bfa'

              return (
                <div key={i} onClick={() => day && selectDay(day)} style={{
                  minHeight: 66, borderRadius: 11, padding: '8px 7px',
                  background: selected
                    ? '#a78bfa20'
                    : count > 0
                      ? `${sigCol}${Math.round(intensity * 14 + 6).toString(16).padStart(2,'0')}`
                      : day ? '#ffffff05' : 'transparent',
                  border: selected
                    ? '1.5px solid #a78bfa80'
                    : todayDay
                      ? '1.5px solid #a78bfa50'
                      : count > 0
                        ? `1px solid ${sigCol}30`
                        : '1px solid transparent',
                  cursor: day ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {selected && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: 'linear-gradient(90deg, transparent, #a78bfa, transparent)',
                    }}/>
                  )}
                  {day && (
                    <>
                      <div style={{
                        fontSize: 12, fontWeight: todayDay || selected ? 800 : 500,
                        color: todayDay ? '#a78bfa' : selected ? '#fff' : count > 0 ? '#e2e8f0' : 'var(--text3)',
                      }}>{day}</div>

                      {count > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            minWidth: 22, height: 18, borderRadius: 6, padding: '0 5px',
                            background: selected ? '#a78bfa40' : `${sigCol}30`,
                            color: selected ? '#a78bfa' : sigCol,
                            fontSize: 10, fontWeight: 800,
                            boxShadow: `0 0 6px ${sigCol}30`,
                          }}>{count}</div>
                          {info?.maxScore >= 5 && <div style={{ fontSize: 9, marginTop: 3 }}>🔥</div>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Légende */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(SIG).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 3, background: v.color, boxShadow: `0 0 4px ${v.color}60` }}/>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{v.label}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>
              {Object.keys(calData).length} {t('leads.activeDays')}
            </div>
          </div>
        </div>

        {/* Panneau jour */}
        {selectedDay && (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '1.25rem',
            animation: 'slideIn 0.2s ease',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            maxHeight: 'calc(100vh - 130px)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                  {selectedDay} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>{MONTHS[month]}</span>
                </div>
                {!loadingDay && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {dayLeads.length > 0
                      ? <><span style={{ color: '#a78bfa', fontWeight: 700 }}>{dayLeads.length}</span> lead{dayLeads.length > 1 ? 's' : ''}</>
                      : t('leads.noLead')}
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedDay(null)} style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text3)', cursor: 'pointer', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            {loadingDay ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
                  <div style={{ fontSize: 28, opacity: 0.2, marginBottom: 8 }}>◈</div>
                  <div style={{ fontSize: 12 }}>{t('leads.loading')}</div>
                </div>
              </div>
            ) : dayLeads.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
                  <div style={{ fontSize: 32, opacity: 0.15, marginBottom: 10 }}>◈</div>
                  <div style={{ fontSize: 13 }}>{t('leads.noleads')}</div>
                </div>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 2 }}>
                {dayLeads.map(lead => {
                  const sc = SIG[lead.signal]?.color || '#a78bfa'
                  return (
                    <div key={lead._id} style={{
                      background: '#ffffff04',
                      borderRadius: 11, padding: '0.85rem',
                      border: '1px solid var(--border)',
                      borderLeft: `3px solid ${sc}`,
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <ScoreBadge score={lead.score} />
                        <SignalBadge signal={lead.signal} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>
                        {lead.nom || <span style={{ color:'var(--text3)', fontStyle:'italic', fontWeight:400 }}>{t('leads.noname')}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 1 }}>
                        {lead.ville}{lead.secteurMatch ? ` · ${lead.secteurMatch}` : ''}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 1 }}>
                        {lead.adresse}{lead.codePostal ? ` · ${lead.codePostal}` : ''}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', opacity: 0.6, marginBottom: 9 }}>
                        {fmtDate(lead.dateCreation)} · NEQ {lead.neq}
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <a href={`https://www.google.com/search?q=${encodeURIComponent([lead.adresse,lead.ville,'QC',lead.codePostal].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer" style={lnk('#4285f4')}>📍 Maps</a>
                        <a href={`https://www.facebook.com/search/top?q=${encodeURIComponent(lead.nom||lead.secteurMatch)}`} target="_blank" rel="noreferrer" style={lnk('#3b82f6')}>📘 FB</a>
                        <a href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(lead.nom||lead.secteurMatch)}`} target="_blank" rel="noreferrer" style={lnk('#e879f9')}>📸 IG</a>
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(lead.nom||lead.secteurMatch)}`} target="_blank" rel="noreferrer" style={lnk('#4ade80')}>🌐 Web</a>
                        <button onClick={() => generateLeadPDF(lead)} style={{ ...lnk('#a78bfa'), background: '#a78bfa12', border: '1px solid #a78bfa30', cursor: 'pointer' }}>↓ PDF</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(14px); } to { opacity:1; transform:translateX(0); } }
      `}</style>
    </div>
  )
}
