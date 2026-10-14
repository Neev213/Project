// Open-Meteo uses WMO weather codes.
// category drives the 3D weather effect in step 8C.
const TABLE = {
    0: ['Clear sky', 'clear'],
    1: ['Mainly clear', 'clear'],
    2: ['Partly cloudy', 'cloudy'],
    3: ['Overcast', 'cloudy'],
    45: ['Fog', 'fog'],
    48: ['Rime fog', 'fog'],
    51: ['Light drizzle', 'rain'],
    53: ['Drizzle', 'rain'],
    55: ['Heavy drizzle', 'rain'],
    56: ['Freezing drizzle', 'rain'],
    57: ['Freezing drizzle', 'rain'],
    61: ['Light rain', 'rain'],
    63: ['Rain', 'rain'],
    65: ['Heavy rain', 'rain'],
    66: ['Freezing rain', 'rain'],
    67: ['Freezing rain', 'rain'],
    71: ['Light snow', 'snow'],
    73: ['Snow', 'snow'],
    75: ['Heavy snow', 'snow'],
    77: ['Snow grains', 'snow'],
    80: ['Rain showers', 'rain'],
    81: ['Rain showers', 'rain'],
    82: ['Violent showers', 'rain'],
    85: ['Snow showers', 'snow'],
    86: ['Heavy snow showers', 'snow'],
    95: ['Thunderstorm', 'storm'],
    96: ['Thunderstorm, hail', 'storm'],
    99: ['Thunderstorm, hail', 'storm'],
}

const ICONS = {
    clear: ['☀️', '🌙'],
    cloudy: ['⛅', '☁️'],
    fog: ['🌫️', '🌫️'],
    rain: ['🌧️', '🌧️'],
    snow: ['❄️', '❄️'],
    storm: ['⛈️', '⛈️'],
}

export function describe(code, isDay = true) {
    const [label, category] = TABLE[code] ?? ['Unknown', 'cloudy']
    const icon = ICONS[category][isDay ? 0 : 1]
    return { label, category, icon }
}