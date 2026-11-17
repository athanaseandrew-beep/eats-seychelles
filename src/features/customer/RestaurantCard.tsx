import { Heart, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Rating, Skeleton } from '../../components/ui/primitives'
import { cn, money } from '../../lib/format'
import { useStore } from '../../store/AppStore'
import type { Restaurant } from '../../types'

export function RestaurantArt({ r, className, big }: { r: Restaurant; className?: string; big?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', r.gradient, className)}>
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_70%,white_0,transparent_35%)]" />
      <span className={cn('absolute inset-0 grid place-items-center drop-shadow-xl select-none', big ? 'text-[110px] md:text-[150px]' : 'text-6xl md:text-7xl')}>{r.emoji}</span>
    </div>
  )
}

export function RestaurantCard({ r, compact }: { r: Restaurant; compact?: boolean }) {
  const { state, dispatch } = useStore()
  const fav = state.favorites.includes(r.id)
  const fee = r.deliveryFee * state.feeConfig.deliveryFeeMultiplier
  const eta = r.busyMode ? `${r.etaMin + 15}–${r.etaMax + 15}` : `${r.etaMin}–${r.etaMax}`
  return (
    <Link to={`/store/${r.id}`} className={cn('group block', compact && 'w-[78vw] sm:w-[300px] shrink-0 snap-start')}>
      <div className="relative">
        <RestaurantArt r={r} className="aspect-[16/9] rounded-2xl group-hover:brightness-[1.03] transition" />
        {r.promo && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-brand text-white text-xs font-bold px-2 py-1 rounded-md">
            <Tag size={12} />{r.promo}
          </span>
        )}
        <button onClick={(e) => { e.preventDefault(); dispatch({ type: 'favorite/toggle', id: r.id }) }}
          className="absolute top-2.5 right-2.5 w-9 h-9 grid place-items-center rounded-full bg-white/90 hover:bg-white" aria-label="Save">
          <Heart size={18} className={cn(fav && 'fill-black')} />
        </button>
        {!r.online && (
          <div className="absolute inset-0 rounded-2xl bg-black/55 grid place-items-center">
            <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1.5 rounded-full">Currently unavailable</span>
          </div>
        )}
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">{r.name}</div>
          <div className="text-sm text-slate-500 truncate">
            {fee === 0 ? <span className="text-emerald-700 font-medium">Free delivery</span> : `${money(fee)} delivery`} · {eta} min
          </div>
        </div>
        <span className="shrink-0 w-9 h-9 rounded-full bg-slate-100 grid place-items-center text-xs font-bold">{r.rating.toFixed(1)}</span>
      </div>
      {!compact && <Rating value={r.rating} count={r.ratingCount} className="sr-only" />}
    </Link>
  )
}

export function RestaurantCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[16/9] rounded-2xl" />
      <Skeleton className="h-4 w-2/3 mt-3" />
      <Skeleton className="h-3 w-1/2 mt-2" />
    </div>
  )
}
