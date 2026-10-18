import mongoose from 'mongoose'
import Favorite from '../models/Favorite.js'

const MAX_FAVORITES = 12
const str = (v) => (typeof v === 'string' ? v.trim().slice(0, 100) : '')

export const getFavorites = async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(favorites)
}

export const addFavorite = async (req, res) => {
  const city = str(req.body.city)
  const { latitude, longitude } = req.body

  if (
    !city ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return res.status(400).json({ message: 'Invalid place' })
  }

  const count = await Favorite.countDocuments({ user: req.user._id })
  if (count >= MAX_FAVORITES) {
    return res.status(400).json({ message: `You can save up to ${MAX_FAVORITES} places` })
  }

  try {
    const favorite = await Favorite.create({
      user: req.user._id,
      city,
      admin1: str(req.body.admin1) || undefined,
      country: str(req.body.country) || undefined,
      latitude,
      longitude,
      placeKey: `${latitude.toFixed(2)},${longitude.toFixed(2)}`,
    })
    res.status(201).json(favorite)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Already in your favorites' })
    }
    throw err
  }
}

export const deleteFavorite = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid id' })
  }
  await Favorite.findOneAndDelete({ _id: req.params.id, user: req.user._id })
  res.json({ message: 'Removed' })
}