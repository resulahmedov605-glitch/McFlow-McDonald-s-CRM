import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useLoadingStore } from './useLoadingStore'

export const API_BASE_URL = 'http://localhost:8080'
const ACCESS_TOKEN_KEY = 'mcflow_access_token'
const REFRESH_TOKEN_KEY = 'mcflow_refresh_token'

type TokenResponse = {
  accessToken: string
  refreshToken: string
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

let refreshPromise: Promise<TokenResponse> | null = null

const clearStoredTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const requestTokenRefresh = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<TokenResponse>(`${API_BASE_URL}/api/Auth/refresh-token`, {
        accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || '',
        refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
      })
      .then((response) => response.data)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  useLoadingStore.getState().startLoading()

  const token = localStorage.getItem(ACCESS_TOKEN_KEY)

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
  async (error) => {
    useLoadingStore.getState().stopLoading()

    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      originalRequest &&
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      try {
        const refreshResponse = await requestTokenRefresh()

        localStorage.setItem(ACCESS_TOKEN_KEY, refreshResponse.accessToken)
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshResponse.refreshToken)

        originalRequest.headers.Authorization = `Bearer ${refreshResponse.accessToken}`
        
        return api(originalRequest)

      } catch (error) {
        clearStoredTokens()

        window.location.href = '/login'

        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

export default api
