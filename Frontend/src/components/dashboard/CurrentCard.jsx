import { motion } from 'framer-motion'
import WidgetCard from './WidgetCard'
import useClock from '../../hooks/useClock'
import { describe } from '../../utils/weatherCodes'
import { degrees } from '../../utils/format'

// The heart: outline when the place is not saved, filled pink when it is
function HeartButton({ active, onClick }) {
  const label = active ? 'Remove from favorites' : 'Save to favorites'
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.85 }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 bg-white/5 text-white/80 transition hover:border-pink-300/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-sky-300"
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        animate={{ scale: active ? [1, 1.35, 1] : 1 }}
        transition={{ duration: 0.35 }}
        fill={active ? '#f472b6' : 'none'}
        stroke={active ? '#f472b6' : 'currentColor'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </motion.svg>
    </motion.button>
  )
}

export default function CurrentCard({ data, isFavorite = false, onToggleFavorite }) {
  const { current, daily } = data
  const { label, icon } = describe(current.weather_code, current.is_day === 1)
  const region = [data.admin1, data.country].filter(Boolean).join(', ')

  // The real time in this city. (current.time is only the time of the latest
  // weather reading, which the provider updates every 15 minutes.)
  const clock = useClock(data.timezone, data.utcOffsetSeconds)

  return (
    <WidgetCard delay={0.6}>
      <div className="flex items-start justify-between gap-3">
        <p className="pt-2 text-xs tracking-[0.3em] text-white/60 uppercase">
          {clock.day}, {clock.time} local
        </p>
        {onToggleFavorite && <HeartButton active={isFavorite} onClick={onToggleFavorite} />}
      </div>
      <h2 className="mt-2 text-3xl font-light">{data.city}</h2>
      {region && <p className="text-sm text-white/60">{region}</p>}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-7xl font-extralight">{degrees(current.temperature_2m)}</p>
        <span className="text-6xl" aria-hidden="true">{icon}</span>
      </div>

      <p className="mt-2 text-lg">{label}</p>
      <p className="mt-1 text-sm text-white/60">
        H {degrees(daily.temperature_2m_max[0])} · L {degrees(daily.temperature_2m_min[0])}
      </p>
    </WidgetCard>
  )
}