import express from 'express';
import { getWeather } from '../controllers/weatherController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getWeather);

export default router;