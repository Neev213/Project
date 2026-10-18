import { useEffect, useId, useRef, useState } from 'react'
import { searchPlaces } from '../../api/weather'

const MIN_CHARS = 3 // the geocoder only does fuzzy matching from 3 letters
const DEBOUNCE_MS = 300

const formatPop = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n)

// "District, Region, Country" without repeats
const subtitle = (p) =>
  [p.admin2, p.admin1, p.country].filter((part, i, arr) => part && part !== arr[i - 1]).join(', ')

// Colours the letters you typed
function Highlight({ text, query }) {
  const q = query.trim()
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-sky-200">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export default function SearchBar({ onSearch, onPrefetch, loading: weatherLoading }) {
  const [value, setValue] = useState('')
  const [found, setFound] = useState({ q: '', items: [] }) // results and the text they belong to
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [searching, setSearching] = useState(false)
  const [failed, setFailed] = useState(false)

  const box = useRef(null)
  const list = useRef(null)
  const skipSearch = useRef(false)
  const listId = useId()

  const query = value.trim()
  const ready = query.length >= MIN_CHARS

  // Search as you type: wait for a pause, cancel anything older
  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false // the text was just filled in by picking a suggestion
      return
    }
    if (query.length < MIN_CHARS) {
      setFound({ q: '', items: [] })
      setSearching(false)
      setFailed(false)
      return
    }

    setSearching(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const items = await searchPlaces(query, controller.signal)
        setFound({ q: query, items })
        setActive(-1)
        setFailed(false)
      } catch (err) {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return
        setFound({ q: query, items: [] })
        setFailed(true)
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Head start: after a short pause on a row (or on the top result that Enter would pick),
  // fetch its weather in the background so choosing it is instant.
  useEffect(() => {
    if (!open || !onPrefetch || found.q !== query) return
    const place = found.items[active >= 0 ? active : 0]
    if (!place) return
    const timer = setTimeout(() => onPrefetch(place), 250)
    return () => clearTimeout(timer)
  }, [open, active, found, query, onPrefetch])

  // Close when clicking elsewhere
  useEffect(() => {
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Keep the highlighted row visible while using the arrow keys
  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const choose = (place) => {
    skipSearch.current = true
    setValue(place.name)
    setOpen(false)
    setActive(-1)
    onSearch(place)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!query) return
    // Only trust suggestions that belong to exactly what is in the box now
    const fresh = found.q === query ? found.items : []
    if (open && fresh.length) {
      choose(fresh[active >= 0 ? active : 0])
      return
    }
    setOpen(false)
    onSearch(query) // fall back to searching by name
  }

  const onKeyDown = (e) => {
    const n = found.items.length
    if (e.key === 'ArrowDown' && n) {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a + 1) % n)
    } else if (e.key === 'ArrowUp' && n) {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a <= 0 ? n - 1 : a - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && ready

  return (
    <div ref={box} className="relative w-full max-w-md">
      <form
        onSubmit={submit}
        className="flex items-center rounded-full border border-white/20 bg-slate-950/30 px-5 py-2 backdrop-blur-md transition duration-300 focus-within:border-sky-300/70 focus-within:shadow-[0_0_28px_rgba(125,211,252,0.4)]"
      >
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search places"
          aria-label="Search places"
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          aria-controls={showList && found.items.length ? listId : undefined}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className="w-full bg-transparent text-white placeholder-white/50 outline-none"
        />
        {searching && <span className="mr-3 text-xs text-white/50">...</span>}
        <button
          type="submit"
          disabled={weatherLoading}
          className="text-sm tracking-widest text-sky-200 uppercase transition hover:text-white disabled:opacity-50"
        >
          {weatherLoading ? '...' : 'Go'}
        </button>
      </form>

      {showList && (
        <div className="absolute top-full right-0 left-0 z-30 mt-2 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/75 shadow-[0_10px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {found.items.length > 0 ? (
            <ul id={listId} ref={list} role="listbox" className="max-h-80 overflow-y-auto py-1">
              {found.items.map((p, i) => (
                <li
                  key={p.id ?? `${p.latitude},${p.longitude}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()} // keep focus in the input
                  onClick={() => choose(p)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center justify-between gap-4 px-5 py-2.5 transition ${
                    i === active ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-white">
                      <Highlight text={p.name} query={query} />
                    </p>
                    <p className="truncate text-xs text-white/50">{subtitle(p)}</p>
                  </div>
                  {p.population > 0 && (
                    <span className="shrink-0 text-xs text-white/40">pop. {formatPop(p.population)}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-white/60">
              {failed
                ? 'Could not load suggestions. Press Enter to search by name.'
                : searching || found.q !== query
                  ? 'Searching...'
                  : `No places found for "${query}"`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}