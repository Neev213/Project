import { motion } from 'framer-motion'

export default function WidgetCard({ children, className = '', delay = 0 }) {
    return (
        <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/30 p-5 text-white shadow-[0_0_40px_rgba(125,200,255,0.10),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-md transition duration-300 hover:border-sky-200/40 hover:shadow-[0_0_50px_rgba(125,200,255,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] ${className}`}
        >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        <div className="relative">{children}</div>
        </motion.section>
    )
}