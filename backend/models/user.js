import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
      // Google accounts have no password
      required: [function () { return this.authProvider === 'local' }, 'Password is required'],
    },

    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, index: true, sparse: true },

    // default true so users that existed before verification stay verified.
    // register() sets it to false explicitly for new local accounts.
    isVerified: { type: Boolean, default: true },

    // email verification code (stored hashed, hidden from normal queries)
    verifyCodeHash: { type: String, select: false },
    verifyCodeExpires: { type: Date, select: false },
    verifyCodeSentAt: { type: Date, select: false },
    verifyAttempts: { type: Number, default: 0, select: false },

    preferredUnit: { type: String, default: 'metric' }, // <- keep YOUR existing definition
  },
  { timestamps: true }
)

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password)
}

export default mongoose.model('User', userSchema)