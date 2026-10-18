import SearchHistory from '../models/searchHistory.js'

const KEEP = 10

export const getHistory = async (req, res) => {
  const history = await SearchHistory.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(KEEP)
    .lean()

  res.json(history)
}

export const clearHistory = async (req, res) => {
  await SearchHistory.deleteMany({ user: req.user._id })
  res.json({ message: 'History cleared' })
}

// Called by weatherController after a search. Replaces an older entry for the
// same place, then trims the list to the newest 10.
export const recordSearch = async (userId, place) => {
  const placeKey = `${Number(place.latitude).toFixed(2)},${Number(place.longitude).toFixed(2)}`

  await SearchHistory.deleteMany({
    user: userId,
    $or: [{ placeKey }, { city: place.city, placeKey: { $exists: false } }], // second rule clears old name-only entries
  })

  await SearchHistory.create({
    user: userId,
    city: place.city,
    admin1: place.admin1,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    placeKey,
  })

  const extra = await SearchHistory.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(KEEP)
    .select('_id')
    .lean()

  if (extra.length) {
    await SearchHistory.deleteMany({ _id: { $in: extra.map((d) => d._id) } })
  }
}