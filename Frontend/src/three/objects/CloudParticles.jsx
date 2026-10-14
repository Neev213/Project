import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture } from 'three'
import { useScene } from '../../context/SceneContext'

const isTouch = () => window.matchMedia('(pointer: coarse)').matches

// Small deterministic random generator (same layout every time)
function mulberry32(seed) {
    return () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

// Points spread evenly through a shell around the planet
function makePositions(count, inner, outer) {
    const rand = mulberry32(42)
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        const u = rand() * 2 - 1
        const theta = rand() * Math.PI * 2
        const r = inner + (outer - inner) * Math.cbrt(rand())
        const s = Math.sqrt(1 - u * u)
        arr[i * 3] = r * s * Math.cos(theta)
        arr[i * 3 + 1] = r * u
        arr[i * 3 + 2] = r * s * Math.sin(theta)
    }
    return arr
}

// Soft white dot, drawn on a canvas
function makeSprite() {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.45)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 64, 64)
    return new CanvasTexture(c)
}

const smooth = (a, b, x) => {
    const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

export default function CloudParticles() {
    const { plunge } = useScene()
    const points = useRef()
    const material = useRef()

    const positions = useMemo(() => makePositions(isTouch() ? 1200 : 3200, 1.08, 1.6), [])
    const sprite = useMemo(() => makeSprite(), [])

    useFrame((_, delta) => {
        const p = plunge.current
        const opacity = smooth(0.15, 0.55, p) * 0.9
        if (material.current) material.current.opacity = opacity
        if (points.current) {
        points.current.visible = opacity > 0.01 // skip drawing when invisible
        points.current.rotation.y += delta * 0.05
        }
    })

    return (
        <points ref={points} visible={false}>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
            ref={material}
            map={sprite}
            size={0.1}
            sizeAttenuation
            transparent
            opacity={0}
            depthWrite={false}
            color="#e6efff"
        />
        </points>
    )
}