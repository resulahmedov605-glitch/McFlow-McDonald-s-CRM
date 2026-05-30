import axios from 'axios'
import { useLoadingStore } from './useLoadingStore'

const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  useLoadingStore.getState().startLoading()

  const token = localStorage.getItem('mcflow_access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    useLoadingStore.getState().stopLoading()
    return response
  },
  (error) => {
    useLoadingStore.getState().stopLoading()
    return Promise.reject(error)
  },
)

export default api
