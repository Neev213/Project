import api from './axios'
import { directSearch, directWeather } from './openMeteo'

// Our server is asked first, because it caches answers and saves search history.
// Open-Meteo is asked straight from the browser when the server:
//   - answers with an error (5xx), or does not answer at all, or
//   - is still silent after HEDGE_MS (a free server that is waking up takes about a minute).
// In the second case both requests run and the first good answer wins.
const HEDGE_MS = 3500
const SERVER_BUSY_MS = 3 * 60 * 1000 // after a "busy" answer, skip the server for a while
let serverBusyUntil = 0

const wasCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError'

const shouldFallBack = (err) => !wasCanceled(err) && (!err.response || err.response.status >= 500)

const markBusy = (err) => {
  if (err.response?.status === 502 || err.response?.status === 503) {
    serverBusyUntil = Date.now() + SERVER_BUSY_MS
  }
}

function serverFirst(serverCall, directCall) {
  if (Date.now() < serverBusyUntil) return directCall()

  return new Promise((resolve, reject) => {
    let finished = false
    let serverFailed = false
    let direct = 'idle' // 'idle' | 'running' | 'failed'
    let directError
    let timer

    const finish = (fn, value) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      fn(value)
    }

    const startDirect = () => {
      if (direct !== 'idle') return
      direct = 'running'
      directCall().then(
        (value) => finish(resolve, value),
        (err) => {
          direct = 'failed'
          directError = err
          // keep waiting for the server unless it already failed (or the request was canceled)
          if (serverFailed || wasCanceled(err)) finish(reject, err)
        }
      )
    }

    timer = setTimeout(startDirect, HEDGE_MS)

    serverCall().then(
      (value) => finish(resolve, value),
      (err) => {
        if (!shouldFallBack(err)) return finish(reject, err) // e.g. "City not Found" is a real answer
        markBusy(err)
        serverFailed = true
        if (direct === 'failed') finish(reject, directError)
        else startDirect()
      }
    )
  })
}

// place: a city name (string) OR a place object (a suggestion, a favorite, a recent search)
// options.prefetch: warm the server cache without touching search history
export const fetchWeather = (place, { prefetch = false } = {}) => {
  const params =
    typeof place === 'string'
      ? { city: place }
      : {
          lat: place.latitude,
          lon: place.longitude,
          name: place.name,
          country: place.country,
          admin1: place.admin1,
        }
  if (prefetch) params.prefetch = 1

  return serverFirst(
    async () => (await api.get('/weather', { params })).data,
    () => directWeather(place)
  )
}

// Autocomplete suggestions. Pass an AbortSignal to cancel outdated requests.
export const searchPlaces = (q, signal) =>
  serverFirst(
    async () => (await api.get('/weather/search', { params: { q }, signal })).data,
    () => directSearch(q, signal)
  )