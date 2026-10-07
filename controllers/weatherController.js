import { getWeatherByCity } from "../services/weatherServices.js";

export const getWeather = async (req, res) => {
    const { city } = req.query;

    if(!city || !city.trim()){
        return res.status(400).json({ message: 'Please provide a city' });
    }

    const data = await getWeatherByCity(city);
    res.json(data);
}