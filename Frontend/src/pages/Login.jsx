import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useScene } from '../context/SceneContext'

export default function Login() {
    const { setPhase } = useScene()
    useEffect(() => {
        setPhase('login')
    }, [setPhase])

    return (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-4 text-white">
        <h1 className="text-3xl">Login page</h1>
        <Link to="/" className="underline">Back to landing</Link>
        </div>
    )
}