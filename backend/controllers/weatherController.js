import {
    getWeatherByCity,
    getWeatherByCoords,
    searchPlaces,
} from "../services/weatherServices.js";
import SearchHistory from "../models/searchHistory.js";

// Query values can be arrays or objects; only accept plain strings
const str = (v) => (typeof v === 'string' ? v.trim().slice(0, 100) : '');

export const getWeather = async (req, res) => {
    const hasCoords = req.query.lat !== undefined || req.query.lon !== undefined;
    let data;

    if (hasCoords) {
        const latitude = Number(str(req.query.lat));
        const longitude = Number(str(req.query.lon));

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            Math.abs(latitude) > 90 ||
            Math.abs(longitude) > 180
        ) {
            return res.status(400).json({ message: 'Invalid coordinates' });
        }

        data = await getWeatherByCoords({
            latitude,
            longitude,
            name: str(req.query.name) || 'Selected place',
            country: str(req.query.country) || undefined,
            admin1: str(req.query.admin1) || undefined,
        });
    } else {
        const city = str(req.query.city);
        if (!city) {
            return res.status(400).json({ message: 'Please provide a city' });
        }
        data = await getWeatherByCity(city);
    }

    // Answer first. History is saved in the background (and skipped for prefetches),
    // so MongoDB is no longer on the critical path.
    res.json(data);

    if (req.user && req.query.prefetch !== '1') {
        SearchHistory.deleteMany({ user: req.user._id, city: data.city })
            .then(() => SearchHistory.create({ user: req.user._id, city: data.city }))
            .catch((err) => console.error('Could not save search history:', err.message));
    }
};

export const search = async (req, res) => {
    const q = str(req.query.q);
    if (q.length < 2) return res.json([]);
    res.json(await searchPlaces(q));
};