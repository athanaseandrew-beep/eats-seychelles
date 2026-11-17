import { ChevronDown, ChevronLeft, ChevronRight, Clock, Search, SlidersHorizontal, Star, Truck, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { EmptyState, Segmented } from '../../components/ui/primitives'
import { CATEGORIES, PROMO_BANNERS } from '../../data/mock'
import { useFakeLoading, useInterval } from '../../hooks'
import { assetUrl, cn, money } from '../../lib/format'
import { useStore } from '../../store/AppStore'
import type { CategoryKey, Dietary } from '../../types'
import type { CustomerOutletCtx } from './CustomerLayout'
import { RestaurantCard, RestaurantCardSkeleton } from './RestaurantCard'

const DIETARY: { key: Dietary; label: string }[] = [
  { key: 'vegan', label: 'Vegan' }, { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'gluten-free', label: 'Gluten-free' }, { key: 'halal', label: 'Halal' },
]

export function DiscoveryFeed({ searchMode }: { searchMode?: boolean }) {
  const { state, dispatch } = useStore()
  const { query, setQuery } = useOutletContext<CustomerOutletCtx>()
  const [category, setCategory] = useState<CategoryKey | null>(null)
  const [under30, setUnder30] = useState(false)
  const [topRated, setTopRated] = useState(false)
  const [freeDelivery, setFreeDelivery] = useState(false)
  const [dietary, setDietary] = useState<Dietary[]>([])
  const [dietOpen, setDietOpen] = useState(false)
  const loading = useFakeLoading(700, [category])

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => state.restaurants.filter((r) => {
    if (category && !r.categories.includes(category)) return false
    if (under30 && (r.busyMode ? r.etaMax + 15 : r.etaMax) > 30) return false
    if (topRated && r.rating < 4.7) return false
    if (freeDelivery && r.deliveryFee * state.feeConfig.deliveryFeeMultiplier > 0) return false
    if (dietary.length && !dietary.every((d) => r.dietary.includes(d))) return false
    if (q) {
      const dishHit = state.menuItems.some((m) => m.restaurantId === r.id && m.name.toLowerCase().includes(q))
      if (!r.name.toLowerCase().includes(q) && !r.cuisine.toLowerCase().includes(q) && !dishHit) return false
    }
    return true
  }).sort((a, b) => Number(b.online) - Number(a.online)), [state.restaurants, state.menuItems, state.feeConfig, category, under30, topRated, freeDelivery, dietary, q])

  const dishResults = q ? state.menuItems.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 6) : []
  const featured = state.restaurants.filter((r) => r.rating >= 4.7 && r.online)
  const activeFilters = Number(under30) + Number(topRated) + Number(freeDelivery) + dietary.length + Number(!!category)
  const clearAll = () => { setCategory(null); setUnder30(false); setTopRated(false); setFreeDelivery(false); setDietary([]); setQuery('') }
  const browsing = !q && activeFilters === 0 && !searchMode

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6">
      {/* Mobile search + mode */}
      <div className="md:hidden pt-3 space-y-3">
        <div className="flex items-center gap-2 h-12 px-4 rounded-full bg-slate-100 focus-within:ring-2 focus-within:ring-black">
          <Search size={18} className="text-slate-500" />
          <input autoFocus={searchMode} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Food, groceries, drinks…" className="bg-transparent outline-none flex-1" />
          {query && <button onClick={() => setQuery('')} aria-label="Clear"><X size={18} /></button>}
        </div>
        {!searchMode && (
          <Segmented className="w-full" value={state.mode} onChange={(mode) => dispatch({ type: 'mode/set', mode })}
            options={[{ value: 'delivery', label: 'Delivery' }, { value: 'pickup', label: 'Pickup' }]} />
        )}
      </div>

      {/* Category carousel */}
      <div className="-mx-4 md:mx-0 mt-4 md:mt-6">
        <div className="flex gap-1 md:gap-3 overflow-x-auto scrollbar-hide px-4 md:px-0 snap-x lg:justify-between">
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCategory(category === c.key ? null : c.key)} className="snap-start shrink-0 flex flex-col items-center gap-1.5 w-[72px] group">
              <span className={cn('w-16 h-16 rounded-full grid place-items-center text-3xl transition', category === c.key ? 'bg-black ring-4 ring-black/10 scale-105' : 'bg-slate-100 group-hover:bg-slate-200')}>{c.emoji}</span>
              <span className={cn('text-xs font-semibold', category === c.key ? 'text-black' : 'text-slate-600')}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div className="-mx-4 md:mx-0 mt-4 sticky top-[100px] md:top-[108px] z-30 bg-white/95 backdrop-blur py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-0">
          {activeFilters > 0 && <button className="pill-off shrink-0" onClick={clearAll}><X size={14} />Clear ({activeFilters})</button>}
          <button className={under30 ? 'pill-on' : 'pill-off'} onClick={() => setUnder30(!under30)}><Clock size={14} />Under 30 min</button>
          <button className={topRated ? 'pill-on' : 'pill-off'} onClick={() => setTopRated(!topRated)}><Star size={14} />Top rated</button>
          <button className={freeDelivery ? 'pill-on' : 'pill-off'} onClick={() => setFreeDelivery(!freeDelivery)}><Truck size={14} />Free delivery</button>
          <div className="relative">
            <button className={dietary.length ? 'pill-on' : 'pill-off'} onClick={() => setDietOpen(!dietOpen)}>
              <SlidersHorizontal size={14} />Dietary{dietary.length ? ` · ${dietary.length}` : ''}<ChevronDown size={14} />
            </button>
          </div>
        </div>
        {dietOpen && (
          <div className="px-4 md:px-0 pt-2 flex flex-wrap gap-2 animate-fade-in">
            {DIETARY.map((d) => {
              const on = dietary.includes(d.key)
              return (
                <button key={d.key} onClick={() => setDietary(on ? dietary.filter((x) => x !== d.key) : [...dietary, d.key])}
                  className={cn('pill', on ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'bg-white border-slate-300 text-slate-700')}>{d.label}</button>
              )
            })}
          </div>
        )}
      </div>

      {browsing && <PromoSlider />}

      {browsing && (
        <section className="mt-8">
          <div className="flex items-end justify-between mb-3">
            <h2 className="section-title">Featured on Eats</h2>
            <span className="text-sm font-semibold text-slate-500">Top rated near you</span>
          </div>
          <div className="-mx-4 md:mx-0 flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-0 snap-x pb-1">
            {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-[78vw] sm:w-[300px] shrink-0"><RestaurantCardSkeleton /></div>)
              : featured.map((r) => <RestaurantCard key={r.id} r={r} compact />)}
          </div>
        </section>
      )}

      {dishResults.length > 0 && (
        <section className="mt-6">
          <h2 className="section-title mb-3">Dishes matching “{query}”</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dishResults.map((m) => {
              const r = state.restaurants.find((x) => x.id === m.restaurantId)!
              return (
                <Link key={m.id} to={`/store/${r.id}`} className="card p-3 flex items-center gap-3 hover:border-slate-400 transition">
                  <span className="w-14 h-14 rounded-xl bg-slate-100 grid place-items-center text-3xl">{m.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold truncate">{m.name}</span>
                    <span className="block text-sm text-slate-500 truncate">{r.name} · {money(m.price)}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="section-title mb-4">{browsing ? 'All restaurants' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-7">
            {Array.from({ length: 8 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="No matches" body="Try removing a filter or searching for something else." action={<button className="btn-primary" onClick={clearAll}>Reset filters</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-7">
            {filtered.map((r) => <RestaurantCard key={r.id} r={r} />)}
          </div>
        )}
      </section>

      {browsing && <PartnerCta />}
    </div>
  )
}

/** "Own a restaurant?" call to action at the end of the feed → partner registration. */
function PartnerCta() {
  return (
    <section className="mt-12 relative overflow-hidden rounded-3xl bg-slate-900 text-white">
      <img src={assetUrl('images/partner-praslin-dinner.jpg')} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-50" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="relative p-6 md:p-10 max-w-xl">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">For restaurants</div>
        <h2 className="text-2xl md:text-3xl font-extrabold mt-1">Own a restaurant in Seychelles?</h2>
        <p className="mt-2 text-white/85">Reach customers across Mahé, Praslin and La Digue. Register online in about 10 minutes.</p>
        <Link to="/partner" className="btn-brand mt-5">Become a partner</Link>
      </div>
      <Link to="/credits" className="absolute bottom-2 right-3 text-[11px] text-white/60 hover:text-white underline">Photo credits</Link>
    </section>
  )
}

function PromoSlider() {
  const ref = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  const go = (i: number) => {
    const el = ref.current
    if (!el) return
    const n = PROMO_BANNERS.length
    const next = (i + n) % n
    const child = el.children[next] as HTMLElement
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }
  useInterval(() => go(idx + 1), paused ? null : 4500)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const w = (el.children[0] as HTMLElement).offsetWidth + 16
      setIdx(Math.round(el.scrollLeft / w))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section className="mt-6 relative group" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)}>
      <div ref={ref} className="-mx-4 md:mx-0 px-4 md:px-0 flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        {PROMO_BANNERS.map((b) => (
          <div key={b.id} className={cn('snap-start shrink-0 w-[88vw] md:w-[calc(50%-8px)] xl:w-[calc(33.333%-11px)] h-40 md:h-44 rounded-3xl bg-gradient-to-br text-white p-5 md:p-6 flex justify-between overflow-hidden relative', b.className)}>
            {b.image && (
              <>
                <img src={assetUrl(b.image)} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/0" />
              </>
            )}
            <div className="flex flex-col justify-between relative z-10 max-w-[70%]">
              <div>
                <div className="text-xl md:text-2xl font-extrabold leading-tight">{b.title}</div>
                <div className="text-sm opacity-90 mt-1">{b.subtitle}</div>
              </div>
              <span className="self-start bg-white text-black text-sm font-semibold px-4 h-9 inline-flex items-center rounded-full">{b.cta}</span>
            </div>
            {!b.image && <span className="absolute -right-2 -bottom-4 text-[110px] rotate-12 select-none">{b.emoji}</span>}
          </div>
        ))}
      </div>
      <button onClick={() => go(idx - 1)} className="hidden md:grid absolute left-2 top-[72px] w-10 h-10 place-items-center rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition" aria-label="Previous"><ChevronLeft size={20} /></button>
      <button onClick={() => go(idx + 1)} className="hidden md:grid absolute right-2 top-[72px] w-10 h-10 place-items-center rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition" aria-label="Next"><ChevronRight size={20} /></button>
      <div className="flex justify-center gap-1.5 mt-3">
        {PROMO_BANNERS.map((b, i) => (
          <button key={b.id} onClick={() => go(i)} className={cn('h-1.5 rounded-full transition-all', i === idx ? 'w-6 bg-black' : 'w-1.5 bg-slate-300')} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </section>
  )
}
