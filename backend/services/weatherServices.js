import cache from "./cacheService.js";

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';


export const getWeatherByCity = async (city) => {
    const key = `weather:${city.trim().toLowerCase()}`;

    const cached = cache.get(key);
    if(cached) return cached;

    const geoRes = await fetch(
        `${GEO_URL}?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoRes.json();

    if(!geoData.results || geoData.results.length === 0){
        const error = new Error('City not Found');
        error.statusCode = 404;
        throw error;
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    const params = new URLSearchParams({
        latitude,
        longitude,
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
    });

    const forecastRes = await fetch(`${FORECAST_URL}?${params}`);
    if(!forecastRes.ok){
        const error = new Error('Weather service unavailable');
        error.statusCode = 502;
        throw error;
    }
    const forecast = await forecastRes.json();

    const result = {
        city: name,
        country,
        latitude,
        longitude,
        current: forecast.current,
        daily: forecast.daily,
    };

    cache.set(key, result);
    return result;
}