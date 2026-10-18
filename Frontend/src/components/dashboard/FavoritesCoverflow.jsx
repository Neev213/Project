import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Keyboard, Mousewheel } from 'swiper/modules'
import { fetchWeather } from '../../api/weather'
import { describe } from '../../utils/weatherCodes'
import { degrees } from '../../utils/format'

// Saved favorite -> the shape fetchWeather / load() expect
const toPlace = (f) => ({
  name: f.city,
  admin1: f.admin1,
  country: f.country,
  latitude: f.latitude,
  longitude: f.longitude,
})

function FavoriteCard({ fav, onSelect, onRemove }) {
  const [now, setNow] = useState(null)

  // Live temperature via the prefetch path: it never touches your search history
  useEffect(() => {
    let cancelled = false
    fetchWeather(toPlace(fav), { prefetch: true })
      .then((d) => {
        if (!cancelled) setNow(d.current)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fav.latitude, fav.longitude])

  const region = [fav.admin1, fav.country].filter(Boolean).join(', ')
  const weather = now ? describe(now.weather_code, now.is_day === 1) : null

  return (
    <div className="fav-card relative rounded-3xl border border-white/15 bg-slate-950/40 backdrop-blur-md">
      <button
        type="button"
        onClick={() => onSelect(toPlace(fav))}
        className="block w-full cursor-pointer p-5 text-left text-white"
      >
        <p className="truncate pr-6 text-xl font-light">{fav.city}</p>
        <p className="h-5 truncate text-xs text-white/50">{region}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-4xl font-extralight">{now ? degrees(now.temperature_2m) : '--'}</span>
          <span className="text-4xl" aria-hidden="true">{weather?.icon}</span>
        </div>
        <p className="mt-1 h-5 text-sm text-white/60">{weather?.label}</p>
      </button>

      <button
        type="button"
        onClick={() => onRemove(fav)}
        aria-label={`Remove ${fav.city} from favorites`}
        className="absolute top-3 right-3 h-6 w-6 rounded-full text-lg leading-none text-white/50 transition hover:bg-white/10 hover:text-white"
      >
        ×
      </button>
    </div>
  )
}

export default function FavoritesCoverflow({ items, onSelect, onRemove }) {
  return (
    <section className="mt-12">
      <h3 className="mb-2 text-center text-xs tracking-[0.3em] text-white/60 uppercase">Favorites</h3>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/50">
          No favorites yet. Tap the heart on a place to save it here.
        </p>
      ) : (
        <Swiper
          modules={[EffectCoverflow, Keyboard, Mousewheel]}
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          slideToClickedSlide
          keyboard={{ enabled: true }}
          mousewheel={{ forceToAxis: true }} // only sideways scrolling; page scroll still works
          coverflowEffect={{ rotate: 35, stretch: 0, depth: 140, modifier: 1, slideShadows: false }}
          style={{ paddingBlock: 32 }}
        >
          {items.map((fav) => (
            <SwiperSlide key={fav._id} style={{ width: 240 }}>
              <FavoriteCard fav={fav} onSelect={onSelect} onRemove={onRemove} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  )
}