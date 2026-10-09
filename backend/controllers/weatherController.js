import { getWeatherByCity } from "../services/weatherServices.js";
import SearchHistory from "../models/searchHistory.js";



export const getWeather = async (req, res) => {
    const { city } = req.query;

    if(!city || !city.trim()){
        return res.status(400).json({ message: 'Please provide a city' });
    }

    const data = await getWeatherByCity(city);

    if(req.user){
        await SearchHistory.deleteMany({ user: req.user._id, city: data.city });
        await SearchHistory.create({ user: req.user._id, city: data.city });
    }
    res.json(data);
};