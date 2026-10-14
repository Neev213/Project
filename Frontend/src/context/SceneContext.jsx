import { createContext, useContext, useMemo, useRef, useState } from 'react'

const SceneContext = createContext(null)

export function SceneProvider({ children }) {
    const scroll = useRef(0)
    const mouse = useRef({ x: 0, y: 0 })
    const stage = useRef(null)
    const sun = useRef(null)
    const moon = useRef(null)
    const plunge = useRef(0)
    const weather = useRef(null) // latest weather result, filled by the dashboard
    const [phase, setPhase] = useState('landing')

    const value = useMemo(
        () => ({ scroll, mouse, stage, sun, moon, plunge, weather, phase, setPhase }),
        [phase]
    )

    return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>
}

export function useScene() {
    const ctx = useContext(SceneContext)
    if (!ctx) throw new Error('useScene must be used inside <SceneProvider>')
    return ctx
}