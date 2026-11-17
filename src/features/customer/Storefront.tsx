import { ArrowLeft, Clock, Heart, Info, MapPin, Plus, Search, Share2, ShoppingBag, Users, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, EmptyState, Rating, Skeleton } from '../../components/ui/primitives'
import { useFakeLoading } from '../../hooks'
import { cn, money } from '../../lib/format'
import { cartSubtotal } from '../../lib/pricing'
import { selectMenu, selectRestaurant, useStore } from '../../store/AppStore'
import type { MenuItem } from '../../types'
import { ItemModal } from './ItemModal'
import { RestaurantArt } from './RestaurantCard'

export function Storefront() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useStore()
  const r = selectRestaurant(state, id)
  const loading = useFakeLoading(550, [id])
  const [menuQuery, setMenuQuery] = useState('')
  const [activeCat, setActiveCat] = useState('')
  const [selected, setSelected] = useState<MenuItem | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const tabsRef = useRef<HTMLDivElement>(null)

  const menu = useMemo(() => (r ? selectMenu(state, r.id) : []), [state, r])
  const categories = useMemo(() => {
    if (!r) return []
    const q = menuQuery.trim().toLowerCase()
    const items = q ? menu.filter((m) => (m.name + m.description).toLowerCase().includes(q)) : menu
    const cats = r.menuCategories.filter((c) => c !== 'Popular')
    const extra = [...new Set(items.map((m) => m.category))].filter((c) => !cats.includes(c))
    const out: { name: string; items: MenuItem[] }[] = []
    if (!q) {
      const popular = items.filter((m) => m.popular)
      if (popular.length) out.push({ name: 'Popular', items: popular })
    }
    for (const c of [...cats, ...extra]) {
      const list = items.filter((m) => m.category === c)
      if (list.length) out.push({ name: c, items: list })
    }
    return out
  }, [r, menu, menuQuery])

  // Scroll-spy for sticky category tabs
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) setActiveCat((vis[0].target as HTMLElement).dataset.cat ?? '')
    }, { rootMargin: '-170px 0px -60% 0px' })
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [categories, loading])

  useEffect(() => {
    const tab = tabsRef.current?.querySelector(`[data-tab="${CSS.escape(activeCat)}"]`) as HTMLElement | null
    tab?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [activeCat])

  if (!r) return <EmptyState icon="🏚️" title="Store not found" action={<Link to="/" className="btn-primary">Back home</Link>} />

  const scrollTo = (cat: string) => {
    const el = sectionRefs.current[cat]
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 165, behavior: 'smooth' })
  }
  const fav = state.favorites.includes(r.id)
  const fee = r.deliveryFee * state.feeConfig.deliveryFeeMultiplier
  const eta = r.busyMode ? `${r.etaMin + 15}–${r.etaMax + 15}` : `${r.etaMin}–${r.etaMax}`
  const cartHere = state.cart.restaurantId === r.id ? state.cart.lines : []
  const qtyFor = (itemId: string) => cartHere.filter((l) => l.itemId === itemId).reduce((n, l) => n + l.quantity, 0)

  return (
    <div className="max-w-[1440px] mx-auto md:px-6 md:pt-5">
      {/* Hero */}
      <div className="relative">
        <RestaurantArt r={r} big className="h-48 md:h-72 md:rounded-3xl" />
        <div className="absolute top-3 inset-x-3 flex justify-between">
          <button onClick={() => navigate(-1)} className="icon-btn bg-white shadow" aria-label="Back"><ArrowLeft size={20} /></button>
          <div className="flex gap-2">
            <button className="icon-btn bg-white shadow" aria-label="Share"><Share2 size={18} /></button>
            <button onClick={() => dispatch({ type: 'favorite/toggle', id: r.id })} className="icon-btn bg-white shadow" aria-label="Favorite"><Heart size={18} className={cn(fav && 'fill-black')} /></button>
          </div>
        </div>
        <div className="absolute -bottom-9 left-4 md:left-8 w-[72px] h-[72px] md:w-24 md:h-24 rounded-full bg-white shadow-lg grid place-items-center text-4xl md:text-5xl border-4 border-white">{r.emoji}</div>
      </div>

      <div className="px-4 md:px-0 lg:grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] lg:gap-10">
        <div className="min-w-0">
          {/* Meta */}
          <div className="pt-12 md:pt-14">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">{r.name}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                  <Rating value={r.rating} count={r.ratingCount} className="text-black" />
                  <span>·</span><span>{r.cuisine}</span><span>·</span><span>{'$'.repeat(r.priceLevel)}</span><span>·</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={13} />{r.distanceKm} km</span>
                </div>
              </div>
              <button className="hidden md:inline-flex btn-secondary"><Users size={16} />Group order</button>
            </div>
            {!r.online && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-50 text-amber-900 text-sm font-medium flex gap-2"><Info size={18} className="shrink-0" />This store is paused and isn’t taking orders right now. You can still browse the menu.</div>
            )}
            <div className="mt-4 grid grid-cols-3 rounded-2xl border border-slate-200 divide-x divide-slate-200 text-center">
              <div className="py-3"><div className="font-bold">{fee === 0 ? 'Free' : money(fee)}</div><div className="text-xs text-slate-500">Delivery fee</div></div>
              <div className="py-3"><div className="font-bold inline-flex items-center gap-1"><Clock size={14} />{eta}</div><div className="text-xs text-slate-500">min{r.busyMode && ' · busy'}</div></div>
              <div className="py-3"><div className="font-bold">{state.mode === 'delivery' ? 'Delivery' : 'Pickup'}</div><div className="text-xs text-slate-500">{r.address}</div></div>
            </div>
            {r.promo && <div className="mt-3"><Badge tone="green" className="text-sm py-1">🏷️ {r.promo}</Badge></div>}
          </div>

          {/* Sticky tabs + search */}
          <div className="sticky top-[100px] md:top-[108px] z-30 bg-white -mx-4 md:mx-0 px-4 md:px-0 mt-6 border-b border-slate-200">
            <div className="flex items-center gap-3 py-2">
              <div ref={tabsRef} className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide">
                {categories.map((c) => (
                  <button key={c.name} data-tab={c.name} onClick={() => scrollTo(c.name)}
                    className={cn('shrink-0 h-9 px-3.5 rounded-full text-sm font-semibold transition', activeCat === c.name ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-700')}>{c.name}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 h-9 px-3 rounded-full bg-slate-100 w-36 md:w-56 focus-within:ring-2 focus-within:ring-black">
                <Search size={15} className="text-slate-500 shrink-0" />
                <input value={menuQuery} onChange={(e) => setMenuQuery(e.target.value)} placeholder="Search menu" className="bg-transparent outline-none text-sm w-full min-w-0" />
                {menuQuery && <button onClick={() => setMenuQuery('')}><X size={14} /></button>}
              </div>
            </div>
          </div>

          {/* Menu */}
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4 mt-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
          ) : categories.length === 0 ? (
            <EmptyState icon="🍽️" title="No dishes found" body={`Nothing on the menu matches “${menuQuery}”.`} />
          ) : categories.map((c) => (
            <section key={c.name} data-cat={c.name} ref={(el) => { sectionRefs.current[c.name] = el }} className="pt-6">
              <h2 className="text-xl font-bold mb-3">{c.name}</h2>
              <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                {c.items.map((m) => {
                  const q = qtyFor(m.id)
                  return (
                    <button key={m.id} disabled={m.soldOut} onClick={() => setSelected(m)}
                      className={cn('text-left card p-3 md:p-4 flex gap-3 hover:border-slate-400 hover:shadow-sm transition relative', m.soldOut && 'opacity-60')}>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold flex items-center gap-2">{q > 0 && <span className="w-5 h-5 rounded bg-brand text-white text-xs grid place-items-center">{q}</span>}{m.name}</div>
                        <div className="text-sm text-slate-500 line-clamp-2 mt-1">{m.description}</div>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <span className="font-semibold">{money(m.price)}</span>
                          {m.calories && <span className="text-slate-400">· {m.calories} cal</span>}
                          {m.popular && c.name !== 'Popular' && <Badge tone="green">Popular</Badge>}
                          {m.dietary?.includes('vegan') && <Badge tone="green">🌱 Vegan</Badge>}
                          {m.soldOut && <Badge tone="red">Sold out</Badge>}
                        </div>
                      </div>
                      <div className="relative shrink-0">
                        <span className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-slate-100 grid place-items-center text-5xl">{m.emoji}</span>
                        {!m.soldOut && <span className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 grid place-items-center"><Plus size={18} /></span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Desktop sticky mini-cart */}
        <aside className="hidden lg:block">
          <div className="sticky top-[132px] mt-14 card p-5">
            <div className="font-bold text-lg mb-1">Your order</div>
            {cartHere.length === 0 ? (
              <div className="text-sm text-slate-500 py-8 text-center"><ShoppingBag className="mx-auto mb-2 text-slate-300" size={36} />Items you add will appear here.</div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto">
                  {cartHere.map((l) => (
                    <div key={l.id} className="py-3 flex gap-3 text-sm">
                      <span className="font-semibold w-6">{l.quantity}×</span>
                      <div className="flex-1 min-w-0"><div className="font-medium">{l.name}</div>{l.selectionLabels.length > 0 && <div className="text-slate-500 text-xs truncate">{l.selectionLabels.join(', ')}</div>}</div>
                      <span className="tabular">{money(l.unitPrice * l.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-semibold pt-3 border-t border-slate-200"><span>Subtotal</span><span className="tabular">{money(cartSubtotal(cartHere))}</span></div>
                <button className="btn-primary w-full mt-4" onClick={() => dispatch({ type: 'cart/open', open: true })}>Go to checkout</button>
              </>
            )}
          </div>
        </aside>
      </div>

      {selected && <ItemModal item={selected} restaurant={r} onClose={() => setSelected(null)} />}
    </div>
  )
}
