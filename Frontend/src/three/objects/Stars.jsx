import { Stars as DreiStars } from '@react-three/drei'

export default function Stars() {
    return <DreiStars radius={100} depth={50} count={5000} factor={4} fade />
}