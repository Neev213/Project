import cache from './cacheService.js'

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

const FORECAST_TTL = 600 // seconds: weather barely changes in 10 minutes
const STALE_TTL = 6 * 60 * 60 // keep an old copy for 6 hours, as a safety net
const GEO_TTL = 3600 // a place's coordinates never change
const UPSTREAM_TIMEOUT = 8000 // don't wait forever for Open-Meteo

const httpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Calls Open-Meteo. When it fails, the real reason is written to the server log,
// and one retry is made for temporary problems (network errors and 5xx).
async function callOpenMeteo(url, label) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    let res
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT) })
    } catch (err) {
      console.error(`Open-Meteo ${label}: request failed (attempt ${attempt}):`, err.message)
      if (attempt === 2) throw httpError(`${label} unavailable`, 502)
      await sleep(700)
      continue
    }

    if (res.ok) return res.json()

    const body = await res.text().catch(() => '')
    console.error(`Open-Meteo ${label}: HTTP ${res.status} (attempt ${attempt}) ${body.slice(0, 300)}`)

    // 429 = the free limit for this server's IP address is used up
    if (res.status === 429) {
      throw httpError('The weather provider is busy right now. Please try again in a few minutes.', 503)
    }
    if (res.status < 500 || attempt === 2) throw httpError(`${label} unavailable`, 502)
    await sleep(700)
  }
}

// Forecast for one point, cached by coordinates (rounded to ~1 km)
async function loadForecast(latitude, longitude) {
  const key = `forecast:${latitude.toFixed(2)},${longitude.toFixed(2)}`
  const cached = cache.get(key)
  if (cached) return cached

  const params = new URLSearchParams({
    latitude,
    longitude,
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'is_day',
      'precipitation',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'weather_code',
    ].join(','),
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_probability_max',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
    forecast_hours: '24',
  })

  try {
    const forecast = await callOpenMeteo(`${FORECAST_URL}?${params}`, 'Weather service')
    cache.set(key, forecast, FORECAST_TTL)
    cache.set(`stale:${key}`, { ...forecast, stale: true }, STALE_TTL)
    return forecast
  } catch (err) {
    // Safety net: an old forecast is better than an error page
    const old = cache.get(`stale:${key}`)
    if (old) {
      console.warn(`Serving an older forecast for ${key}`)
      return old
    }
    throw err
  }
}

const buildResult = ({ name, country, admin1, latitude, longitude }, forecast) => ({
  city: name,
  country,
  admin1,
  latitude,
  longitude,
  timezone: forecast.timezone,
  utcOffsetSeconds: forecast.utc_offset_seconds,
  current: forecast.current,
  hourly: forecast.hourly,
  daily: forecast.daily,
  stale: forecast.stale === true,
})

// Autocomplete: up to 10 matching places (cities, towns, villages)
export const searchPlaces = async (query) => {
  const q = query.trim()
  if (q.length < 2) return []

  const key = `search:${q.toLowerCase()}`
  const cached = cache.get(key)
  if (cached) return cached

  const data = await callOpenMeteo(
    `${GEO_URL}?name=${encodeURIComponent(q)}&count=10&language=en&format=json`,
    'Geocoding service'
  )
  const places = (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    admin1: r.admin1,
    admin2: r.admin2,
    country: r.country,
    countryCode: r.country_code,
    latitude: r.latitude,
    longitude: r.longitude,
    population: r.population,
    timezone: r.timezone,
  }))

  cache.set(key, places, 600)
  return places
}

// Typed name: take the first match (the lookup itself is cached too)
export const getWeatherByCity = async (city) => {
  const q = city.trim()
  const geoKey = `geo:${q.toLowerCase()}`

  let place = cache.get(geoKey)
  if (!place) {
    const geoData = await callOpenMeteo(
      `${GEO_URL}?name=${encodeURIComponent(q)}&count=1&language=en&format=json`,
      'Geocoding service'
    )

    if (!geoData.results || geoData.results.length === 0) {
      throw httpError('City not Found', 404)
    }

    const { latitude, longitude, name, country, admin1 } = geoData.results[0]
    place = { name, country, admin1, latitude, longitude }
    cache.set(geoKey, place, GEO_TTL)
  }

  const forecast = await loadForecast(place.latitude, place.longitude)
  return buildResult(place, forecast)
}

// Exact place picked from the suggestions
export const getWeatherByCoords = async (place) => {
  const forecast = await loadForecast(place.latitude, place.longitude)
  return buildResult(place, forecast)
}