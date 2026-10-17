import { describe } from '../utils/weatherCodes'

// Every number the scene needs to know about the weather, each from 0 to 1
export const MOOD_KEYS = ['rain', 'snow', 'cloud', 'fog', 'storm', 'dark', 'windX', 'windY']

export const createMood = () => ({
  rain: 0,
  snow: 0,
  cloud: 0,
  fog: 0,
  storm: 0,
  dark: 0,
  windX: 0,
  windY: 0,
  flash: 0, // lightning, driven by WeatherEffects
})

const clamp01 = (v) => Math.min(Math.max(v, 0), 1)

// How strong the weather code says the precipitation is
const STRENGTH = {
  51: 0.3, 53: 0.5, 55: 0.8, 56: 0.4, 57: 0.7,
  61: 0.35, 63: 0.6, 65: 0.9, 66: 0.5, 67: 0.85,
  71: 0.35, 73: 0.6, 75: 0.9, 77: 0.4,
  80: 0.4, 81: 0.65, 82: 0.95, 85: 0.5, 86: 0.85,
  95: 0.9, 96: 1, 99: 1,
}

// weather: the backend result. psi: how the scene is turned (from skyMath).
// fx: optional override from the URL (?fx=rain), for testing.
export function computeMood(weather, psi = 0, fx = null) {
    const c = weather.current
    const { category } = describe(c.weather_code, c.is_day === 1)
    const kind = fx || category

    const cover = clamp01((c.cloud_cover ?? 0) / 100)
    const strength = fx
        ? 0.8
        : Math.max(STRENGTH[c.weather_code] ?? 0.5, clamp01((c.precipitation ?? 0) / 6))

    const m = createMood()

    switch (kind) {
        case 'rain':
        m.rain = strength
        m.cloud = Math.max(cover, 0.7 + 0.3 * strength)
        m.fog = 0.15 * strength
        break
        case 'snow':
        m.snow = strength
        m.cloud = Math.max(cover, 0.7)
        m.fog = 0.2 * strength
        break
        case 'storm':
        m.rain = Math.max(strength, 0.85)
        m.storm = 1
        m.cloud = 1
        m.fog = 0.2
        break
        case 'fog':
        m.fog = 0.8
        m.cloud = Math.max(cover, 0.5)
        break
        case 'cloudy':
        m.cloud = Math.max(cover, 0.6)
        break
        default: // clear
        m.cloud = cover * 0.7
    }

    // How much the whole scene should dim
    m.dark = clamp01(m.cloud * 0.5 + m.rain * 0.3 + m.snow * 0.15 + m.storm * 0.2 + m.fog * 0.15)

    // Wind: the API gives the direction it blows FROM (degrees clockwise from north)
    const speed = clamp01((c.wind_speed_10m ?? 0) / 40)
    const toward = (((c.wind_direction_10m ?? 0) + 180) * Math.PI) / 180
    const east = Math.sin(toward)
    const north = Math.cos(toward)
    // turn east/north into the scene's world axes
    m.windX = (east * Math.cos(psi) - north * Math.sin(psi)) * speed
    m.windY = (east * Math.sin(psi) + north * Math.cos(psi)) * speed

    return m
}