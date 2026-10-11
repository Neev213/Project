import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useScene } from '../context/SceneContext'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function useScrollProgress(wrapperRef) {
    const { scroll, setPhase } = useScene()

    useEffect(() => {
        setPhase('landing')
        return () => {
        scroll.current = 0
        }
    }, [scroll, setPhase])

    useGSAP(
        () => {
        ScrollTrigger.create({
            trigger: wrapperRef.current,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
            scroll.current = self.progress
            },
        })
        },
        { scope: wrapperRef }
    )
}