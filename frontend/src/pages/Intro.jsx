// pages/Intro.jsx — Écran d'intro cinématique Jinbe
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Intro() {
  const navigate  = useNavigate()
  const [phase, setPhase] = useState(0)
  // 0 = noir  1 = image fade  2 = titre  3 = quote  4 = sortie

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 1800)
    const t3 = setTimeout(() => setPhase(3), 3000)
    const t4 = setTimeout(() => setPhase(4), 5000)
    const t5 = setTimeout(() => {
      localStorage.setItem('intro_seen', '1')
      navigate('/engine')
    }, 6200)
    return () => [t1,t2,t3,t4,t5].forEach(clearTimeout)
  }, [navigate])

  const skip = () => {
    localStorage.setItem('intro_seen', '1')
    navigate('/engine')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      overflow: 'hidden',
      cursor: 'pointer',
    }} onClick={skip}>

      {/* Image Jinbe — fade in dramatique */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 1.8s ease',
      }}>
        <img
          src="https://static.wikia.nocookie.net/all-worlds-alliance/images/1/14/Jinbei_by_donaco-d62otii.png/revision/latest?cb=20180903072652"
          alt="Jinbe"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            filter: 'brightness(0.55) saturate(1.3)',
            transform: phase >= 4 ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 1.5s ease',
          }}
        />

        {/* Vignette bords */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
        }}/>

        {/* Dégradé bas */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,10,0.95) 0%, transparent 100%)',
        }}/>

        {/* Particules eau */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${8 + i * 8}%`,
            bottom: `${10 + (i % 4) * 8}%`,
            width: i % 3 === 0 ? 4 : 2,
            height: i % 3 === 0 ? 4 : 2,
            borderRadius: '50%',
            background: '#00cfff',
            opacity: phase >= 2 ? 0.7 : 0,
            transition: `opacity 0.8s ease ${i * 0.1}s`,
            animation: phase >= 2 ? `floatDrop${i % 3} ${2 + i % 2}s infinite ease-in-out` : 'none',
          }}/>
        ))}
      </div>

      {/* Ligne horizontale style anime */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: '50%', height: 1,
        background: 'linear-gradient(to right, transparent, #00aaff, transparent)',
        opacity: phase >= 2 ? 0.4 : 0,
        transition: 'opacity 1s ease',
        transform: 'translateY(-80px)',
      }}/>

      {/* Contenu textuel */}
      <div style={{
        position: 'absolute', bottom: '12%', left: 0, right: 0,
        textAlign: 'center',
        padding: '0 2rem',
      }}>

        {/* Titre JINBE */}
        <div style={{
          fontSize: 'clamp(48px, 10vw, 96px)',
          fontWeight: 900,
          letterSpacing: '0.25em',
          color: '#fff',
          textTransform: 'uppercase',
          fontFamily: 'Georgia, serif',
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.9s ease, transform 0.9s ease',
          textShadow: '0 0 40px rgba(0,150,255,0.8), 0 2px 20px rgba(0,0,0,0.9)',
        }}>
          JINBE
        </div>

        {/* Sous-titre */}
        <div style={{
          fontSize: 'clamp(14px, 2.5vw, 22px)',
          fontWeight: 400,
          letterSpacing: '0.4em',
          color: '#a0d8ff',
          textTransform: 'uppercase',
          marginTop: 8,
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 1s ease 0.3s, transform 1s ease 0.3s',
          textShadow: '0 0 20px rgba(0,150,255,0.6)',
        }}>
          Chevalier de la Mer
        </div>

        {/* Citation */}
        <div style={{
          fontSize: 'clamp(13px, 1.8vw, 18px)',
          color: '#cce8ff',
          fontStyle: 'italic',
          marginTop: 24,
          maxWidth: 600,
          margin: '24px auto 0',
          lineHeight: 1.7,
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'opacity 0.9s ease, transform 0.9s ease',
          textShadow: '0 1px 8px rgba(0,0,0,0.9)',
        }}>
          « Pense à ceux que tu as encore...<br/>pas à ceux que tu as perdus. »
        </div>
      </div>

      {/* Fade out final */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#000',
        opacity: phase >= 4 ? 1 : 0,
        transition: 'opacity 1.2s ease',
        pointerEvents: 'none',
      }}/>

      {/* Skip */}
      <div style={{
        position: 'absolute', top: 24, right: 28,
        fontSize: 12, color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.15em',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 1s ease',
      }}>
        CLIQUER POUR PASSER
      </div>

      <style>{`
        @keyframes floatDrop0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes floatDrop1 { 0%,100%{transform:translateY(-6px)} 50%{transform:translateY(6px)} }
        @keyframes floatDrop2 { 0%,100%{transform:translateY(4px)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  )
}
