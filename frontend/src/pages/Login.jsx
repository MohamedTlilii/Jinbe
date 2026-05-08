// pages/Login.jsx — Page de connexion sécurisée Jinbe
import { useState } from 'react'
import api from '../utils/api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [shake,    setShake]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      localStorage.setItem('jimbe_token', data.token)
      onLogin()
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur de connexion'
      setError(msg)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Image Jinbe + overlays */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <img
          src="https://static.wikia.nocookie.net/all-worlds-alliance/images/1/14/Jinbei_by_donaco-d62otii.png/revision/latest?cb=20180903072652"
          alt="Jinbe"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
            filter: 'brightness(0.35) saturate(1.4) contrast(1.1)',
            animation: 'imgZoom 18s ease-in-out infinite alternate',
            transformOrigin: 'center top',
          }}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, #000 0%, transparent 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.85) 100%)' }} />
      </div>

      {/* Particules eau */}
      {[...Array(18)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${3 + i * 5.2}%`,
          bottom: `${5 + (i % 6) * 6}%`,
          width:  i % 5 === 0 ? 5 : i % 3 === 0 ? 3 : 2,
          height: i % 5 === 0 ? 5 : i % 3 === 0 ? 3 : 2,
          borderRadius: '50%',
          background: i % 2 === 0 ? '#00cfff' : '#00ffcc',
          opacity: 0.45,
          boxShadow: `0 0 8px ${i % 2 === 0 ? '#00cfff' : '#00ffcc'}`,
          animation: `floatDrop${i % 3} ${2.2 + (i % 3) * 0.7}s infinite ease-in-out ${i * 0.12}s`,
          pointerEvents: 'none',
        }}/>
      ))}

      {/* Titre JINBE en haut */}
      <div style={{
        position: 'absolute', top: '8%', left: 0, right: 0,
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 9, letterSpacing: '0.45em', color: '#00ccff', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10, opacity: 0.8 }}>
          ── INTELLIGENCE COMMERCIALE ──
        </div>
        <div style={{
          fontSize: 'clamp(42px, 8vw, 80px)', fontWeight: 900,
          letterSpacing: '0.25em', color: '#fff',
          fontFamily: 'Georgia, "Times New Roman", serif',
          textShadow: '0 0 50px rgba(0,170,255,0.8), 0 0 100px rgba(0,170,255,0.3)',
          lineHeight: 1,
        }}>
          JINBE
        </div>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', color: '#7fd4ff', textTransform: 'uppercase', marginTop: 8, opacity: 0.75 }}>
          Chevalier de la Mer
        </div>
      </div>

      {/* Carte login */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 400,
        margin: '0 1rem',
        animation: shake ? 'loginShake 0.45s ease' : 'none',
      }}>
        <div style={{
          background: 'rgba(10, 12, 20, 0.88)',
          border: '1px solid rgba(0,170,255,0.25)',
          borderRadius: 20,
          padding: '2.5rem 2rem',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 60px rgba(0,170,255,0.12), 0 24px 80px rgba(0,0,0,0.7)',
        }}>

          {/* Header carte */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(0,170,255,0.12)',
              border: '1px solid rgba(0,170,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: 22,
              boxShadow: '0 0 24px rgba(0,170,255,0.2)',
            }}>🔐</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '0.08em' }}>
              Accès Sécurisé
            </div>
            <div style={{ fontSize: 11, color: '#4a9fc4', marginTop: 4, letterSpacing: '0.05em' }}>
              REQ · QUÉBEC · DÉTECTION
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Username */}
            <div>
              <label style={{ fontSize: 10, color: '#4a9fc4', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(0,170,255,0.2)',
                  borderRadius: 10, color: '#fff',
                  padding: '11px 14px', fontSize: 14,
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,170,255,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,170,255,0.2)'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 10, color: '#4a9fc4', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="••••••••••"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(0,170,255,0.2)'}`,
                    borderRadius: 10, color: '#fff',
                    padding: '11px 44px 11px 14px', fontSize: 14,
                    outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = error ? 'rgba(239,68,68,0.7)' : 'rgba(0,170,255,0.6)'}
                  onBlur={e => e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(0,170,255,0.2)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#4a9fc4', fontSize: 15, padding: 4, lineHeight: 1,
                  }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: 8, padding: '9px 13px',
                fontSize: 12, color: '#f87171',
                fontWeight: 600, textAlign: 'center',
              }}>
                ✕ {error}
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              style={{
                marginTop: 4,
                padding: '13px',
                borderRadius: 11, border: 'none',
                background: loading || !password.trim()
                  ? 'rgba(0,170,255,0.12)'
                  : 'linear-gradient(135deg, #0088cc, #00aaff)',
                color: loading || !password.trim() ? '#4a9fc4' : '#fff',
                fontSize: 13, fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading || !password.trim() ? 'none' : '0 0 24px rgba(0,170,255,0.35)',
                fontFamily: 'inherit',
              }}
            >
              {loading ? '⟳ Vérification...' : '→ Connexion'}
            </button>
          </form>
        </div>

        {/* Tagline bas */}
        <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: 9, letterSpacing: '0.3em', color: 'rgba(0,200,255,0.35)', textTransform: 'uppercase' }}>
          ▶ Système protégé · Accès restreint
        </div>
      </div>

      <style>{`
        @keyframes imgZoom {
          0%   { transform: scale(1)    translateY(0px); }
          100% { transform: scale(1.08) translateY(-12px); }
        }
        @keyframes floatDrop0 { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-15px)} }
        @keyframes floatDrop1 { 0%,100%{transform:translateY(-8px)} 50%{transform:translateY(8px)}  }
        @keyframes floatDrop2 { 0%,100%{transform:translateY(5px)}  50%{transform:translateY(-11px)} }
        @keyframes loginShake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-10px)}
          40%{transform:translateX(10px)}
          60%{transform:translateX(-7px)}
          80%{transform:translateX(7px)}
        }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px rgba(10,12,20,0.95) inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    </div>
  )
}
