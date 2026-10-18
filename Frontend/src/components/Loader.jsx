import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

export default function Loader() {
  const { active, progress } = useProgress()
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (active || progress < 100) return
    const t1 = setTimeout(() => setFading(true), 300)
    const t2 = setTimeout(() => setGone(true), 1100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [active, progress])

  if (gone) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white transition-opacity duration-700 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <p className="text-lg font-semibold tracking-[0.25em]">WEATHER EARTH</p>
      <div className="mt-6 h-0.5 w-56 overflow-hidden rounded bg-white/15">
        <div
          className="h-full bg-sky-300 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-xs tracking-widest text-white/50">{Math.round(progress)}%</p>
    </div>
  )
}