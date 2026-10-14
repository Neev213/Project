import { useEffect } from 'react'
import gsap from 'gsap'
import { useScene } from '../context/SceneContext'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
    const { setPhase, plunge } = useScene()
    const { user, logout } = useAuth()

    useEffect(() => {
        setPhase('dashboard')

        // the white flash from the plunge fades away
        gsap.to('[data-flash]', { opacity: 0, duration: 1.2, delay: 0.15, ease: 'power2.out' })

        // opened directly (refresh / bookmark): fly down instead of snapping
        if (plunge.current < 1) {
        gsap.to(plunge, { current: 1, duration: 2.5, ease: 'power2.inOut' })
        }
    }, [setPhase, plunge])

    return (
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 text-white">
        <h1 className="text-4xl font-light">Hello, {user?.name || user?.email}</h1>
        <p className="text-white/70">Dashboard coming in Step 8.</p>
        <button
            onClick={logout}
            className="rounded-full border border-white/40 px-6 py-2 transition hover:bg-white/10"
        >
            Log out
        </button>
        </div>
    )
}