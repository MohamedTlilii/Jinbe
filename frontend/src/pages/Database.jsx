// pages/Database.jsx
import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useT } from '../i18n/useT'
import { useUiStore } from '../store/uiStore'
import { ConfirmModal } from '../components/ui/index'

const fmt = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB'
  if (bytes >= 1048576)    return (bytes / 1048576).toFixed(1)    + ' MB'
  if (bytes >= 1024)       return (bytes / 1024).toFixed(0)       + ' KB'
  return bytes + ' B'
}
const fmtDuration = (ms) => {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60), rs = s % 60
  if (m < 60) return rs > 0 ? `${m}min ${rs}s` : `${m}min`
  const h = Math.floor(m / 60), rm = m % 60
  return rm > 0 ? `${h}h ${rm}min` : `${h}h`
}

const MONTH_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const MONTH_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function Database() {
  const t    = useT()
  const { lang } = useUiStore()

  const MONTH_NAMES = lang === 'fr' ? MONTH_FR : MONTH_EN

  const SIGNALS = [
    { key: 'nouvelle',     label: t('lastrun.nouvelles'), color: '#22c55e', icon: '✦' },
    { key: 'reouverture',  label: t('lastrun.reouv'),     color: '#f97316', icon: '↺' },
    { key: 'demenagement', label: t('lastrun.demen'),     color: '#3b82f6', icon: '→' },
    { key: 'fermeture',    label: t('lastrun.ferm'),      color: '#ef4444', icon: '✕' },
  ]

  const [stats,    setStats]    = useState(null)
  const [registry, setRegistry] = useState(null)
  const [storage,  setStorage]  = useState(null)
  const [signals,  setSignals]  = useState(null)
  const [runs,     setRuns]     = useState([])
  const [year,     setYear]     = useState(new Date().getFullYear())
  const [purging,    setPurging]    = useState(null)
  const [deletingRun,setDeletingRun] = useState(null)
  const [confirm,    setConfirm]    = useState(null)
  const [loading,    setLoading]    = useState(true)

  const load = (y) => {
    setLoading(true)
    Promise.all([
      api.get(`/stats/${y}`).then(({ data }) => setStats(data)).catch(() => {}),
      api.get('/stats/registry').then(({ data }) => setRegistry(data)).catch(() => {}),
      api.get('/stats/storage').then(({ data }) => setStorage(data)).catch(() => {}),
      api.get('/stats/signals').then(({ data }) => setSignals(data)).catch(() => {}),
      api.get('/runs').then(({ data }) => setRuns(data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { load(year) }, [year])
  useEffect(() => {
    const timer = setInterval(() => {
      api.get('/stats/storage').then(({ data }) => setStorage(data)).catch(() => {})
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  const handleDeleteRun = (id) => {
    setConfirm({
      title: lang === 'fr' ? 'Supprimer ce run ?' : 'Delete this run?',
      message: lang === 'fr' ? 'Cette action est irréversible.' : 'This action is irreversible.',
      confirmLabel: lang === 'fr' ? '✕ Supprimer' : '✕ Delete',
      color: '#ef4444',
      onConfirm: async () => {
        setConfirm(null)
        setDeletingRun(id)
        try { await api.delete(`/runs/${id}`); setRuns(r => r.filter(x => x._id !== id)) } catch {}
        setDeletingRun(null)
      }
    })
  }

  const handleDeleteAllRuns = () => {
    setConfirm({
      title: lang === 'fr' ? 'Supprimer tout l\'historique ?' : 'Delete all history?',
      message: lang === 'fr' ? 'Tous les runs seront supprimés définitivement.' : 'All runs will be permanently deleted.',
      confirmLabel: lang === 'fr' ? '✕ Tout supprimer' : '✕ Delete all',
      color: '#ef4444',
      onConfirm: async () => {
        setConfirm(null)
        setDeletingRun('all')
        try { await api.delete('/runs/all'); setRuns([]) } catch {}
        setDeletingRun(null)
      }
    })
  }

  const handlePurge = (type, label) => {
    setConfirm({
      title: lang === 'fr' ? `Vider "${label}" ?` : `Clear "${label}"?`,
      message: lang === 'fr' ? 'Supprime définitivement tous les leads de ce type.' : 'Permanently deletes all leads of this type.',
      confirmLabel: lang === 'fr' ? '✕ Vider' : '✕ Clear',
      color: '#ef4444',
      onConfirm: async () => {
        setConfirm(null)
        setPurging(type)
        try { await api.delete(`/leads/purge/${type}`); load(year) } catch {}
        setPurging(null)
      }
    })
  }

  const totalLeads    = stats?.totalLeads    || 0
  const nouvelles     = stats?.nouvelles     || 0
  const fermetures    = stats?.fermetures    || 0
  const demenagements = stats?.demenagements || 0
  const reouvertures  = stats?.reouvertures  || 0
  const monthly       = stats?.monthly       || []
  const villes        = stats?.groupes       || []
  const secteurs      = stats?.secteurs      || []
  const years         = stats?.years?.length ? stats.years : [year]

  const maxMonth   = Math.max(...monthly.map(m => m.total), 1)
  const maxVille   = Math.max(...villes.map(g => g.count), 1)
  const maxSecteur = Math.max(...secteurs.map(s => s.count), 1)

  const disk     = storage?.disk
  const diskPct  = disk ? Math.round((disk.used / disk.size) * 100) : 0
  const diskColor = diskPct > 90 ? '#ef4444' : diskPct > 75 ? '#f97316' : '#22c55e'
  const mongoUsed  = storage?.storageSize || 0
  const mongoIndex = storage?.indexSize   || 0
  const mongoTotal = mongoUsed + mongoIndex

  const signalValues = {
    nouvelle: nouvelles, reouverture: reouvertures,
    demenagement: demenagements, fermeture: fermetures,
  }

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* ── Hero Header ── */}
      <div style={{
        background: 'var(--bg2)', borderRadius: 18,
        border: '1px solid #94a3b820',
        padding: '1.5rem 2rem', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden', flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ position:'absolute', top:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'#94a3b8', opacity:0.05, filter:'blur(65px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, right:100, width:160, height:160, borderRadius:'50%', background:'#94a3b8', opacity:0.03, filter:'blur(40px)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:18, zIndex:1 }}>
          <div style={{
            width:52, height:52, borderRadius:14,
            background:'#94a3b818', border:'1px solid #94a3b828',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, color:'#94a3b8', boxShadow:'0 0 24px #94a3b818',
          }}>◫</div>
          <div>
            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:6, opacity:0.9 }}>
              {t('db.subtitle')}
            </div>
            <div style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1 }}>
              {t('db.title')}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12, zIndex:1, flexWrap:'wrap' }}>
          {!loading && totalLeads > 0 && (
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:36, fontWeight:900, color:'var(--text)', lineHeight:1, letterSpacing:'-0.03em', textShadow:'0 0 30px #94a3b820' }}>
                {totalLeads.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
              </div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>{t('db.leadsyear')}</div>
            </div>
          )}
          {years.length > 0 && (
            <div style={{ display:'flex', gap:4, background:'var(--bg3)', borderRadius:10, padding:3 }}>
              {years.map(y => (
                <button key={y} onClick={() => setYear(y)} style={{
                  padding:'5px 14px', borderRadius:7, fontSize:12, fontWeight:700,
                  border:'none',
                  background: y === year ? '#94a3b820' : 'transparent',
                  color: y === year ? '#94a3b8' : 'var(--text3)',
                  cursor:'pointer', transition:'all 0.15s',
                  boxShadow: y === year ? '0 0 8px #94a3b820' : 'none',
                }}>{y}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── REQ Strip ── */}
      {registry && (
        <div style={{
          background: 'var(--bg2)', borderRadius: 14,
          border: '1px solid #6c63ff25',
          padding: '1.1rem 1.5rem', marginBottom: 12,
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'#6c63ff', opacity:0.05, filter:'blur(40px)', pointerEvents:'none' }} />
          <div style={{ gridColumn:'1/-1', fontSize:9, color:'#6c63ff', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12, opacity:0.9 }}>
            {t('db.registry')}
          </div>
          {[
            { label: t('db.total'),    value: registry.total,    color: 'var(--text)' },
            { label: t('db.actives'),  value: registry.actifs,   color: '#22c55e'     },
            { label: t('db.inactives'),value: registry.inactifs, color: '#ef4444'     },
            { label: t('db.detected'), value: registry.leads,    color: '#6c63ff'     },
          ].map(({ label, value, color }, i) => (
            <div key={i} style={{ borderLeft: i > 0 ? '1px solid var(--border)' : 'none', paddingLeft: i > 0 ? 20 : 0 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>
                {(value || 0).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── 4 Signal KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
        {SIGNALS.map(({ key, label, color, icon }) => {
          const val = signalValues[key] || 0
          const pct = totalLeads > 0 ? Math.round((val / totalLeads) * 100) : 0
          return (
            <div key={key} style={{
              background: 'var(--bg2)', borderRadius: 14,
              border: `1px solid ${color}25`,
              padding: '1.1rem 1.2rem',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position:'absolute', bottom:-20, right:-20, width:80, height:80, borderRadius:'50%', background:color, opacity:0.07, filter:'blur(24px)', pointerEvents:'none' }} />
              <div style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:28, height:28, borderRadius:8,
                background:`${color}18`, border:`1px solid ${color}35`,
                color, fontSize:13, fontWeight:700, marginBottom:10,
              }}>{icon}</div>
              <div style={{ fontSize:28, fontWeight:900, color:'var(--text)', lineHeight:1 }}>{val.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{label}</div>
              <div style={{ marginTop:10, background:`${color}15`, borderRadius:99, height:3 }}>
                <div style={{ height:'100%', borderRadius:99, background:color, width:`${pct}%`, transition:'width 0.8s ease' }} />
              </div>
              <div style={{ fontSize:10, color:`${color}99`, marginTop:4 }}>{pct}% {t('dashboard.pct')}</div>
            </div>
          )
        })}
      </div>

      {/* ── Activité mensuelle ── */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'1.25rem 1.5rem', marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:10, background:'#94a3b818', color:'#94a3b8', border:'1px solid #94a3b835', borderRadius:5, padding:'2px 8px', letterSpacing:'0.1em' }}>
            {year}
          </span>
          {t('db.monthly')}
        </div>
        {monthly.length === 0 ? (
          <div style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'2rem 0', opacity:0.6 }}>
            {t('db.noleads')}
          </div>
        ) : (
          <div style={{ display:'flex', gap:5, height:120, alignItems:'flex-end' }}>
            {Array.from({ length: 12 }, (_, i) => {
              const m = monthly.find(x => x._id === i + 1)
              const h = m ? Math.max((m.total / maxMonth) * 90, 4) : 0
              const isActive = !!m
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  {m && <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700 }}>{m.total}</div>}
                  <div style={{
                    width:'100%', height: h || 3,
                    background: isActive ? 'var(--accent)' : 'var(--bg3)',
                    borderRadius:4,
                    boxShadow: isActive ? '0 0 8px var(--accent)30' : 'none',
                    transition:'height 0.6s ease',
                  }} />
                  <div style={{ fontSize:9, color:'var(--text3)', opacity:0.7 }}>{MONTH_NAMES[i]}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Top villes + Top secteurs ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        {[
          { title: t('db.topCities'),  items: villes,   max: maxVille,   baseHue: 200 },
          { title: t('db.topSec'),     items: secteurs,  max: maxSecteur, baseHue: 260 },
        ].map(({ title, items, max, baseHue }) => (
          <div key={title} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'1.25rem' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:14 }}>{title}</div>
            {items.length === 0 ? (
              <div style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'1.5rem 0', opacity:0.6 }}>{t('db.nodata')}</div>
            ) : items.slice(0, 20).map((g, i) => {
              const pct = max > 0 ? (g.count / max) * 100 : 0
              const c = `hsl(${baseHue + i * 6}, 70%, 58%)`
              return (
                <div key={g._id || i} style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 0' }}>
                  <span style={{
                    fontSize:10, fontWeight:800, width:22, height:22,
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                    background:`${c}18`, color:c, borderRadius:6, flexShrink:0,
                  }}>{i+1}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:12, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'76%' }}>{g._id || '—'}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{g.count.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}</span>
                    </div>
                    <div style={{ background:'var(--bg3)', borderRadius:99, height:3 }}>
                      <div style={{ height:'100%', borderRadius:99, background:c, width:`${pct}%`, transition:'width 0.6s ease' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Leads par signal + Purge ── */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'1.25rem 1.5rem', marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:14 }}>{t('db.bySignal')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
          {SIGNALS.map(({ key, label, color, icon }) => {
            const count = signals?.[key] || 0
            return (
              <div key={key} style={{
                background:`${color}08`, border:`1px solid ${color}30`,
                borderRadius:12, padding:'1rem',
                position:'relative', overflow:'hidden',
              }}>
                <div style={{ position:'absolute', bottom:-16, right:-16, width:60, height:60, borderRadius:'50%', background:color, opacity:0.1, filter:'blur(16px)', pointerEvents:'none' }} />
                <div style={{
                  width:26, height:26, borderRadius:7,
                  background:`${color}20`, border:`1px solid ${color}40`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color, fontSize:12, fontWeight:700, marginBottom:8,
                }}>{icon}</div>
                <div style={{ fontSize:24, fontWeight:900, color, lineHeight:1 }}>{count.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:5 }}>{label}</div>
              </div>
            )
          })}
        </div>

        {/* Purge zone */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:14 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8, marginBottom:10,
            background:'#ef444408', border:'1px solid #ef444420', borderRadius:8, padding:'0.5rem 0.85rem',
          }}>
            <span style={{ fontSize:12, color:'#ef4444', fontWeight:700 }}>{t('db.purge')}</span>
            <span style={{ fontSize:11, color:'var(--text3)' }}>{t('db.purgedesc')}</span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {SIGNALS.map(({ key, label, color }) => (
              <button key={key} onClick={() => handlePurge(key, label)} disabled={purging !== null}
                style={{
                  background:'var(--bg3)', border:`1px solid ${color}40`,
                  color: purging === key ? 'var(--text3)' : color,
                  borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:600,
                  cursor: purging !== null ? 'not-allowed' : 'pointer',
                  transition:'all 0.15s',
                }}>
                {purging === key ? t('db.purge.del') : `${t('db.purge.btn')} ${label.toLowerCase()}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stockage ── */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'1.25rem 1.5rem', marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>💾 {t('db.storage')}</div>
          <button
            onClick={() => api.get('/stats/storage').then(({ data }) => setStorage(data)).catch(()=>{})}
            style={{ fontSize:11, padding:'4px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:7, color:'var(--text2)', cursor:'pointer' }}
          >{t('db.refresh')}</button>
        </div>

        {!storage ? (
          <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:'1rem 0' }}>{t('db.loading')}</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns: disk ? '1fr 1fr' : '1fr', gap:12 }}>

            {/* MongoDB */}
            <div style={{ background:'var(--bg3)', borderRadius:12, padding:'1.1rem', border:'1px solid #6c63ff20' }}>
              <div style={{ fontSize:10, color:'#6c63ff', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>
                {t('db.mongo')} — {storage.dbName}
              </div>
              <div style={{ fontSize:28, fontWeight:900, color:'var(--text)', lineHeight:1 }}>{fmt(mongoTotal)}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12, marginTop:4 }}>
                {(storage.leadsCount || 0).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')} {t('db.docs')}
              </div>
              <div style={{ background:'#6c63ff20', borderRadius:99, height:6, overflow:'hidden', marginBottom:6 }}>
                <div style={{ width:`${mongoTotal > 0 ? Math.round((mongoUsed/mongoTotal)*100) : 50}%`, height:'100%', background:'#6c63ff', borderRadius:99, transition:'width 0.6s' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                <span style={{ color:'#6c63ff' }}>{lang === 'fr' ? 'Données' : 'Data'} {fmt(mongoUsed)}</span>
                <span style={{ color:'#22c55e' }}>Index {fmt(mongoIndex)}</span>
              </div>
            </div>

            {/* Disque */}
            {disk && (
              <div style={{ background:'var(--bg3)', borderRadius:12, padding:'1.1rem', border:`1px solid ${diskColor}20` }}>
                <div style={{ fontSize:10, color:diskColor, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>
                  {t('db.disk')} — {lang === 'fr' ? 'PC local' : 'Local PC'}
                </div>
                <div style={{ fontSize:28, fontWeight:900, color:'var(--text)', lineHeight:1 }}>{fmt(disk.free)}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12, marginTop:4 }}>
                  {t('db.free')} {fmt(disk.size)} {t('db.total_disk')}
                </div>
                <div style={{ background:`${diskColor}20`, borderRadius:99, height:6, overflow:'hidden', marginBottom:6 }}>
                  <div style={{ width:`${Math.min(diskPct,100)}%`, height:'100%', background:diskColor, borderRadius:99, transition:'width 0.6s' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                  <span style={{ color:diskColor }}>{diskPct}% {t('db.used')}</span>
                  <span style={{ color:'#22c55e' }}>{fmt(disk.free)} {t('db.free')}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Historique des runs ── */}
      {runs.length > 0 && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'1.25rem 1.5rem', marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{t('db.runs')}</div>
            <button onClick={handleDeleteAllRuns} disabled={deletingRun !== null} style={{
              fontSize:11, padding:'4px 12px', background:'#ef444410',
              border:'1px solid #ef444435', borderRadius:7, color:'#ef4444',
              cursor: deletingRun !== null ? 'not-allowed' : 'pointer', fontWeight:600,
            }}>
              {deletingRun === 'all' ? t('db.runs.deling') : t('db.runs.delall')}
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {runs.slice(0, 10).map((run, i) => (
              <div key={run._id || i} style={{
                display:'flex', alignItems:'center', gap:12,
                background:'var(--bg3)', borderRadius:9, padding:'0.55rem 1rem',
                fontSize:12, borderLeft:`3px solid ${run.isBaseline ? '#6c63ff' : run.isTest ? '#f97316' : '#22c55e'}`,
              }}>
                <span style={{ color:'var(--text3)', width:145, flexShrink:0, fontSize:11 }}>
                  {new Date(run.startedAt).toLocaleString('fr-CA')}
                </span>
                <span style={{ color:'var(--accent)', fontWeight:700, width:65, flexShrink:0 }}>
                  ⏱ {fmtDuration(run.durationMs)}
                </span>
                {run.isBaseline ? (
                  <span style={{ color:'#6c63ff', fontWeight:600 }}>{t('db.baseline')} · {(run.counts?.total||0).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')} {t('db.docs')}</span>
                ) : run.isTest ? (
                  <span style={{ color:'#f97316', fontWeight:600 }}>{t('db.test')}</span>
                ) : (
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', flex:1 }}>
                    {SIGNALS.map(({ key, icon, color }) => (
                      <span key={key} style={{ color, fontWeight:700 }}>
                        {icon} {(run.counts?.[key]||0).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
                      </span>
                    ))}
                  </div>
                )}
                <button onClick={() => handleDeleteRun(run._id)} disabled={deletingRun !== null} style={{
                  marginLeft:'auto', flexShrink:0,
                  fontSize:11, padding:'2px 8px', background:'transparent',
                  border:'1px solid #ef444430', borderRadius:6, color:'#ef4444',
                  cursor: deletingRun !== null ? 'not-allowed' : 'pointer', opacity: deletingRun !== null ? 0.4 : 1,
                }}>
                  {deletingRun === run._id ? t('db.runs.deling') : t('db.runs.delone')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
