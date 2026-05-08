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

export default function Database() {
  const t    = useT()
  const { lang } = useUiStore()

  const SIGNALS = [
    { key: 'nouvelle',     label: t('lastrun.nouvelles'), color: '#4ade80', icon: '✦' },
    { key: 'reouverture',  label: t('lastrun.reouv'),     color: '#2dd4bf', icon: '↺' },
    { key: 'demenagement', label: t('lastrun.demen'),     color: '#fb923c', icon: '→' },
    { key: 'fermeture',    label: t('lastrun.ferm'),      color: '#f87171', icon: '✕' },
  ]

  const [registry,    setRegistry]    = useState(null)
  const [storage,     setStorage]     = useState(null)
  const [runs,        setRuns]        = useState([])
  const [year,        setYear]        = useState(new Date().getFullYear())
  const [years,       setYears]       = useState([new Date().getFullYear()])
  const [refreshing,  setRefreshing]  = useState(false)
  const [storageCheck, setStorageCheck] = useState(null)
  const [deletingRun, setDeletingRun] = useState(null)
  const [confirm,     setConfirm]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/stats/registry').then(({ data }) => setRegistry(data)).catch(() => setLoadError(true)),
      api.get('/stats/storage').then(({ data }) => setStorage(data)).catch(() => setLoadError(true)),
      api.get('/runs').then(({ data }) => setRuns(data)).catch(() => {}),
      api.get(`/stats/${year}`).then(({ data }) => {
if (data.years?.length) setYears(data.years)
      }).catch(() => {}),
    ]).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    api.get(`/stats/${year}`).then(({ data }) => {
      if (data.years?.length) setYears(data.years)
    }).catch(() => {})
  }, [year])

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
        try { await api.delete(`/runs/${id}`); setRuns(r => r.filter(x => x._id !== id)) } catch { /* ignore */ }
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
        try { await api.delete('/runs/all'); setRuns([]) } catch { /* ignore */ }
        setDeletingRun(null)
      }
    })
  }

  const disk      = storage?.disk
  const diskPct   = disk ? Math.round((disk.used / disk.size) * 100) : 0
  const diskColor = diskPct > 90 ? '#ef4444' : diskPct > 75 ? '#f97316' : '#22c55e'
  const mongoUsed  = storage?.storageSize || 0
  const mongoIndex = storage?.indexSize   || 0
  const mongoTotal = mongoUsed + mongoIndex

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
      </div>

      {/* ── Erreur chargement ── */}
      {loadError && !loading && (
        <div style={{
          background: '#f97316' + '12', border: '1px solid ' + '#f97316' + '30',
          borderRadius: 10, padding: '10px 16px', marginBottom: 12,
          fontSize: 12, color: '#f97316', fontWeight: 600,
        }}>
          ⚠ Certaines données n'ont pas pu être chargées — vérifiez la connexion au serveur.
        </div>
      )}

      {/* ── REQ Strip ── */}
      {registry && (
        <div style={{
          background: 'var(--bg2)', borderRadius: 14,
          border: '1px solid #6c63ff25',
          padding: '1.1rem 1.5rem', marginBottom: 12,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'#6c63ff', opacity:0.05, filter:'blur(40px)', pointerEvents:'none' }} />

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:9, color:'#6c63ff', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', opacity:0.9 }}>
              {t('db.registry')}
            </div>
            {years.length > 0 && (
              <div style={{ display:'flex', gap:3, background:'var(--bg3)', borderRadius:8, padding:3 }}>
                {years.map(y => (
                  <button key={y} onClick={() => setYear(y)} style={{
                    padding:'3px 12px', borderRadius:6, fontSize:11, fontWeight:700,
                    border:'none', cursor:'pointer', transition:'all 0.15s',
                    background: y === year ? '#6c63ff22' : 'transparent',
                    color: y === year ? '#6c63ff' : 'var(--text3)',
                    boxShadow: y === year ? '0 0 8px #6c63ff20' : 'none',
                  }}>{y}</button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0 }}>
            {[
              { label: t('db.total'),    value: registry.total,    color: 'var(--text)' },
              { label: t('db.actives'),  value: registry.actifs,   color: '#22c55e'     },
              { label: t('db.inactives'),value: registry.inactifs, color: '#ef4444'     },
            ].map(({ label, value, color }, i) => (
              <div key={i} style={{ borderLeft: i > 0 ? '1px solid var(--border)' : 'none', paddingLeft: i > 0 ? 20 : 0 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>
                  {(value ?? 0).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stockage ── */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'1.25rem 1.5rem', marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>💾 {t('db.storage')}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {storageCheck && (
              <span style={{
                fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:6,
                background: storageCheck.ok ? '#22c55e15' : '#ef444415',
                color: storageCheck.ok ? '#22c55e' : '#ef4444',
                border: `1px solid ${storageCheck.ok ? '#22c55e30' : '#ef444430'}`,
              }}>
                {storageCheck.ok ? '✓ Correct' : '✕ Erreur'} · {storageCheck.time}
              </span>
            )}
            <button
              onClick={async () => {
                setRefreshing(true)
                setStorageCheck(null)
                try {
                  const { data } = await api.get('/stats/storage')
                  setStorage(data)
                  const ok = data && data.storageSize > 0 && data.leadsCount > 0 && data.disk?.free > 0
                  const time = new Date().toLocaleTimeString('fr-CA')
                  setStorageCheck({ ok, time })
                } catch {
                  const time = new Date().toLocaleTimeString('fr-CA')
                  setStorageCheck({ ok: false, time })
                }
                setRefreshing(false)
              }}
              disabled={refreshing}
              style={{
                fontSize:11, padding:'4px 12px', background:'var(--bg3)',
                border:'1px solid var(--border)', borderRadius:7,
                color: refreshing ? '#22c55e' : 'var(--text2)',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', gap:5, transition:'color 0.2s',
              }}
            >
              <span style={{ display:'inline-block', animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}>↻</span>
              {refreshing ? (lang === 'fr' ? 'Vérification...' : 'Checking...') : t('db.refresh')}
            </button>
          </div>
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
