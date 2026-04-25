// store/engineStore.js — État global du moteur
import { create } from 'zustand'
import api from '../utils/api'

export const useEngineStore = create((set, get) => ({
  status: {
    isRunning:      false,
    isProcessing:   false,
    lastRun:        null,
    nextRun:        null,
    lastLeadsFound: 0,
    lastDuration:   0,
    progress:       0,
    currentStep:    '',
  },
  logs: [],
  ws:   null,

  // Charger le statut depuis l'API
  fetchStatus: async () => {
    try {
      const { data } = await api.get('/engine/status')
      set({ status: data })
    } catch { /* ignore */ }
  },

  // Démarrer le moteur
  start: async () => {
    await api.post('/engine/start')
    get().fetchStatus()
  },

  // Arrêter le moteur
  stop: async () => {
    await api.post('/engine/stop')
    get().fetchStatus()
  },

  // Lancer manuellement
  runNow: async () => {
    await api.post('/engine/run')
    get().fetchStatus()
  },

  // Reset DB + rechargement complet 2.9M
  resetDB: async () => {
    await api.post('/engine/reset')
    get().fetchStatus()
  },

  // Test — N leads (défaut 10)
  runTestMode: async (limit = 10) => {
    await api.post('/engine/test', { limit })
    get().fetchStatus()
  },

  // Ajouter une ligne au log
  addLog: (message) => set((state) => ({
    logs: [...state.logs.slice(-200), { id: Date.now(), message, time: new Date().toLocaleTimeString('fr-CA') }]
  })),

  clearLogs: () => set({ logs: [] }),

  // Connecter le WebSocket pour logs temps réel
  connectWS: () => {
    if (get().ws) return
    const ws = new WebSocket('ws://localhost:3001')
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'log')      get().addLog(data.message)
      if (data.type === 'progress') set((state) => ({ status: { ...state.status, progress: data.percent, currentStep: data.step } }))
      if (data.type === 'done') {
        get().fetchStatus()
        window.dispatchEvent(new Event('engine:done'))
      }
    }
    ws.onclose = () => { set({ ws: null }); setTimeout(() => get().connectWS(), 3000) }
    set({ ws })
  },
}))
