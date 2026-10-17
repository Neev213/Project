import WidgetCard from './WidgetCard'
import { describe } from '../../utils/weatherCodes'
import { degrees, longDay, timePart } from '../../utils/format'

export default function CurrentCard({ data }) {
  const { current, daily } = data
  const { label, icon } = describe(current.weather_code, current.is_day === 1)
  const region = [data.admin1, data.country].filter(Boolean).join(', ')

  return (
    <WidgetCard delay={0.6}>
      <p className="text-xs tracking-[0.3em] text-white/60 uppercase">
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
    </WidgetCard>
  )
}