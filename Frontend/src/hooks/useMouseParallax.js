import { useEffect } from 'react'
import { useScene } from '../context/SceneContext'

export default function useMouseParallax() {
    const { mouse } = useScene()

    useEffect(() => {
        // Touch devices have no cursor, so skip the listener entirely
        if (window.matchMedia('(pointer: coarse)').matches) return

        const onMove = (e) => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1      // -1 (left) to 1 (right)
        mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1)  // -1 (bottom) to 1 (top)
        }

        window.addEventListener('mousemove', onMove)
        return () => window.removeEventListener('mousemove', onMove)
    }, [mouse])
}