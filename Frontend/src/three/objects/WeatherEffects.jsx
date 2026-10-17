import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, Vector2, Vector3 } from 'three'
import { useScene } from '../../context/SceneContext'
import { mulberry32 } from '../rand'

// Size of the box of rain / snow that follows the camera
const BOX = [7, 7, 5]
const BOX_FORWARD = 3.2 // box is centred this far in front of the camera

const isTouch = () => window.matchMedia('(pointer: coarse)').matches
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const smoothstep = (a, b, x) => {
    const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
    return t * t * (3 - 2 * t)
    }

    /* ------------------------------------------------------------------ */
    /* Rain: thin streaks, animated entirely on the GPU                    */
    /* ------------------------------------------------------------------ */
    const rainVertex = /* glsl */ `
    uniform float uTime;
    uniform vec3 uBox;
    uniform vec2 uWind;
    uniform float uSpeed;
    uniform float uLen;
    uniform float uAmount;
    attribute float aEnd;
    attribute float aSeed;
    varying float vAlpha;

    void main() {
        float speed = uSpeed * (0.75 + 0.5 * aSeed);
        vec3 vel = vec3(uWind, -speed);                       // world Z is "up"
        vec3 q = fract(position + vel * uTime / uBox);        // wraps around the box
        vec3 pos = (q - 0.5) * uBox;
        pos -= normalize(vel) * uLen * aEnd;                  // tail of the streak

        float fade = smoothstep(0.0, 0.12, q.z) * (1.0 - smoothstep(0.88, 1.0, q.z));
        fade *= smoothstep(0.0, 0.1, q.y) * (1.0 - smoothstep(0.9, 1.0, q.y));
        vAlpha = fade * (1.0 - 0.7 * aEnd) * step(aSeed, uAmount);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
    `

    const rainFragment = /* glsl */ `
    uniform float uOpacity;
    varying float vAlpha;
    void main() {
        gl_FragColor = vec4(0.72, 0.82, 1.0, vAlpha * uOpacity);
    }
    `

    function Rain() {
    const { mood, dash } = useScene()
    const lines = useRef()
    const mat = useRef()
    const time = useRef(0)
    const count = isTouch() ? 1300 : 2600

    const { pos, end, seed } = useMemo(() => {
        const rand = mulberry32(7)
        const pos = new Float32Array(count * 6)
        const end = new Float32Array(count * 2)
        const seed = new Float32Array(count * 2)
        for (let i = 0; i < count; i++) {
        const x = rand()
        const y = rand()
        const z = rand()
        const s = rand()
        for (let v = 0; v < 2; v++) {
            const o = i * 2 + v
            pos[o * 3] = x
            pos[o * 3 + 1] = y
            pos[o * 3 + 2] = z
            end[o] = v // 0 = head, 1 = tail
            seed[o] = s
        }
        }
        return { pos, end, seed }
    }, [count])

    const uniforms = useMemo(
        () => ({
        uTime: { value: 0 },
        uBox: { value: new Vector3(...BOX) },
        uWind: { value: new Vector2() },
        uSpeed: { value: 6.5 },
        uLen: { value: 0.28 },
        uAmount: { value: 0 },
        uOpacity: { value: 0.55 },
        }),
        []
    )

    useFrame((state, delta) => {
        const m = mood.current
        const amount = m.rain * dash.current
        if (!lines.current || !mat.current) return
        lines.current.visible = amount > 0.01
        if (!lines.current.visible) return

        const cam = state.camera.position
        lines.current.position.set(cam.x, cam.y + BOX_FORWARD, cam.z)

        time.current += delta
        const u = mat.current.uniforms
        u.uTime.value = time.current
        u.uAmount.value = amount
        u.uSpeed.value = reducedMotion() ? 3.5 : 6.5
        u.uWind.value.set(m.windX * 2, m.windY * 2) // slant with the wind
    })

    return (
        <lineSegments ref={lines} frustumCulled={false} visible={false}>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pos, 3]} />
            <bufferAttribute attach="attributes-aEnd" args={[end, 1]} />
            <bufferAttribute attach="attributes-aSeed" args={[seed, 1]} />
        </bufferGeometry>
        <shaderMaterial
            ref={mat}
            uniforms={uniforms}
            vertexShader={rainVertex}
            fragmentShader={rainFragment}
            transparent
            depthWrite={false}
        />
        </lineSegments>
    )
    }

    /* ------------------------------------------------------------------ */
    /* Snow: soft round flakes that sway as they fall                      */
    /* ------------------------------------------------------------------ */
    const snowVertex = /* glsl */ `
    uniform float uTime;
    uniform vec3 uBox;
    uniform vec2 uWind;
    uniform float uSize;
    uniform float uPixel;
    uniform float uAmount;
    attribute float aSeed;
    varying float vAlpha;

    void main() {
        float speed = 0.35 + 0.25 * aSeed;
        vec3 vel = vec3(uWind * 0.5, -speed);
        vec3 q = fract(position + vel * uTime / uBox);
        vec3 pos = (q - 0.5) * uBox;
        pos.x += sin(uTime * 0.7 + aSeed * 6.2831) * 0.25;    // gentle sway
        pos.y += cos(uTime * 0.5 + aSeed * 12.566) * 0.2;

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = uSize * uPixel * (10.0 / max(-mv.z, 0.1)) * (0.6 + 0.8 * aSeed);

        float fade = smoothstep(0.0, 0.12, q.z) * (1.0 - smoothstep(0.88, 1.0, q.z));
        fade *= smoothstep(0.0, 0.1, q.y) * (1.0 - smoothstep(0.9, 1.0, q.y));
        vAlpha = fade * step(aSeed, uAmount);

        gl_Position = projectionMatrix * mv;
    }
    `

    const snowFragment = /* glsl */ `
    varying float vAlpha;
    void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        float a = smoothstep(0.5, 0.15, d);
        gl_FragColor = vec4(1.0, 1.0, 1.0, a * vAlpha * 0.9);
    }
    `

    function Snow() {
    const { mood, dash } = useScene()
    const points = useRef()
    const mat = useRef()
    const time = useRef(0)
    const count = isTouch() ? 1000 : 2000

    const { pos, seed } = useMemo(() => {
        const rand = mulberry32(13)
        const pos = new Float32Array(count * 3)
        const seed = new Float32Array(count)
        for (let i = 0; i < count; i++) {
        pos[i * 3] = rand()
        pos[i * 3 + 1] = rand()
        pos[i * 3 + 2] = rand()
        seed[i] = rand()
        }
        return { pos, seed }
    }, [count])

    const uniforms = useMemo(
        () => ({
        uTime: { value: 0 },
        uBox: { value: new Vector3(...BOX) },
        uWind: { value: new Vector2() },
        uSize: { value: 1.2 },
        uPixel: { value: 1 },
        uAmount: { value: 0 },
        }),
        []
    )

    useFrame((state, delta) => {
        const m = mood.current
        const amount = m.snow * dash.current
        if (!points.current || !mat.current) return
        points.current.visible = amount > 0.01
        if (!points.current.visible) return

        const cam = state.camera.position
        points.current.position.set(cam.x, cam.y + BOX_FORWARD, cam.z)

        time.current += delta * (reducedMotion() ? 0.5 : 1)
        const u = mat.current.uniforms
        u.uTime.value = time.current
        u.uAmount.value = amount
        u.uPixel.value = state.gl.getPixelRatio()
        u.uWind.value.set(m.windX * 2, m.windY * 2)
    })

    return (
        <points ref={points} frustumCulled={false} visible={false}>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pos, 3]} />
            <bufferAttribute attach="attributes-aSeed" args={[seed, 1]} />
        </bufferGeometry>
        <shaderMaterial
            ref={mat}
            uniforms={uniforms}
            vertexShader={snowVertex}
            fragmentShader={snowFragment}
            transparent
            depthWrite={false}
        />
        </points>
    )
}

/* ------------------------------------------------------------------ */
/* Cloud deck: soft puffs scattered just above the planet's surface    */
/* ------------------------------------------------------------------ */
function makePuffTexture() {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const rand = mulberry32(5)
    for (let i = 0; i < 9; i++) {
        const x = 64 + (rand() - 0.5) * 56
        const y = 64 + (rand() - 0.5) * 28
        const r = 22 + rand() * 20
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, 'rgba(255,255,255,0.55)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, size, size)
    }
    return new CanvasTexture(canvas)
}

function CloudDeck() {
    const { mood, dash, stage, sky } = useScene()
    const group = useRef()
    const count = isTouch() ? 40 : 70
    const puff = useMemo(() => makePuffTexture(), [])

    const puffs = useMemo(() => {
        const rand = mulberry32(21)
        const capRadius = 0.95 // radians around the city
        return Array.from({ length: count }, () => {
        const theta = Math.acos(1 - rand() * (1 - Math.cos(capRadius))) // even spread over the cap
        const phi = rand() * Math.PI * 2
        const h = 1.015 + rand() * 0.07 // just above the surface
        return {
            pos: [
            h * Math.sin(theta) * Math.cos(phi),
            h * Math.sin(theta) * Math.sin(phi),
            h * Math.cos(theta),
            ],
            size: 0.35 + rand() * 0.5,
            seed: rand(),
            rot: rand() * Math.PI * 2,
        }
        })
    }, [count])

    useFrame(() => {
        const m = mood.current
        const cloud = m.cloud * dash.current
        if (!group.current || !stage.current) return
        group.current.visible = cloud > 0.01
        if (!group.current.visible) return

        // Follow the planet (the city is straight "up" while on the dashboard)
        group.current.position.copy(stage.current.position)
        group.current.scale.copy(stage.current.scale)

        // Brightness: dark at night, dimmer under heavy cloud, flashes with lightning
        const dayLight = smoothstep(-0.15, 0.25, sky.current.lightDir.z)
        const base = (0.15 + 0.8 * dayLight) * (1 - 0.55 * m.dark)
        const bright = Math.min(1, base + m.flash * 0.6)

        for (const child of group.current.children) {
        const { seed, size } = child.userData
        const grow = smoothstep(seed * 0.8, seed * 0.8 + 0.2, cloud) // more puffs as cover rises
        child.scale.setScalar(Math.max(size * grow, 0.0001))
        child.material.opacity = (0.45 + 0.3 * m.cloud) * grow
        child.material.color.setScalar(bright)
        }
    })

    return (
        <group ref={group} visible={false}>
        {puffs.map((p, i) => (
            <sprite key={i} position={p.pos} scale={[p.size, p.size, 1]} userData={{ seed: p.seed, size: p.size }}>
            <spriteMaterial map={puff} transparent depthWrite={false} opacity={0} rotation={p.rot} />
            </sprite>
        ))}
        </group>
    )
}

/* ------------------------------------------------------------------ */
/* Veil: a full-screen layer for fog, overcast darkness and lightning  */
/* ------------------------------------------------------------------ */
const veilVertex = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0); // covers the whole screen
    }
`

const veilFragment = /* glsl */ `
    uniform float uFog;
    uniform float uDark;
    uniform float uFlash;
    varying vec2 vUv;

    void main() {
        // fog is denser toward the bottom of the screen (ground level)
        float haze = uFog * mix(1.0, 0.45, vUv.y) * 0.75;
        float dark = uDark * 0.35;
        float flash = uFlash * 0.55;

        vec3 col = vec3(0.62, 0.68, 0.76) * haze + vec3(0.9, 0.93, 1.0) * flash;
        float a = haze + dark + flash;
        gl_FragColor = vec4(col / max(a, 0.0001), clamp(a, 0.0, 0.92));
    }
`

function Veil() {
    const { mood, dash } = useScene()
    const mesh = useRef()
    const mat = useRef()

    const uniforms = useMemo(
        () => ({ uFog: { value: 0 }, uDark: { value: 0 }, uFlash: { value: 0 } }),
        []
    )

    useFrame(() => {
        if (!mesh.current || !mat.current) return
        const m = mood.current
        const d = dash.current
        const fog = m.fog * d
        const dark = m.dark * d
        mesh.current.visible = fog + dark + m.flash > 0.005
        const u = mat.current.uniforms
        u.uFog.value = fog
        u.uDark.value = dark
        u.uFlash.value = m.flash
    })

    return (
        <mesh ref={mesh} frustumCulled={false} renderOrder={10} visible={false}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
            ref={mat}
            uniforms={uniforms}
            vertexShader={veilVertex}
            fragmentShader={veilFragment}
            transparent
            depthTest={false}
            depthWrite={false}
        />
        </mesh>
    )
}

/* ------------------------------------------------------------------ */
/* Lightning: random double flashes during storms                      */
/* ------------------------------------------------------------------ */
function Lightning() {
    const { mood, dash } = useScene()
    const time = useRef(0)
    const next = useRef(0)
    const pulses = useRef([])

    useFrame((_, delta) => {
        const m = mood.current
        time.current += delta

        // no flashing for people who prefer reduced motion
        const active = !reducedMotion() && m.storm * dash.current > 0.4

        if (active && time.current > next.current) {
        pulses.current = [time.current, time.current + 0.14 + Math.random() * 0.1]
        next.current = time.current + 3 + Math.random() * 7
        }

        let f = 0
        for (const t0 of pulses.current) {
        const age = time.current - t0
        if (age >= 0 && age < 0.35) f += Math.exp(-age * 14)
        }
        m.flash = active ? Math.min(f, 1) : 0
    })

    return null
}

export default function WeatherEffects() {
    return (
        <>
        <Rain />
        <Snow />
        <CloudDeck />
        <Veil />
        <Lightning />
        </>
    )
}