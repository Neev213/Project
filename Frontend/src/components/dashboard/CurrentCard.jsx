import { motion } from 'framer-motion'
import WidgetCard from './WidgetCard'
import { describe } from '../../utils/weatherCodes'
import { degrees, longDay, timePart } from '../../utils/format'

export default function CurrentCard({ data, isFavorite = false, onToggleFavorite }) {
  const { current, daily } = data
  const { label, icon } = describe(current.weather_code, current.is_day === 1)
  const region = [data.admin1, data.country].filter(Boolean).join(', ')

  return (
    <WidgetCard delay={0.6}>
      <div className="relative">
        {onToggleFavorite && (
          <motion.button
            type="button"
            onClick={onToggleFavorite}
            whileTap={{ scale: 0.8 }}
            animate={{ scale: isFavorite ? [1, 1.35, 1] : 1 }}
            transition={{ duration: 0.35 }}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`absolute top-0 right-0 p-1 transition-colors ${
              isFavorite ? 'text-rose-400' : 'text-white/60 hover:text-white'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            >
              <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5 6.4 5c2 0 3.6 1.1 5.6 3 2-1.9 3.6-3 5.6-3 3.4 0 5.2 3.6 3.9 6.8C19.5 16.4 12 21 12 21z" />
            </svg>
          </motion.button>
        )}

        <p className="pr-10 text-xs tracking-[0.3em] text-white/60 uppercase">
          {longDay(current.time)}, {timePart(current.time)} local
        </p>
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
      </div>
    </WidgetCard>
  )
}