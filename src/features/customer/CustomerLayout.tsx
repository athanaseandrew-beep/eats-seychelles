import { ChevronDown, Home, MapPin, Receipt, Search, ShoppingBag, User } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Segmented } from '../../components/ui/primitives'
import { cn, money } from '../../lib/format'
import { cartSubtotal } from '../../lib/pricing'
import { cartCount, useStore } from '../../store/AppStore'
import { AddressModal } from './AddressModal'
import { CartDrawer } from './CartDrawer'

export interface CustomerOutletCtx {
  query: string
  setQuery: (q: string) => void
  openAddress: () => void
}

export function Logo({ suffix }: { suffix?: string }) {
  return (
    <span className="text-[22px] font-extrabold tracking-tight leading-none select-none">
      Eats<span className="text-brand">.</span>
      {suffix && <span className="ml-1.5 text-sm font-semibold text-slate-500 align-middle">{suffix}</span>}
    </span>
  )
}

export function CustomerLayout() {
  const { state, dispatch } = useStore()
  const [query, setQuery] = useState('')
  const [addrOpen, setAddrOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const count = cartCount(state)
  const subtotal = cartSubtotal(state.cart.lines)
  const activeOrder = state.orders.find((o) => o.customerName === 'You' && !['delivered', 'cancelled'].includes(o.status))

  const onSearch = (q: string) => {
    setQuery(q)
    if (pathname !== '/' && pathname !== '/search') navigate('/')
  }

  return (
    <div className="min-h-[calc(100vh-44px)] flex flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-11 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto h-14 md:h-16 px-4 md:px-6 flex items-center gap-3 md:gap-5">
          <NavLink to="/" className="hidden md:block shrink-0"><Logo /></NavLink>
          <Segmented className="hidden lg:inline-flex" value={state.mode} onChange={(mode) => dispatch({ type: 'mode/set', mode })}
            options={[{ value: 'delivery', label: 'Delivery' }, { value: 'pickup', label: 'Pickup' }]} />
          <button onClick={() => setAddrOpen(true)} className="flex items-center gap-2 min-w-0 md:px-3 md:h-10 md:rounded-full md:bg-slate-100 md:hover:bg-slate-200 text-left">
            <MapPin size={18} className="shrink-0" />
            <span className="min-w-0">
              <span className="md:hidden block text-[11px] font-medium text-slate-500 leading-tight">{state.mode === 'delivery' ? 'Deliver now' : 'Pickup near'}</span>
              <span className="block truncate text-sm font-semibold max-w-[56vw] md:max-w-[200px]">{state.address.line1}</span>
            </span>
            <ChevronDown size={16} className="shrink-0" />
          </button>
          <div className="hidden md:flex flex-1 items-center gap-2 h-11 px-4 rounded-full bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-black">
            <Search size={18} className="text-slate-500" />
            <input value={query} onChange={(e) => onSearch(e.target.value)} placeholder="Search restaurants, dishes, groceries" className="bg-transparent outline-none flex-1 text-sm" />
          </div>
          <div className="flex-1 md:hidden" />
          <NavLink to="/orders" className="hidden md:inline-flex btn-ghost text-sm"><Receipt size={18} /> Orders</NavLink>
          <button onClick={() => dispatch({ type: 'cart/open', open: true })}
            className={cn('relative inline-flex items-center gap-2 h-10 rounded-full font-semibold text-sm transition', count ? 'bg-black text-white px-4' : 'md:bg-slate-100 md:px-4 w-10 md:w-auto justify-center')}
            aria-label="Open cart">
            <ShoppingBag size={18} />
            <span className={cn(count ? 'inline' : 'hidden md:inline')}>{count ? count : 'Cart'}</span>
          </button>
        </div>
      </header>

      {/* Active order banner */}
      {activeOrder && pathname === '/' && (
        <button onClick={() => navigate(`/track/${activeOrder.id}`)} className="bg-brand text-white">
          <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-11 flex items-center justify-between text-sm font-semibold">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white animate-pulse" />Your order from {activeOrder.restaurantName} is in progress</span>
            <span className="underline underline-offset-2">Track</span>
          </div>
        </button>
      )}

      <main className="flex-1 pb-36 md:pb-12">
        <Outlet context={{ query, setQuery: onSearch, openAddress: () => setAddrOpen(true) } satisfies CustomerOutletCtx} />
      </main>

      {/* ── Mobile sticky cart bar ───────────────────────────── */}
      {count > 0 && !state.cartOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-16 z-40 px-3 pb-2">
          <button onClick={() => dispatch({ type: 'cart/open', open: true })} className="w-full h-14 rounded-2xl bg-black text-white flex items-center justify-between px-4 shadow-xl animate-slide-up">
            <span className="w-7 h-7 rounded-full bg-white/15 grid place-items-center text-sm font-bold">{count}</span>
            <span className="font-semibold">View cart</span>
            <span className="font-semibold tabular">{money(subtotal)}</span>
          </button>
        </div>
      )}

      {/* ── Mobile bottom tabs ───────────────────────────────── */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 pb-safe">
        <div className="grid grid-cols-4 h-16">
          {[
            { to: '/', icon: Home, label: 'Home', end: true },
            { to: '/search', icon: Search, label: 'Search' },
            { to: '/orders', icon: Receipt, label: 'Orders' },
            { to: '/account', icon: User, label: 'Account' },
          ].map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('flex flex-col items-center justify-center gap-1 text-[11px] font-semibold', isActive ? 'text-black' : 'text-slate-400')}>
              <Icon size={22} strokeWidth={2.2} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <CartDrawer />
      <AddressModal open={addrOpen} onClose={() => setAddrOpen(false)} />
    </div>
  )
}
