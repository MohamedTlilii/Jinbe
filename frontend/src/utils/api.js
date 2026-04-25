// utils/api.js — Instance Axios centralisée
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
})

// Intercepteur erreurs
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API Error:', err.response?.data?.error || err.message)
    return Promise.reject(err)
  }
)

export default api
