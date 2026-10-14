import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useScene } from '../../context/SceneContext' // CHANGED: was the LIGHT_POSITION import

const SHOW_ATMOSPHERE = true // set to false to remove the blue rim completely

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;

    float light = dot(normalize(vWorldNormal), normalize(sunDirection));
    float dayMix = smoothstep(-0.1, 0.3, light);

    vec3 dayColor = day * (0.15 + max(light, 0.0) * 1.2);

    float lum = dot(night, vec3(0.299, 0.587, 0.114));
    float lights = smoothstep(0.05, 0.4, lum);
    lights = pow(lights, 1.3);
    vec3 nightColor = vec3(1.0, 0.7, 0.3) * lights * 4.0;
    nightColor += day * vec3(0.04, 0.06, 0.10);

    gl_FragColor = vec4(mix(nightColor, dayColor, dayMix), 1.0);
    #include <colorspace_fragment>
  }
`

// Clouds use the SAME light math as the surface, so both terminators match.
const cloudFragment = /* glsl */ `
  uniform sampler2D cloudMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    float cloud = texture2D(cloudMap, vUv).r;
    float light = dot(normalize(vWorldNormal), normalize(sunDirection));
    float dayMix = smoothstep(-0.1, 0.3, light);
    float shade = 0.03 + dayMix * (0.55 + max(light, 0.0) * 0.6);

    gl_FragColor = vec4(vec3(shade), cloud * 0.9);
    #include <colorspace_fragment>
  }
`

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const atmosphereFragment = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(max(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 4.0);
    gl_FragColor = vec4(0.25, 0.55, 1.0, 1.0) * intensity * 0.8;
  }
`

export default function Earth() {
  const { lightNow } = useScene() // CHANGED: shared light direction, updated every frame by SkyRig
  const cloudsRef = useRef() // CHANGED: earthRef removed, the Earth no longer spins by itself

  const [dayMap, nightMap, cloudMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_night.jpg',
    '/textures/earth_clouds.jpg',
  ])

  // CHANGED: the old fixed sunDirection is replaced by the shared lightNow vector.
  // On landing/login it equals your old LIGHT_POSITION direction; on the dashboard it
  // becomes the real sun direction for the chosen city.
  const sunDirection = lightNow

  const earthUniforms = useMemo(
    () => ({
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      sunDirection: { value: sunDirection },
    }),
    [dayMap, nightMap, sunDirection]
  )

  const cloudUniforms = useMemo(
    () => ({
      cloudMap: { value: cloudMap },
      sunDirection: { value: sunDirection },
    }),
    [cloudMap, sunDirection]
  )

  // CHANGED: CameraRig now handles the Earth's spin and orientation.
  // The clouds only drift slowly relative to the ground (0.07 - 0.05 = 0.02, as before).
  useFrame((_, delta) => {
    cloudsRef.current.rotation.y += delta * 0.02
  })

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          uniforms={earthUniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>

      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.012, 64, 64]} />
        <shaderMaterial
          uniforms={cloudUniforms}
          vertexShader={vertexShader}
          fragmentShader={cloudFragment}
          transparent
          depthWrite={false}
        />
      </mesh>

      {SHOW_ATMOSPHERE && (
        <mesh>
          <sphereGeometry args={[1.06, 64, 64]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            vertexShader={atmosphereVertex}
            fragmentShader={atmosphereFragment}
          />
        </mesh>
      )}
    </group>
  )
}