import { useEffect, useState } from 'react'

// The real time in a city, e.g. { day: 'Friday', time: '01:42' }.
// `timezone` is a name like "Asia/Kolkata". If the browser does not know it,
// the offset from UTC (in seconds) is used instead.
export function localClock(now, timezone, utcOffsetSeconds = 0) {
  try {
    const date = new Date(now)
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone }),
      time: date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: timezone,
      }),
    }
  } catch {
    const shifted = new Date(now + utcOffsetSeconds * 1000).toISOString() // "2026-10-23T01:42:10.000Z"
    return {
      day: new Date(`${shifted.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' }),
      time: shifted.slice(11, 16),
    }
  }
}

// A clock for a city that keeps ticking while the page is open
export default function useClock(timezone, utcOffsetSeconds) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(id)
  }, [])

  return localClock(now, timezone, utcOffsetSeconds)
}