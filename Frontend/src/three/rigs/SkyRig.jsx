import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useScene } from '../../context/SceneContext'
import { computeSky } from '../skyMath'
import { computeMood, MOOD_KEYS } from '../weatherMood'
import { LIGHT_POSITION, SUN_POSITION } from '../constants'

const SUN_DIST = 7
const BASE_LIGHT_INTENSITY = 3 // must match the directionalLight intensity in SpaceScene

const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt))
const clamp01 = (v) => Math.min(Math.max(v, 0), 1)

const ZERO_MOOD = Object.fromEntries(MOOD_KEYS.map((k) => [k, 0]))
const baseLight = new Vector3(...LIGHT_POSITION).normalize()
const tmp = new Vector3()

export default function SkyRig({ lightRef, sunFadeRef }) {
  const { weather, phase, dash, sky, mood, stage, sun, lightNow } = useScene()
  const seen = useRef({ weather: null, stamp: -1 })
  const target = useRef(null)
  const moodTarget = useRef(null)

  // Priority -1: runs before CameraRig so it always reads fresh values
  useFrame((_, delta) => {
    const w = weather.current
    const stamp = Math.floor(Date.now() / 30000) // refresh the sky every 30 s

    if (w && (w !== seen.current.weather || stamp !== seen.current.stamp)) {
      seen.current = { weather: w, stamp }
      target.current = computeSky(w.latitude, w.longitude, new Date())

      // ?fx=rain|snow|storm|fog|cloudy|clear forces a mood, for testing
      const fx = new URLSearchParams(window.location.search).get('fx')
      moodTarget.current = computeMood(w, target.current.psi, fx)

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

    // Ease the weather mood: fades in on the dashboard, out when you leave
    const goal = phase === 'dashboard' && moodTarget.current ? moodTarget.current : ZERO_MOOD
    const km = 1 - Math.exp(-1.5 * delta)
    for (const key of MOOD_KEYS) {
      mood.current[key] += (goal[key] - mood.current[key]) * km
    }

    const d = dash.current
    const m = mood.current

    // Shared light direction (the Earth shaders read lightNow)
    lightNow.copy(baseLight).lerp(sky.current.lightDir, d).normalize()

    if (lightRef.current) {
      lightRef.current.position.copy(lightNow).multiplyScalar(10)
      // overcast dims the sun; lightning briefly lights everything up
      lightRef.current.intensity = BASE_LIGHT_INTENSITY * (1 - 0.65 * m.dark * d) + 5 * m.flash
    }

    // The drawn Sun
    if (sun.current && stage.current) {
      tmp.copy(sky.current.sunDraw).multiplyScalar(SUN_DIST).add(stage.current.position)
      sun.current.position.set(SUN_POSITION[0], SUN_POSITION[1], SUN_POSITION[2]).lerp(tmp, d)
    }

    // Clouds hide the Sun's glow
    if (sunFadeRef.current) {
      sunFadeRef.current.scale.setScalar(Math.max(1 - 0.9 * clamp01(m.cloud * 1.1) * d, 0.0001))
    }
  }, -1)

  return null
}