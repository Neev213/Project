import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import GlassPanel from './GlassPanel'
import { useAuth } from '../context/AuthContext'
import usePlunge from '../hooks/usePlunge'

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
const errMsg = (err) => err.response?.data?.message || 'Something went wrong. Please try again.'

function Field({ id, label, type = 'text', value, onChange, autoComplete }) {
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
        placeholder=" "
        className="peer w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 pt-6 pb-2 text-white outline-none transition duration-300 focus:border-sky-300/70 focus:bg-white/[0.08] focus:shadow-[0_0_24px_rgba(125,211,252,0.35)]"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute top-4 left-4 text-white/60 transition-all duration-200 peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-200 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
  )
}

function OtpInput({ digits, setDigits, disabled }) {
  const refs = useRef([])
  const focus = (i) => refs.current[Math.min(Math.max(i, 0), 5)]?.focus()

  const onChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, '')
    setDigits((d) => d.map((x, k) => (k === i ? v.slice(-1) : x)))
    if (v) focus(i + 1)
  }

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i]) focus(i - 1)
  }

  const onPaste = (e) => {
    e.preventDefault()
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!t) return
    setDigits(Array.from({ length: 6 }, (_, k) => t[k] || ''))
    focus(t.length)
  }

  return (
    <div className="flex justify-between gap-2" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          disabled={disabled}
          onChange={(e) => onChange(i, e)}
          onKeyDown={(e) => onKeyDown(i, e)}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          className="h-14 w-12 rounded-xl border border-white/15 bg-white/[0.04] text-center text-2xl text-white outline-none transition duration-300 focus:border-sky-300/70 focus:bg-white/[0.08] focus:shadow-[0_0_24px_rgba(125,211,252,0.4)]"
        />
      ))}
    </div>
  )
}

export default function AuthWindow() {
  const [params] = useSearchParams()
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [step, setStep] = useState('form') // 'form' | 'verify'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [digits, setDigits] = useState(Array(6).fill(''))
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const { login, register, verifyEmail, resendCode, loginWithGoogle } = useAuth()
  const startPlunge = usePlunge()

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const code = digits.join('')

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (step === 'verify' && code.length === 6 && !busy) submitCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step])

  const switchMode = (next) => {
    setMode(next)
    setError('')
  }

  const startVerify = () => {
    setStep('verify')
    setDigits(Array(6).fill(''))
    setCooldown(60)
    setError('')
    setInfo(`We emailed a 6-digit code to ${form.email}`)
  }

  const submitForm = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      if (mode === 'signup') {
        await register(form.name, form.email, form.password)
        startVerify()
      } else {
        await login(form.email, form.password)
        startPlunge()
        return // stay "busy" while the animation plays
      }
    } catch (err) {
      if (err.response?.data?.needsVerification) startVerify()
      else setError(errMsg(err))
    }
    setBusy(false)
  }

  const submitCode = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await verifyEmail(form.email, code)
      startPlunge()
      return
    } catch (err) {
      setError(errMsg(err))
      setDigits(Array(6).fill(''))
    }
    setBusy(false)
  }

  const resend = async () => {
    if (cooldown > 0) return
    setError('')
    try {
      await resendCode(form.email)
      setCooldown(60)
      setInfo('A new code is on its way.')
    } catch (err) {
      setError(errMsg(err))
    }
  }

  const onGoogle = async (res) => {
    setError('')
    try {
      await loginWithGoogle(res.credential)
      startPlunge()
    } catch (err) {
      setError(errMsg(err))
    }
  }

  return (
    <GlassPanel className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {step === 'verify' ? (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5"
          >
            <h2 className="text-3xl font-light">Check your email</h2>
            <p className="text-sm text-white/70">{info}</p>

            <OtpInput digits={digits} setDigits={setDigits} disabled={busy} />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-300/30 bg-red-400/10 px-3 py-2 text-sm text-red-200"
              >
                {error}
              </motion.p>
            )}

            <button
              type="button"
              onClick={submitCode}
              disabled={busy || code.length < 6}
              className="rounded-full bg-white py-3 text-sm font-medium tracking-widest text-black uppercase transition duration-300 hover:shadow-[0_0_40px_rgba(125,211,252,0.7)] disabled:opacity-50"
            >
              {busy ? 'Verifying...' : 'Verify'}
            </button>

            <div className="flex items-center justify-between text-sm text-white/60">
              <button
                type="button"
                onClick={() => {
                  setStep('form')
                  setError('')
                }}
                className="transition hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0}
                className="transition hover:text-white disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative mb-8 flex rounded-full border border-white/15 bg-white/[0.04] p-1">
              {['login', 'signup'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className="relative z-10 flex-1 rounded-full py-2 text-sm tracking-widest uppercase"
                >
                  {mode === m && (
                    <motion.span
                      layoutId="auth-pill"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="absolute inset-0 -z-10 rounded-full bg-white/20 shadow-[0_0_24px_rgba(125,211,252,0.45)]"
                    />
                  )}
                  {m === 'login' ? 'Login' : 'Sign up'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                onSubmit={submitForm}
                initial={{ opacity: 0, x: mode === 'signup' ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'signup' ? -30 : 30 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4"
              >
                <h2 className="mb-2 text-3xl font-light">
                  {mode === 'signup' ? 'Create your account' : 'Welcome back'}
                </h2>

                {mode === 'signup' && (
                  <Field id="name" label="Name" value={form.name} onChange={set('name')} autoComplete="name" />
                )}
                <Field id="email" label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
                <Field
                  id="password"
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-red-300/30 bg-red-400/10 px-3 py-2 text-sm text-red-200"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 rounded-full bg-white py-3 text-sm font-medium tracking-widest text-black uppercase transition duration-300 hover:shadow-[0_0_40px_rgba(125,211,252,0.7)] disabled:opacity-60"
                >
                  {busy ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Enter'}
                </button>
              </motion.form>
            </AnimatePresence>

            {GOOGLE_ENABLED && (
              <>
                <div className="my-6 flex items-center gap-4 text-xs tracking-widest text-white/40 uppercase">
                  <span className="h-px flex-1 bg-white/15" />
                  or
                  <span className="h-px flex-1 bg-white/15" />
                </div>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={onGoogle}
                    onError={() => setError('Google sign-in failed. Please try again.')}
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    text="continue_with"
                    width="320"
                  />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  )
}