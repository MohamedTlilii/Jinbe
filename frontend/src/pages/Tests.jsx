import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { ConfirmModal } from '../components/ui/index'
import { useEngineStore } from '../store/engineStore'
import { useT } from '../i18n/useT'
import { useUiStore } from '../store/uiStore'

const PRESETS = [10, 20, 50, 100]

const BUMP_TYPES = [
  { type: 'patch',  color: '#4ade80', icon: '◦', label: 'Patch',  rule: 'x.x.N', desc_fr: 'Correction de bug, petit ajustement',    desc_en: 'Bug fix, small adjustment'       },
  { type: 'minor',  color: '#38bdf8', icon: '◈', label: 'Minor',  rule: 'x.N.0', desc_fr: 'Nouvelle fonctionnalité, évolution',      desc_en: 'New feature, evolution'          },
  { type: 'major',  color: '#c084fc', icon: '◉', label: 'Major',  rule: 'N.0.0', desc_fr: 'Refonte, changement majeur, breaking',    desc_en: 'Rewrite, major change, breaking' },
  { type: 'manuel', color: '#fbbf24', icon: '✎', label: 'Manuel', rule: 'x.y.z', desc_fr: 'Saisir le numéro exact que tu veux',      desc_en: 'Enter the exact number you want' },
]

const TYPE_COLORS_ALL = { patch: '#4ade80', minor: '#38bdf8', major: '#c084fc', manuel: '#fbbf24' }
const TYPE_COLORS     = { patch: '#4ade80', minor: '#38bdf8', major: '#c084fc', manuel: '#fbbf24' }

function bumpPreview(v, type) {
  const [a, b, c] = (v || '1.0.0').split('.').map(Number)
  if (type === 'major') return `${a + 1}.0.0`
  if (type === 'minor') return `${a}.${b + 1}.0`
  return `${a}.${b}.${c + 1}`
}

const ANIM = `
  @keyframes fadeUp   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  @keyframes blinkDot { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes scanLine { 0%{top:0} 100%{top:100%} }
`

function SeedCard({ sig, count, status, onSeed, onNavigate, t, lang }) {
  const [hov, setHov] = useState(false)
  const active  = count > 0
  const loading = status === 'loading'
  const done    = status === 'ok'
  const err     = status === 'error'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${hov ? sig.color + '30' : 'var(--border)'}`,
        borderLeft: `3px solid ${sig.color}`,
        borderRadius: 14, padding: '1.1rem',
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 8px 28px ${sig.color}12` : 'none',
        display: 'flex', flexDirection: 'column', gap: 10,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {hov && (
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 100, height: 100, borderRadius: '50%',
          background: sig.color, opacity: 0.05, filter: 'blur(28px)',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${sig.color}18`, border: `1px solid ${sig.color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: sig.color,
          boxShadow: `0 0 16px ${sig.color}20`,
        }}>{sig.icon}</div>

        {active ? (
          <span style={{
            fontSize: 10, padding: '3px 9px', borderRadius: 99, fontWeight: 700,
            background: `${sig.color}20`, color: sig.color,
            border: `1px solid ${sig.color}35`,
            boxShadow: `0 0 8px ${sig.color}15`,
          }}>
            {count} {count > 1 ? t('tests.actives') : t('tests.active')}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--text3)', opacity: 0.5 }}>{t('tests.empty')}</span>
        )}
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 3, letterSpacing: '-0.01em' }}>
          {sig.label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>{sig.desc}</div>
      </div>

      <button
        onClick={onSeed}
        disabled={loading}
        style={{
          padding: '7px 0', borderRadius: 9, fontSize: 12, fontWeight: 700,
          background: done ? '#4ade8022' : err ? '#f8717122' : `${sig.color}`,
          color: done ? '#4ade80' : err ? '#f87171' : '#fff',
          border: done ? '1px solid #4ade8044' : err ? '1px solid #f8717144' : 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
          boxShadow: !done && !err && !loading ? `0 3px 12px ${sig.color}30` : 'none',
        }}
      >
        {loading ? t('tests.seeding') : done ? t('tests.seeded') : err ? t('tests.error') : `+ ${lang === 'fr' ? 'Créer lead test' : 'Create test lead'}`}
      </button>

      <button
        onClick={onNavigate}
        style={{
          fontSize: 10, color: sig.color, background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', padding: 0, fontWeight: 600,
          opacity: 0.7, letterSpacing: '0.02em',
        }}
      >
        {t('tests.view')} {sig.label}
      </button>
    </div>
  )
}

export default function Tests() {
  const navigate = useNavigate()
  const t = useT()
  const { status: engineStatus, runTestMode, resetDB, ws } = useEngineStore()
  const isProcessing = engineStatus.isProcessing

  const { lang } = useUiStore()

  const SIGNALS = [
    { key: 'nouvelle',     label: t('nouvelle.label'),     color: '#4ade80', icon: '✦', desc: lang === 'fr' ? 'Entreprise jamais vue dans le registre' : 'Business never seen in registry', route: '/nouvelles'    },
    { key: 'reouverture',  label: t('reouverture.label'),  color: '#2dd4bf', icon: '↺', desc: lang === 'fr' ? 'Était fermée, redevient active'         : 'Was closed, becomes active again',  route: '/reouvertures'  },
    { key: 'demenagement', label: t('demenagement.label'), color: '#fb923c', icon: '→', desc: lang === 'fr' ? 'Adresse changée + historique conservé'  : 'Address changed + history kept',    route: '/demenagements' },
    { key: 'fermeture',    label: t('fermeture.label'),    color: '#f87171', icon: '✕', desc: lang === 'fr' ? 'statutREQ → Fermé'                       : 'statusREQ → Closed',               route: '/fermetures'    },
  ]

  const [activeLeads,  setActiveLeads]  = useState([])
  const [statuses,     setStatuses]     = useState({})
  const [resetStatus,  setResetStatus]  = useState(null)
  const [logs,         setLogs]         = useState([])
  const [testLimit,    setTestLimit]    = useState(10)
  const [testRunning,  setTestRunning]  = useState(false)
  const [resetDBState, setResetDBState] = useState(null)
  const [versionData,  setVersionData]  = useState(null)
  const [bumpType,     setBumpType]     = useState(null)
  const [bumpNote,     setBumpNote]     = useState('')
  const [manualVer,    setManualVer]    = useState('')
  const [manualErr,    setManualErr]    = useState('')
  const [bumping,      setBumping]      = useState(false)
  const logRef = useRef(null)

  const [confirm,     setConfirm]     = useState(null)
  const [diagRunning, setDiagRunning] = useState(false)
  const [diagResult,  setDiagResult]  = useState(null)
  const [ramData,     setRamData]     = useState(null)
  const [ramHistory,  setRamHistory]  = useState([])
  const [ramPeak,     setRamPeak]     = useState(0)
  const [dlModal,     setDlModal]     = useState(false)
  const [dlRunning,   setDlRunning]   = useState(false)
  const [dlResult,    setDlResult]    = useState(null)

  const addLog = (msg, type = 'info') => {
    const ts = new Date().toLocaleTimeString('fr-CA')
    setLogs(prev => [{ ts, msg, type, id: Date.now() + Math.random() }, ...prev].slice(0, 30))
  }

  const loadVersion = useCallback(async () => {
    try { const { data } = await api.get('/version'); setVersionData(data) } catch {}
  }, [])

  useEffect(() => { loadVersion() }, [loadVersion])

  const doBump = () => {
    if (!bumpType) return
    setManualErr('')
    if (bumpType === 'manuel') {
      if (!/^\d+\.\d+\.\d+$/.test(manualVer.trim())) {
        setManualErr(t('tests.ver.invalid'))
        return
      }
    }
    const preview = bumpType === 'manuel' ? manualVer.trim() : bumpPreview(versionData?.version, bumpType)
    setConfirm({
      title: lang === 'fr' ? `Appliquer v${preview} ?` : `Apply v${preview}?`,
      message: lang === 'fr' ? `Version actuelle : v${versionData?.version}` : `Current version: v${versionData?.version}`,
      confirmLabel: lang === 'fr' ? '⬆ Confirmer' : '⬆ Confirm',
      color: '#c084fc',
      onConfirm: async () => {
        setConfirm(null)
        setBumping(true)
        try {
          const body = bumpType === 'manuel'
            ? { manual: manualVer.trim(), note: bumpNote }
            : { type: bumpType, note: bumpNote }
          const { data } = await api.post('/version/bump', body)
          setVersionData(data)
          addLog(`Version → v${data.version} (${bumpType})${bumpNote ? ' — ' + bumpNote : ''}`, 'ok')
          setBumpType(null)
          setBumpNote('')
          setManualVer('')
        } catch (e) {
          const msg = e.response?.data?.error || e.message
          setManualErr(msg)
          addLog(t('common.error') + ' version : ' + msg, 'error')
        }
        setBumping(false)
      }
    })
  }

  const loadActive = useCallback(async () => {
    try {
      const { data } = await api.get('/tests/active')
      setActiveLeads(data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadActive() }, [loadActive])

  const seed = async (signal) => {
    setStatuses(s => ({ ...s, [signal]: 'loading' }))
    try {
      const { data } = await api.post(`/tests/seed/${signal}`)
      setStatuses(s => ({ ...s, [signal]: 'ok' }))
      addLog(`${signal.toUpperCase()} — NEQ ${data.neq} · ${data.nom || '?'} · ${data.ville || '?'}`, 'ok')
      await loadActive()
    } catch (e) {
      setStatuses(s => ({ ...s, [signal]: 'error' }))
      addLog(`${t('common.error')} ${signal} : ${e.response?.data?.error || e.message}`, 'error')
    }
    setTimeout(() => setStatuses(s => ({ ...s, [signal]: null })), 3000)
  }

  const resetOne = (neq, nom) => {
    setConfirm({
      title: lang === 'fr' ? 'Remettre en baseline ?' : 'Reset to baseline?',
      message: nom || `NEQ ${neq}`,
      confirmLabel: lang === 'fr' ? '↺ Confirmer' : '↺ Confirm',
      color: '#f97316',
      onConfirm: async () => {
        setConfirm(null)
        try {
          await api.delete(`/tests/reset/${neq}`)
          addLog(`Reset — NEQ ${neq} · ${nom || '?'} → baseline`, 'info')
          await loadActive()
        } catch (e) { addLog(t('common.error') + ' reset : ' + e.message, 'error') }
      }
    })
  }

  const resetAll = () => {
    setConfirm({
      title: lang === 'fr' ? 'Tout remettre en baseline ?' : 'Reset all to baseline?',
      message: lang === 'fr' ? 'Tous les leads de test redeviennent baseline.' : 'All test leads will become baseline.',
      confirmLabel: lang === 'fr' ? '↺ Confirmer' : '↺ Confirm',
      color: '#f97316',
      onConfirm: async () => {
        setConfirm(null)
        setResetStatus('loading')
        try {
          const { data } = await api.delete('/tests/reset')
          setResetStatus('ok')
          addLog(`Reset — ${data.reset} lead(s) → baseline`, 'ok')
          setActiveLeads([])
        } catch (e) {
          setResetStatus('error')
          addLog(t('common.error') + ' reset : ' + e.message, 'error')
        }
        setTimeout(() => setResetStatus(null), 3000)
      }
    })
  }

  const launchTest = () => {
    const n = Math.min(Math.max(parseInt(testLimit) || 10, 1), 500)
    setConfirm({
      title: lang === 'fr' ? `Lancer le test — ${n} leads ?` : `Run test — ${n} leads?`,
      message: lang === 'fr' ? 'Lance le moteur sur les premières entrées du registre REQ.' : 'Runs the engine on the first registry entries.',
      confirmLabel: lang === 'fr' ? '⚗ Lancer' : '⚗ Run',
      color: '#fb923c',
      onConfirm: async () => {
        setConfirm(null)
        setTestRunning(true)
        addLog(`${lang === 'fr' ? 'Lancement test moteur' : 'Launching engine test'} — ${n} leads...`, 'info')
        try {
          await runTestMode(n)
          addLog(`Test ${n} ✓`, 'ok')
        } catch (e) {
          addLog(t('common.error') + ' test : ' + (e.response?.data?.error || e.message), 'error')
        }
        setTimeout(() => setTestRunning(false), 3000)
      }
    })
  }

  const handleResetDB = () => {
    setConfirm({
      title: lang === 'fr' ? 'Réinitialiser la base ?' : 'Reset database?',
      message: lang === 'fr' ? 'Supprime TOUTE la base et recharge les 2.9M du registre. Irréversible.' : 'Deletes ALL data and reloads 2.9M registry entries. Irreversible.',
      confirmLabel: lang === 'fr' ? '✕ Réinitialiser' : '✕ Reset',
      color: '#ef4444',
      onConfirm: async () => {
        setConfirm(null)
        setResetDBState('loading')
        addLog(lang === 'fr' ? 'Reset DB lancé...' : 'DB reset started...', 'info')
        try {
          await resetDB()
          setResetDBState('ok')
          addLog(lang === 'fr' ? 'Reset DB lancé — rechargement baseline en cours' : 'DB reset launched — reloading baseline', 'ok')
        } catch (e) {
          setResetDBState('error')
          addLog(t('common.error') + ' Reset DB : ' + (e.response?.data?.error || e.message), 'error')
        }
        setTimeout(() => setResetDBState(null), 4000)
      }
    })
  }

  const runDiag = async () => {
    setDiagRunning(true)
    setDiagResult(null)
    try {
      const { data } = await api.get('/tests/health-full')
      setDiagResult(data)
      addLog(lang === 'fr' ? 'Diagnostic terminé' : 'Diagnostic complete', 'ok')
    } catch (e) { addLog('Diagnostic : ' + e.message, 'error') }
    setDiagRunning(false)
  }

  const fetchRam = async () => {
    try {
      const { data } = await api.get('/tests/ram')
      setRamData(data)
      setRamHistory(h => [...h.slice(-29), data.heapUsed])
      setRamPeak(p => Math.max(p, data.heapUsed))
    } catch {}
  }

  useEffect(() => {
    fetchRam()
    const iv = setInterval(fetchRam, isProcessing ? 1500 : 6000)
    return () => clearInterval(iv)
  }, [isProcessing])

  const openDlModal = async () => {
    setDlModal(true)
    setDlRunning(true)
    setDlResult(null)
    try {
      const { data } = await api.get('/tests/check-download')
      setDlResult(data)
    } catch (e) { addLog('Download check : ' + e.message, 'error') }
    setDlRunning(false)
  }

  const fmtFree = (bytes) => {
    const gb = bytes / 1024 / 1024 / 1024
    return gb >= 1 ? gb.toFixed(1) + ' GB' : Math.round(bytes / 1024 / 1024) + ' MB'
  }

  const wsOk = ws && ws.readyState === 1

  const countBySignal = (sig) => activeLeads.filter(l => l.signal === sig).length
  const totalActive   = activeLeads.length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <style>{ANIM}</style>

      {/* ── Hero ── */}
      <div style={{
        background: 'var(--bg2)', borderRadius: 18,
        border: '1px solid #c084fc22',
        padding: '1.75rem 2rem', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'#c084fc', opacity:0.06, filter:'blur(65px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, right:120, width:160, height:160, borderRadius:'50%', background:'#a78bfa', opacity:0.04, filter:'blur(45px)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:18, zIndex:1 }}>
          <div style={{
            width:56, height:56, borderRadius:16,
            background:'#c084fc18', border:'1px solid #c084fc30',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:24, color:'#c084fc',
            boxShadow:'0 0 28px #c084fc22',
          }}>⚗</div>
          <div>
            <div style={{ fontSize:9, color:'#c084fc', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:6, opacity:0.9 }}>
              {t('tests.subtitle')}
            </div>
            <div style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1 }}>
              {t('tests.title')}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:20, alignItems:'center', zIndex:1 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'7px 16px', borderRadius:99,
            background: isProcessing ? '#00ff8812' : '#ffffff08',
            border: `1px solid ${isProcessing ? '#00ff8830' : '#ffffff12'}`,
          }}>
            <span style={{
              width:7, height:7, borderRadius:'50%', flexShrink:0,
              background: isProcessing ? '#00ff88' : '#4a5568',
              boxShadow: isProcessing ? '0 0 8px #00ff88' : 'none',
              animation: isProcessing ? 'blinkDot 1.2s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize:11, fontWeight:700, color: isProcessing ? '#00ff88' : 'var(--text3)' }}>
              {isProcessing ? t('status.active') : t('status.stopped')}
            </span>
          </div>

          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:42, fontWeight:900, color:'var(--text)', lineHeight:1, letterSpacing:'-0.04em', textShadow:'0 0 40px #c084fc25' }}>
              {totalActive}
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{t('tests.activeleads')}</div>
          </div>
        </div>
      </div>

      {/* ── Modal Download ── */}
      {dlModal && (
        <div onClick={() => !dlRunning && setDlModal(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center',
          backdropFilter:'blur(6px)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'var(--bg2)', borderRadius:18, padding:'1.75rem',
            width:420, border:'1px solid #38bdf825',
            boxShadow:'0 24px 80px rgba(0,0,0,0.6)',
            animation:'fadeUp 0.3s ease',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:'#38bdf818', border:'1px solid #38bdf828', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#38bdf8' }}>🌐</div>
              <div>
                <div style={{ fontSize:9, color:'#38bdf8', fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:2 }}>{lang === 'fr' ? 'Vérification' : 'Check'}</div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>{lang === 'fr' ? 'Téléchargement registre' : 'Registry download'}</div>
              </div>
            </div>

            {dlRunning ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[lang === 'fr' ? 'Serveur Données Québec' : 'Données Québec server',
                  lang === 'fr' ? 'Version locale' : 'Local version',
                  lang === 'fr' ? 'ZIP local (temp/)' : 'Local ZIP (temp/)',
                  lang === 'fr' ? 'Intégrité ZIP' : 'ZIP integrity',
                ].map((label, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg3)', borderRadius:10 }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid #38bdf8', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
                    <span style={{ fontSize:12, color:'var(--text2)' }}>{label}</span>
                  </div>
                ))}
              </div>
            ) : dlResult ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {dlResult.steps.map((step, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'10px 14px', background: step.ok ? '#22c55e0a' : '#ef44440a',
                    border:`1px solid ${step.ok ? '#22c55e25' : '#ef444425'}`,
                    borderRadius:10, animation:`fadeUp ${0.15 + i * 0.08}s ease`,
                  }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>{step.ok ? '✓' : '✕'}</span>
                    <span style={{ fontSize:12, color:'var(--text)', flex:1, fontWeight:600 }}>{step.label}</span>
                    <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'monospace' }}>{step.detail}</span>
                  </div>
                ))}
                <div style={{ marginTop:8, padding:'10px 14px', borderRadius:10, background: dlResult.allOk ? '#22c55e12' : '#f9731612', border:`1px solid ${dlResult.allOk ? '#22c55e30' : '#f9731630'}`, fontSize:12, fontWeight:700, color: dlResult.allOk ? '#22c55e' : '#f97316', textAlign:'center' }}>
                  {dlResult.allOk ? (lang === 'fr' ? '✓ Tout est prêt pour un run' : '✓ Ready for a run') : (lang === 'fr' ? '⚠ Vérifiez les étapes en erreur' : '⚠ Check failing steps')}
                </div>
              </div>
            ) : null}

            {!dlRunning && (
              <button onClick={() => setDlModal(false)} style={{ marginTop:16, width:'100%', padding:'10px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text2)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 3 Test Cards : Diagnostic · RAM · Download ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:'1.25rem', animation:'fadeUp 0.28s ease' }}>

        {/* ① Diagnostic */}
        <div style={{ background:'var(--bg2)', border:'1px solid #22c55e22', borderRadius:14, padding:'1.25rem', display:'flex', flexDirection:'column', gap:12, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:'#22c55e', opacity:0.04, filter:'blur(28px)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'#22c55e18', border:'1px solid #22c55e28', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#22c55e' }}>◉</div>
            <div>
              <div style={{ fontSize:9, color:'#22c55e', fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase' }}>{lang === 'fr' ? 'Santé système' : 'System health'}</div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>Diagnostic</div>
            </div>
          </div>

          {!diagResult && !diagRunning && (
            <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>
              {lang === 'fr' ? 'Vérifie MongoDB, RAM, disque et ZIP en une passe.' : 'Checks MongoDB, RAM, disk and ZIP in one pass.'}
            </div>
          )}

          {diagResult && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                { label: 'MongoDB', ok: diagResult.mongodb.ok, detail: diagResult.mongodb.ok ? `${(diagResult.mongodb.docs||0).toLocaleString()} docs` : 'Déconnecté' },
                { label: 'RAM', ok: diagResult.ram.heapUsed < 500, detail: `${diagResult.ram.heapUsed} MB heap` },
                { label: lang === 'fr' ? 'Disque C:' : 'Drive C:', ok: diagResult.disk ? diagResult.disk.pct < 90 : false, detail: diagResult.disk ? fmtFree(diagResult.disk.free) + (lang === 'fr' ? ' libre' : ' free') : 'N/A' },
                { label: 'ZIP REQ', ok: diagResult.zip.exists, detail: diagResult.zip.exists ? `${diagResult.zip.sizeMb} MB` : (lang === 'fr' ? 'Absent' : 'Missing') },
                { label: 'WebSocket', ok: wsOk, detail: wsOk ? (lang === 'fr' ? 'Actif' : 'Active') : (lang === 'fr' ? 'Déconnecté' : 'Disconnected') },
              ].map((row, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, animation:`fadeUp ${0.1 + i * 0.06}s ease` }}>
                  <span style={{ color: row.ok ? '#22c55e' : '#f87171', fontSize:12, flexShrink:0 }}>{row.ok ? '✓' : '✕'}</span>
                  <span style={{ color:'var(--text2)', flex:1, fontWeight:600 }}>{row.label}</span>
                  <span style={{ color:'var(--text3)', fontFamily:'monospace', fontSize:10 }}>{row.detail}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={runDiag} disabled={diagRunning} style={{
            marginTop:'auto', padding:'8px 0', borderRadius:9, fontSize:12, fontWeight:800,
            background: diagRunning ? 'var(--bg3)' : '#22c55e',
            color: diagRunning ? 'var(--text3)' : '#fff',
            border:'none', cursor: diagRunning ? 'not-allowed' : 'pointer',
            boxShadow: diagRunning ? 'none' : '0 3px 12px #22c55e30', transition:'all 0.2s',
          }}>
            {diagRunning ? (lang === 'fr' ? '⟳ En cours...' : '⟳ Running...') : (lang === 'fr' ? '▶ Lancer le diagnostic' : '▶ Run diagnostic')}
          </button>
        </div>

        {/* ② RAM Monitor */}
        <div style={{ background:'var(--bg2)', border:`1px solid ${isProcessing ? '#00ff8830' : '#a78bfa22'}`, borderRadius:14, padding:'1.25rem', display:'flex', flexDirection:'column', gap:12, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background: isProcessing ? '#00ff88' : '#a78bfa', opacity:0.04, filter:'blur(28px)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:'#a78bfa18', border:'1px solid #a78bfa28', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#a78bfa' }}>📊</div>
              <div>
                <div style={{ fontSize:9, color:'#a78bfa', fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase' }}>RAM</div>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>Monitor</div>
              </div>
            </div>
            {isProcessing && <span style={{ fontSize:9, padding:'2px 8px', borderRadius:99, background:'#00ff8818', color:'#00ff88', border:'1px solid #00ff8830', fontWeight:700, letterSpacing:'0.1em', animation:'blinkDot 1.2s infinite' }}>LIVE</span>}
          </div>

          {ramData && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                {[
                  { label: 'Heap', value: ramData.heapUsed, max: ramData.heapTotal, color:'#a78bfa' },
                  { label: 'Total', value: ramData.heapTotal, max: ramData.heapTotal, color:'#38bdf8' },
                  { label: 'RSS', value: ramData.rss, max: ramData.rss, color:'#fb923c' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:'var(--bg3)', borderRadius:8, padding:'8px' }}>
                    <div style={{ fontSize:16, fontWeight:900, color, lineHeight:1 }}>{value}</div>
                    <div style={{ fontSize:9, color:'var(--text3)', marginTop:2 }}>{label} MB</div>
                  </div>
                ))}
              </div>

              {ramHistory.length > 1 && (
                <div style={{ background:'var(--bg3)', borderRadius:8, padding:'8px', position:'relative' }}>
                  <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4, display:'flex', justifyContent:'space-between' }}>
                    <span>Heap MB</span>
                    <span style={{ color:'#f87171', fontWeight:700 }}>Pic: {ramPeak} MB</span>
                  </div>
                  <svg width="100%" height="44" viewBox={`0 0 ${Math.max(ramHistory.length - 1, 1)} 44`} preserveAspectRatio="none">
                    {(() => {
                      const mx = Math.max(...ramHistory, 1)
                      const pts = ramHistory.map((v, i) => `${i},${44 - Math.round((v / mx) * 40)}`).join(' ')
                      const fill = ramHistory.map((v, i) => `${i},${44 - Math.round((v / mx) * 40)}`).join(' ') + ` ${ramHistory.length - 1},44 0,44`
                      return <>
                        <polygon points={fill} fill="#a78bfa18" />
                        <polyline points={pts} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    })()}
                  </svg>
                </div>
              )}

              <div style={{ fontSize:10, color:'var(--text3)', textAlign:'center', marginTop:-4 }}>
                {isProcessing ? (lang === 'fr' ? '↻ Mise à jour toutes les 1.5s' : '↻ Updates every 1.5s') : (lang === 'fr' ? '↻ Mise à jour toutes les 6s' : '↻ Updates every 6s')}
              </div>
            </>
          )}
        </div>

        {/* ③ Download Check */}
        <div style={{ background:'var(--bg2)', border:'1px solid #38bdf822', borderRadius:14, padding:'1.25rem', display:'flex', flexDirection:'column', gap:12, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:'#38bdf8', opacity:0.04, filter:'blur(28px)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'#38bdf818', border:'1px solid #38bdf828', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#38bdf8' }}>🌐</div>
            <div>
              <div style={{ fontSize:9, color:'#38bdf8', fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase' }}>{lang === 'fr' ? 'Registre REQ' : 'REQ Registry'}</div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{lang === 'fr' ? 'Vérif. téléchargement' : 'Download check'}</div>
            </div>
          </div>

          <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>
            {lang === 'fr'
              ? 'Vérifie que le serveur Données Québec est accessible et que le ZIP local est valide.'
              : 'Checks that the Données Québec server is reachable and the local ZIP is valid.'}
          </div>

          <div style={{ flex:1 }} />

          <button onClick={openDlModal} style={{
            padding:'8px 0', borderRadius:9, fontSize:12, fontWeight:800,
            background:'#38bdf8', color:'#fff', border:'none', cursor:'pointer',
            boxShadow:'0 3px 12px #38bdf830', transition:'all 0.2s',
          }}>
            {lang === 'fr' ? '▶ Vérifier' : '▶ Check'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── 4 Signal seed cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:'1.25rem', animation:'fadeUp 0.3s ease' }}>
        {SIGNALS.map(sig => (
          <SeedCard
            key={sig.key}
            sig={sig}
            count={countBySignal(sig.key)}
            status={statuses[sig.key]}
            onSeed={() => seed(sig.key)}
            onNavigate={() => navigate(sig.route)}
            t={t}
            lang={lang}
          />
        ))}
      </div>

      {/* ── Leads actifs ── */}
      <div style={{
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:14, marginBottom:'1.25rem', overflow:'hidden',
        animation:'fadeUp 0.35s ease',
      }}>
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{t('tests.activeleads')}</span>
            {totalActive > 0 && (
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:'#c084fc18', color:'#c084fc', border:'1px solid #c084fc30', fontWeight:700 }}>
                {totalActive}
              </span>
            )}
          </div>
          <button
            onClick={resetAll}
            disabled={resetStatus === 'loading' || totalActive === 0}
            style={{
              padding:'6px 14px', borderRadius:8, fontSize:11, fontWeight:700,
              background: totalActive > 0 ? '#f8717112' : 'var(--bg3)',
              color: totalActive > 0 ? '#f87171' : 'var(--text3)',
              border: `1px solid ${totalActive > 0 ? '#f8717130' : 'var(--border)'}`,
              cursor: totalActive > 0 ? 'pointer' : 'not-allowed',
              transition:'all 0.15s',
            }}
          >
            {resetStatus === 'loading' ? '⟳ Reset...' : resetStatus === 'ok' ? '✓' : (lang === 'fr' ? '↺ Tout remettre en baseline' : '↺ Reset all to baseline')}
          </button>
        </div>

        {totalActive === 0 ? (
          <div style={{ textAlign:'center', padding:'2.5rem', color:'var(--text3)', fontSize:13 }}>
            <div style={{ fontSize:32, opacity:0.1, marginBottom:10, color:'#c084fc' }}>⚗</div>
            {lang === 'fr'
              ? <>Aucun lead de test — clique <b>+ Créer lead test</b> sur une carte</>
              : <>No test leads — click <b>+ Create test lead</b> on a card</>}
          </div>
        ) : (
          <div style={{ padding:'0.75rem 1rem', display:'flex', flexDirection:'column', gap:6 }}>
            {activeLeads.map(lead => {
              const sig = SIGNALS.find(s => s.key === lead.signal)
              return (
                <div key={lead._id} style={{
                  display:'flex', alignItems:'center', gap:12,
                  background:'var(--bg3)', borderRadius:9, padding:'0.65rem 1rem',
                  border:`1px solid ${sig?.color || 'var(--border)'}20`,
                  borderLeft:`3px solid ${sig?.color || 'var(--border)'}`,
                  transition:'all 0.15s',
                }}>
                  <span style={{ fontSize:15, width:20, textAlign:'center', flexShrink:0, color:sig?.color }}>{sig?.icon || '?'}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:sig?.color, width:100, flexShrink:0 }}>
                    {sig?.label || lead.signal}
                  </span>
                  <span style={{ fontSize:12, color:'var(--text)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {lead.nom || <span style={{ color:'var(--text3)', fontStyle:'italic' }}>{t('signal.noname')}</span>}
                  </span>
                  <span style={{ fontSize:11, color:'var(--text3)', width:130, flexShrink:0 }}>
                    {lead.ville || '—'} · NEQ {lead.neq}
                  </span>
                  <span style={{ fontSize:10, color:'var(--text3)', width:80, flexShrink:0, opacity:0.7 }}>
                    {new Date(lead.dateTrouve).toLocaleDateString('fr-CA')}
                  </span>
                  <button
                    onClick={() => resetOne(lead.neq, lead.nom)}
                    style={{
                      fontSize:10, padding:'3px 9px', borderRadius:6, fontWeight:700, flexShrink:0,
                      background:'#f8717112', color:'#f87171', border:'1px solid #f8717130', cursor:'pointer',
                    }}
                  >
                    Reset
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 2 actions bottom ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:'1.25rem' }}>

        {/* Test N leads */}
        <div style={{
          background:'var(--bg2)', border:'1px solid #fb923c22',
          borderRadius:14, padding:'1.25rem',
          display:'flex', flexDirection:'column', gap:14,
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'#fb923c', opacity:0.04, filter:'blur(30px)', pointerEvents:'none' }} />

          <div style={{ zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{
                width:28, height:28, borderRadius:8, background:'#fb923c18', border:'1px solid #fb923c28',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#fb923c',
              }}>🧪</span>
              <span style={{ fontSize:13, fontWeight:800, color:'var(--text)', letterSpacing:'-0.01em' }}>
                {t('tests.testn')}
              </span>
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>
              {lang === 'fr'
                ? <>Lance le moteur sur les premières <b style={{ color:'#fb923c' }}>N</b> entrées du registre. Même source que le run normal — aucun risque.</>
                : <>Runs the engine on the first <b style={{ color:'#fb923c' }}>N</b> registry entries. Same source as normal run — no risk.</>}
            </div>
          </div>

          <div style={{ display:'flex', gap:6, alignItems:'center', zIndex:1, flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:4 }}>
              {PRESETS.map(p => (
                <button key={p} onClick={() => setTestLimit(p)} style={{
                  padding:'5px 11px', borderRadius:7, fontSize:11, fontWeight:700,
                  border:`1px solid ${testLimit == p ? '#fb923c50' : 'var(--border)'}`,
                  background: testLimit == p ? '#fb923c20' : 'var(--bg3)',
                  color: testLimit == p ? '#fb923c' : 'var(--text3)',
                  cursor:'pointer', transition:'all 0.15s',
                }}>
                  {p}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:'auto' }}>
              <input
                type="number" min={1} max={500} value={testLimit}
                onChange={e => setTestLimit(e.target.value)}
                style={{
                  width:68, padding:'6px 10px', borderRadius:8,
                  fontSize:14, fontWeight:800, textAlign:'center',
                  background:'var(--bg3)', border:'1px solid #fb923c35',
                  color:'#fb923c', outline:'none',
                }}
              />
              <span style={{ fontSize:11, color:'var(--text3)' }}>leads</span>
            </div>
          </div>

          <button
            onClick={launchTest}
            disabled={isProcessing || testRunning}
            style={{
              padding:'10px 0', borderRadius:10, fontSize:13, fontWeight:800,
              background: isProcessing || testRunning ? 'var(--bg3)' : '#fb923c',
              color: isProcessing || testRunning ? 'var(--text3)' : '#fff',
              border:'none', cursor: isProcessing || testRunning ? 'not-allowed' : 'pointer',
              transition:'all 0.2s', zIndex:1,
              boxShadow: isProcessing || testRunning ? 'none' : '0 4px 16px #fb923c35',
            }}
          >
            {isProcessing
              ? (lang === 'fr' ? '⟳ Moteur occupé...' : '⟳ Engine busy...')
              : testRunning ? t('tests.running')
              : `⚡ ${t('tests.run')} — ${testLimit || 10} leads`}
          </button>
        </div>

        {/* Reset DB */}
        <div style={{
          background:'var(--bg2)', border:'1px solid #f8717122',
          borderRadius:14, padding:'1.25rem',
          display:'flex', flexDirection:'column', gap:14,
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'#f87171', opacity:0.04, filter:'blur(30px)', pointerEvents:'none' }} />

          <div style={{ zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{
                width:28, height:28, borderRadius:8, background:'#f8717118', border:'1px solid #f8717128',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#f87171',
              }}>✕</span>
              <span style={{ fontSize:13, fontWeight:800, color:'#f87171', letterSpacing:'-0.01em' }}>
                {t('tests.reset')}
              </span>
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>
              {lang === 'fr'
                ? <>{t('tests.reset.desc')}</>
                : <>{t('tests.reset.desc')}</>}
            </div>
          </div>

          <div style={{ flex:1 }} />

          <div style={{ display:'flex', gap:10, alignItems:'center', zIndex:1 }}>
            <div style={{
              flex:1, padding:'8px 12px', borderRadius:8, fontSize:11,
              background:'#f871711a', border:'1px solid #f8717128', color:'#f87171',
              fontWeight:600,
            }}>
              {t('tests.reset.warn')}
            </div>
            <button
              onClick={handleResetDB}
              disabled={isProcessing || resetDBState === 'loading'}
              style={{
                padding:'10px 18px', borderRadius:10, fontSize:12, fontWeight:800,
                background:'#f8717122', color: isProcessing ? 'var(--text3)' : '#f87171',
                border:`1px solid ${isProcessing ? 'var(--border)' : '#f8717140'}`,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition:'all 0.2s', flexShrink:0, zIndex:1,
              }}
            >
              {resetDBState === 'loading' ? t('tests.resetting') : resetDBState === 'ok' ? '✓' : t('tests.reset.btn')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Version Manager ── */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid #c084fc22',
        borderRadius: 14, overflow: 'hidden', marginBottom: '1.25rem',
        animation: 'fadeUp 0.45s ease',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
          background: 'var(--bg3)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: '#c084fc', opacity: 0.05, filter: 'blur(25px)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: '#c084fc18',
              border: '1px solid #c084fc28', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, color: '#c084fc',
            }}>⬡</div>
            <div>
              <div style={{ fontSize: 9, color: '#c084fc', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 1 }}>{t('tests.version')}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{lang === 'fr' ? 'Version application' : 'Application version'}</div>
            </div>
          </div>
          <div style={{
            fontSize: 22, fontWeight: 900, color: 'var(--text)',
            letterSpacing: '-0.03em', zIndex: 1, textShadow: '0 0 30px #c084fc30',
          }}>
            v{versionData?.version || '…'}
          </div>
        </div>

        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {BUMP_TYPES.map(bt => {
              const isManuel = bt.type === 'manuel'
              const preview  = isManuel ? (manualVer || '?') : bumpPreview(versionData?.version, bt.type)
              const selected = bumpType === bt.type
              return (
                <button
                  key={bt.type}
                  onClick={() => { setBumpType(selected ? null : bt.type); setManualErr('') }}
                  style={{
                    padding: '0.9rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    border: `1px solid ${selected ? bt.color + '50' : 'var(--border)'}`,
                    background: selected ? `${bt.color}12` : 'var(--bg3)',
                    transition: 'all 0.18s ease',
                    boxShadow: selected ? `0 0 16px ${bt.color}18` : 'none',
                    transform: selected ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: bt.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {bt.icon} {bt.label}
                    </span>
                    <span style={{
                      fontSize: 9, color: bt.color, opacity: 0.7,
                      background: `${bt.color}14`, border: `1px solid ${bt.color}25`,
                      borderRadius: 5, padding: '1px 6px', fontWeight: 700, letterSpacing: '0.1em',
                    }}>{bt.rule}</span>
                  </div>
                  <div style={{
                    fontSize: isManuel ? 13 : 17, fontWeight: 900,
                    color: selected ? bt.color : 'var(--text)',
                    letterSpacing: '-0.02em', marginBottom: 4, transition: 'color 0.15s',
                    fontStyle: isManuel && !manualVer ? 'italic' : 'normal',
                    opacity: isManuel && !manualVer ? 0.4 : 1,
                  }}>
                    {isManuel ? (manualVer ? `v${manualVer}` : 'v x.y.z') : `v${preview}`}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.5 }}>
                    {lang === 'fr' ? bt.desc_fr : bt.desc_en}
                  </div>
                </button>
              )
            })}
          </div>

          {bumpType && (() => {
            const col = TYPE_COLORS_ALL[bumpType]
            const isManuel = bumpType === 'manuel'
            return (
              <div style={{
                padding: '0.85rem', borderRadius: 10,
                background: `${col}0a`, border: `1px solid ${col}22`,
                animation: 'fadeUp 0.25s ease',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {isManuel ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>v{versionData?.version} →</span>
                      <input
                        placeholder={t('tests.ver.manual')}
                        value={manualVer}
                        onChange={e => { setManualVer(e.target.value); setManualErr('') }}
                        onKeyDown={e => e.key === 'Enter' && doBump()}
                        autoFocus
                        style={{
                          width: 90, padding: '6px 10px', borderRadius: 8, fontSize: 14,
                          fontWeight: 800, textAlign: 'center', fontFamily: 'monospace',
                          background: 'var(--bg3)', outline: 'none',
                          border: `1px solid ${manualErr ? '#f87171' : col + '50'}`,
                          color: manualErr ? '#f87171' : col,
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: col, fontWeight: 700, flexShrink: 0 }}>
                      v{versionData?.version} → v{bumpPreview(versionData?.version, bumpType)}
                    </div>
                  )}

                  <input
                    placeholder={t('tests.ver.note')}
                    value={bumpNote}
                    onChange={e => setBumpNote(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !isManuel && doBump()}
                    style={{
                      flex: 1, minWidth: 160, padding: '7px 12px', borderRadius: 8, fontSize: 12,
                      background: 'var(--bg3)', border: `1px solid ${col}28`,
                      color: 'var(--text)', outline: 'none',
                    }}
                  />

                  <button onClick={doBump} disabled={bumping} style={{
                    padding: '8px 18px', borderRadius: 9, fontSize: 12, fontWeight: 800,
                    background: col, color: '#fff', border: 'none',
                    cursor: bumping ? 'not-allowed' : 'pointer',
                    opacity: bumping ? 0.6 : 1,
                    boxShadow: `0 3px 12px ${col}35`, flexShrink: 0,
                  }}>
                    {bumping ? '⟳' : `⬆ ${lang === 'fr' ? 'Appliquer' : 'Apply'}`}
                  </button>

                  <button onClick={() => { setBumpType(null); setBumpNote(''); setManualVer(''); setManualErr('') }}
                    style={{ fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    ✕
                  </button>
                </div>
                {manualErr && (
                  <div style={{ fontSize: 11, color: '#f87171', marginTop: 6, paddingLeft: 2 }}>
                    ✕ {manualErr}
                  </div>
                )}
              </div>
            )
          })()}

          {versionData?.history?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                {t('tests.ver.history')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                {versionData.history.map((entry, i) => {
                  const col = TYPE_COLORS[entry.type] || '#94a3b8'
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 10px', borderRadius: 8,
                      background: i === 0 ? `${col}0a` : 'transparent',
                      border: `1px solid ${i === 0 ? col + '20' : 'transparent'}`,
                    }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, color: col,
                        background: `${col}18`, border: `1px solid ${col}28`,
                        borderRadius: 5, padding: '2px 6px', flexShrink: 0, letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}>{entry.type}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? col : 'var(--text2)', width: 60, flexShrink: 0 }}>
                        v{entry.version}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.note || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>—</span>}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, opacity: 0.5 }}>
                        {new Date(entry.date).toLocaleDateString('fr-CA')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      {/* ── Journal terminal ── */}
      <div style={{
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:14, overflow:'hidden',
        animation:'fadeUp 0.4s ease',
      }}>
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'0.85rem 1.25rem', borderBottom:'1px solid var(--border)',
          background:'var(--bg3)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{
              fontSize:9, fontWeight:700, color:'#fbbf24',
              background:'#fbbf2418', border:'1px solid #fbbf2430',
              borderRadius:5, padding:'2px 7px', letterSpacing:'0.1em',
            }}>LIVE</span>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{t('tests.journal')}</span>
            {logs.length > 0 && (
              <span style={{ fontSize:10, color:'var(--text3)' }}>{logs.length}</span>
            )}
          </div>
          {logs.length > 0 && (
            <button onClick={() => setLogs([])} style={{
              fontSize:10, color:'var(--text3)', background:'none', border:'none',
              cursor:'pointer', padding:'3px 8px',
            }}>
              {t('engine.clear')}
            </button>
          )}
        </div>

        <div ref={logRef} style={{
          background:'#080b12', padding:'0.85rem 1.1rem',
          minHeight:120, maxHeight:200, overflowY:'auto',
          fontFamily:'monospace', fontSize:11,
        }}>
          {logs.length === 0 ? (
            <span style={{ color:'#2d3a52' }}>— {lang === 'fr' ? 'En attente d\'actions...' : 'Waiting for actions...'}</span>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              {logs.map((log) => (
                <div key={log.id} style={{ display:'flex', gap:10, animation:'fadeUp 0.2s ease' }}>
                  <span style={{ color:'#2d3a52', flexShrink:0 }}>{log.ts}</span>
                  <span style={{
                    color: log.type === 'ok'    ? '#4ade80'
                         : log.type === 'error' ? '#f87171'
                         : '#64748b',
                  }}>
                    {log.type === 'ok' ? '✓' : log.type === 'error' ? '✕' : '·'} {log.msg}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
