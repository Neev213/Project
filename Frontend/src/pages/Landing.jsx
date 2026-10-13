import { useEffect, useRef, useState } from 'react'
import Overlay from '../components/Overlay'
import Words from '../components/Words'
import LandingCTA from '../components/LandingCTA'
import { useScrollProgress } from '../hooks/useScrollProgress'

// screen index (0-4) -> dot index (0-3)
const dotOf = [0, 0, 1, 2, 3]

const features = [
    { name: 'Rain', text: 'Rain surprises you. We show where it is falling right now.' },
    { name: 'Snow', text: 'Cold fronts are hard to picture. We map them on the globe.' },
    { name: 'Clouds', text: 'Forecasts feel abstract. We let you read the sky itself.' },
]

function Fade({ show, children, className = '' }) {
    return (
        <div
        className={`transition-all duration-700 ease-out ${
            show ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        } ${className}`}
        >
        {children}
        </div>
    )
}

const pill = 'rounded-full border border-white/40 px-6 py-2 transition hover:bg-white/10'

export default function Landing() {
    const [active, setActive] = useState(0)
    const wrapperRef = useRef(null)
    useScrollProgress(wrapperRef)

    useEffect(() => {
        const onScroll = () => {
        const i = Math.round(window.scrollY / window.innerHeight)
        setActive(Math.min(4, Math.max(0, i)))
        }
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <>
        <Overlay active={dotOf[active]} />

        <div
            ref={wrapperRef}
            data-fade
            className="relative z-10 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
        >
            {/* 0 - Hero */}
            <section className="relative flex h-screen flex-col items-center justify-center px-6 text-center">
            <Words
                text="The world's weather, seen from above"
                show={active === 0}
                className="max-w-3xl text-5xl font-light md:text-6xl"
            />
            <Fade show={active === 0} className="mt-6 max-w-md text-white/70">
                Live clouds, rain and snow, mapped onto a real Earth.
            </Fade>
            <div className="absolute bottom-8 animate-bounce text-2xl text-white/60">↓</div>
            </section>

            {/* 1 - Push-in */}
            <section className="h-screen" />

            {/* 2 - Weather you can see */}
            <section className="flex h-screen flex-col items-start justify-center px-[8vw]">
            <Words
                text="Weather you can see"
                show={active === 2}
                className="mb-12 text-4xl font-light md:text-5xl"
            />
            <Fade show={active === 2} className="grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-3">
                {features.map((f) => (
                <div key={f.name}>
                    <h3 className="mb-2 text-lg tracking-wide">{f.name}</h3>
                    <p className="mb-3 text-sm text-white/70">{f.text}</p>
                    <span className="text-xl">→</span>
                </div>
                ))}
            </Fade>
            </section>

            {/* 3 - The sky above your city */}
            <section className="flex h-screen flex-col items-end justify-center px-[8vw] text-right">
            <Words
                text="The sky above your city"
                show={active === 3}
                className="mb-6 max-w-xl text-4xl font-light md:text-5xl"
            />
            <Fade show={active === 3} className="max-w-md">
                <p className="mb-8 text-white/70">
                Dive to the night side and watch your city light up under live weather.
                </p>
                <div className="flex justify-end gap-4">
                <button className={pill}>Explore cities</button>
                <button className={pill}>How it works</button>
                </div>
            </Fade>
            </section>

            {/* 4 - Step inside */}
            <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
            <Words
                text="Step inside"
                show={active === 4}
                className="mb-8 text-5xl font-light md:text-6xl"
            />
            <Fade show={active === 4}>
                <LandingCTA />
            </Fade>
            </section>
        </div>
        </>
    )
}