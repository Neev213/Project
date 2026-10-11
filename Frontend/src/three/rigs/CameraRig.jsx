import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScene } from '../../context/SceneContext'
import { KEYFRAMES } from '../keyframes.js'

const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
const damp = (current, target, lambda, delta) =>
  lerp(current, target, 1 - Math.exp(-lambda * delta))
const smoothstep = (t) => t * t * (3 - 2 * t)
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

// Find the two keyframes around p and blend between them
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

export default function CameraRig() {
  const { scroll, stage, sun, moon, phase, mouse } = useScene()
  const progress = useRef(0)
  const smooth = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const { camera, size } = state

    // Scroll progress, eased
    const target = phase === 'landing' ? scroll.current : 1
    progress.current = damp(progress.current, target, 4, delta)
    const s = sample(progress.current)

    // Smoothed mouse
    smooth.current.x = damp(smooth.current.x, mouse.current.x, 3, delta)
    smooth.current.y = damp(smooth.current.y, mouse.current.y, 3, delta)

    // Camera: keyframe position + cursor drift, then look at center
    camera.position.set(s.cam[0], s.cam[1], s.cam[2])
    camera.position.x += smooth.current.x * 0.35
    camera.position.y += smooth.current.y * 0.2
    camera.lookAt(0, 0, 0)

    // Stage (Earth + Moon): position, scale, rotation
    const k = clamp(size.width / size.height / (16 / 9), 0.4, 1.2)
    if (stage.current) {
      stage.current.position.set(s.earth[0] * k, s.earth[1], s.earth[2])
      stage.current.scale.setScalar(s.scale)
      stage.current.rotation.y = s.rotY
      stage.current.rotation.y += smooth.current.x * 0.08
      stage.current.rotation.x = -smooth.current.y * 0.05
    }

    // Sun and Moon fade by scaling to near zero (keeps the lights alive)
    const v = Math.max(s.vis, 0.0001)
    if (sun.current) sun.current.scale.setScalar(v)
    if (moon.current) moon.current.scale.setScalar(v)
  })

  return null
}