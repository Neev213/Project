import api from './axios'

// place: a city name (string) OR a suggestion object from searchPlaces
// options.prefetch: warm the server cache without touching search history
export const fetchWeather = async (place, { prefetch = false } = {}) => {
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
  return (await api.get('/weather', { params })).data
}

// Autocomplete suggestions. Pass an AbortSignal to cancel outdated requests.
export const searchPlaces = async (q, signal) =>
  (await api.get('/weather/search', { params: { q }, signal })).data

// Most recent search, newest first. Returns null if there is none.
export const fetchLastCity = async () => {
  try {
    const { data } = await api.get('/history')
    return Array.isArray(data) && data[0]?.city ? data[0].city : null
  } catch {
    return null
  }
}