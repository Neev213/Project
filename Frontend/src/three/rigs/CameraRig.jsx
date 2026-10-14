import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Euler, Quaternion } from 'three'
import { useScene } from '../../context/SceneContext'
import { KEYFRAMES, LOGIN_FRAME } from '../keyframes.js'

const EARTH_RADIUS = 1 // radius of the sphere in Earth.jsx (before the stage scale)
const SURFACE_GAP = 0.35 // plunge: how far above the surface the dive ends
const FOV_START = 30
const FOV_END = 55

// Dashboard camera, relative to the city
const DASH_BACK = 0.9 // how far south of the city the camera sits
const DASH_HEIGHT = 0.55 // how high above the surface
const DASH_PITCH = (-12 * Math.PI) / 180 // tilt toward the ground (negative = down)

const euler = new Euler()
const qBase = new Quaternion()

const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
const damp = (current, target, lambda, delta) =>
  lerp(current, target, 1 - Math.exp(-lambda * delta))
const smoothstep = (t) => t * t * (3 - 2 * t)
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

function sample(p) {
  let i = 0
  while (i < KEYFRAMES.length - 2 && p > KEYFRAMES[i + 1].p) i++
  const a = KEYFRAMES[i]
  const b = KEYFRAMES[i + 1]
  const t = clamp((p - a.p) / (b.p - a.p), 0, 1)
  const e = smoothstep(t)
  return {
    cam: lerp3(a.cam, b.cam, e),
    earth: lerp3(a.earth, b.earth, e),
    scale: lerp(a.scale, b.scale, e),
    rotY: lerp(a.rotY, b.rotY, e),
    vis: lerp(a.vis, b.vis, e),
  }
}

function mixFrame(a, b, t) {
  return {
    cam: lerp3(a.cam, b.cam, t),
    earth: lerp3(a.earth, b.earth, t),
    scale: lerp(a.scale, b.scale, t),
    rotY: lerp(a.rotY, b.rotY, t),
    vis: lerp(a.vis, b.vis, t),
  }
}

export default function CameraRig() {
  const { scroll, stage, sun, moon, plunge, dash, sky, phase, mouse } = useScene()

  const progress = useRef(phase === 'landing' ? 0 : 1)
  const blend = useRef(phase === 'landing' ? 0 : 1)
  const smooth = useRef({ x: 0, y: 0 })
  const idle = useRef(0) // slow background spin of the Earth

  useFrame((state, delta) => {
    const { camera, size } = state

    // Scroll progress, eased
    const target = phase === 'landing' ? scroll.current : 1
    progress.current = damp(progress.current, target, 4, delta)

    // 0 = landing pose, 1 = login pose
    blend.current = damp(blend.current, phase === 'landing' ? 0 : 1, 2.5, delta)

    const s = mixFrame(sample(progress.current), LOGIN_FRAME, smoothstep(blend.current))

    // Smoothed mouse
    smooth.current.x = damp(smooth.current.x, mouse.current.x, 3, delta)
    smooth.current.y = damp(smooth.current.y, mouse.current.y, 3, delta)

    // Where the Earth is in the world right now
    const k = clamp(size.width / size.height / (16 / 9), 0.4, 1.2)
    const earthPos = [s.earth[0] * k, s.earth[1], s.earth[2]]

    // Back on the landing page: bring the plunge back to 0
    if (phase === 'landing' && plunge.current > 0) {
      plunge.current = damp(plunge.current, 0, 4, delta)
    }
    const p = plunge.current
    const d = dash.current

    // Camera position and look target
    let [cx, cy, cz] = s.cam
    let lx = 0
    let ly = 0
    let lz = 0

    // Plunge: dive straight at the planet
    if (p > 0) {
      const dx = cx - earthPos[0]
      const dy = cy - earthPos[1]
      const dz = cz - earthPos[2]
      const len = Math.hypot(dx, dy, dz) || 1
      const stop = EARTH_RADIUS * s.scale + SURFACE_GAP
      cx = lerp(cx, earthPos[0] + (dx / len) * stop, p)
      cy = lerp(cy, earthPos[1] + (dy / len) * stop, p)
      cz = lerp(cz, earthPos[2] + (dz / len) * stop, p)
      lx = earthPos[0] * p
      ly = earthPos[1] * p
      lz = earthPos[2] * p
    }

    // Dashboard: hover just south of the city, above it, looking toward the horizon
    if (d > 0.001) {
      const rs = EARTH_RADIUS * s.scale
      const px = earthPos[0]
      const py = earthPos[1] - DASH_BACK
      const pz = earthPos[2] + rs + DASH_HEIGHT
      const tx = px
      const ty = py + Math.cos(DASH_PITCH) * 3
      const tz = pz + Math.sin(DASH_PITCH) * 3
      cx = lerp(cx, px, d)
      cy = lerp(cy, py, d)
      cz = lerp(cz, pz, d)
      lx = lerp(lx, tx, d)
      ly = lerp(ly, ty, d)
      lz = lerp(lz, tz, d)
    }

    // In the dashboard "up" is world +Z (away from the planet), otherwise +Y
    camera.up.set(0, 1 - d, d).normalize()

    // Cursor drift: off during the dive, a little on the dashboard
    const drift = 1 - p * (1 - 0.35 * d)
    camera.position.set(
      cx + smooth.current.x * 0.35 * drift,
      cy + smooth.current.y * 0.2 * drift,
      cz
    )
    camera.lookAt(lx, ly, lz)

    const fov = lerp(FOV_START, FOV_END, p)
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    // Stage (Earth + Moon)
    if (stage.current) {
      idle.current += delta * 0.05 * (1 - d)

      stage.current.position.set(earthPos[0], earthPos[1], earthPos[2])
      stage.current.scale.setScalar(s.scale)

      // Normal orientation: keyframes + idle spin + cursor tilt
      euler.set(-smooth.current.y * 0.05, s.rotY + idle.current + smooth.current.x * 0.08, 0)
      qBase.setFromEuler(euler)

      // Dashboard: turn the globe so the chosen city is under the camera
      if (d > 0.001) qBase.slerp(sky.current.q, d)
      stage.current.quaternion.copy(qBase)
    }

    // Sun and Moon fade
    const v = Math.max(s.vis, 0.0001)
    if (sun.current) sun.current.scale.setScalar(v)
    if (moon.current) moon.current.scale.setScalar(v)
  })

  return null
}