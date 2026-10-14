import api from './axios'

export const fetchWeather = async (city) => 
    (await api.get('./weather', { params: {city} })).data

export const fetchLastCity = async () => {
    try {
        const { data } = await api.get('./history')
        return Array.isArray(data) && data[0]?.city ? data[0].city : null
    } catch {
        return null
    }
}