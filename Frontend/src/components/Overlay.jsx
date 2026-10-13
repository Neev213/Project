import { Link } from 'react-router-dom'

export default function Overlay({ active, total = 4 }) {
    return (
        <header data-fade className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-8 py-6 text-white">
        <div className="pointer-events-auto flex items-center gap-6">
            <Link to="/" className="text-lg font-semibold tracking-[0.25em]">
            WEATHER EARTH
            </Link>
            <span className="text-xs uppercase tracking-[0.3em] text-white/60">Menu</span>
        </div>

        <div className="flex gap-3">
            {Array.from({ length: total }).map((_, i) => (
            <span
                key={i}
                className={`h-2 w-2 rounded-full transition-all duration-500 ${
                i === active ? 'scale-125 bg-white' : 'bg-white/30'
                }`}
            />
            ))}
        </div>
        </header>
    )
}