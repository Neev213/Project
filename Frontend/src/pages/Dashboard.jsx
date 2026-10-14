import { useEffect } from 'react'
import gsap from 'gsap'
import { AnimatePresence, motion } from 'framer-motion'
import { useScene } from '../context/SceneContext'
import { useAuth } from '../context/AuthContext'
import useWeather from '../hooks/useWeather'
import { fetchLastCity } from '../api/weather'
import SearchBar from '../components/dashboard/SearchBar'
import CurrentCard from '../components/dashboard/CurrentCard'
import StatsGrid from '../components/dashboard/StatsGrid'
import ForecastStrip from '../components/dashboard/ForecastStrip'

const DEFAULT_CITY = 'London'

export default function Dashboard() {
    const { setPhase, plunge } = useScene()
    const { user, logout } = useAuth()
    const { data, loading, error, load } = useWeather()

    // Scene: finish the plunge, fade the white flash
    useEffect(() => {
        setPhase('dashboard')
        gsap.to('[data-flash]', { opacity: 0, duration: 1.2, delay: 0.15, ease: 'power2.out' })
        if (plunge.current < 1) {
        gsap.to(plunge, { current: 1, duration: 2.5, ease: 'power2.inOut' })
        }
    }, [setPhase, plunge])

    // Data: start with the most recent search, or a default city
    useEffect(() => {
        let cancelled = false
        ;(async () => {
        const last = await fetchLastCity()
        if (!cancelled) load(last || DEFAULT_CITY)
        })()
        return () => {
        cancelled = true
        }
    }, [load])

    const firstName = (user?.name || user?.email || '').split(' ')[0]

    return (
        <div className="relative z-10 min-h-screen text-white">
        <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pt-6">
            <span className="text-lg font-semibold tracking-[0.25em]">WEATHER EARTH</span>
            <SearchBar onSearch={load} loading={loading} />
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
                key={data.city}
                className={`grid gap-4 transition-opacity duration-300 lg:grid-cols-[380px_minmax(0,1fr)] ${
                loading ? 'opacity-60' : 'opacity-100'
                }`}
            >
                <div className="flex flex-col gap-4">
                <CurrentCard data={data} />
                <StatsGrid data={data} />
                </div>
                <ForecastStrip data={data} />
            </div>
            )}
        </main>
        </div>
    )
}