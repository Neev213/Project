import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import weatherRoutes from './routes/weatherRoutes.js'
import favoriteRoutes from './routes/favoritesRoutes.js'
import historyRoutes from './routes/historyRoutes.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()
connectDB()

const app = express()

// CORS first, locked to the frontend origin only
app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())

app.get('/', (req, res) => {
    res.send('API is running')
})

app.use('/api/auth', authRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/history', historyRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
})