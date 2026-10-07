import express from 'express';
import { register, login, getMe} from '../controllers/authController.js';
import { protect  } from '../middleware/authMiddleware.js';
import { get } from 'mongoose';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;