import Stars from '../objects/Stars'
import Earth from '../objects/Earth'
import Sun from '../objects/Sun'
import Moon from '../objects/Moon'
import { useScene } from '../../context/SceneContext'
import { LIGHT_POSITION } from '../constants'

export default function SpaceScene() {
  const { stage, sun, moon } = useScene()

  return (
    <>
      <Stars />
      <directionalLight position={LIGHT_POSITION} intensity={3} color="#fff1d6" />

      <group ref={stage}>
        <Earth />
        <group ref={moon}>
          <Moon />
        </group>
      </group>

      <group ref={sun}>
        <Sun />
      </group>
    </>
  )
}