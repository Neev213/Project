import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { AnimatePresence, motion } from 'framer-motion'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import { useScene } from '../context/SceneContext'
import { useAuth } from '../context/AuthContext'
import useWeather from '../hooks/useWeather'
import useFavorites from '../hooks/useFavorites'
import { fetchHistory, clearHistory } from '../api/history'
import SearchBar from '../components/dashboard/SearchBar'
import RecentSearches from '../components/dashboard/RecentSearches'
import CurrentCard from '../components/dashboard/CurrentCard'
import StatsGrid from '../components/dashboard/StatsGrid'
import ForecastStrip from '../components/dashboard/ForecastStrip'
import FavoritesCoverflow from '../components/dashboard/FavoritesCoverflow'

const DEFAULT_CITY = 'London'
const MAX_RECENT = 10
const SHOWN_RECENT = 6

const labelOf = (p) => (typeof p === 'string' ? p : p.name)
const sameAs = (a, b) =>
  typeof a === 'object' && typeof b === 'object'
    ? a.latitude.toFixed(2) === b.latitude.toFixed(2) && a.longitude.toFixed(2) === b.longitude.toFixed(2)
    : labelOf(a).toLowerCase() === labelOf(b).toLowerCase()

// weather result -> place for load() / the recent list
const placeFromData = (d) => ({
  name: d.city,
  admin1: d.admin1,
  country: d.country,
  latitude: d.latitude,
  longitude: d.longitude,
})

export default function Dashboard() {
  const { setPhase, plunge } = useScene()
  const { user, logout } = useAuth()
  const { data, loading, error, load, prefetch } = useWeather()
  const favs = useFavorites()
  const [recent, setRecent] = useState([])

  // Scene: finish the plunge, fade the white flash
  useEffect(() => {
    setPhase('dashboard')
    gsap.to('[data-flash]', { opacity: 0, duration: 1.2, delay: 0.15, ease: 'power2.out' })
    if (plunge.current < 1) {
      gsap.to(plunge, { current: 1, duration: 2.5, ease: 'power2.inOut' })
    }
  }, [setPhase, plunge])

  // Start: load history, then reopen the exact place you last viewed
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const history = await fetchHistory()
      if (cancelled) return
      setRecent(history)
      load(history[0] || DEFAULT_CITY)
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  // Keep the recent chips up to date locally, so we never wait for the server
  useEffect(() => {
    if (!data) return
    const place = placeFromData(data)
    setRecent((prev) => [place, ...prev.filter((p) => !sameAs(p, place))].slice(0, MAX_RECENT))
  }, [data])

  const openPlace = (place) => {
    load(place)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearRecent = async () => {
    setRecent([])
    try {
      await clearHistory()
    } catch {
      /* the list is only a convenience */
    }
  }

  const current = data && {
    city: data.city,
    admin1: data.admin1,
    country: data.country,
    latitude: data.latitude,
    longitude: data.longitude,
  }
  const chips = recent.filter((p) => !data || !sameAs(p, placeFromData(data))).slice(0, SHOWN_RECENT)
  const firstName = (user?.name || user?.email || '').split(' ')[0]

  return (
    <div className="relative z-10 min-h-screen text-white">
      {/* thin loading bar */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loadbar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 top-0 z-40 h-0.5 overflow-hidden bg-white/10"
          >
            <div className="h-full w-1/3 animate-[loadbar_1.1s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pt-6">
        <span className="text-lg font-semibold tracking-[0.25em]">WEATHER EARTH</span>

        {/* On phones the search bar gets its own full-width row */}
        <div className="order-3 w-full md:order-none md:w-auto md:max-w-md md:flex-1">
          <SearchBar onSearch={load} onPrefetch={prefetch} loading={loading} />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-white/70">{firstName}</span>
          <button
            onClick={logout}
            className="rounded-full border border-white/30 px-4 py-1.5 transition hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </header>

      <RecentSearches items={chips} onPick={load} onClear={clearRecent} />

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto mt-4 max-w-md rounded-lg border border-red-300/30 bg-red-400/10 px-4 py-2 text-center text-sm text-red-200"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-6xl px-6 pt-8 pb-16">
        {!data ? (
          <p className="mt-24 text-center tracking-widest text-white/60 uppercase">
            {loading ? 'Reading the sky...' : 'Search for a city to begin'}
          </p>
        ) : (
          <div
            className={`grid gap-4 transition-opacity duration-300 lg:grid-cols-[380px_minmax(0,1fr)] ${
              loading ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <div className="flex flex-col gap-4">
              <CurrentCard
                data={data}
                isFavorite={favs.isFavorite(current)}
                onToggleFavorite={user ? () => favs.toggle(current) : undefined}
              />
              <StatsGrid data={data} />
            </div>
            <ForecastStrip data={data} />
          </div>
        )}

        <FavoritesCoverflow items={favs.items} onSelect={openPlace} onRemove={favs.remove} />
      </main>
    </div>
  )
}