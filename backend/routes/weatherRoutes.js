import express from 'express';
import { getWeather, search } from '../controllers/weatherController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', search);
router.get('/', optionalAuth, getWeather);

export default router;