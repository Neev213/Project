import api from './axios'

// A saved history row -> something useWeather.load() understands.
// Old rows only have a city name, so those stay plain strings.
export const placeFromHistory = (h) =>
  h.latitude != null && h.longitude != null
    ? { name: h.city, admin1: h.admin1, country: h.country, latitude: h.latitude, longitude: h.longitude }
    : h.city

// Newest first. Returns [] on any problem.
export const fetchHistory = async () => {
  try {
    const { data } = await api.get('/history')
    return Array.isArray(data) ? data.filter((h) => h.city).map(placeFromHistory) : []
  } catch {
    return []
  }
}

export const clearHistory = async () => (await api.delete('/history')).data