import { useRef } from 'react'
import Stars from '../objects/Stars'
import Earth from '../objects/Earth'
import CloudParticles from '../objects/CloudParticles'
import Moon from '../objects/Moon'
import Sun from '../objects/Sun'
import WeatherEffects from '../objects/WeatherEffects'
import SkyRig from '../rigs/SkyRig'
import { useScene } from '../../context/SceneContext'
import { LIGHT_POSITION } from '../constants'

export default function SpaceScene() {
  const { stage, sun, moon } = useScene()
  const light = useRef()
  const sunFade = useRef()

  return (
    <>
      <SkyRig lightRef={light} sunFadeRef={sunFade} />
      <Stars />
      <directionalLight ref={light} position={LIGHT_POSITION} intensity={3} color="#fff1d6" />

      <group ref={stage}>
        <Earth />
        <CloudParticles />
        <group ref={moon}>
          <Moon />
        </group>
      </group>

      <group ref={sun}>
        <group ref={sunFade}>
          <Sun />
        </group>
      </group>

      <WeatherEffects />
    </>
  )
}