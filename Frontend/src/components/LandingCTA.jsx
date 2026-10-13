import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"
import gsap from 'gsap'
import { useScene } from "../context/SceneContext";

export default function LandingCTA() {
    const { setPhase } = useScene()
    const navigate = useNavigate()
    const busy = useRef(false)
    const timer = useRef(null)

    useEffect(() => () => timer.current?.kill(), [])

    const fly = (mode) => {
        if (busy.current) return 
        busy.current = true
        setPhase('flying')
        gsap.to('[data-fade]', {opacity: 0, duration: 1, ease: 'power2.inOut' })

        timer.current = gsap.delayedCall(1.4, () => 
            navigate(mode === 'signup' ? '/login?mode=signup' : '/login')
        )
    }

    return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
            onClick={() => fly('login')}
            className="rounded-full border border-white/40 bg-white/10 px-8 py-3 text-sm font-medium tracking-widest uppercase backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.35)]"
        >
            Login
        </button>
        <button
            onClick={() => fly('signup')}
            className="rounded-full bg-white px-8 py-3 text-sm font-medium tracking-widest text-black uppercase transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(255,255,255,0.7)]"
        >
            Sign up
        </button>
        </div>
    )
}