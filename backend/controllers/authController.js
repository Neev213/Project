import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/user.js'
import generateToken from '../utils/generateToken.js'
import sendEmail from '../utils/sendEmail.js'

const CODE_TTL = 10 * 60 * 1000 // code valid for 10 minutes
const RESEND_COOLDOWN = 60 * 1000 // 1 code per minute
const MAX_ATTEMPTS = 5

const VERIFY_FIELDS = '+verifyCodeHash +verifyCodeExpires +verifyCodeSentAt +verifyAttempts'

const normalizeEmail = (e) => String(e || '').toLowerCase().trim()
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex')

// Input checks: only real strings of a sane length (bcrypt reads at most 72 bytes)
const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max
const validPassword = (p) => typeof p === 'string' && p.length >= 8 && p.length <= 72

const userPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  preferredUnit: user.preferredUnit,
  token: generateToken(user._id),
})

const cooldownActive = (user) =>
  user.verifyCodeSentAt && Date.now() - user.verifyCodeSentAt.getTime() < RESEND_COOLDOWN

// Create a fresh 6-digit code, store only its hash, and email it
async function issueCode(user) {
  const code = String(crypto.randomInt(100000, 1000000))
  user.verifyCodeHash = hashCode(code)
  user.verifyCodeExpires = new Date(Date.now() + CODE_TTL)
  user.verifyCodeSentAt = new Date()
  user.verifyAttempts = 0
  await user.save()

  await sendEmail({
    to: user.email,
    subject: `${code} is your Weather Earth verification code`,
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#05070d;color:#fff;padding:32px;border-radius:16px;max-width:420px">
        <h2 style="margin:0 0 8px;font-weight:300;letter-spacing:2px">WEATHER EARTH</h2>
        <p style="color:#9ca3af">Enter this code to verify your email:</p>
        <p style="font-size:36px;letter-spacing:10px;margin:16px 0"><b>${code}</b></p>
        <p style="color:#6b7280;font-size:13px">It expires in 10 minutes. If this wasn't you, ignore this email.</p>
      </div>`,
  })
}

export const register = async (req, res) => {
  const { name, password } = req.body
  const email = normalizeEmail(req.body.email)

  if (!isText(name, 60) || !isText(req.body.email, 254) || !validPassword(password)) {
    return res.status(400).json({
      message: 'Provide a name, a valid email and a password of 8 to 72 characters',
    })
  }

  let user = await User.findOne({ email }).select(VERIFY_FIELDS)

  if (user) {
    if (user.isVerified) return res.status(400).json({ message: 'User already exists' })
    // Unverified earlier attempt: let them retry, but not spam emails
    if (cooldownActive(user)) {
      return res.status(429).json({ message: 'Please wait a minute before requesting another code' })
    }
    user.name = name
    user.password = password
  } else {
    user = new User({ name, email, password, isVerified: false })
  }

  await issueCode(user)

  res.status(201).json({
    message: 'Verification code sent',
    email: user.email,
    needsVerification: true,
  })
}

export const verifyEmail = async (req, res) => {
  const email = normalizeEmail(req.body.email)
  const code = String(req.body.code || '').trim()

  const user = await User.findOne({ email }).select(VERIFY_FIELDS)

  if (!user) return res.status(400).json({ message: 'Invalid or expired code' })
  if (user.isVerified) {
    return res.status(400).json({ message: 'Email already verified. Please log in.' })
  }
  if (!user.verifyCodeHash || !user.verifyCodeExpires || user.verifyCodeExpires < new Date()) {
    return res.status(400).json({ message: 'Code expired. Request a new one.' })
  }
  if (user.verifyAttempts >= MAX_ATTEMPTS) {
    return res.status(429).json({ message: 'Too many attempts. Request a new code.' })
  }

  const given = Buffer.from(hashCode(code))
  const stored = Buffer.from(user.verifyCodeHash)
  const match = given.length === stored.length && crypto.timingSafeEqual(given, stored)

  if (!match) {
    user.verifyAttempts += 1
    await user.save()
    return res.status(400).json({ message: 'Incorrect code' })
  }

  user.isVerified = true
  user.verifyCodeHash = undefined
  user.verifyCodeExpires = undefined
  user.verifyCodeSentAt = undefined
  user.verifyAttempts = 0
  await user.save()

  res.json(userPayload(user))
}

export const resendCode = async (req, res) => {
  const email = normalizeEmail(req.body.email)
  const generic = { message: 'If the account needs verification, a new code was sent' }

  const user = await User.findOne({ email }).select(VERIFY_FIELDS)
  // Same answer whether or not the account exists (no email enumeration)
  if (!user || user.isVerified) return res.json(generic)

  if (cooldownActive(user)) {
    return res.status(429).json({ message: 'Please wait a minute before requesting another code' })
  }

  await issueCode(user)
  res.json(generic)
}

export const login = async (req, res) => {
  const { password } = req.body
  const email = normalizeEmail(req.body.email)

  if (!isText(req.body.email, 254) || typeof password !== 'string' || !password || password.length > 72) {
    return res.status(400).json({ message: 'Please provide valid email and password' })
  }

  const user = await User.findOne({ email }).select('+password ' + VERIFY_FIELDS)

  if (user && !user.password) {
    return res.status(400).json({ message: 'This account uses Google sign-in' })
  }

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  // Only after the password is correct do we reveal the account is unverified
  if (!user.isVerified) {
    if (!cooldownActive(user)) await issueCode(user)
    return res.status(403).json({
      message: 'Please verify your email. We sent you a code.',
      needsVerification: true,
      email: user.email,
    })
  }

  res.json(userPayload(user))
}

export const googleLogin = async (req, res) => {
  const { credential } = req.body
  if (typeof credential !== 'string' || !credential) {
    return res.status(400).json({ message: 'Missing Google credential' })
  }

  // Created here (not at module level) so process.env is already loaded
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

  let payload
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID, // token must be issued for OUR app
    })
    payload = ticket.getPayload()
  } catch {
    return res.status(401).json({ message: 'Invalid Google token' })
  }

  if (!payload?.email || !payload.email_verified) {
    return res.status(401).json({ message: 'Google email is not verified' })
  }

  const email = normalizeEmail(payload.email)
  let user = await User.findOne({ email })

  if (user) {
    if (!user.isVerified) {
      // Someone may have pre-registered this email with their own password.
      // Google just proved the real owner, so drop that password.
      user.set('password', undefined)
      user.authProvider = 'google'
      user.isVerified = true
    }
    if (!user.googleId) user.googleId = payload.sub
    await user.save()
  } else {
    user = await User.create({
      name: payload.name || email.split('@')[0],
      email,
      googleId: payload.sub,
      authProvider: 'google',
      isVerified: true,
    })
  }

  res.json(userPayload(user))
}

export const getMe = async (req, res) => {
  res.json(req.user)
}