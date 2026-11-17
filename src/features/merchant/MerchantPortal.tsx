import { BarChart3, ClipboardList, Flame, Plus, UtensilsCrossed, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Toggle } from '../../components/ui/primitives'
import { MARKET } from '../../config/market'
import { cn, money, orderId } from '../../lib/format'
import { selectMenu, useStore } from '../../store/AppStore'
import type { Order } from '../../types'
import { Logo } from '../customer/CustomerLayout'
import { KDSBoard } from './KDSBoard'
import { MenuManager } from './MenuManager'

const NAMES = ['Josiane F.', 'Terry V.', 'Anne-Marie L.', 'Bernard H.', 'Aisha R.', 'Wills C.']

export function MerchantPortal() {
  const { state, dispatch } = useStore()
  const [storeId, setStoreId] = useState('r1')
  const [sound, setSound] = useState(false)
  const r = state.restaurants.find((x) => x.id === storeId)!
  const orders = state.orders.filter((o) => o.restaurantId === storeId)
  const today = orders.filter((o) => o.status !== 'cancelled')
  const revenue = today.reduce((s, o) => s + o.fees.subtotal, 0)

  const simulateOrder = () => {
    const menu = selectMenu(state, storeId).filter((m) => !m.soldOut)
    const picks = menu.sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3))
    const lines = picks.map((m, i) => ({ id: `sim-${Date.now()}-${i}`, itemId: m.id, restaurantId: storeId, name: m.name, emoji: m.emoji, quantity: 1 + Math.floor(Math.random() * 2), selections: {}, selectionLabels: [], instructions: i === 0 && Math.random() > 0.5 ? 'No onions please' : '', unitPrice: m.price }))
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
    const now = Date.now()
    const o: Order = {
      id: orderId(), restaurantId: storeId, restaurantName: r.name, restaurantEmoji: r.emoji, customerName: NAMES[Math.floor(Math.random() * NAMES.length)],
      address: 'Anse Etoile, House 22, Mahé', lines,
      fees: { subtotal, deliveryFee: r.deliveryFee, serviceFee: subtotal * 0.05, smallOrderFee: 0, priorityFee: 0, tax: subtotal * 1.05 * (MARKET.vatPct / 100), tip: 25, discount: 0, total: subtotal * 1.05 * (1 + MARKET.vatPct / 100) + r.deliveryFee + 25 },
      status: 'placed', placedAt: now, acceptDeadline: now + 90_000, prepMinutes: 12, dropoff: 'door', instructions: '', speed: Math.random() > 0.7 ? 'priority' : 'standard', mode: 'delivery', timeline: { placed: now },
    }
    dispatch({ type: 'order/inject', order: o })
  }

  return (
    <div className="min-h-[calc(100vh-44px)] bg-slate-50">
      {/* Header */}
      <header className="sticky top-11 z-30 bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden sm:block"><Logo suffix="Merchant" /></span>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="h-10 pl-3 pr-8 rounded-full bg-slate-100 font-semibold text-sm outline-none max-w-[240px]">
              {state.restaurants.map((x) => <option key={x.id} value={x.id}>{x.emoji} {x.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 sm:gap-5 ml-auto flex-wrap">
            <div className={cn('flex items-center gap-2 h-10 pl-3 pr-2 rounded-full text-sm font-semibold', r.online ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700')}>
              <span className={cn('w-2 h-2 rounded-full', r.online ? 'bg-brand animate-pulse' : 'bg-red-500')} />
              {r.online ? 'Online' : 'Paused'}
              <Toggle size="sm" checked={r.online} onChange={(v) => dispatch({ type: 'restaurant/patch', id: r.id, patch: { online: v } })} label="Store online" srOnly />
            </div>
            <div className={cn('flex items-center gap-2 h-10 pl-3 pr-2 rounded-full text-sm font-semibold', r.busyMode ? 'bg-orange-50 text-orange-800' : 'bg-slate-100')}>
              <Flame size={15} className={r.busyMode ? 'text-orange-500' : 'text-slate-500'} />Busy +15m
              <Toggle size="sm" tone="dark" checked={r.busyMode} onChange={(v) => dispatch({ type: 'restaurant/patch', id: r.id, patch: { busyMode: v } })} label="Busy mode" srOnly />
            </div>
            <button onClick={() => setSound(!sound)} className={cn('icon-btn', sound ? 'bg-black text-white hover:bg-slate-800' : 'bg-slate-100')} title={sound ? 'Sound alerts on' : 'Sound alerts off'} aria-label="Toggle sound">
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button onClick={simulateOrder} className="btn-secondary text-sm"><Plus size={16} />Simulate order</button>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {[{ to: '/merchant', label: 'Live orders', icon: ClipboardList, end: true }, { to: '/merchant/menu', label: 'Menu & store', icon: UtensilsCrossed }].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('shrink-0 h-11 px-3 inline-flex items-center gap-2 text-sm font-semibold border-b-2 transition', isActive ? 'border-black text-black' : 'border-transparent text-slate-500 hover:text-black')}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
          <div className="ml-auto hidden md:flex items-center gap-5 text-sm text-slate-600 pr-1">
            <span className="inline-flex items-center gap-1.5"><BarChart3 size={15} />Today</span>
            <span><b className="text-black tabular">{today.length}</b> orders</span>
            <span><b className="text-black tabular">{money(revenue)}</b> sales</span>
            <span><b className="text-black">{r.rating}</b> rating</span>
          </div>
        </div>
      </header>

      {!r.online && (
        <div className="bg-red-600 text-white text-sm font-semibold text-center py-2">Store is paused — customers can browse but can’t order.</div>
      )}

      <Routes>
        <Route index element={<KDSBoard restaurantId={storeId} sound={sound} />} />
        <Route path="menu" element={<MenuManager restaurantId={storeId} />} />
      </Routes>
    </div>
  )
}
