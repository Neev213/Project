import { createContext, useContext, useMemo, useRef, useState } from 'react'

const SceneContext = createContext(null)

export function SceneProvider({ children }) {
    const scroll = useRef(0)
    const mouse = useRef({ x: 0, y: 0 })
    const [phase, setPhase] = useState('landing')

    const value = useMemo(() => ({ scroll, mouse, phase, setPhase }), [phase])

    return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>
}

export function useScene() {
    const ctx = useContext(SceneContext)
    if (!ctx) throw new Error('useScene must be used inside <SceneProvider>')
    return ctx
}