// pages/Intro.jsx — Écran d'intro cinématique Jinbe
import { useEffect, useState } from 'react'
import { useUiStore } from '../store/uiStore'

const DURATION = 7200

export default function Intro({ onDone }) {
  const { lang }     = useUiStore()
  const [phase, setPhase] = useState(0)
  // 0=noir  1=scan+image  2=titre  3=subtitle  4=quote  5=tagline  6=fadeout

  const done = () => { localStorage.setItem('intro_seen', '1'); onDone?.() }

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3400),
      setTimeout(() => setPhase(5), 4800),
      setTimeout(() => setPhase(6), 5900),
      setTimeout(done, DURATION),
    ]
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const skip = done

  return (
    <div onClick={skip} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', overflow: 'hidden', cursor: 'pointer' }}>

      {/* ── Image + overlays ── */}
      <div style={{ position: 'absolute', inset: 0, opacity: phase >= 1 ? 1 : 0, transition: 'opacity 2.2s ease' }}>
        <img
          src="https://static.wikia.nocookie.net/all-worlds-alliance/images/1/14/Jinbei_by_donaco-d62otii.png/revision/latest?cb=20180903072652"
          alt="Jinbe"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
            filter: 'brightness(0.42) saturate(1.5) contrast(1.1)',
            transform: phase >= 6 ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 1.8s ease',
          }}
        />
        {/* Gradient haut */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)' }} />
        {/* Gradient bas */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', background: 'linear-gradient(to top, #000 0%, transparent 100%)' }} />
        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.88) 100%)' }} />
      </div>

      {/* ── Scan line ── */}
      {phase === 1 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(to right, transparent 0%, #00aaff 30%, #00ffcc 50%, #00aaff 70%, transparent 100%)',
          boxShadow: '0 0 24px #00aaff, 0 0 60px #00aaff55',
          animation: 'scanDown 1.3s ease-in forwards',
        }}/>
      )}

      {/* ── Ligne accent horizontale ── */}
      <div style={{
        position: 'absolute', left: '8%', right: '8%',
        top: 'calc(50% - 160px)', height: 1,
        background: 'linear-gradient(to right, transparent, #00aaff55, #00ffcc88, #00aaff55, transparent)',
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 1s ease 0.2s',
      }}/>

      {/* ── Particules eau ── */}
      {phase >= 2 && [...Array(20)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${3 + i * 4.8}%`,
          bottom: `${6 + (i % 6) * 5}%`,
          width:  i % 5 === 0 ? 5 : i % 3 === 0 ? 3 : 2,
          height: i % 5 === 0 ? 5 : i % 3 === 0 ? 3 : 2,
          borderRadius: '50%',
          background: i % 2 === 0 ? '#00cfff' : '#00ffcc',
          opacity: 0.55,
          boxShadow: `0 0 8px ${i % 2 === 0 ? '#00cfff' : '#00ffcc'}`,
          animation: `floatDrop${i % 3} ${2 + (i % 3) * 0.6}s infinite ease-in-out ${i * 0.11}s`,
        }}/>
      ))}

      {/* ── Contenu textuel ── */}
      <div style={{ position: 'absolute', bottom: '12%', left: 0, right: 0, textAlign: 'center', padding: '0 2rem' }}>

        {/* Tag */}
        <div style={{
          fontSize: 10, letterSpacing: '0.4em', color: '#00ccff',
          fontWeight: 700, textTransform: 'uppercase', marginBottom: 20,
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 0.8s ease 0.15s',
        }}>
          ── {lang === 'fr' ? 'INTELLIGENCE COMMERCIALE' : 'COMMERCIAL INTELLIGENCE'} ──
        </div>

        {/* JINBE */}
        <div style={{
          fontSize: 'clamp(60px, 13vw, 116px)',
          fontWeight: 900,
          letterSpacing: phase >= 2 ? '0.22em' : '0.55em',
          color: '#fff',
          textTransform: 'uppercase',
          fontFamily: 'Georgia, "Times New Roman", serif',
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 0.9s ease, letter-spacing 1.4s cubic-bezier(0.16,1,0.3,1)',
          textShadow: '0 0 50px rgba(0,170,255,0.75), 0 0 120px rgba(0,170,255,0.3), 0 6px 40px rgba(0,0,0,1)',
          lineHeight: 1,
        }}>
          JINBE
        </div>

        {/* Sous-titre */}
        <div style={{
          fontSize: 'clamp(11px, 1.8vw, 17px)',
          fontWeight: 300,
          letterSpacing: '0.55em',
          color: '#7fd4ff',
          textTransform: 'uppercase',
          marginTop: 12,
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
          textShadow: '0 0 18px rgba(0,170,255,0.55)',
        }}>
          {lang === 'fr' ? 'Chevalier de la Mer' : 'Knight of the Sea'}
        </div>

        {/* Divider animé */}
        <div style={{
          width: phase >= 3 ? 220 : 0,
          height: 1,
          background: 'linear-gradient(to right, transparent, #00aaff, transparent)',
          margin: '20px auto',
          transition: 'width 1.1s cubic-bezier(0.16,1,0.3,1)',
        }}/>

        {/* Citation */}
        <div style={{
          fontSize: 'clamp(12px, 1.5vw, 16px)',
          color: '#c8e8ff',
          fontStyle: 'italic',
          maxWidth: 500,
          margin: '0 auto',
          lineHeight: 1.85,
          opacity: phase >= 4 ? 1 : 0,
          transform: phase >= 4 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 1s ease, transform 1s ease',
          textShadow: '0 1px 10px rgba(0,0,0,0.95)',
        }}>
          {lang === 'fr'
            ? '« Pense à ceux que tu as encore...\npas à ceux que tu as perdus. »'
            : '« Think of those you still have...\nnot those you have lost. »'}
        </div>

        {/* Tagline app */}
        <div style={{
          marginTop: 26,
          fontSize: 10,
          letterSpacing: '0.35em',
          color: '#00ffcc',
          textTransform: 'uppercase',
          opacity: phase >= 5 ? 0.75 : 0,
          transition: 'opacity 1s ease',
        }}>
          {lang === 'fr' ? '▶ DÉTECTION · REQ · QUÉBEC' : '▶ DETECTION · REQ · QUEBEC'}
        </div>
      </div>

      {/* ── Fade out final ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#000',
        opacity: phase >= 6 ? 1 : 0,
        transition: 'opacity 1.4s ease',
        pointerEvents: 'none',
      }}/>

      {/* ── Skip ── */}
      <div style={{
        position: 'absolute', top: 24, right: 28,
        fontSize: 11, color: 'rgba(255,255,255,0.28)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 1.5s ease',
      }}>
        {lang === 'fr' ? 'Cliquer pour passer' : 'Click to skip'}
      </div>

      <style>{`
        @keyframes scanDown {
          0%   { top: 0;    opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes floatDrop0 { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-15px)} }
        @keyframes floatDrop1 { 0%,100%{transform:translateY(-8px)} 50%{transform:translateY(8px)}  }
        @keyframes floatDrop2 { 0%,100%{transform:translateY(5px)}  50%{transform:translateY(-11px)} }
      `}</style>
    </div>
  )
}
