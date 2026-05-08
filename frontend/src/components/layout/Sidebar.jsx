// components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useEngineStore } from '../../store/engineStore'
import { useUiStore } from '../../store/uiStore'
import { useT } from '../../i18n/useT'
import api from '../../utils/api'

const NAV_FR = [
  { to: '/engine',        icon: '⚙', color: '#00d4ff', bg: '#00d4ff18', label: 'Moteur',        signal: null },
  { to: '/dashboard',     icon: '▦', color: '#a78bfa', bg: '#a78bfa18', label: 'Dashboard',      signal: null },
  { to: '/leads',         icon: '◈', color: '#38bdf8', bg: '#38bdf818', label: 'Leads',          signal: null },
  { to: '/nouveautes',    icon: '⚡', color: '#fbbf24', bg: '#fbbf2418', label: 'Dernier run',   signal: null },
  { to: '/nouvelles',     icon: '✦', color: '#4ade80', bg: '#4ade8018', label: 'Nouvelles',      signal: 'nouvelle' },
  { to: '/reouvertures',  icon: '↺', color: '#2dd4bf', bg: '#2dd4bf18', label: 'Réouvertures',   signal: 'reouverture' },
  { to: '/demenagements', icon: '→', color: '#fb923c', bg: '#fb923c18', label: 'Déménagements',  signal: 'demenagement' },
  { to: '/fermetures',    icon: '✕', color: '#f87171', bg: '#f8717118', label: 'Fermetures',     signal: 'fermeture' },
  { to: '/carte',         icon: '◉', color: '#34d399', bg: '#34d39918', label: 'Carte',          signal: null },
  { to: '/tests',         icon: '⚗', color: '#c084fc', bg: '#c084fc18', label: 'Tests',          signal: null },
  { to: '/database',      icon: '◫', color: '#94a3b8', bg: '#94a3b818', label: 'Base données',   signal: null },
]


export default function Sidebar({ onLogout }) {
  const { status, fetchStatus, connectWS } = useEngineStore()
  const { theme, toggleTheme } = useUiStore()
  const t = useT()
  const [counts,  setCounts]  = useState({})
  const [version, setVersion] = useState('1.0.0')

  const loadCounts = async () => {
    try {
      const { data } = await api.get('/stats/signals')
      setCounts(data)
    } catch { /* ignore */ }
  }

  const loadVersion = async () => {
    try {
      const { data } = await api.get('/version')
      setVersion(data.version)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchStatus()
    connectWS()
    loadCounts()
    loadVersion()
    const interval = setInterval(() => { fetchStatus(); loadCounts() }, 15000)
    const onEngineDone = () => { fetchStatus(); loadCounts() }
    window.addEventListener('engine:done', onEngineDone)
    return () => { clearInterval(interval); window.removeEventListener('engine:done', onEngineDone) }
  }, [fetchStatus, connectWS])

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar)',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Logo + Jinbe */}
      <div style={{ borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ position: 'relative', height: 120 }}>
          <img
            src="https://static.wikia.nocookie.net/all-worlds-alliance/images/1/14/Jinbei_by_donaco-d62otii.png/revision/latest?cb=20180903072652"
            alt="Jinbe"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 30%, var(--bg2) 100%)',
          }}/>
          <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', gap: 5 }}>
              🌊 Jinbe
            </div>
            <div style={{ fontSize: 9, color: '#a0c4ff', marginTop: 2, textShadow: '0 1px 4px rgba(0,0,0,0.9)', fontStyle: 'italic', lineHeight: 1.4 }}>
              « Chevalier de la Mer »
            </div>
          </div>
        </div>
      </div>

      {/* Statut moteur — Radar */}
      {(() => {
        const active = status.isRunning || status.isProcessing
        const col = status.isProcessing ? '#00ff88' : status.isRunning ? '#00cc66' : '#ef4444'
        const colDim = status.isProcessing ? '#00ff8840' : status.isRunning ? '#00cc6640' : '#ef444440'
        return (
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', background: `${col}08` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Radar SVG amélioré */}
              <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                <svg viewBox="0 0 44 44" width="44" height="44">
                  <defs>
                    <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={col} stopOpacity="0.15"/>
                      <stop offset="100%" stopColor={col} stopOpacity="0"/>
                    </radialGradient>
                  </defs>
                  {/* Fond glow */}
                  <circle cx="22" cy="22" r="20" fill="url(#radarGlow)" />
                  {/* Cercles concentriques */}
                  <circle cx="22" cy="22" r="19" fill="none" stroke={col} strokeWidth="0.8" opacity="0.2"/>
                  <circle cx="22" cy="22" r="13" fill="none" stroke={col} strokeWidth="0.8" opacity="0.35"/>
                  <circle cx="22" cy="22" r="7"  fill="none" stroke={col} strokeWidth="0.8" opacity="0.55"/>
                  {/* Croix */}
                  <line x1="22" y1="3"  x2="22" y2="41" stroke={col} strokeWidth="0.6" opacity="0.25"/>
                  <line x1="3"  y1="22" x2="41" y2="22" stroke={col} strokeWidth="0.6" opacity="0.25"/>
                  <line x1="8"  y1="8"  x2="36" y2="36" stroke={col} strokeWidth="0.4" opacity="0.15"/>
                  <line x1="36" y1="8"  x2="8"  y2="36" stroke={col} strokeWidth="0.4" opacity="0.15"/>
                  {/* Sweep actif */}
                  {active && (
                    <g style={{ transformOrigin: '22px 22px', animation: 'radarSweep 2.5s linear infinite' }}>
                      <path d={`M22,22 L22,3 A19,19 0 0,1 ${22+19*Math.sin(1.1)},${22-19*Math.cos(1.1)}`}
                        fill={colDim} />
                      <circle cx="22" cy="4" r="2.5" fill={col} opacity="0.95"/>
                    </g>
                  )}
                  {/* Point central */}
                  <circle cx="22" cy="22" r="2.5" fill={col}/>
                  <circle cx="22" cy="22" r="1"   fill="#fff" opacity="0.9"/>
                </svg>
                {/* Ring glow externe si actif */}
                {active && (
                  <div style={{
                    position: 'absolute', inset: -3,
                    borderRadius: '50%',
                    border: `1px solid ${col}`,
                    opacity: 0.3,
                    animation: 'radarRing 2.5s ease-out infinite',
                  }}/>
                )}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: col, letterSpacing: '0.03em' }}>
                  {status.isProcessing ? t('status.processing') : status.isRunning ? t('status.active') : t('status.stopped')}
                </div>
                {status.lastLeadsFound > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                    {status.lastLeadsFound.toLocaleString('fr-CA')} {t('status.lastleads')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Bouton Thème ── */}
      <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 12px', borderRadius: 8, cursor: 'pointer', border: 'none',
            background: theme === 'dark' ? '#374151' : '#f59e0b',
            color: '#fff', fontSize: 12, fontWeight: 700,
            fontFamily: 'inherit', width: '100%',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Mode jour' : 'Mode nuit'}
          </span>
          <div style={{ width: 36, height: 18, borderRadius: 99, background: 'rgba(255,255,255,0.3)', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
              left: theme === 'dark' ? 2 : 20,
            }} />
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto' }}>
        {NAV_FR.map((item) => (
          <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.45rem 1rem',
            color: isActive ? '#fff' : 'var(--text2)',
            background: isActive ? item.bg : 'transparent',
            borderRight: isActive ? `2px solid ${item.color}` : '2px solid transparent',
            fontSize: 13, transition: 'all 0.15s', textDecoration: 'none',
            borderRadius: '0 0 0 0',
          })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 26, borderRadius: 7,
                background: item.bg,
                color: item.color,
                fontSize: 13, fontWeight: 700,
                border: `1px solid ${item.color}30`,
                flexShrink: 0,
              }}>{item.icon}</span>
              <span style={{ fontSize: 12.5 }}>{item.label}</span>
            </div>
            {item.signal && counts[item.signal] > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: `${item.color}22`, color: item.color,
                border: `1px solid ${item.color}44`,
                borderRadius: 99, padding: '1px 6px', minWidth: 20, textAlign: 'center',
              }}>
                {counts[item.signal] > 999 ? '999+' : counts[item.signal]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onLogout}
          title="Déconnexion"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 7,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)' }}
        >
          ⏻ Déco
        </button>
        <span style={{ color: '#c084fc', fontWeight: 700, fontFamily: 'monospace', fontSize: 11 }}>v{version}</span>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes radarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes radarRing  { 0% { transform: scale(1); opacity: 0.35; } 100% { transform: scale(1.6); opacity: 0; } }
      `}</style>
    </aside>
  )
}
