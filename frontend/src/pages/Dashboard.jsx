// pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import api from '../utils/api'
import { useT } from '../i18n/useT'
import { LeadDetailModal } from '../components/ui/LeadDetailModal'
import { ScoreBadge, SignalBadge } from '../components/ui/index'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

const fmtDur = (ms) => {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60), rs = s % 60
  return rs > 0 ? `${m}min ${rs}s` : `${m}min`
}

const fmtAgo = (date) => {
  if (!date) return '—'
  const diff = Math.floor((Date.now() - new Date(date)) / 60000)
  if (diff < 1) return "À l'instant"
  if (diff < 60) return `Il y a ${diff}min`
  const h = Math.floor(diff / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA') : '—'

const SIG_COLOR = { nouvelle:'#4ade80', reouverture:'#2dd4bf', demenagement:'#fb923c', fermeture:'#f87171' }

const SCORE_COLOR = { 6:'#ef4444', 5:'#f97316', 4:'#eab308', 3:'#3b82f6', 2:'#6c63ff', 1:'#8b90a7' }

export default function Dashboard() {
  const t = useT()
  const navigate = useNavigate()
  const [year,        setYear]        = useState(new Date().getFullYear())
  const [data,        setData]        = useState(null)
  const [years,       setYears]       = useState([new Date().getFullYear()])
  const [runs,        setRuns]        = useState([])
  const [topLeads,    setTopLeads]    = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [weekData,    setWeekData]    = useState([])
  const [modalLead,   setModalLead]   = useState(null)
  const [scoresDist,  setScoresDist]  = useState({})

  useEffect(() => {
    api.get(`/stats/${year}`).then(({ data: d }) => {
      setData(d)
      if (d.years?.length) setYears(d.years)
    }).catch(() => {})
  }, [year])

  useEffect(() => {
    api.get('/stats/scores').then(({ data: d }) => setScoresDist(d)).catch(() => {})
  }, [])

  useEffect(() => {
    const now = new Date()
    Promise.all([
      api.get('/runs/latest'),
      api.get('/leads', { params: { score: 5, limit: 6 } }),
      api.get('/leads/nouveautes'),
      api.get('/leads/calendar', { params: { month: now.getMonth() + 1, year: now.getFullYear() } }),
    ]).then(([runsRes, topRes, recentRes, calRes]) => {
      setRuns(runsRes.data || [])
      setTopLeads(topRes.data?.leads || [])
      setRecentLeads((recentRes.data?.leads || []).slice(0, 9))
      const today = now.getDate()
      const calMap = {}
      ;(calRes.data || []).forEach(d => { calMap[d._id.day] = { count: d.count, sig: d.topSignal } })
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = today - i
        if (d > 0) days.push({ day: d, count: calMap[d]?.count || 0, sig: calMap[d]?.sig })
      }
      setWeekData(days)
    }).catch(() => {})
  }, [])

  const m = (i) => data?.monthly?.find(x => x._id === i + 1)
  const MONTHS = MONTHS_FR

  const SIGNALS = [
    { key: 'nouvelles',     label: t('nouvelle.label'),     color: '#4ade80', icon: '✦' },
    { key: 'reouvertures',  label: t('reouverture.label'),  color: '#2dd4bf', icon: '↺' },
    { key: 'demenagements', label: t('demenagement.label'), color: '#fb923c', icon: '→' },
    { key: 'fermetures',    label: t('fermeture.label'),    color: '#f87171', icon: '✕' },
  ]

  const SHORTCUTS = [
    { label: `⚡ ${t('nav.lastrun')}`,       path: '/nouveautes',    color: '#fbbf24' },
    { label: `✦ ${t('nav.nouvelles')}`,      path: '/nouvelles',     color: '#4ade80' },
    { label: `→ ${t('nav.demenagements')}`,  path: '/demenagements', color: '#fb923c' },
    { label: `↺ ${t('nav.reouvertures')}`,   path: '/reouvertures',  color: '#2dd4bf' },
    { label: `✕ ${t('nav.fermetures')}`,     path: '/fermetures',    color: '#f87171' },
    { label: `◉ ${t('nav.map')}`,            path: '/carte',         color: '#34d399' },
    { label: `◈ ${t('dashboard.calendar')}`, path: '/leads',         color: '#38bdf8' },
  ]

  const barData = {
    labels: MONTHS,
    datasets: [
      { label: t('nouvelle.label'),     data: MONTHS.map((_, i) => m(i)?.nouvelles     || 0), backgroundColor: '#4ade8033', borderColor: '#4ade80', borderWidth: 1.5, borderRadius: 5 },
      { label: t('reouverture.label'),  data: MONTHS.map((_, i) => m(i)?.reouvertures  || 0), backgroundColor: '#2dd4bf33', borderColor: '#2dd4bf', borderWidth: 1.5, borderRadius: 5 },
      { label: t('demenagement.label'), data: MONTHS.map((_, i) => m(i)?.demenagements || 0), backgroundColor: '#fb923c33', borderColor: '#fb923c', borderWidth: 1.5, borderRadius: 5 },
      { label: t('fermeture.label'),    data: MONTHS.map((_, i) => m(i)?.fermetures    || 0), backgroundColor: '#f8717133', borderColor: '#f87171', borderWidth: 1.5, borderRadius: 5 },
    ],
  }

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#64748b', font: { size: 11 }, boxWidth: 10, padding: 14 } },
      tooltip: { backgroundColor: '#0f1117', titleColor: '#f1f5f9', bodyColor: '#64748b', borderColor: '#1e2433', borderWidth: 1, padding: 10 },
    },
    scales: {
      x: { ticks: { color: '#3a4560', font: { size: 10 } }, grid: { color: '#1e243310' } },
      y: { ticks: { color: '#3a4560' }, grid: { color: '#1e243330' } },
    },
    animation: { duration: 700, easing: 'easeInOutQuart' },
  }

  const donutData = {
    labels: [t('nouvelle.label'), t('reouverture.label'), t('demenagement.label'), t('fermeture.label')],
    datasets: [{
      data: [data?.nouvelles || 0, data?.reouvertures || 0, data?.demenagements || 0, data?.fermetures || 0],
      backgroundColor: ['#4ade8033','#2dd4bf33','#fb923c33','#f8717133'],
      borderColor:     ['#4ade80',  '#2dd4bf',  '#fb923c',  '#f87171'],
      borderWidth: 2, hoverBorderWidth: 3,
    }],
  }

  const donutOptions = {
    responsive: true, cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 }, padding: 12, boxWidth: 10 } },
      tooltip: { backgroundColor: '#0f1117', titleColor: '#f1f5f9', bodyColor: '#64748b', borderColor: '#1e2433', borderWidth: 1 },
    },
    animation: { duration: 700 },
  }

  const totalLeads = data?.totalLeads || 0
  const noLeads = !data || totalLeads === 0
  const lastRun = runs[0] || null
  const maxWeek = weekData.length > 0 ? Math.max(...weekData.map(d => d.count), 1) : 1
  const scoreMoyen = data?.scoreMoyen || 0
  const scorePct = Math.min((scoreMoyen / 6) * 100, 100)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'var(--bg2)', borderRadius: 18,
        border: '1px solid #a78bfa20',
        padding: '1.5rem 2rem', marginBottom: '1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'#a78bfa', opacity:0.06, filter:'blur(65px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, right:160, width:160, height:160, borderRadius:'50%', background:'#a78bfa', opacity:0.03, filter:'blur(45px)', pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'center', gap:18, zIndex:1 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#a78bfa18', border:'1px solid #a78bfa30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#a78bfa', boxShadow:'0 0 24px #a78bfa22' }}>▦</div>
          <div>
            <div style={{ fontSize:9, color:'#a78bfa', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:6, opacity:0.9 }}>{t('dashboard.subtitle')}</div>
            <div style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1 }}>{t('dashboard.title')}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:5, zIndex:1 }}>
          {years.map(y => (
            <button key={y} onClick={() => setYear(y)} style={{
              padding:'7px 18px', borderRadius:9, fontSize:13, fontWeight:700,
              border: y === year ? '1px solid #a78bfa55' : '1px solid var(--border)',
              background: y === year ? '#a78bfa18' : 'var(--bg3)',
              color: y === year ? '#a78bfa' : 'var(--text3)',
              cursor:'pointer', transition:'all 0.15s',
              boxShadow: y === year ? '0 0 12px #a78bfa20' : 'none',
            }}>{y}</button>
          ))}
        </div>
      </div>

      {/* ── Raccourcis rapides ── */}
      <div style={{
        background: 'var(--bg2)', borderRadius: 12,
        border: '1px solid var(--border)',
        padding: '0.7rem 1.1rem', marginBottom: '1rem',
        display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 4 }}>{t('dashboard.quickaccess')}</span>
        {SHORTCUTS.map(s => (
          <button key={s.path} onClick={() => navigate(s.path)} style={{
            padding: '4px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
            background: `${s.color}12`, color: s.color,
            border: `1px solid ${s.color}25`,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = `${s.color}22`; e.currentTarget.style.boxShadow = `0 0 10px ${s.color}20` }}
            onMouseLeave={e => { e.currentTarget.style.background = `${s.color}12`; e.currentTarget.style.boxShadow = 'none' }}
          >{s.label}</button>
        ))}
      </div>

      {noLeads ? (
        <div style={{ background:'var(--bg2)', borderRadius:16, border:'1px solid var(--border)', textAlign:'center', padding:'4rem 2rem' }}>
          <div style={{ fontSize:48, marginBottom:16, opacity:0.2 }}>◈</div>
          <div style={{ fontSize:16, color:'var(--text2)', fontWeight:600 }}>{t('dashboard.nodata')} {year}</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:8 }}>{t('dashboard.launch')}</div>
        </div>
      ) : (
        <>
          {/* ── Total + 4 signal cards ── */}
          <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:10, marginBottom:'1rem' }}>
            <div style={{
              background:'var(--bg2)', borderRadius:14,
              border:'1px solid #a78bfa30', padding:'1.5rem',
              display:'flex', flexDirection:'column', justifyContent:'space-between',
              position:'relative', overflow:'hidden', boxShadow:'0 0 30px #a78bfa08',
            }}>
              <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:'#a78bfa', opacity:0.06, filter:'blur(30px)' }}/>
              <div>
                <div style={{ fontSize:10, letterSpacing:'0.18em', color:'#a78bfa', textTransform:'uppercase', fontWeight:700, marginBottom:8 }}>{t('dashboard.total')}</div>
                <div style={{ fontSize:42, fontWeight:900, color:'#fff', lineHeight:1, letterSpacing:'-0.02em' }}>{totalLeads.toLocaleString('fr-CA')}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>
                  {t('dashboard.avgscore')} <span style={{ color:'#a78bfa', fontWeight:700 }}>★ {scoreMoyen}</span> / 6
                </div>
              </div>
              {/* Score gauge */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('dashboard.avgscore')}</div>
                <div style={{ background: '#ffffff10', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                  <div style={{ height:'100%', borderRadius:99, width:`${scorePct}%`, background:'linear-gradient(90deg, #6c63ff, #a78bfa)', transition:'width 1s ease' }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:9, color:'var(--text3)' }}>
                  <span>1</span><span style={{ color:'#a78bfa', fontWeight:700 }}>{scoreMoyen}/6</span><span>6</span>
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
              {SIGNALS.map(s => {
                const val = data?.[s.key] || 0
                const pct = totalLeads > 0 ? Math.round((val / totalLeads) * 100) : 0
                return (
                  <div key={s.key} style={{
                    background:'var(--bg2)', borderRadius:14,
                    border:`1px solid ${s.color}25`, padding:'1.1rem',
                    position:'relative', overflow:'hidden', cursor:'pointer',
                  }} onClick={() => navigate(`/${s.key}`)}>
                    <div style={{ position:'absolute', bottom:-20, right:-20, width:70, height:70, borderRadius:'50%', background:s.color, opacity:0.07, filter:'blur(20px)' }}/>
                    <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, background:`${s.color}18`, border:`1px solid ${s.color}35`, color:s.color, fontSize:13, fontWeight:700, marginBottom:10 }}>{s.icon}</div>
                    <div style={{ fontSize:24, fontWeight:800, color:'#fff', lineHeight:1 }}>{val.toLocaleString('fr-CA')}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{s.label}</div>
                    <div style={{ marginTop:10, background:`${s.color}15`, borderRadius:99, height:3 }}>
                      <div style={{ height:'100%', borderRadius:99, background:s.color, width:`${pct}%`, transition:'width 0.8s ease' }}/>
                    </div>
                    <div style={{ fontSize:10, color:`${s.color}99`, marginTop:4 }}>{pct}% {t('dashboard.pct')}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Dernier run banner ── */}
          {lastRun && (
            <div style={{
              background:'var(--bg2)', borderRadius:14,
              border:'1px solid #fbbf2422', padding:'1rem 1.5rem',
              marginBottom:'1rem', display:'flex', gap:0, alignItems:'center', flexWrap:'wrap',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:-20, right:60, width:100, height:100, borderRadius:'50%', background:'#fbbf24', opacity:0.04, filter:'blur(35px)', pointerEvents:'none' }}/>
              <div style={{ fontSize:10, color:'#fbbf24', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', marginRight:20 }}>⚡ {t('lastrun.title')}</div>
              {[
                { label: t('lastrun.duration'), value: fmtDur(lastRun.durationMs) },
                { label: t('lastrun.started'),  value: fmtAgo(lastRun.startedAt) },
                { label: 'Date',                value: new Date(lastRun.startedAt).toLocaleString('fr-CA') },
                { label: t('lastrun.nouvelles'),value: lastRun.counts?.nouvelle || 0,     color:'#4ade80' },
                { label: t('lastrun.reouv'),    value: lastRun.counts?.reouverture || 0,  color:'#2dd4bf' },
                { label: t('lastrun.demen'),    value: lastRun.counts?.demenagement || 0, color:'#fb923c' },
                { label: t('lastrun.ferm'),     value: lastRun.counts?.fermeture || 0,    color:'#f87171' },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center' }}>
                  {i > 0 && <div style={{ width:1, height:32, background:'var(--border)', margin:'0 18px' }}/>}
                  <div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginBottom:2 }}>{item.label}</div>
                    <div style={{ fontSize:15, fontWeight:800, color: item.color || '#fff' }}>{item.value}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => navigate('/nouveautes')} style={{
                marginLeft:'auto', padding:'6px 14px', borderRadius:8, fontSize:11, fontWeight:700,
                background:'#fbbf2412', color:'#fbbf24', border:'1px solid #fbbf2428', cursor:'pointer',
              }}>{t('dashboard.view')}</button>
            </div>
          )}

          {/* ── Tendance 7 jours + Score distribution ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:'1rem' }}>

            {/* Sparkline 7 jours */}
            <div style={{ background:'var(--bg2)', borderRadius:14, border:'1px solid var(--border)', padding:'1.1rem 1.25rem' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>{t('dashboard.trend')}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>
                <span style={{ color:'#a78bfa', fontWeight:700 }}>{weekData.reduce((s,d) => s+d.count, 0)}</span> {t('dashboard.weekleads')}
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:70 }}>
                {weekData.map((d, i) => {
                  const h = maxWeek > 0 ? Math.max((d.count / maxWeek) * 100, 4) : 4
                  const c = d.sig ? (SIG_COLOR[d.sig] || '#a78bfa') : '#a78bfa'
                  return (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ fontSize:9, color:'var(--text3)', fontWeight:700 }}>{d.count || ''}</div>
                      <div style={{
                        width:'100%', borderRadius:5,
                        background: d.count > 0 ? c : '#ffffff0a',
                        height:`${h}%`, minHeight:4,
                        boxShadow: d.count > 0 ? `0 0 8px ${c}40` : 'none',
                        transition:'height 0.6s ease',
                      }}/>
                      <div style={{ fontSize:9, color:'var(--text3)' }}>{d.day}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Score distribution */}
            <div style={{ background:'var(--bg2)', borderRadius:14, border:'1px solid var(--border)', padding:'1.1rem 1.25rem' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>{t('dashboard.scoredist')}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>
                {t('dashboard.avgscore')} : <span style={{ color:'#a78bfa', fontWeight:700 }}>★ {scoreMoyen} / 6</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[6,5,4,3,2,1].map(s => {
                  const c = SCORE_COLOR[s]
                  const isAvg = Math.round(scoreMoyen) === s
                  const count = scoresDist[s] || 0
                  const maxCount = Math.max(...[6,5,4,3,2,1].map(x => scoresDist[x] || 0), 1)
                  const realPct = Math.round((count / maxCount) * 100)
                  return (
                    <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:c, width:14, textAlign:'center' }}>{s}★</span>
                      <div style={{ flex:1, background:'var(--bg3)', borderRadius:99, height:7, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:99, background:c, width:`${realPct}%`, transition:'width 0.8s ease', opacity: isAvg ? 1 : 0.55 }}/>
                      </div>
                      <span style={{ fontSize:9, color:'var(--text3)', width:32, textAlign:'right' }}>{count.toLocaleString('fr-CA')}</span>
                      {isAvg && <span style={{ fontSize:9, color:c, fontWeight:700 }}>{t('dashboard.avgmark')}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Bar + Donut ── */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:'1rem' }}>
            <div style={{ background:'var(--bg2)', borderRadius:14, border:'1px solid var(--border)', padding:'1.25rem' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:'1.1rem', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ color:'#fbbf24', fontSize:10, background:'#fbbf2418', border:'1px solid #fbbf2435', borderRadius:5, padding:'2px 7px', letterSpacing:'0.1em' }}>{year}</span>
                {t('dashboard.monthly')}
              </div>
              <Bar data={barData} options={barOptions} />
            </div>
            <div style={{ background:'var(--bg2)', borderRadius:14, border:'1px solid var(--border)', padding:'1.25rem', display:'flex', flexDirection:'column' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:'1rem' }}>{t('dashboard.signals')}</div>
              <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center' }}>
                <Doughnut data={donutData} options={donutOptions} />
              </div>
            </div>
          </div>

          {/* ── Leads haute priorité ── */}
          {topLeads.length > 0 && (
            <div style={{ background:'var(--bg2)', borderRadius:14, border:'1px solid #f9731625', padding:'1.1rem 1.25rem', marginBottom:'1rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{t('dashboard.priority')}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{t('dashboard.prioritydesc')}</div>
                </div>
                <button onClick={() => navigate('/leads')} style={{ padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:700, background:'#f9731612', color:'#f97316', border:'1px solid #f9731628', cursor:'pointer' }}>
                  {t('dashboard.viewall')}
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:8 }}>
                {topLeads.map(lead => {
                  const c = SIG_COLOR[lead.signal] || '#a78bfa'
                  return (
                    <div key={lead._id} onClick={() => setModalLead(lead)} style={{
                      background:'#ffffff04', borderRadius:10, padding:'0.75rem',
                      border:'1px solid var(--border)', borderLeft:`3px solid ${c}`,
                      cursor:'pointer', transition:'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ffffff08'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#ffffff04'; e.currentTarget.style.transform = 'none' }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                        <ScoreBadge score={lead.score} />
                        <SignalBadge signal={lead.signal} />
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:3, lineHeight:1.3 }}>
                        {lead.nom || <span style={{ color:'var(--text3)', fontStyle:'italic', fontWeight:400 }}>{t('signal.noname')}</span>}
                      </div>
                      <div style={{ fontSize:10, color:'var(--text3)' }}>{lead.ville}{lead.secteurMatch ? ` · ${lead.secteurMatch}` : ''}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Feed récent + Top régions + secteurs ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:'1rem' }}>

            {/* Feed activité récente */}
            <div style={{ background:'var(--bg2)', borderRadius:14, border:'1px solid var(--border)', padding:'1.1rem 1.25rem' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:12 }}>{t('dashboard.recent')}</div>
              {recentLeads.length === 0 ? (
                <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:'1.5rem 0' }}>{t('dashboard.norecentleads')}</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {recentLeads.map(lead => {
                    const c = SIG_COLOR[lead.signal] || '#a78bfa'
                    return (
                      <div key={lead._id} onClick={() => setModalLead(lead)} style={{
                        display:'flex', alignItems:'center', gap:8, padding:'6px 8px',
                        borderRadius:8, cursor:'pointer', transition:'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#ffffff06'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width:7, height:7, borderRadius:'50%', background:c, flexShrink:0, boxShadow:`0 0 5px ${c}` }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {lead.nom || t('dashboard.noname')}
                          </div>
                          <div style={{ fontSize:9, color:'var(--text3)' }}>{lead.ville} · {fmtDate(lead.dateTrouve)}</div>
                        </div>
                        <div style={{ fontSize:9, color:c, fontWeight:700, flexShrink:0 }}>{lead.score}/6</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Top régions */}
            <div style={{ background:'var(--bg2)', borderRadius:14, border:'1px solid var(--border)', padding:'1.1rem 1.25rem' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:12 }}>{t('dashboard.topCities')}</div>
              {(data.groupes || []).slice(0, 5).map((g, i) => {
                const max = data.groupes[0]?.count || 1
                const pct = (g.count / max) * 100
                const c = `hsl(${200 + i * 18}, 70%, 60%)`
                return (
                  <div key={g._id || i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0' }}>
                    <span style={{ fontSize:10, fontWeight:800, width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', background:`${c}18`, color:c, borderRadius:5, flexShrink:0 }}>{i+1}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                        <span style={{ fontSize:11, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>{g._id || '—'}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{g.count.toLocaleString('fr-CA')}</span>
                      </div>
                      <div style={{ background:'var(--bg3)', borderRadius:99, height:3 }}>
                        <div style={{ height:'100%', borderRadius:99, background:c, width:`${pct}%`, transition:'width 0.7s ease' }}/>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Top secteurs */}
            <div style={{ background:'var(--bg2)', borderRadius:14, border:'1px solid var(--border)', padding:'1.1rem 1.25rem' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:12 }}>{t('dashboard.topSec')}</div>
              {(data.secteurs || []).slice(0, 5).map((g, i) => {
                const max = data.secteurs[0]?.count || 1
                const pct = (g.count / max) * 100
                const c = `hsl(${270 + i * 18}, 70%, 60%)`
                return (
                  <div key={g._id || i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0' }}>
                    <span style={{ fontSize:10, fontWeight:800, width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', background:`${c}18`, color:c, borderRadius:5, flexShrink:0 }}>{i+1}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                        <span style={{ fontSize:11, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>{g._id || '—'}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{g.count.toLocaleString('fr-CA')}</span>
                      </div>
                      <div style={{ background:'var(--bg3)', borderRadius:99, height:3 }}>
                        <div style={{ height:'100%', borderRadius:99, background:c, width:`${pct}%`, transition:'width 0.7s ease' }}/>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {modalLead && <LeadDetailModal lead={modalLead} onClose={() => setModalLead(null)} />}
    </div>
  )
}
