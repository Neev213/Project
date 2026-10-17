import { useCallback, useRef, useState } from 'react'
import { fetchWeather } from '../api/weather'
import { useScene } from '../context/SceneContext'

export default function useWeather() {
  const { weather } = useScene()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(0)

  // place: a city name or a place object picked from the suggestions
  const load = useCallback(
    async (place) => {
      const query = typeof place === 'string' ? place.trim() : place
      if (!query) return

      const id = ++requestId.current // only the latest request may update state
      setLoading(true)
      setError('')

      try {
        const result = await fetchWeather(query)
        if (id !== requestId.current) return
        setData(result)
        weather.current = result // share with the 3D scene
      } catch (err) {
        if (id !== requestId.current) return
        setError(err.response?.data?.message || 'Could not load the weather. Please try again.')
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    },
    [weather]
  )

  return { data, loading, error, load }
}