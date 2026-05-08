// utils/api.js — Instance Axios centralisée
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
})

// Ajoute le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jimbe_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// Gère les 401 → déconnexion automatique (sauf pour le login lui-même)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('jimbe_token')
      window.location.reload()
    }
    console.error('API Error:', err.response?.data?.error || err.message)
    return Promise.reject(err)
  }
)

export default api
