import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useScene } from '../context/SceneContext'

export default function usePlunge() {
    const { plunge, setPhase } = useScene()
    const navigate = useNavigate()
    const timeline = useRef(null)
    const busy = useRef(false)

    useEffect(() => () => timeline.current?.kill(), [])

    return () => {
        if (busy.current) return // ignore double triggers
        busy.current = true

        // shorter animation for people who prefer reduced motion
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const k = reduce ? 0.5 : 1

        setPhase('plunge')

        timeline.current = gsap.timeline({ onComplete: () => navigate('/dashboard') })
        timeline.current
        .to('[data-fade]', { opacity: 0, duration: 0.7 * k, ease: 'power2.inOut' }, 0)
        .to(plunge, { current: 1, duration: 2.3 * k, ease: 'power3.in' }, 0.3 * k)
        .to('[data-flash]', { opacity: 1, duration: 0.6 * k, ease: 'power1.in' }, 2.0 * k)
    }
}