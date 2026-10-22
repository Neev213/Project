import { useEffect, useState } from 'react'

// A small message shown while the free server is waking up.
// api/axios.js sends the "server-slow" window event.
export default function ServerNotice() {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const onSlow = (e) => setSlow(e.detail === true)
    window.addEventListener('server-slow', onSlow)
    return () => window.removeEventListener('server-slow', onSlow)
  }, [])

  if (!slow) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div className="max-w-md rounded-2xl border border-white/20 bg-slate-950/70 px-5 py-3 text-center shadow-[0_10px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <p className="animate-pulse text-sm font-medium text-sky-200">Waking up the server...</p>
        <p className="mt-0.5 text-xs text-white/60">
          The free server sleeps when nobody is using it. This can take up to a minute.
        </p>
      </div>
    </div>
  )
}