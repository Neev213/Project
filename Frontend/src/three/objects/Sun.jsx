import { useMemo } from 'react'
import * as THREE from 'three'
import { Billboard, useTexture } from '@react-three/drei'
import { SUN_POSITION } from '../constants'

function makeGlowTexture() {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255, 250, 220, 1)')
    g.addColorStop(0.15, 'rgba(255, 220, 140, 0.9)')
    g.addColorStop(0.4, 'rgba(255, 160, 60, 0.35)')
    g.addColorStop(1, 'rgba(255, 120, 20, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
}

function makeDiscMask() {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.42, size / 2, size / 2, size * 0.5)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
}

export default function Sun() {
    const sunMap = useTexture('/textures/sun.jpg')
    const glowTexture = useMemo(() => makeGlowTexture(), [])
    const discMask = useMemo(() => makeDiscMask(), [])

    return (
        <group position={SUN_POSITION}>
        <Billboard>
            {/* soft glow */}
            <mesh>
            <planeGeometry args={[5, 5]} />
            <meshBasicMaterial
                map={glowTexture}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
            />
            </mesh>
            {/* textured disc, always a perfect circle */}
            <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshBasicMaterial
                map={sunMap}
                alphaMap={discMask}
                transparent
                depthWrite={false}
                toneMapped={false}
            />
            </mesh>
        </Billboard>
        <pointLight intensity={300} decay={2} color="#fff1d6" />
        </group>
    )
}