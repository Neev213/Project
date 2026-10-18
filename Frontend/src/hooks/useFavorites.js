import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { addFavorite, fetchFavorites, removeFavorite } from '../api/favorites'

const keyOf = (p) => `${Number(p.latitude).toFixed(2)},${Number(p.longitude).toFixed(2)}`

export default function useFavorites() {
  const { user } = useAuth()
  const loggedIn = Boolean(user)
  const [items, setItems] = useState([])
  const busy = useRef(false) // one change at a time

  useEffect(() => {
    if (!loggedIn) {
      setItems([])
      return
    }
    let cancelled = false
    fetchFavorites()
      .then((list) => {
        if (!cancelled) setItems(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [loggedIn])

  // After a refused change, show what the server really has
  const resync = useCallback(async (fallback) => {
    try {
      setItems(await fetchFavorites())
    } catch {
      setItems(fallback)
    }
  }, [])

  const isFavorite = useCallback(
    (place) => Boolean(place) && items.some((f) => keyOf(f) === keyOf(place)),
    [items]
  )

  const remove = useCallback(
    async (fav) => {
      if (busy.current) return
      busy.current = true
      const snapshot = items
      setItems((list) => list.filter((f) => f._id !== fav._id)) // instant
      try {
        await removeFavorite(fav._id)
      } catch {
        await resync(snapshot) // roll back
      } finally {
        busy.current = false
      }
    },
    [items, resync]
  )

  // place: { city, admin1, country, latitude, longitude }
  const toggle = useCallback(
    async (place) => {
      if (!place) return
      const existing = items.find((f) => keyOf(f) === keyOf(place))
      if (existing) return remove(existing)

      if (busy.current) return
      busy.current = true
      const snapshot = items
      setItems((list) => [{ _id: `tmp-${Date.now()}`, ...place }, ...list]) // instant
      try {
        const saved = await addFavorite(place)
        setItems((list) => list.map((f) => (keyOf(f) === keyOf(saved) ? saved : f))) // swap in the real one
      } catch {
        await resync(snapshot) // roll back (limit reached, duplicate, offline...)
      } finally {
        busy.current = false
      }
    },
    [items, remove, resync]
  )

  return { items, isFavorite, toggle, remove }
}