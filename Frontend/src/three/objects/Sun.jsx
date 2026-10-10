import { useMemo } from 'react'
import * as THREE from 'three'
import { SUN_POSITION } from '../constants'

function makeGlowTexture() {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255, 250, 220, 1)')
    gradient.addColorStop(0.15, 'rgba(255, 220, 140, 0.9)')
    gradient.addColorStop(0.4, 'rgba(255, 160, 60, 0.35)')
    gradient.addColorStop(1, 'rgba(255, 120, 20, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
}

export default function Sun() {
    const glowTexture = useMemo(() => makeGlowTexture(), [])

    return (
    <group position={SUN_POSITION}>
        <sprite scale={[5, 5, 1]}>
        <spriteMaterial
            map={glowTexture}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
        />
        </sprite>
        <pointLight intensity={300} decay={2} color="#fff1d6" />
    </group>
    )
}