import WidgetCard from './WidgetCard'
import { describe } from '../../utils/weatherCodes'
import { dayLabel, degrees, hourLabel, isDayAt } from '../../utils/format'

function Hourly({ data }) {
  const { hourly, daily } = data
  return (
    <WidgetCard delay={0.9}>
      <p className="mb-4 text-xs tracking-[0.3em] text-white/60 uppercase">Next 24 hours</p>
      <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none]">
        {hourly.time.map((t, i) => {
          const { icon } = describe(hourly.weather_code[i], isDayAt(t, daily))
          return (
            <div key={t} className="flex min-w-[52px] flex-col items-center gap-2">
              <span className="text-xs text-white/60">{hourLabel(t)}</span>
              <span className="text-2xl" aria-hidden="true">{icon}</span>
              <span>{degrees(hourly.temperature_2m[i])}</span>
              <span className="text-[10px] text-sky-200">
                {hourly.precipitation_probability[i] ?? 0}%
              </span>
            </div>
          )
        })}
      </div>
    </WidgetCard>
  )
}

function Daily({ data }) {
  const { daily } = data
  const lows = daily.temperature_2m_min
  const highs = daily.temperature_2m_max
  const min = Math.min(...lows)
  const span = Math.max(...highs) - min || 1

  return (
    <WidgetCard delay={1.05}>
      <p className="mb-4 text-xs tracking-[0.3em] text-white/60 uppercase">7-day forecast</p>
      <div className="flex flex-col gap-3">
        {daily.time.map((d, i) => {
          const { icon } = describe(daily.weather_code[i], true)
          const left = ((lows[i] - min) / span) * 100
          const width = ((highs[i] - lows[i]) / span) * 100
          return (
            <div key={d} className="flex items-center gap-3 text-sm">
              <span className="w-12 text-white/70">{dayLabel(d, i)}</span>
              <span className="w-6 text-lg" aria-hidden="true">{icon}</span>
              <span className="w-9 text-right text-white/60">{degrees(lows[i])}</span>
              <div className="relative h-1.5 flex-1 rounded-full bg-white/10">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-sky-300 to-amber-200"
                  style={{ left: `${left}%`, width: `${Math.max(width, 6)}%` }}
                />
              </div>
              <span className="w-9">{degrees(highs[i])}</span>
            </div>
          )
        })}
      </div>
    </WidgetCard>
  )
}

export default function ForecastStrip({ data }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Hourly data={data} />
      <Daily data={data} />
    </div>
  )
}