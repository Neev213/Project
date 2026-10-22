import api from './axios'
import { directSearch, directWeather } from './openMeteo'

// When our server cannot get weather data (HTTP 5xx or no answer at all), ask Open-Meteo
// straight from the browser instead. After a "busy" answer we skip the server for a few
// minutes, so the next searches do not wait for a request that is going to fail again.
const SERVER_BUSY_MS = 3 * 60 * 1000
let serverBusyUntil = 0

const wasCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError'

const shouldFallBack = (err) => !wasCanceled(err) && (!err.response || err.response.status >= 500)

const markBusy = (err) => {
  if (err.response?.status === 502 || err.response?.status === 503) {
    serverBusyUntil = Date.now() + SERVER_BUSY_MS
  }
}

// place: a city name (string) OR a place object (a suggestion, a favorite, a recent search)
// options.prefetch: warm the server cache without touching search history
export const fetchWeather = async (place, { prefetch = false } = {}) => {
  if (Date.now() >= serverBusyUntil) {
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

    try {
      return (await api.get('/weather', { params })).data
    } catch (err) {
      if (!shouldFallBack(err)) throw err // e.g. "City not Found" is a real answer
      markBusy(err)
    }
  }
  return directWeather(place)
}

// Autocomplete suggestions. Pass an AbortSignal to cancel outdated requests.
export const searchPlaces = async (q, signal) => {
  if (Date.now() >= serverBusyUntil) {
    try {
      return (await api.get('/weather/search', { params: { q }, signal })).data
    } catch (err) {
      if (!shouldFallBack(err)) throw err
      markBusy(err)
    }
  }
  return directSearch(q, signal)
}