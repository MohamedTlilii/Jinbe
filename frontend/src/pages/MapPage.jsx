// pages/MapPage.jsx — Carte des leads (lookup local instantané)
import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Rectangle, Polygon, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../utils/api'
import { generateLeadPDF } from '../utils/pdf'
import { useT } from '../i18n/useT'

const MAP_CSS = `.leaflet-tile { border: none !important; outline: none !important; }`

// Coordonnées approx par ville (lookup local, instantané, pas de geocoding)
const CITY_COORDS = {
  // Montréal & région
  'montréal': [45.5017, -73.5673], 'montreal': [45.5017, -73.5673],
  'laval': [45.6066, -73.7124],
  'longueuil': [45.5312, -73.5185],
  'brossard': [45.4565, -73.4749],
  'mirabel': [45.6500, -74.1833],
  'saint-jérôme': [45.7744, -74.0025], 'saint-jerome': [45.7744, -74.0025],
  'saint-sauveur': [45.9000, -74.1667],
  'terrebonne': [45.7036, -73.6469],
  'repentigny': [45.7397, -73.4697],
  'boucherville': [45.5986, -73.4336],
  'vaudreuil-dorion': [45.3986, -74.0269], 'vaudreuil': [45.3986, -74.0269],
  'salaberry-de-valleyfield': [45.2667, -74.1333], 'valleyfield': [45.2667, -74.1333],
  'saint-jean-sur-richelieu': [45.3167, -73.2667], 'st-jean-sur-richelieu': [45.3167, -73.2667],
  'saint-hyacinthe': [45.6167, -72.9500],
  'sorel-tracy': [46.0333, -73.1167], 'sorel': [46.0333, -73.1167],
  'granby': [45.4000, -72.7333],
  'blainville': [45.6717, -73.8828],
  'boisbriand': [45.6167, -73.8333],
  'sainte-thérèse': [45.6333, -73.8500], 'sainte-therese': [45.6333, -73.8500],
  'rosemère': [45.6333, -73.8000], 'rosemere': [45.6333, -73.8000],
  'lachute': [45.6547, -74.3391],
  'sainte-julie': [45.5833, -73.3333],
  'châteauguay': [45.3806, -73.7441], 'chateauguay': [45.3806, -73.7441],
  'mont-royal': [45.5167, -73.6444],
  'saint-laurent': [45.5098, -73.6970],
  'deux-montagnes': [45.5333, -73.8667],
  'saint-eustache': [45.5667, -73.9000],
  'chambly': [45.4500, -73.2833],
  'carignan': [45.4333, -73.3000],
  'beloeil': [45.5667, -73.2000],
  'varennes': [45.7167, -73.4333],
  'mascouche': [45.7500, -73.6000],
  "l'assomption": [45.8167, -73.4333],
  'joliette': [46.0167, -73.4500],
  'saint-constant': [45.3667, -73.5750],
  'delson': [45.3667, -73.5333],
  'candiac': [45.3833, -73.5167],
  'la prairie': [45.4167, -73.5000],
  'saint-bruno-de-montarville': [45.5333, -73.3500], 'saint-bruno': [45.5333, -73.3500],
  'saint-basile-le-grand': [45.5333, -73.2833],
  'saint-lambert': [45.5000, -73.5167],
  'mont-saint-hilaire': [45.5667, -73.1833],
  'mercier': [45.3333, -73.7500],
  'sainte-catherine': [45.4000, -73.5833],
  'pointe-claire': [45.4500, -73.8167],
  'dollard-des-ormeaux': [45.4833, -73.8333], 'ddo': [45.4833, -73.8333],
  'kirkland': [45.4500, -73.8667],
  'beaconsfield': [45.4333, -73.8667],
  'westmount': [45.4833, -73.6000],
  'sainte-agathe-des-monts': [46.0500, -74.2833],
  'côte-saint-luc': [45.4667, -73.6667], 'cote-saint-luc': [45.4667, -73.6667],
  'lanoraie': [45.9833, -73.2167],
  'contrecœur': [45.8500, -73.2333], 'contrecoeur': [45.8500, -73.2333],
  'mcmasterville': [45.5500, -73.2167],
  'otterburn park': [45.5333, -73.2000],
  'saint-charles-borromée': [46.0500, -73.4667],
  'coteau-du-lac': [45.2667, -74.1833],
  'hudson': [45.4333, -74.1500],
  'rigaud': [45.4667, -74.3000],
  'sainte-anne-de-bellevue': [45.4167, -73.9500],
  // Mauricie
  'trois-rivières': [46.3432, -72.5428], 'trois-rivieres': [46.3432, -72.5428],
  'cap-de-la-madeleine': [46.3667, -72.5167],
  'shawinigan': [46.5667, -72.7500],
  'grand-mère': [46.6167, -72.7000],
  'drummondville': [45.8833, -72.4833],
  'victoriaville': [46.0500, -71.9667],
  'plessisville': [46.2167, -71.7667],
  'louiseville': [46.2547, -72.9426],
  'saint-tite': [46.7333, -72.5667],
  'bécancour': [46.3333, -72.4333], 'becancour': [46.3333, -72.4333],
  'nicolet': [46.2333, -72.6167],
  'warwick': [45.9500, -71.9000],
  'kingsey falls': [45.8667, -72.0667],
  'pierreville': [46.0833, -72.8167],
  'saint-germain-de-grantham': [45.8167, -72.5500],
  'wickham': [45.8000, -72.5000],
  'notre-dame-du-bon-conseil': [45.9667, -72.3500],
  'yamaska': [46.0000, -72.9167],
  'saint-liboire': [45.6500, -72.7667],
  'batiscan': [46.5000, -72.2667],
  'champlain': [46.4500, -72.4000],
  'saint-étienne-des-grès': [46.4500, -72.8667],
  'saint-Maurice': [46.5000, -72.7000],
  'grondines': [46.5667, -72.0167],
  // Outaouais / Gatineau
  'gatineau': [45.4765, -75.7013],
  'ottawa': [45.4215, -75.6972],
  'hull': [45.4200, -75.7100],
  'aylmer': [45.3900, -75.8333],
  'buckingham': [45.5833, -75.4333],
  'masson-angers': [45.5333, -75.4000],
  'orléans': [45.4667, -75.5167], 'orleans': [45.4667, -75.5167],
  'clarence-rockland': [45.5500, -75.2000], 'rockland': [45.5500, -75.2000],
  'embrun': [45.2833, -75.2833],
  // Québec
  'québec': [46.8139, -71.2080], 'quebec': [46.8139, -71.2080],
  'lévis': [46.8025, -71.1756], 'levis': [46.8025, -71.1756],
  'beauport': [46.8667, -71.1833],
  'charlesbourg': [46.8667, -71.2667],
  'sainte-foy': [46.7833, -71.2833],
  'sillery': [46.7833, -71.2500],
  'cap-rouge': [46.7667, -71.3667],
  'loretteville': [46.8333, -71.3500],
  'saint-augustin-de-desmaures': [46.7333, -71.4667],
  'val-bélair': [46.8833, -71.4167], 'val-belair': [46.8833, -71.4167],
  'lac-saint-charles': [46.9500, -71.3500],
  "l'ancienne-lorette": [46.7992, -71.3570],
  'wendake': [46.8736, -71.3575],
  'boischatel': [46.9167, -71.1000],
  'charny': [46.7167, -71.2667],
  'saint-romuald': [46.7500, -71.2333],
  'donnacona': [46.6714, -71.7769],
  'pont-rouge': [46.7500, -71.6833],
  'portneuf': [46.6833, -71.8833],
  'neuville': [46.7000, -71.5833],
  'sainte-anne-de-beaupré': [47.0167, -70.9333],
  'baie-saint-paul': [47.4383, -70.5250],
  'shannon': [46.8833, -71.5167],
  'saint-gabriel-de-valcartier': [46.9333, -71.5167],
  'stoneham': [47.0000, -71.3667],
  'fossambault-sur-le-lac': [46.8667, -71.5833],
  'saint-nicolas': [46.6667, -71.3833],
  'pintendre': [46.7500, -71.2833],
  'saint-jean-chrysostome': [46.7333, -71.2000],
  'scott': [46.5167, -71.0333],
}

const getCoords = (ville) => {
  if (!ville) return null
  const raw = ville.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').trim()
  return CITY_COORDS[ville.toLowerCase()] || CITY_COORDS[raw] || null
}

const jitter = (id, axis, r = 0.12) => {
  const n = parseInt((String(id || '')).replace(/\D/g, '').slice(-8) || '12345')
  const v = axis === 0 ? (n * 9301 + 49297) % 233280 : (n * 3541 + 31337) % 233280
  return (v / 233280 - 0.5) * r * 2
}

const GROUP_CENTER = {
  montreal:  [45.5017, -73.5673],
  mauricie:  [46.3432, -72.5428],
  quebec:    [46.8139, -71.2080],
  outaouais: [45.4765, -75.7013],
  default:   [46.1,    -73.0],
}

const SIGNAL_COLOR = {
  nouvelle:     '#4ade80',
  reouverture:  '#2dd4bf',
  demenagement: '#fb923c',
  fermeture:    '#f87171',
}

function LockMinZoom() {
  const map = useMap()
  useEffect(() => {
    map.whenReady(() => {
      map.setZoom(7, { animate: false })
      map.setMinZoom(7)
    })
  }, [map])
  return null
}

function MapFly({ center, zoom, bounds }) {
  const map = useMap()
  const prev = useRef(null)
  useEffect(() => {
    if (!center && !bounds) return
    const key = bounds ? `bounds:${bounds[0].join(',')}_${bounds[1].join(',')}` : `center:${center.join(',')}_${zoom}`
    if (key !== prev.current) {
      if (bounds) map.flyToBounds(bounds, { duration: 1.0, padding: [8, 8] })
      else map.flyTo(center, zoom, { duration: 1.0 })
      prev.current = key
    }
  }, [center, zoom, bounds, map])
  return null
}

export default function MapPage() {
  const t = useT()

  const SIGNAL_LABEL = {
    nouvelle:     t('map.nouvelle'),
    reouverture:  t('map.reouverture'),
    demenagement: t('map.demenagement'),
    fermeture:    t('map.fermeture'),
  }

  const FRAME_BOUNDS = [[44.2, -76.7], [48.0, -69.7]]

  const GROUPES = [
    { id: 'all',       label: t('map.all'),       bounds: FRAME_BOUNDS },
    { id: 'montreal',  label: '🔴 Mtl',            center: [45.5017, -73.5673], zoom: 10 },
    { id: 'mauricie',  label: '🟡 Mauricie',        center: [46.3430, -72.5470], zoom: 10 },
    { id: 'quebec',    label: '🔵 Québec',          center: [46.8139, -71.2080], zoom: 11 },
    { id: 'outaouais', label: '✕ Outaouais',        center: [45.4765, -75.7013], zoom: 11 },
  ]

  const ZONE_CIRCLES = [
    { center: [45.5017, -73.5673], color: '#ef4444', radius: 80000, name: '🔴 Montréal',  region: 'Île-de-Montréal',    driveKey: 'map.drive60' },
    { center: [46.3432, -72.5428], color: '#eab308', radius: 80000, name: '🟡 Mauricie',   region: 'Trois-Rivières',     driveKey: 'map.drive60' },
    { center: [46.8139, -71.2080], color: '#3b82f6', radius: 80000, name: '🔵 Québec',     region: 'Capitale-Nationale', driveKey: 'map.drive60' },
    { center: [45.4765, -75.7013], color: '#ef4444', radius: 40000, ottawa: true },
    { center: [45.4042, -71.8929], color: '#a855f7', radius: 80000, name: '🟣 Sherbrooke', region: 'Estrie',             driveKey: 'map.drive60' },
    { center: [45.4000, -72.7333], color: '#06b6d4', radius: 80000, name: '🩵 Granby',     region: 'Montérégie-Est',     driveKey: 'map.drive60' },
  ]

  const MAP_BOUNDS = [[43.6, -77.5], [48.8, -68.9]]

  const [mapCenter,   setMapCenter]   = useState(null)
  const [mapZoom,     setMapZoom]     = useState(null)
  const [mapBounds,   setMapBounds]   = useState(FRAME_BOUNDS)
  const [markers,     setMarkers]     = useState([])
  const [loading,     setLoading]     = useState(false)
  const [activeGroup, setActiveGroup] = useState('all')
  const [search,      setSearch]      = useState('')
  const sigIndexRef = useRef({})

  const loadLeads = async (groupeId) => {
    setLoading(true)
    setMarkers([])
    sigIndexRef.current = {}

    try {
      const params = { limit: 2000 }
      if (groupeId !== 'all') params.groupe = groupeId

      const { data: leadsData } = await api.get('/leads', { params })
      const leads = leadsData.leads || []

      const fallback = (groupeId !== 'all' && GROUP_CENTER[groupeId]) || GROUP_CENTER.default
      const groups = {}
      leads.forEach(lead => {
        const coords = getCoords(lead.ville) || fallback
        const key = `${coords[0].toFixed(3)}_${coords[1].toFixed(3)}`
        if (!groups[key]) groups[key] = { coords, items: [] }
        groups[key].items.push(lead)
      })
      const result = []
      Object.values(groups).forEach(({ coords, items }) => {
        const n = items.length
        items.forEach((lead, i) => {
          const angle = n > 1 ? (i / n) * 2 * Math.PI : 0
          const r = n > 1 ? 0.15 : 0
          result.push({ ...lead, pos: [coords[0] + r * Math.sin(angle), coords[1] + r * Math.cos(angle)] })
        })
      })
      setMarkers(result)
    } catch (e) { console.error(e) }

    setLoading(false)
  }

  const handleGroup = (g) => {
    setActiveGroup(g.id)
    if (g.bounds) {
      setMapBounds(g.bounds)
      setMapCenter(null)
      setMapZoom(null)
    } else {
      setMapCenter(g.center)
      setMapZoom(g.zoom)
      setMapBounds(null)
    }
    loadLeads(g.id)
  }

  const searchCity = async () => {
    const v = search.trim()
    if (!v) return
    setLoading(true)
    setActiveGroup(null)
    setMarkers([])
    sigIndexRef.current = {}

    const coords = getCoords(v)
    if (coords) {
      setMapBounds(null)
      setMapCenter(coords)
      setMapZoom(12)
    }

    try {
      const { data: leadsData } = await api.get('/leads', { params: { ville: v, limit: 100 } })
      const leads = leadsData.leads || []
      const fallbackSearch = coords || GROUP_CENTER.default
      const result = leads.map(lead => {
        const c = getCoords(lead.ville) || fallbackSearch
        return { ...lead, pos: [c[0] + jitter(lead._id, 0, 0.025), c[1] + jitter(lead._id, 1, 0.025)] }
      })
      setMarkers(result)
    } catch (e) { console.error(e) }

    setLoading(false)
  }

  const flyToSignal = (signal) => {
    const ofType = markers.filter(m => m.signal === signal)
    if (!ofType.length) return
    const idx = (sigIndexRef.current[signal] || 0) % ofType.length
    sigIndexRef.current[signal] = idx + 1
    setMapBounds(null)
    setMapCenter(ofType[idx].pos)
    setMapZoom(14)
  }

  useEffect(() => { loadLeads('all') }, [])

  const total = markers.length

  return (
    <div style={{ height: '100%' }}>

      {/* Hero Header */}
      <div style={{
        background: 'var(--bg2)', borderRadius: 18,
        border: '1px solid #34d39920',
        padding: '1.4rem 2rem', marginBottom: '1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden', flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ position:'absolute', top:-60, left:-60, width:200, height:200, borderRadius:'50%', background:'#34d399', opacity:0.06, filter:'blur(60px)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:18, zIndex:1 }}>
          <div style={{
            width:50, height:50, borderRadius:14,
            background:'#34d39918', border:'1px solid #34d39930',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20, color:'#34d399', boxShadow:'0 0 22px #34d39922',
          }}>◉</div>
          <div>
            <div style={{ fontSize:9, color:'#34d399', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:5, opacity:0.9 }}>
              {t('map.subtitle')}
            </div>
            <div style={{ fontSize:24, fontWeight:900, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1 }}>
              {t('map.title')}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, zIndex:1, flexWrap:'wrap' }}>
          {/* Région pills */}
          <div style={{ display:'flex', gap:3, background:'var(--bg3)', borderRadius:10, padding:3 }}>
            {GROUPES.map(g => {
              const isOttawa = g.id === 'outaouais'
              const isActive = activeGroup === g.id
              return (
                <button key={g.id} onClick={() => handleGroup(g)} disabled={loading} style={{
                  padding:'5px 11px', borderRadius:7, fontSize:11, fontWeight:700,
                  border:'none', cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.15s',
                  background: isActive ? (isOttawa ? '#ef444422' : '#34d39922') : 'transparent',
                  color: isOttawa ? '#ef4444' : (isActive ? '#34d399' : 'var(--text3)'),
                  boxShadow: isActive ? (isOttawa ? '0 0 8px #ef444422' : '0 0 8px #34d39922') : 'none',
                }}>{g.label}</button>
              )
            })}
          </div>

          {/* Search */}
          <div style={{ display:'flex', gap:6 }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchCity()}
              placeholder={t('map.city')} disabled={loading}
              style={{
                background:'var(--bg3)', border:`1px solid ${search ? '#34d39950' : 'var(--border)'}`,
                borderRadius:9, color:'var(--text)', padding:'6px 12px', fontSize:12, width:130, outline:'none',
              }}
            />
            <button onClick={searchCity} disabled={loading || !search.trim()} style={{
              padding:'6px 14px', borderRadius:9, fontSize:12, fontWeight:700,
              background: loading || !search.trim() ? 'var(--bg3)' : '#34d399',
              color: loading || !search.trim() ? 'var(--text3)' : '#000',
              border:'none', cursor: loading || !search.trim() ? 'not-allowed' : 'pointer',
            }}>→</button>
          </div>

          {/* Count */}
          <div style={{ textAlign:'right', minWidth:48 }}>
            <div style={{ fontSize:24, fontWeight:900, color: loading ? 'var(--text3)' : 'var(--text)', lineHeight:1, letterSpacing:'-0.03em' }}>
              {loading ? '⟳' : total}
            </div>
            <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{t('map.onmap')}</div>
          </div>
        </div>
      </div>

      {/* Légende cliquable */}
      <div style={{
        display:'flex', alignItems:'center', gap:6, marginBottom:'0.75rem', flexWrap:'wrap',
        background:'var(--bg2)', borderRadius:10, padding:'0.55rem 1rem',
        border:'1px solid var(--border)',
      }}>
        {Object.entries(SIGNAL_LABEL).map(([sig, lbl]) => {
          const count = markers.filter(m => m.signal === sig).length
          const active = count > 0
          return (
            <button key={sig} onClick={() => flyToSignal(sig)} disabled={!active} style={{
              display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700,
              background: active ? `${SIGNAL_COLOR[sig]}18` : 'transparent',
              color: active ? SIGNAL_COLOR[sig] : 'var(--text3)',
              border: `1px solid ${active ? SIGNAL_COLOR[sig] + '40' : 'transparent'}`,
              borderRadius:99, padding:'3px 10px',
              cursor: active ? 'pointer' : 'default', transition:'all 0.15s',
            }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background: active ? SIGNAL_COLOR[sig] : 'var(--border)', display:'inline-block', flexShrink:0 }} />
              {lbl}
              {count > 0 && <span style={{ opacity:0.65 }}>{count}</span>}
            </button>
          )
        })}
        {loading && (
          <span style={{ marginLeft:'auto', fontSize:11, color:'#34d399', fontStyle:'italic', opacity:0.8 }}>
            ⟳ {t('map.loading')}
          </span>
        )}
        {!loading && total === 0 && (
          <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text3)', fontStyle:'italic' }}>
            {t('map.noleads')}
          </span>
        )}
      </div>

      {/* Carte */}
      <div style={{ height: 'calc(100vh - 270px)', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapContainer
          bounds={FRAME_BOUNDS}
          boundsOptions={{ padding: [20, 20] }}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          maxBounds={MAP_BOUNDS}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <LockMinZoom />
          <MapFly center={mapCenter} zoom={mapZoom} bounds={mapBounds} />

          {/* X rouge sur Ottawa — hors Registre des Entreprises du Québec */}
          <Marker
            position={[45.4765, -75.7013]}
            interactive={false}
            icon={L.divIcon({
              className: '',
              html: '<div style="color:#ef4444;font-size:42px;font-weight:900;line-height:1;text-shadow:0 0 10px #ef4444cc,0 0 3px #000;">✕</div>',
              iconSize: [44, 44],
              iconAnchor: [22, 22],
            })}
          />

          {/* Masque noir sur tout ce qui est hors du cadre */}
          <Polygon
            positions={[
              [[-90,-180],[-90,180],[90,180],[90,-180]],
              [[44.2,-76.7],[44.2,-69.7],[48.0,-69.7],[48.0,-76.7]],
            ]}
            pathOptions={{ stroke: false, fillColor: '#000', fillOpacity: 0.82 }}
          />

          {/* Cadre noir épais autour de toute la zone */}
          <Rectangle
            bounds={FRAME_BOUNDS}
            pathOptions={{ color: '#000000', weight: 4, fill: false }}
          />

          {/* Cercles colorés avec glow */}
          {ZONE_CIRCLES.map((z, i) => (
            <React.Fragment key={i}>
              <Circle
                center={z.center}
                radius={z.radius * 1.25}
                pathOptions={{ color: z.ottawa ? '#ef4444' : z.color, weight: 0, fillColor: z.ottawa ? '#1a1a2e' : z.color, fillOpacity: z.ottawa ? 0.18 : 0.08 }}
              />
              <Circle
                center={z.center}
                radius={z.radius}
                pathOptions={{ color: z.ottawa ? '#ef4444' : z.color, weight: z.ottawa ? 3 : 2.5, fillColor: z.ottawa ? '#0f0f1a' : z.color, fillOpacity: z.ottawa ? 0.55 : 0.25, dashArray: z.ottawa ? '8,5' : undefined }}
              >
                {z.ottawa ? (
                  <Popup>
                    <div style={{ fontFamily:'sans-serif', fontSize:13, maxWidth:220 }}>
                      <div style={{ fontWeight:700, color:'#ef4444', marginBottom:6 }}>{t('map.ottawa.title')}</div>
                      <div style={{ color:'#555', lineHeight:1.5 }}>{t('map.ottawa.desc')}</div>
                    </div>
                  </Popup>
                ) : (
                  <Popup>
                    <div style={{ fontFamily:'sans-serif', fontSize:13, maxWidth:230 }}>
                      <div style={{ fontWeight:800, color: z.color, fontSize:15, marginBottom:4 }}>{z.name}</div>
                      <div style={{ color:'#666', fontSize:11, marginBottom:8 }}>{z.region}</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', background:'#f5f5f5', borderRadius:7, padding:'5px 10px' }}>
                          <span style={{ color:'#888', fontSize:11 }}>{t('map.zone.rayon')}</span>
                          <span style={{ fontWeight:700, color:'#222' }}>{z.radius / 1000} km</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', background:'#f5f5f5', borderRadius:7, padding:'5px 10px' }}>
                          <span style={{ color:'#888', fontSize:11 }}>{t('map.zone.temps')}</span>
                          <span style={{ fontWeight:700, color:'#222' }}>{t(z.driveKey)}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                )}
              </Circle>
            </React.Fragment>
          ))}

          {markers.map(lead => (
            <CircleMarker
              key={lead._id}
              center={lead.pos}
              radius={8}
              pathOptions={{
                color: '#fff',
                weight: 1.5,
                fillColor: SIGNAL_COLOR[lead.signal] || '#8b90a7',
                fillOpacity: 0.9,
              }}
            >
              <Popup minWidth={220}>
                <div style={{ fontFamily: 'sans-serif', fontSize: 13 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{lead.nom || t('signal.noname')}</div>
                  <div style={{ fontSize: 11, color: SIGNAL_COLOR[lead.signal], fontWeight: 600, marginBottom: 6 }}>
                    ● {SIGNAL_LABEL[lead.signal] || lead.signal}
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>{lead.adresse}</div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>{lead.ville} · {lead.codePostal}</div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>{t('common.score')} : {lead.score}/6 · NEQ {lead.neq}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    <a href={`https://www.google.com/maps/search/?q=${encodeURIComponent([lead.adresse, lead.ville, 'QC', lead.codePostal].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, padding: '3px 7px', background: '#1a73e81a', color: '#1a73e8', border: '1px solid #1a73e844', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>📍 Maps</a>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent([lead.adresse, lead.ville, 'QC', lead.codePostal].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, padding: '3px 7px', background: '#0f9d581a', color: '#0f9d58', border: '1px solid #0f9d5844', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>🔍 Google</a>
                    <a href={`https://www.facebook.com/search/top?q=${encodeURIComponent(lead.nom || '')}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, padding: '3px 7px', background: '#18529d1a', color: '#18529d', border: '1px solid #18529d44', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>📘 FB</a>
                    <a href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(lead.nom || '')}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, padding: '3px 7px', background: '#e10a7d1a', color: '#e10a7d', border: '1px solid #e10a7d44', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>📸 IG</a>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(lead.nom || '')}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, padding: '3px 7px', background: '#22c55e1a', color: '#22c55e', border: '1px solid #22c55e44', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>🌐 Web</a>
                    <button onClick={() => generateLeadPDF(lead)} style={{ fontSize: 10, padding: '3px 7px', background: '#6c63ff1a', color: '#6c63ff', border: '1px solid #6c63ff44', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>↓ PDF</button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <style>{MAP_CSS}</style>
    </div>
  )
}
