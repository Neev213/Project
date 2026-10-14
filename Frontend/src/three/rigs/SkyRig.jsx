import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useScene } from '../../context/SceneContext'
import { computeSky } from '../skyMath'
import { LIGHT_POSITION, SUN_POSITION } from '../constants'

const SUN_DIST = 7
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt))

const baseLight = new Vector3(...LIGHT_POSITION).normalize()
const tmp = new Vector3()

export default function SkyRig({ lightRef }) {
  const { weather, phase, dash, sky, stage, sun, lightNow } = useScene()
  const seen = useRef({ weather: null, stamp: -1 })
  const target = useRef(null)

  // Priority -1: runs before CameraRig so it always reads fresh values
  useFrame((_, delta) => {
    const w = weather.current
    const stamp = Math.floor(Date.now() / 30000) // refresh the sky every 30 s

    if (w && (w !== seen.current.weather || stamp !== seen.current.stamp)) {
      seen.current = { weather: w, stamp }
      target.current = computeSky(w.latitude, w.longitude, new Date())
      if (!sky.current.ready) {
        sky.current.q.copy(target.current.q)
        sky.current.lightDir.copy(target.current.lightDir)
        sky.current.sunDraw.copy(target.current.sunDraw)
        sky.current.moonLocal.copy(target.current.moonLocal)
        sky.current.ready = true
      }
    }

    const t = target.current
    dash.current = damp(dash.current, phase === 'dashboard' && t ? 1 : 0, 1.2, delta)

    // Ease toward the target so changing city swings the globe smoothly
    if (t) {
      const k = 1 - Math.exp(-3 * delta)
      sky.current.q.slerp(t.q, k)
      sky.current.lightDir.lerp(t.lightDir, k).normalize()
      sky.current.sunDraw.lerp(t.sunDraw, k).normalize()
      sky.current.moonLocal.lerp(t.moonLocal, k)
    }

    const d = dash.current

    // Shared light direction (the Earth shaders read lightNow)
    lightNow.copy(baseLight).lerp(sky.current.lightDir, d).normalize()
    if (lightRef.current) lightRef.current.position.copy(lightNow).multiplyScalar(10)

    // The drawn Sun
    if (sun.current && stage.current) {
      tmp.copy(sky.current.sunDraw).multiplyScalar(SUN_DIST).add(stage.current.position)
      sun.current.position.set(SUN_POSITION[0], SUN_POSITION[1], SUN_POSITION[2]).lerp(tmp, d)
    }
  }, -1)

  return null
}