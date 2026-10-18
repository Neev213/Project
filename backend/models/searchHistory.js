import mongoose from 'mongoose'

const searchHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    admin1: { type: String, trim: true },
    country: { type: String, trim: true },
    // optional, so old entries that only have a city name still load
    latitude: Number,
    longitude: Number,
    placeKey: String,
  },
  { timestamps: true }
)

searchHistorySchema.index({ user: 1, createdAt: -1 })
searchHistorySchema.index({ user: 1, placeKey: 1 })

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema)

export default SearchHistory