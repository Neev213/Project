import { motion } from 'framer-motion'

export default function GlassPanel({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-3xl bg-white/[0.03] p-8 text-white backdrop-blur-lg backdrop-saturate-150 shadow-[0_0_90px_rgba(125,200,255,0.18),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_0_50px_rgba(255,255,255,0.03)] ${className}`}
    >
      {/* glowing animated edge */}
      <div className="glass-ring-glow" />
      <div className="glass-ring" />

      {/* light sweeps, clipped to the rounded corners */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-sky-300/10" />
        <div className="absolute -top-24 -left-24 h-60 w-60 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-60 w-60 rounded-full bg-violet-400/20 blur-3xl" />
      </div>

      <div className="relative">{children}</div>
    </motion.div>
  )
}