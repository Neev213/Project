import Favorite from "../models/Favorite.js";

export const getFavorites = async (req, res) => {
    const favorites = await Favorite.find({ user: req.user._id }).sort({
        createdAt: -1,
    });
    res.json(favorites);
};

export const addFavorite = async (req, res) => {
    const { city, country, latitude, longitude } = req.body;

    if(!city || latitude === undefined || longitude === undefined){
        return res.
            status(400)
            .json({ message: 'Please provide city, latitude and longitude' });

    }

    const exists = await Favorite.findOne({ user: req.user._id, city });

    if(exists){
        return res.status(400).json({ message: 'City already in favorites' });
    }

    const favorite = await Favorite.create({
        user: req.user._id,
        city,
        country,
        latitude,
        longitude,
    });

    res.status(201).json(favorite);
};

export const deleteFavorite = async (req, res) => {
    const favorite = await Favorite.findOne({
        _id: req.params.id,
        user: req.user._id,
    });

    if(!favorite){
        return res.status(404).json({ message: 'Favorite not found' });
    }

    await favorite.deleteOne();
    res.json({ message: 'Favorite removed' });
}