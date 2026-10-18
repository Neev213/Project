import api from './axios'

export const fetchFavorites = async () => (await api.get('/favorites')).data

// place: { city, admin1, country, latitude, longitude }
export const addFavorite = async (place) =>
  (
    await api.post('/favorites', {
      city: place.city,
      admin1: place.admin1,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
    })
  ).data

export const removeFavorite = async (id) => (await api.delete(`/favorites/${id}`)).data