import { useEffect } from 'react'
import { useScene } from '../context/SceneContext'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
    const { setPhase } = useScene()
    const { user, logout } = useAuth()

    useEffect(() => {
        setPhase('dashboard')
    }, [setPhase])

    return (
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 text-white">
        <h1 className="text-4xl font-light">Hello, {user?.name || user?.email}</h1>
        <p className="text-white/60">Dashboard coming in Step 8.</p>
        <button
            onClick={logout}
            className="rounded-full border border-white/40 px-6 py-2 transition hover:bg-white/10"
        >
            Log out
        </button>
        </div>
    )
}