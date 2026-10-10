import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import SpaceScene from './scenes/SpaceScene'

export default function CanvasRoot() {
    return (
    <div className="fixed inset-0 z-0">
        <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        >
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.15} />

        <Suspense fallback={null}>
            <SpaceScene />
        </Suspense>
        </Canvas>
    </div>
    )
}