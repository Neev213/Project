import express from 'express'
import {
    register,
    login,
    getMe,
    verifyEmail,
    resendCode,
    googleLogin,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register', register)
router.post('/verify-email', verifyEmail)
router.post('/resend-code', resendCode)
router.post('/login', login)
router.post('/google', googleLogin)
router.get('/me', protect, getMe)

export default router