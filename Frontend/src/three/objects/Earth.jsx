import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from 'three';
import { SUN_POSITION } from "../constants";

const vertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const fragmentShader = `
    uniform sampler2D dayMap;
    uniform sampler2D nightMap;
    uniform vec3 sunDirection;
    varying vec2 vUv;
    varying vec3 vWorldNormal;

    void main() {
        vec3 day = texture2D(dayMap, vUv).rgb;
        vec3 night = texture2D(nightMap, vUv).rgb;

        float light = dot(normalize(vWorldNormal), normalize(sunDirection));
        float dayMix = smoothstep(-0.15, 0.25, light);

        vec3 dayColor = day * (0.15 + max(light, 0.0));
        vec3 nightColor = night * 1.6 + day * 0.02;

        gl_FragColor = vec4(mix(nightColor, dayColor, dayMix), 1.0);
        #include <colorspace_fragment>
    }
`

export default function() {
    const earthRef = useRef()
    const cloudsRef = useRef()

    const [dayMap, nightMap, cloudMap] = useTexture([
        '/textures/earth_day.jpg',
        '/textures/earth_night.jpg',
        '/textures/earth_clouds.jpg',
    ])

    const uniforms = useMemo(
        () => ({
            dayMap: { value: dayMap },
            nightMap: { value: nightMap },
            sunDirection: { value: new THREE.Vector3(...SUN_POSITION).normalize() },
        }),
        [dayMap, nightMap]
    )

    useFrame((_, delta) => {
        earthRef.current.rotation.y += delta * 0.05
        cloudsRef.current.rotation.y += delta * 0.07
    })

    return (
        <group>
            <mesh ref={earthRef}>
                <sphereGeometry args={[1, 64, 64]} />
                <shaderMaterial
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                />
            </mesh>

            <mesh ref={cloudsRef}>
                <sphereGeometry args={[1.012, 64, 64]} />
                <meshStandardMaterial
                    color="white"
                    alphaMap={cloudMap}
                    transparent
                    depthWrite={false}
                />
            </mesh>
        </group>
    )
}
    


    