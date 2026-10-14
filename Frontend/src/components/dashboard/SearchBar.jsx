import { useState } from 'react'

export default function SearchBar({ onSearch, loading }) {
    const [value, setValue] = useState('')

    const submit = (e) => {
        e.preventDefault()
        if (value.trim()) onSearch(value)
    }

    return (
        <form
        onSubmit={submit}
        className="flex w-full max-w-md items-center rounded-full border border-white/20 bg-slate-950/30 px-5 py-2 backdrop-blur-md transition duration-300 focus-within:border-sky-300/70 focus-within:shadow-[0_0_28px_rgba(125,211,252,0.4)]"
        >
        <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search a city..."
            aria-label="Search a city"
            className="w-full bg-transparent text-white placeholder-white/50 outline-none"
        />
        <button
            type="submit"
            disabled={loading}
            className="ml-3 text-sm tracking-widest text-sky-200 uppercase transition hover:text-white disabled:opacity-50"
        >
            {loading ? '...' : 'Go'}
        </button>
        </form>
    )
}