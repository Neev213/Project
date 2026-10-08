import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import weatherRoutes  from './routes/weatherRoutes.js'
import favoriteRoutes from './routes/favoritesRoutes.js'



dotenv.config();
connectDB();

const app = express()

app.use(cors())
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running');
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000

app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/favorites', favoriteRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
});
