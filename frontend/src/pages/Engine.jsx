// pages/Engine.jsx
import { useEffect, useRef, useState } from 'react'
import { useEngineStore } from '../store/engineStore'
import { ProgressBar, fmtDate, ConfirmModal } from '../components/ui/index'
import { useT } from '../i18n/useT'
import { useUiStore } from '../store/uiStore'

export default function Engine() {
  const { status, logs, runNow, fetchStatus, clearLogs, connectWS } = useEngineStore()
  const t = useT()
  const { lang } = useUiStore()
  const logRef = useRef(null)
  const [confirm, setConfirm] = useState(null)

  const isActive     = status.isRunning
  const isProcessing = status.isProcessing
  const col    = isProcessing ? '#00ff88' : isActive ? '#00cc66' : '#ef4444'
  const colDim = isProcessing ? '#00ff8830' : isActive ? '#00cc6630' : '#ef444430'

  useEffect(() => { fetchStatus(); connectWS() }, [fetchStatus, connectWS])
  useEffect(() => { if (!isProcessing) return; const iv = setInterval(fetchStatus, 5000); return () => clearInterval(iv) }, [isProcessing, fetchStatus])
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [logs])

  const statusLabel  = isProcessing ? t('status.proc_label') : isActive ? t('status.watch_label') : t('status.off_label')
  const moteurLabel  = isProcessing ? t('status.processing') : isActive ? t('status.active') : t('status.stopped')

  const HOW = [
    [t('engine.step.check'),  t('engine.step.check.v')],
    [t('engine.step.dl'),     t('engine.step.dl.v')],
    [t('engine.step.filter'), t('engine.step.filter.v')],
    [t('engine.step.detect'), t('engine.step.detect.v')],
    [t('engine.step.save'),   t('engine.step.save.v')],
  ]

  const GUAR = [
    [t('engine.g.norisk'),  '#4ade80', t('engine.g.norisk.v')],
    [t('engine.g.noban'),   '#4ade80', t('engine.g.noban.v')],
    [t('engine.g.nocost'),  '#4ade80', t('engine.g.nocost.v')],
    [t('engine.g.update'),  '#fbbf24', t('engine.g.update.v')],
    [t('engine.g.all'),     '#00d4ff', t('engine.g.all.v')],
  ]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{
        background: 'var(--bg2)', border: `1px solid ${col}30`, borderRadius: 16,
        padding: '2rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: 32,
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 0 40px ${col}10`,
      }}>
        <div style={{ position:'absolute',top:-40,left:-40,width:200,height:200,borderRadius:'50%',background:col,opacity:0.04,filter:'blur(40px)',pointerEvents:'none' }}/>

        {/* Radar */}
        <div style={{ position:'relative',width:120,height:120,flexShrink:0 }}>
          <svg viewBox="0 0 120 120" width="120" height="120">
            <defs><radialGradient id="engGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={col} stopOpacity="0.18"/><stop offset="100%" stopColor={col} stopOpacity="0"/>
            </radialGradient></defs>
            <circle cx="60" cy="60" r="56" fill="url(#engGlow)"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke={col} strokeWidth="1" opacity="0.18"/>
            <circle cx="60" cy="60" r="40" fill="none" stroke={col} strokeWidth="1" opacity="0.28"/>
            <circle cx="60" cy="60" r="26" fill="none" stroke={col} strokeWidth="1" opacity="0.45"/>
            <circle cx="60" cy="60" r="12" fill="none" stroke={col} strokeWidth="1" opacity="0.65"/>
            <line x1="60" y1="6" x2="60" y2="114" stroke={col} strokeWidth="0.8" opacity="0.2"/>
            <line x1="6" y1="60" x2="114" y2="60" stroke={col} strokeWidth="0.8" opacity="0.2"/>
            <line x1="21" y1="21" x2="99" y2="99" stroke={col} strokeWidth="0.5" opacity="0.12"/>
            <line x1="99" y1="21" x2="21" y2="99" stroke={col} strokeWidth="0.5" opacity="0.12"/>
            {(isActive||isProcessing)&&(
              <g style={{transformOrigin:'60px 60px',animation:'engSweep 2.5s linear infinite'}}>
                <path d={`M60,60 L60,6 A54,54 0 0,1 ${60+54*Math.sin(1.1)},${60-54*Math.cos(1.1)}`} fill={colDim}/>
                <circle cx="60" cy="8" r="5" fill={col} opacity="0.95"/>
                <circle cx="60" cy="8" r="3" fill="#fff" opacity="0.7"/>
              </g>
            )}
            <circle cx="60" cy="60" r="5" fill={col}/><circle cx="60" cy="60" r="2.5" fill="#fff" opacity="0.9"/>
          </svg>
          {(isActive||isProcessing)&&(
            <>
              <div style={{position:'absolute',inset:-6,borderRadius:'50%',border:`1px solid ${col}`,opacity:0.25,animation:'engRing 2.5s ease-out infinite'}}/>
              <div style={{position:'absolute',inset:-14,borderRadius:'50%',border:`1px solid ${col}`,opacity:0.12,animation:'engRing 2.5s ease-out infinite 0.8s'}}/>
            </>
          )}
        </div>

        {/* Texte */}
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11,letterSpacing:'0.2em',color:col,textTransform:'uppercase',marginBottom:6,fontWeight:600 }}>
            {statusLabel}
          </div>
          <div style={{ fontSize:28,fontWeight:800,color:'var(--text)',lineHeight:1.1,marginBottom:8 }}>
            {moteurLabel}
          </div>
          <div style={{ fontSize:12,color:'var(--text3)',lineHeight:1.8 }}>
            {status.lastRun ? `${t('engine.lastrun')} : ${fmtDate(status.lastRun)}` : t('engine.never')}
            {status.nextRun && <><br/>{t('engine.next')} : {fmtDate(status.nextRun)}</>}
          </div>
          {status.lastLeadsFound>0&&(
            <div style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:10,padding:'4px 12px',background:`${col}18`,border:`1px solid ${col}40`,borderRadius:99,fontSize:12,fontWeight:700,color:col}}>
              ◈ {status.lastLeadsFound.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')} leads — {Math.round((status.lastDuration||0)/1000)}s
            </div>
          )}
        </div>

        {/* Bouton */}
        <div style={{ flexShrink:0 }}>
          <button onClick={() => !isProcessing && setConfirm({
            title: lang === 'fr' ? 'Lancer le moteur ?' : 'Launch engine?',
            message: lang === 'fr' ? 'Télécharge et analyse le registre REQ complet. Peut durer 10-15 min.' : 'Downloads and analyzes the full REQ registry. May take 10-15 min.',
            confirmLabel: lang === 'fr' ? '⚡ Lancer' : '⚡ Launch',
            color: '#00d4ff',
            onConfirm: () => { setConfirm(null); runNow() }
          })} disabled={isProcessing} style={{
            padding:'12px 28px',borderRadius:10,border:'none',cursor:isProcessing?'not-allowed':'pointer',
            background:isProcessing?'#ffffff10':'linear-gradient(135deg,#00d4ff,#0066ff)',
            color:'#fff',fontSize:14,fontWeight:700,
            opacity:isProcessing?0.5:1,
            boxShadow:isProcessing?'none':'0 4px 20px #00d4ff35',
            transition:'all 0.2s',
          }}>
            {isProcessing ? t('engine.launching') : t('engine.launch')}
          </button>
        </div>
      </div>

      {isProcessing&&(
        <div style={{marginBottom:'1.5rem'}}>
          <ProgressBar percent={status.progress||0} step={status.currentStep||t('engine.init')} />
        </div>
      )}

      {/* Stats cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:'1.5rem'}}>
        {[
          { label: t('engine.leadsFound'), value: status.lastLeadsFound||0, color:'#00cc66', icon:'◈' },
          { label: t('engine.duration'),   value: status.lastDuration ? `${Math.round(status.lastDuration/1000)}s` : '—', color:'#00d4ff', icon:'⏱' },
          { label: t('engine.status'),     value: moteurLabel, color:col, icon:'◉' },
          { label: t('engine.source'),     value: 'REQ Québec', color:'#a78bfa', icon:'◫' },
        ].map(s=>(
          <div key={s.label} style={{background:'var(--bg2)',borderRadius:12,padding:'1rem 1.25rem',border:`1px solid ${s.color}20`}}>
            <div style={{fontSize:18,marginBottom:4,color:s.color}}>{s.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:'var(--text)'}}>{s.value}</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How + Guarantees */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'1.5rem'}}>
        <div style={{background:'var(--bg2)',borderRadius:12,padding:'1.25rem',border:'1px solid var(--border)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:'#00d4ff'}}>⚙</span> {t('engine.howworks')}
          </div>
          {HOW.map(([k,v])=>(
            <div key={k} style={{display:'flex',gap:10,marginBottom:9,alignItems:'flex-start'}}>
              <span style={{fontSize:9,fontWeight:700,color:'#00d4ff',background:'#00d4ff18',border:'1px solid #00d4ff30',borderRadius:5,padding:'2px 6px',marginTop:1,whiteSpace:'nowrap'}}>{k}</span>
              <span style={{fontSize:12,color:'var(--text2)',lineHeight:1.5}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{background:'var(--bg2)',borderRadius:12,padding:'1.25rem',border:'1px solid var(--border)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:'#4ade80'}}>✓</span> {t('engine.guarantees')}
          </div>
          {GUAR.map(([k,c,v])=>(
            <div key={k} style={{display:'flex',gap:10,marginBottom:9,alignItems:'flex-start'}}>
              <span style={{fontSize:9,fontWeight:700,color:c,background:`${c}18`,border:`1px solid ${c}30`,borderRadius:5,padding:'2px 6px',marginTop:1,whiteSpace:'nowrap'}}>{k}</span>
              <span style={{fontSize:12,color:'var(--text2)',lineHeight:1.5}}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Console */}
      <div style={{background:'var(--bg2)',borderRadius:12,padding:'1.25rem',border:'1px solid var(--border)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--text)',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:10,background:'#fbbf2420',border:'1px solid #fbbf2440',borderRadius:5,padding:'2px 7px',color:'#fbbf24'}}>LIVE</span>
            {t('engine.livelog')}
          </div>
          <button onClick={clearLogs} style={{fontSize:11,color:'var(--text3)',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,padding:'3px 10px',cursor:'pointer'}}>
            {t('engine.clear')}
          </button>
        </div>
        <div ref={logRef} style={{background:'#0a0d14',borderRadius:8,padding:'0.75rem 1rem',height:260,overflowY:'auto',fontFamily:'monospace',fontSize:12,border:'1px solid #1e2433'}}>
          {logs.length===0 ? (
            <div style={{color:'#3a4560'}}>{t('engine.waiting')}</div>
          ) : logs.map(log=>(
            <div key={log.id} style={{marginBottom:4,display:'flex',gap:8}}>
              <span style={{color:'#3a4a6a',flexShrink:0}}>{log.time}</span>
              <span style={{color:log.message.includes('❌')?'#f87171':log.message.includes('✅')?'#4ade80':log.message.includes('⚠')?'#fbbf24':'#94a3b8'}}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes engSweep { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes engRing  { 0% { transform:scale(1);opacity:0.3; } 100% { transform:scale(1.4);opacity:0; } }
        @keyframes fadeIn   { from { opacity:0;transform:translateY(3px); } to { opacity:1;transform:translateY(0); } }
      `}</style>
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
