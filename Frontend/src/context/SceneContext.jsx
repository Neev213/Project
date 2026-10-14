import { createContext, useContext, useMemo, useRef, useState } from 'react'
import { Quaternion, Vector3 } from 'three'
import { LIGHT_POSITION } from '../three/constants'

const SceneContext = createContext(null)

const createSky = () => ({
  ready: false,
  q: new Quaternion(), // Earth orientation that puts the city under the camera
  lightDir: new Vector3(0, 0, 1), // real direction of the sunlight (world)
  sunDraw: new Vector3(0, 0, 1), // where the Sun disc is drawn (world direction)
  moonLocal: new Vector3(2.5, 0.3, 0), // where the Moon is drawn (Earth-local)
})

export function SceneProvider({ children }) {
  const scroll = useRef(0)
  const mouse = useRef({ x: 0, y: 0 })
  const stage = useRef(null)
  const sun = useRef(null)
  const moon = useRef(null)
  const plunge = useRef(0) // 0 = orbit, 1 = down in the clouds
  const dash = useRef(0) // 0 = not on the dashboard, 1 = city view
  const weather = useRef(null) // latest weather result, set by the dashboard
  const [sky] = useState(() => ({ current: createSky() }))
  // One shared vector that every shader reads as "the light direction"
  const [lightNow] = useState(() => new Vector3(...LIGHT_POSITION).normalize())
  const [phase, setPhase] = useState('landing')

  const value = useMemo(
    () => ({ scroll, mouse, stage, sun, moon, plunge, dash, weather, sky, lightNow, phase, setPhase }),
    [phase, sky, lightNow]
  )

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>
}

export function useScene() {
  const ctx = useContext(SceneContext)
  if (!ctx) throw new Error('useScene must be used inside <SceneProvider>')
  return ctx
}