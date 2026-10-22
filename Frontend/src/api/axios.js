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

// --- "The server is waking up" signal ---------------------------------------------------
// If any request is still waiting after SLOW_MS, the page is told (a window event),
// and told again when everything has finished. <ServerNotice /> shows the message.
const SLOW_MS = 5000
let pending = 0
let slowTimer = null

const announce = (slow) => {
  try {
    window.dispatchEvent(new CustomEvent('server-slow', { detail: slow }))
  } catch {
    /* no window (tests, server rendering) */
  }
}

const requestStarted = () => {
  pending += 1
  if (!slowTimer) slowTimer = setTimeout(() => announce(true), SLOW_MS)
}

const requestFinished = () => {
  pending = Math.max(0, pending - 1)
  if (pending === 0) {
    clearTimeout(slowTimer)
    slowTimer = null
    announce(false)
  }
}

// Attach the JWT to every outgoing request
api.interceptors.request.use((config) => {
  requestStarted()
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {
    /* storage unavailable, continue without a token */
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    requestFinished()
    return response
  },
  (error) => {
    requestFinished()
    return Promise.reject(error)
  }
)

// --- Wake the server early ---------------------------------------------------------------
// A free server sleeps when nobody uses it. Knocking as soon as the site opens means it is
// usually awake by the time someone logs in. "no-cors": we do not need the answer.
if (import.meta.env.VITE_API_URL && typeof window !== 'undefined') {
  fetch(`${import.meta.env.VITE_API_URL}/health`, { mode: 'no-cors' }).catch(() => {})
}

export default api