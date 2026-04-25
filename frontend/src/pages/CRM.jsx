// pages/CRM.jsx — Gestion des bons leads
import { useState, useEffect } from 'react'
import api from '../utils/api'
import { PageHeader, ScoreBadge, StatusBadge, SignalBadge, Btn, Card, fmtDate, fmtRelative } from '../components/ui/index'

const STATUTS = [
  { value: '',             label: 'Tous' },
  { value: 'bon_lead',     label: 'Bon lead' },
  { value: 'contacte',     label: 'Contacté' },
  { value: 'rdv_planifie', label: 'RDV planifié' },
  { value: 'vendu',        label: 'Vendu' },
  { value: 'perdu',        label: 'Perdu' },
]

const STATUT_OPTIONS = [
  { value: 'bon_lead',     label: 'Bon lead' },
  { value: 'contacte',     label: 'Contacté' },
  { value: 'rdv_planifie', label: 'RDV planifié' },
  { value: 'vendu',        label: 'Vendu' },
  { value: 'perdu',        label: 'Perdu' },
]

export default function CRM() {
  const [entries,    setEntries]    = useState([])
  const [total,      setTotal]      = useState(0)
  const [search,     setSearch]     = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [editingNote,  setEditingNote]  = useState(null)
  const [noteText,     setNoteText]     = useState('')

  const loadCRM = async () => {
    try {
      const params = { limit: 100 }
      if (search)        params.search    = search
      if (filterStatut)  params.statutCRM = filterStatut
      const { data } = await api.get('/crm', { params })
      setEntries(data.entries || [])
      setTotal(data.total || 0)
    } catch { /* ignore */ }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadCRM() }, [search, filterStatut])

  const updateStatut = async (id, statutCRM) => {
    await api.patch(`/crm/${id}`, { statutCRM })
    setEntries(prev => prev.map(e => e._id === id ? { ...e, statutCRM } : e))
  }

  const saveNote = async (id) => {
    await api.patch(`/crm/${id}`, { notes: noteText })
    setEntries(prev => prev.map(e => e._id === id ? { ...e, notes: noteText } : e))
    setEditingNote(null)
  }

  const updateField = async (id, field, value) => {
    await api.patch(`/crm/${id}`, { [field]: value })
    setEntries(prev => prev.map(e => e._id === id ? { ...e, [field]: value } : e))
  }

  const exportCSV = () => { window.open('http://localhost:3001/api/crm/export', '_blank') }

  return (
    <div>
      <PageHeader title="CRM" sub={`${total} bons leads`}>
        <Btn onClick={exportCSV} color="var(--bg3)" style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>
          ↓ Export CSV
        </Btn>
      </PageHeader>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', color: 'var(--text)', fontSize: 13, width: 200 }}
        />
        {STATUTS.map(s => (
          <button key={s.value} onClick={() => setFilterStatut(s.value)} style={{
            padding: '4px 12px', borderRadius: 99, fontSize: 12,
            border: '1px solid var(--border)',
            background: filterStatut === s.value ? 'var(--accent)' : 'var(--bg2)',
            color: filterStatut === s.value ? '#fff' : 'var(--text2)',
            cursor: 'pointer',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {entries.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◉</div>
          <div style={{ color: 'var(--text2)' }}>Aucun bon lead dans le CRM</div>
          <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 8 }}>Marque des leads comme "Bon lead" pour les voir ici</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map((entry, i) => (
            <div key={entry._id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
              animation: `fadeIn 0.2s ease ${i * 0.03}s both`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                {/* Infos lead */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{entry.nom}</span>
                    <ScoreBadge score={entry.score} />
                    <SignalBadge signal={entry.signal} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{entry.ville} · {entry.secteurMatch}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{entry.adresse} {entry.codePostal}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    Créée {fmtDate(entry.dateCreation)} · Ajouté {fmtRelative(entry.dateAjouteCRM)} · NEQ {entry.neq}
                  </div>
                </div>

                {/* Statut + actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <StatusBadge status={entry.statutCRM} />
                  <select
                    value={entry.statutCRM}
                    onChange={e => updateStatut(entry._id, e.target.value)}
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 12, padding: '4px 8px' }}
                  >
                    {STATUT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Champs contact */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <input
                  placeholder="Téléphone"
                  defaultValue={entry.telephone}
                  onBlur={e => updateField(entry._id, 'telephone', e.target.value)}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', color: 'var(--text)', fontSize: 12, width: 140 }}
                />
                <input
                  placeholder="Contact (nom)"
                  defaultValue={entry.contact}
                  onBlur={e => updateField(entry._id, 'contact', e.target.value)}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', color: 'var(--text)', fontSize: 12, width: 160 }}
                />
              </div>

              {/* Notes */}
              <div style={{ marginTop: 8 }}>
                {editingNote === entry._id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      rows={2}
                      style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--text)', fontSize: 12, resize: 'none' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Btn onClick={() => saveNote(entry._id)} color="var(--green)" style={{ fontSize: 11, padding: '4px 10px' }}>Sauver</Btn>
                      <Btn onClick={() => setEditingNote(null)} color="var(--bg3)" style={{ fontSize: 11, padding: '4px 10px', border: '1px solid var(--border)', color: 'var(--text2)' }}>Annuler</Btn>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => { setEditingNote(entry._id); setNoteText(entry.notes || '') }}
                    style={{ fontSize: 12, color: entry.notes ? 'var(--text2)' : 'var(--text3)', cursor: 'pointer', padding: '4px 0', borderBottom: '1px dashed var(--border)' }}
                  >
                    {entry.notes || '+ Ajouter une note...'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}
