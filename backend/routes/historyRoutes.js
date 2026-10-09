import express from 'express';

import { getHistory, clearHistory } from '../controllers/historyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getHistory);
router.delete('/', clearHistory);

export default router;
