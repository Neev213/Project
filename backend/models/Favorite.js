import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    city: { type: String, required: true, trim: true },
    admin1: { type: String, trim: true },
    country: { type: String, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    // coordinates rounded to ~1 km: the same place can't be saved twice
    placeKey: { type: String, required: true },
  },
  { timestamps: true }
)

favoriteSchema.index({ user: 1, placeKey: 1 }, { unique: true })

export default mongoose.model('Favorite', favoriteSchema)