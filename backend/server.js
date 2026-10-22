import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import weatherRoutes from './routes/weatherRoutes.js'
import favoriteRoutes from './routes/favoritesRoutes.js'
import historyRoutes from './routes/historyRoutes.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

// Fail early instead of running with an open CORS policy or no secrets
for (const name of ['CLIENT_URL', 'JWT_SECRET', 'MONGO_URI']) {
    if (!process.env[name]) {
        console.error(`Missing environment variable: ${name}`)
        process.exit(1)
    }
}

connectDB()

const app = express()

// Needed behind Render / Railway / Vercel so rate limits see the real client IP
app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json({ limit: '10kb' }))

const limiter = (windowMinutes, limit) =>
    rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        limit, // called `max` in express-rate-limit versions before 7
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many requests. Please try again later.' },
    })

app.get('/', (req, res) => {
    res.send('API is running')
})

// "Are you awake?" The site calls this when it opens, so a sleeping free server starts early.
// It sits above the rate limits on purpose, and it does not touch the database.
app.get('/api/health', (req, res) => {
    res.json({ ok: true })
})

// Search-as-you-type and prefetching make many calls, so the general limit is generous
app.use('/api', limiter(15, 1000))

// Login and signup: slow down password guessing
app.use('/api/auth/login', limiter(15, 10))
app.use('/api/auth/google', limiter(15, 20))
// Anything that sends an email or checks a code
app.use('/api/auth/register', limiter(60, 10))
app.use('/api/auth/verify', limiter(15, 15))
app.use('/api/auth/resend', limiter(60, 10))

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