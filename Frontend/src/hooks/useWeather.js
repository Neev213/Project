import { useCallback, useRef, useState } from 'react'
import { fetchWeather } from '../api/weather'
import { useScene } from '../context/SceneContext'

const TTL = 10 * 60 * 1000 // how long a result counts as fresh in the browser
const MAX_ENTRIES = 30

const keyOf = (place) =>
  typeof place === 'string'
    ? `n:${place.trim().toLowerCase()}`
    : `c:${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`

export default function useWeather() {
  const { weather } = useScene()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [memory] = useState(() => new Map()) // recent results, kept in the browser
  const [inflight] = useState(() => new Set()) // prefetches already running
  const requestId = useRef(0)

  const remember = useCallback(
    (key, result) => {
      const entry = { result, at: Date.now() }
      memory.set(key, entry)
      // a typed name and the exact coordinates point to the same result
      memory.set(keyOf({ latitude: result.latitude, longitude: result.longitude }), entry)
      while (memory.size > MAX_ENTRIES) memory.delete(memory.keys().next().value)
    },
    [memory]
  )

  const show = useCallback(
    (result) => {
      setData(result)
      weather.current = result // share with the 3D scene
    },
    [weather]
  )

  // place: a city name or a place object picked from the suggestions
  const load = useCallback(
    async (place) => {
      const query = typeof place === 'string' ? place.trim() : place
      if (!query) return

      const id = ++requestId.current // only the latest request may update state
      const key = keyOf(query)
      const hit = memory.get(key)
      const fresh = Boolean(hit && Date.now() - hit.at < TTL)

      setError('')
      if (fresh) {
        show(hit.result) // instant
        setLoading(false)
      } else {
        setLoading(true)
      }

      // Always ask the server too: it records the search history, and it
      // refreshes the data quietly if we showed a cached copy.
      try {
        const result = await fetchWeather(query)
        remember(key, result)
        if (id !== requestId.current) return
        show(result)
      } catch (err) {
        if (id !== requestId.current) return
        if (!fresh) setError(err.response?.data?.message || 'Could not load the weather. Please try again.')
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    },
    [memory, remember, show]
  )

  // Fetch in the background so a later click is instant. Never shows errors.
  const prefetch = useCallback(
    async (place) => {
      const key = keyOf(place)
      const hit = memory.get(key)
      if ((hit && Date.now() - hit.at < TTL) || inflight.has(key)) return

      inflight.add(key)
      try {
        remember(key, await fetchWeather(place, { prefetch: true }))
      } catch {
        /* ignore: this was only a head start */
      } finally {
        inflight.delete(key)
      }
    },
    [memory, inflight, remember]
  )

  return { data, loading, error, load, prefetch }
}