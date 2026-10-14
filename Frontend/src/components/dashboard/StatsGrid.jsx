import WidgetCard from './WidgetCard'
import { compass, degrees, timePart } from '../../utils/format'

export default function StatsGrid({ data }) {
    const { current, daily } = data

    const stats = [
        ['Feels like', degrees(current.apparent_temperature)],
        ['Wind', `${Math.round(current.wind_speed_10m)} km/h ${compass(current.wind_direction_10m)}`],
        ['Humidity', `${current.relative_humidity_2m}%`],
        ['Pressure', `${Math.round(current.pressure_msl)} hPa`],
        ['UV index', `${Math.round(daily.uv_index_max[0])}`],
        ['Cloud cover', `${current.cloud_cover}%`],
        ['Sunrise', timePart(daily.sunrise[0])],
        ['Sunset', timePart(daily.sunset[0])],
        ['Rain chance', `${daily.precipitation_probability_max[0] ?? 0}%`],
    ]

    return (
        <WidgetCard delay={0.75}>
        <div className="grid grid-cols-3 gap-x-4 gap-y-5">
            {stats.map(([label, value]) => (
            <div key={label}>
                <p className="text-[10px] tracking-[0.2em] text-white/50 uppercase">{label}</p>
                <p className="mt-1 text-lg">{value}</p>
            </div>
            ))}
        </div>
        </WidgetCard>
    )
}