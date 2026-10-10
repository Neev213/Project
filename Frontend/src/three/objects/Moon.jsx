import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { use } from "react";

export default function Moon() {
    const orbitRef = useRef()
    const moonMap = useTexture('/textures/moon.jpg')

    useFrame((_, delta) => {
        orbitRef.current.rotation.y += delta * 0.2
    })

    return (
        <group ref={orbitRef}>
            <mesh position={[2.5, 0.3, 0]}>
                <sphereGeometry args={[0.27, 32, 32]} />
                <meshStandardMaterial map={moonMap} />
            </mesh>
        </group>
    )
}