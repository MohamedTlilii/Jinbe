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

  _wsRetries: 0,

  // Connecter le WebSocket pour logs temps réel
  connectWS: () => {
    if (get().ws) return
    const wsHost = window.location.hostname || 'localhost'
    const ws = new WebSocket(`ws://${wsHost}:3001`)
    ws.onopen  = () => set({ _wsRetries: 0 })
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'log')      get().addLog(data.message)
        if (data.type === 'progress') set((state) => ({ status: { ...state.status, progress: data.percent, currentStep: data.step } }))
        if (data.type === 'done') {
          get().fetchStatus()
          window.dispatchEvent(new Event('engine:done'))
        }
      } catch { /* message WS non-JSON ignoré */ }
    }
    ws.onclose = () => {
      set({ ws: null })
      const retries = get()._wsRetries + 1
      set({ _wsRetries: retries })
      const delay = Math.min(3000 * Math.pow(1.3, Math.min(retries - 1, 15)), 30000)
      setTimeout(() => get().connectWS(), delay)
    }
    set({ ws })
  },
}))
