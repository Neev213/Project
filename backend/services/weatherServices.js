import cache from './cacheService.js'

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

const FORECAST_TTL = 600 // seconds: weather barely changes in 10 minutes
const GEO_TTL = 3600 // a place's coordinates never change

const httpError = (message, statusCode) => {
    const error = new Error(message)
    error.statusCode = statusCode
    return error
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

    const res = await fetch(`${FORECAST_URL}?${params}`)
    if (!res.ok) throw httpError('Weather service unavailable', 502)

    const forecast = await res.json()
    cache.set(key, forecast, FORECAST_TTL)
    return forecast
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
})

// Autocomplete: up to 10 matching places (cities, towns, villages)
export const searchPlaces = async (query) => {
    const q = query.trim()
    if (q.length < 2) return []

    const key = `search:${q.toLowerCase()}`
    const cached = cache.get(key)
    if (cached) return cached

    const res = await fetch(
        `${GEO_URL}?name=${encodeURIComponent(q)}&count=10&language=en&format=json`
    )
    if (!res.ok) throw httpError('Geocoding service unavailable', 502)

    const data = await res.json()
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

// Typed name: take the first match (the lookup itself is now cached too)
export const getWeatherByCity = async (city) => {
    const q = city.trim()
    const geoKey = `geo:${q.toLowerCase()}`

    let place = cache.get(geoKey)
    if (!place) {
        const geoRes = await fetch(
            `${GEO_URL}?name=${encodeURIComponent(q)}&count=1&language=en&format=json`
        )
        if (!geoRes.ok) throw httpError('Geocoding service unavailable', 502)
        const geoData = await geoRes.json()

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