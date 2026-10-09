import { Canvas } from "@react-three/fiber";

export default function CanvasRoot() {
    return (
        <div className="fixed inset-0 z-0">
            <Canvas
                camera={{ position: [0, 0, 6], fov: 50 }}
                dpr={[1, 2]}
                gl={{ antialias: true }}
            >
                <color attach="background" args={['#000']} />
                <ambientLight intensity={0.4} />
                <directionalLight position={[5, 3, 5]} intensity={2} />

                <mesh>
                    <sphereGeometry args={[1, 64, 64]} />
                    <meshStandardMaterial color="royalblue" />
                </mesh>
            </Canvas>
        </div>
    )
}