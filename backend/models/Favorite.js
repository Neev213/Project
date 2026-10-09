import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
    country: {
        type: String,
        trim: true
    },
    latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
    },
    longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
    },
}, {timestamps: true});

favoriteSchema.index({ user: 1, city: 1 }, {unique: true});

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;