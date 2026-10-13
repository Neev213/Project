import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useScene } from '../context/SceneContext'
import { useAuth } from '../context/AuthContext'
import AuthWindow from '../components/AuthWindow'

export default function Login() {
    const { setPhase } = useScene()
    const { user } = useAuth()

    useEffect(() => {
        setPhase('login')
    }, [setPhase])

    // Already logged in? Skip the window.
    if (user) return <Navigate to="/dashboard" replace />

    return (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 md:justify-start md:px-[8vw]">
        <Link
            to="/"
            className="absolute top-6 left-8 text-lg font-semibold tracking-[0.25em] text-white"
        >
            WEATHER EARTH
        </Link>
        <AuthWindow />
        </div>
    )
}