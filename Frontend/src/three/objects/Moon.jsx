import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Vector3 } from 'three'
import { useScene } from '../../context/SceneContext'

const ORBIT_RADIUS = 2.5

export default function Moon() {
  const { dash, sky } = useScene()
  const mesh = useRef()
  const angle = useRef(0)
  const orbit = useMemo(() => new Vector3(), [])
  const texture = useTexture('/textures/moon.jpg')

  useFrame((_, delta) => {
    if (!mesh.current) return

    // Idle orbit (landing / login)
    angle.current += delta * 0.2
    orbit.set(Math.cos(angle.current) * ORBIT_RADIUS, 0.3, -Math.sin(angle.current) * ORBIT_RADIUS)
    mesh.current.position.copy(orbit)

    // On the dashboard, glide to the real position in this city's sky
    if (dash.current > 0.001) mesh.current.position.lerp(sky.current.moonLocal, dash.current)
  })

  return (
    <mesh ref={mesh} position={[ORBIT_RADIUS, 0.3, 0]}>
      <sphereGeometry args={[0.27, 48, 48]} />
      <meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  )
}