import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import gsap from 'gsap'
import { useScene } from '../context/SceneContext'
import { useAuth } from '../context/AuthContext'
import AuthWindow from '../components/AuthWindow'

export default function Login() {
    const { setPhase, plunge } = useScene()
    const { user } = useAuth()

    // Only redirect people who ARRIVE already logged in.
    // (Someone who just logged in here must be allowed to watch the plunge.)
    const [alreadyIn] = useState(() => Boolean(user))

    useEffect(() => {
        if (alreadyIn) return
        setPhase('login')
        gsap.set('[data-flash]', { opacity: 0 })
        // coming back from the dashboard (logout): pull the camera back out
        if (plunge.current > 0) {
        gsap.to(plunge, { current: 0, duration: 1.8, ease: 'power2.inOut' })
        }
    }, [alreadyIn, setPhase, plunge])

    if (alreadyIn) return <Navigate to="/dashboard" replace />

    return (
        <div
        data-fade
        className="relative z-10 flex min-h-screen items-center justify-center px-6 md:justify-start md:px-[8vw]"
        >
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