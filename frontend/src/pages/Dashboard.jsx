// pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import api from '../utils/api'
import { useT } from '../i18n/useT'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function Dashboard() {
  const t = useT()
  const [year,  setYear]  = useState(new Date().getFullYear())
  const [data,  setData]  = useState(null)
  const [years, setYears] = useState([new Date().getFullYear()])

  useEffect(() => {
    api.get(`/stats/${year}`).then(({ data: d }) => {
      setData(d)
      if (d.years?.length) setYears(d.years)
    }).catch(() => {})
  }, [year])

  const m = (i) => data?.monthly?.find(x => x._id === i + 1)

  const SIGNALS = [
    { key: 'nouvelles',     label: t('nouvelle.label'),    color: '#4ade80', icon: '✦' },
    { key: 'reouvertures',  label: t('reouverture.label'), color: '#2dd4bf', icon: '↺' },
    { key: 'demenagements', label: t('demenagement.label'),color: '#fb923c', icon: '→' },
    { key: 'fermetures',    label: t('fermeture.label'),   color: '#f87171', icon: '✕' },
  ]

  const MONTHS = t('months.0') === 'January' ? MONTHS_EN : MONTHS_FR

  const barData = {
    labels: MONTHS,
    datasets: [
      { label: t('nouvelle.label'),    data: MONTHS.map((_, i) => m(i)?.nouvelles     || 0), backgroundColor: '#4ade8033', borderColor: '#4ade80', borderWidth: 1.5, borderRadius: 5 },
      { label: t('reouverture.label'), data: MONTHS.map((_, i) => m(i)?.reouvertures  || 0), backgroundColor: '#2dd4bf33', borderColor: '#2dd4bf', borderWidth: 1.5, borderRadius: 5 },
      { label: t('demenagement.label'),data: MONTHS.map((_, i) => m(i)?.demenagements || 0), backgroundColor: '#fb923c33', borderColor: '#fb923c', borderWidth: 1.5, borderRadius: 5 },
      { label: t('fermeture.label'),   data: MONTHS.map((_, i) => m(i)?.fermetures    || 0), backgroundColor: '#f8717133', borderColor: '#f87171', borderWidth: 1.5, borderRadius: 5 },
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
      backgroundColor: ['#4ade8033', '#2dd4bf33', '#fb923c33', '#f8717133'],
      borderColor:     ['#4ade80',   '#2dd4bf',   '#fb923c',   '#f87171'],
      borderWidth: 2,
      hoverBorderWidth: 3,
    }],
  }

  const donutOptions = {
    responsive: true,
    cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 }, padding: 12, boxWidth: 10 } },
      tooltip: { backgroundColor: '#0f1117', titleColor: '#f1f5f9', bodyColor: '#64748b', borderColor: '#1e2433', borderWidth: 1 },
    },
    animation: { duration: 700 },
  }

  const totalLeads = data?.totalLeads || 0
  const noLeads = !data || totalLeads === 0

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Hero Header */}
      <div style={{
        background: 'var(--bg2)', borderRadius: 18,
        border: '1px solid #a78bfa20',
        padding: '1.5rem 2rem', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'#a78bfa', opacity:0.06, filter:'blur(65px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, right:160, width:160, height:160, borderRadius:'50%', background:'#a78bfa', opacity:0.03, filter:'blur(45px)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:18, zIndex:1 }}>
          <div style={{
            width:52, height:52, borderRadius:14,
            background:'#a78bfa18', border:'1px solid #a78bfa30',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, color:'#a78bfa', boxShadow:'0 0 24px #a78bfa22',
          }}>▦</div>
          <div>
            <div style={{ fontSize:9, color:'#a78bfa', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:6, opacity:0.9 }}>
              {t('dashboard.subtitle')}
            </div>
            <div style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1 }}>
              {t('dashboard.title')}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:5, zIndex:1 }}>
          {years.map(y => (
            <button key={y} onClick={() => setYear(y)} style={{
              padding: '7px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700,
              border: y === year ? '1px solid #a78bfa55' : '1px solid var(--border)',
              background: y === year ? '#a78bfa18' : 'var(--bg3)',
              color: y === year ? '#a78bfa' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: y === year ? '0 0 12px #a78bfa20' : 'none',
            }}>{y}</button>
          ))}
        </div>
      </div>

      {noLeads ? (
        <div style={{
          background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border)',
          textAlign: 'center', padding: '4rem 2rem',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>◈</div>
          <div style={{ fontSize: 16, color: 'var(--text2)', fontWeight: 600 }}>{t('dashboard.nodata')} {year}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>{t('dashboard.launch')}</div>
        </div>
      ) : (
        <>
          {/* Hero total + signal cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, marginBottom: '1.25rem' }}>
            {/* Total leads */}
            <div style={{
              background: 'var(--bg2)', borderRadius: 14,
              border: '1px solid #a78bfa30',
              padding: '1.5rem',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 0 30px #a78bfa08',
            }}>
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 100, height: 100, borderRadius: '50%',
                background: '#a78bfa', opacity: 0.06, filter: 'blur(30px)',
              }}/>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
                {t('dashboard.total')}
              </div>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {totalLeads.toLocaleString('fr-CA')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
                {t('dashboard.avgscore')} <span style={{ color: '#a78bfa', fontWeight: 700 }}>★ {data?.scoreMoyen || 0}</span> / 6
              </div>
            </div>

            {/* 4 signal cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {SIGNALS.map(s => {
                const val = data?.[s.key] || 0
                const pct = totalLeads > 0 ? Math.round((val / totalLeads) * 100) : 0
                return (
                  <div key={s.key} style={{
                    background: 'var(--bg2)', borderRadius: 14,
                    border: `1px solid ${s.color}25`,
                    padding: '1.1rem 1.1rem',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', bottom: -20, right: -20,
                      width: 70, height: 70, borderRadius: '50%',
                      background: s.color, opacity: 0.07, filter: 'blur(20px)',
                    }}/>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: 8,
                      background: `${s.color}18`, border: `1px solid ${s.color}35`,
                      color: s.color, fontSize: 13, fontWeight: 700,
                      marginBottom: 10,
                    }}>{s.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                      {val.toLocaleString('fr-CA')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{s.label}</div>
                    <div style={{ marginTop: 10, background: `${s.color}15`, borderRadius: 99, height: 3 }}>
                      <div style={{ height: '100%', borderRadius: 99, background: s.color, width: `${pct}%`, transition: 'width 0.8s ease' }}/>
                    </div>
                    <div style={{ fontSize: 10, color: `${s.color}99`, marginTop: 4 }}>{pct}% {t('dashboard.pct')}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bar + Donut */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)', padding: '1.25rem' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#fbbf24', fontSize: 10, background: '#fbbf2418', border: '1px solid #fbbf2435', borderRadius: 5, padding: '2px 7px', letterSpacing: '0.1em' }}>
                  {year}
                </span>
                {t('dashboard.monthly')}
              </div>
              <Bar data={barData} options={barOptions} />
            </div>
            <div style={{ background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' }}>{t('dashboard.signals')}</div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut data={donutData} options={donutOptions} />
              </div>
            </div>
          </div>

          {/* Top villes + secteurs */}
          {(data.groupes?.length > 0 || data.secteurs?.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { title: t('dashboard.topCities'), items: data.groupes,  baseHue: 200 },
                { title: t('dashboard.topSec'),    items: data.secteurs, baseHue: 270 },
              ].map(({ title, items, baseHue }) => (
                <div key={title} style={{ background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)', padding: '1.25rem' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>{title}</div>
                  {(items || []).slice(0, 5).map((g, i) => {
                    const max = items[0]?.count || 1
                    const pct = (g.count / max) * 100
                    const c = `hsl(${baseHue + i * 18}, 70%, 60%)`
                    return (
                      <div key={g._id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, width: 20, height: 20,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          background: `${c}18`, color: c, borderRadius: 6, flexShrink: 0,
                        }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{g._id || '—'}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{g.count.toLocaleString('fr-CA')}</span>
                          </div>
                          <div style={{ background: 'var(--bg3)', borderRadius: 99, height: 3 }}>
                            <div style={{ height: '100%', borderRadius: 99, background: c, width: `${pct}%`, transition: 'width 0.7s ease' }}/>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
