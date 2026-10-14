const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export const compass = (deg) => DIRS[Math.round(deg / 45) % 8]
export const degrees = (n) => `${Math.round(n)}°`

// Times from the API are local to the city, like "2026-10-15T06:12"
export const timePart = (iso) => (iso ? iso.slice(11, 16) : '--:--')
export const hourLabel = (iso) => `${iso.slice(11, 13)}:00`

export const dayLabel = (isoDate, index) =>
    index === 0
    ? 'Today'
    : new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' })

export const longDay = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { weekday: 'long' })

// Is this timestamp between that day's sunrise and sunset?
export function isDayAt(iso, daily) {
    const i = daily.time.indexOf(iso.slice(0, 10))
    if (i < 0) return true
    return iso >= daily.sunrise[i] && iso < daily.sunset[i]
}