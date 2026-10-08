import express from 'express';

import {
    getFavorites,
    addFavorite,
    deleteFavorite,
} from '../controllers/favoriteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:id', deleteFavorite);

export default router;
