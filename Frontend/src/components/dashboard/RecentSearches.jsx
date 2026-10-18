// items: places (objects with a name) or plain city names from old history rows
export default function RecentSearches({ items, onPick, onClear }) {
  if (!items.length) return null

  return (
    <div className="mx-auto mt-3 flex max-w-6xl flex-wrap items-center justify-center gap-2 px-6">
      <span className="text-xs tracking-widest text-white/40 uppercase">Recent</span>
      {items.map((p) => {
        const name = typeof p === 'string' ? p : p.name
        const key = typeof p === 'string' ? `n:${p}` : `${p.latitude},${p.longitude}`
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPick(p)}
            className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            {name}
          </button>
        )
      })}
      <button
        type="button"
        onClick={onClear}
        className="px-2 text-xs text-white/40 underline-offset-2 transition hover:text-white hover:underline"
      >
        Clear
      </button>
    </div>
  )
}