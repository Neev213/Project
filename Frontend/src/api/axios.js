import axios from 'axios'

export const TOKEN_KEY = 'we_token'

// Helps when a deploy forgets the variable: requests would go to the wrong address
if (!import.meta.env.VITE_API_URL) {
  console.error('VITE_API_URL is not set. Add it in your hosting settings and redeploy.')
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 90000, // a free server can take about a minute to wake up
})

// Attach the JWT to every outgoing request
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {
    /* storage unavailable, continue without a token */
  }
  return config
})

export default api