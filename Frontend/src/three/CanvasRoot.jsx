import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import CameraRig from './rigs/CameraRig'
import SpaceScene from './scenes/SpaceScene'
import useMouseParallax from '../hooks/useMouseParallax'
import ErrorBoundary from '../components/ErrorBoundary'

export default function CanvasRoot() {
  useMouseParallax()

  return (
    <div className="fixed inset-0 z-0">
      <ErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 9], fov: 30 }}
          dpr={[1, window.innerWidth < 768 ? 1.5 : 2]}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#000']} />
          <ambientLight intensity={0.02} />
          <CameraRig />
          <Suspense fallback={null}>
            <SpaceScene />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}