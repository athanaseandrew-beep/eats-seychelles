import { Camera, Check, ChevronRight, Clock, DoorClosed, Flame, MapPin, MessageCircle, Navigation, Phone, Power, Store, TrendingUp, UserRound, Wallet, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CityMap, DEFAULT_ROUTE, pointAlong, type HeatZone, type Pt } from '../../components/ui/CityMap'
import { Badge, CountdownRing, Toggle } from '../../components/ui/primitives'
import { ME_COURIER, RESTAURANTS } from '../../data/mock'
import { useNow } from '../../hooks'
import { MARKET } from '../../config/market'
import { cn, mmss, money, orderId } from '../../lib/format'
import { useStore } from '../../store/AppStore'
import type { Order } from '../../types'

const HEAT: HeatZone[] = [
  { x: 95, y: 205, r: 70, level: 3, label: '1.6×' },
  { x: 300, y: 85, r: 60, level: 2, label: '1.3×' },
  { x: 205, y: 250, r: 55, level: 1, label: '1.1×' },
  { x: 345, y: 210, r: 45, level: 2, label: '1.2×' },
]
const OFFER_MS = 30_000
const TO_STORE: Pt[] = [[250, 230], [250, 202], [88, 202], [88, 214]]
const WEEK = [{ d: 'Mon', v: 1240 }, { d: 'Tue', v: 1085 }, { d: 'Wed', v: 1610 }, { d: 'Thu', v: 1420 }, { d: 'Fri', v: 2050 }, { d: 'Sat', v: 1790 }, { d: 'Sun', v: 0 }]

type Step = 'to_store' | 'check_in' | 'verify' | 'to_customer' | 'proof' | 'done'
const STEPS: { key: Step; label: string }[] = [
  { key: 'to_store', label: 'Navigate to store' },
  { key: 'check_in', label: 'Check in' },
  { key: 'verify', label: 'Verify items' },
  { key: 'to_customer', label: 'Navigate to customer' },
  { key: 'proof', label: 'Photo proof' },
]

/** Mock payout model (SCR): base + distance + share of basket + surge + 100% of tip */
export const payoutFor = (o: Order) => Math.round((35 + o.fees.subtotal * 0.04 + 5.1 * 6 * 1.2 + o.fees.tip) * 100) / 100

export function CourierApp() {
  const { state, dispatch } = useStore()
  const now = useNow(500)
  const { online, activeOrderId } = state.courier
  const active = state.orders.find((o) => o.id === activeOrderId)
  const [offer, setOffer] = useState<{ orderId: string; expiresAt: number } | null>(null)
  const [heat, setHeat] = useState(true)
  const searchingSince = useRef<number>(0)

  // Dispatch engine (mock): after a few seconds online, offer a real waiting order, else create one.
  useEffect(() => {
    if (!online || activeOrderId || offer) { searchingSince.current = 0; return }
    if (!searchingSince.current) searchingSince.current = now
    if (now - searchingSince.current < 4000) return
    const candidate = state.orders.find((o) => !o.courierId && ['preparing', 'ready'].includes(o.status) && o.mode === 'delivery' && !state.courier.declinedIds.includes(o.id))
    if (candidate) {
      setOffer({ orderId: candidate.id, expiresAt: now + OFFER_MS })
    } else {
      const r = RESTAURANTS.filter((x) => x.online)[Math.floor(Math.random() * 8)]
      const items = state.menuItems.filter((m) => m.restaurantId === r.id).slice(0, 2)
      const lines = items.map((m, i) => ({ id: `cj-${now}-${i}`, itemId: m.id, restaurantId: r.id, name: m.name, emoji: m.emoji, quantity: 1, selections: {}, selectionLabels: [], instructions: '', unitPrice: m.price }))
      const subtotal = lines.reduce((s, l) => s + l.unitPrice, 0)
      const o: Order = {
        id: orderId(), restaurantId: r.id, restaurantName: r.name, restaurantEmoji: r.emoji, customerName: 'Steve R.', address: 'Beau Vallon, Rue Bel Ombre, House 5', lines,
        fees: { subtotal, deliveryFee: r.deliveryFee, serviceFee: 15, smallOrderFee: 0, priorityFee: 0, tax: subtotal * (MARKET.vatPct / 100), tip: 30, discount: 0, total: subtotal * (1 + MARKET.vatPct / 100) + 45 + r.deliveryFee },
        status: 'preparing', placedAt: now - 120000, acceptedAt: now - 60000, acceptDeadline: now, prepMinutes: 10, dropoff: 'meet', instructions: 'Call on arrival, tower lobby', speed: 'standard', mode: 'delivery',
        timeline: { placed: now - 120000, preparing: now - 60000 },
      }
      dispatch({ type: 'order/inject', order: o })
      setOffer({ orderId: o.id, expiresAt: now + OFFER_MS })
    }
  }, [online, activeOrderId, offer, now, state.orders, state.menuItems, state.courier.declinedIds, dispatch])

  // Offer expiry → auto-decline
  useEffect(() => {
    if (offer && now > offer.expiresAt) { dispatch({ type: 'courier/decline', orderId: offer.orderId }); setOffer(null) }
  }, [offer, now, dispatch])

  const offerOrder = offer ? state.orders.find((o) => o.id === offer.orderId) : undefined
  const onlineFor = state.courier.onlineSince ? now - state.courier.onlineSince : 0

  return (
    <div className="lg:h-[calc(100vh-44px)] lg:flex bg-slate-900">
      {/* Map */}
      <div className="relative h-[46vh] lg:h-auto lg:flex-1">
        <TripMap active={active} heat={heat && !active} />
        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2">
          <div className="bg-black text-white rounded-2xl px-4 py-2.5 shadow-xl">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Today</div>
            <div className="text-xl font-extrabold tabular">{money(state.courier.earningsToday)}</div>
          </div>
          {!active && (
            <div className="bg-white rounded-full shadow-lg pl-3 pr-2 h-10 flex items-center gap-2 text-xs font-semibold">
              <Flame size={14} className="text-orange-500" />Demand <Toggle size="sm" checked={heat} onChange={setHeat} />
            </div>
          )}
        </div>
        {!active && (
          <div className="absolute bottom-8 lg:bottom-6 left-1/2 -translate-x-1/2">
            <button onClick={() => dispatch({ type: 'courier/online', online: !online })}
              className={cn('h-14 px-8 rounded-full font-bold text-base shadow-2xl flex items-center gap-2 transition active:scale-95', online ? 'bg-white text-black' : 'bg-brand text-white')}>
              <Power size={20} />{online ? 'Go offline' : 'Go online'}
            </button>
          </div>
        )}
      </div>

      {/* Sheet */}
      <div className="relative -mt-5 lg:mt-0 rounded-t-3xl lg:rounded-none bg-white lg:w-[440px] lg:overflow-y-auto min-h-[54vh] lg:min-h-0 pb-10">
        <div className="lg:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-300" />
        {active ? (
          <ActiveTrip key={active.id} order={active} />
        ) : offerOrder && offer ? (
          <OfferCard order={offerOrder} remaining={offer.expiresAt - now}
            onAccept={() => { dispatch({ type: 'courier/accept', orderId: offerOrder.id }); setOffer(null) }}
            onDecline={() => { dispatch({ type: 'courier/decline', orderId: offerOrder.id }); setOffer(null) }} />
        ) : (
          <div className="p-5">
            <div className="flex items-center gap-3">
              <span className={cn('w-3 h-3 rounded-full', online ? 'bg-brand animate-pulse' : 'bg-slate-300')} />
              <div className="flex-1">
                <div className="font-extrabold text-xl">{online ? 'Finding trips…' : 'You’re offline'}</div>
                <div className="text-sm text-slate-500">{online ? `Online for ${mmss(onlineFor)} · stay near orange zones for surge` : 'Go online to start receiving delivery requests.'}</div>
              </div>
            </div>
            {online && <div className="mt-4 h-1 rounded-full bg-emerald-100 overflow-hidden"><div className="h-full w-full bg-brand animate-pulse" /></div>}
            <EarningsWidget />
          </div>
        )}
      </div>
    </div>
  )
}

function TripMap({ active, heat }: { active?: Order; heat: boolean }) {
  const now = useNow(500)
  const [legStart, setLegStart] = useState(now)
  const leg = !active ? 'idle' : ['on_the_way'].includes(active.status) ? 'customer' : active.status === 'courier_at_store' ? 'atstore' : 'store'
  useEffect(() => setLegStart(Date.now()), [leg])
  const t = Math.min(1, (now - legStart) / 12000)
  const route = leg === 'store' ? TO_STORE : DEFAULT_ROUTE
  const pos = useMemo(() => {
    if (leg === 'idle') return { p: [250, 230] as Pt, angle: -90 }
    if (leg === 'atstore') return { p: DEFAULT_ROUTE[0], angle: -90 }
    if (active?.status === 'delivered') return { p: DEFAULT_ROUTE[DEFAULT_ROUTE.length - 1], angle: 0 }
    return pointAlong(route, t)
  }, [leg, route, t, active?.status])
  return (
    <CityMap className="absolute inset-0" heat={heat ? HEAT : undefined} route={route} routeProgress={leg === 'atstore' ? 0 : t}
      showRoute={leg !== 'idle'} showStore={leg !== 'idle'} showHome={leg === 'customer' || leg === 'atstore'}
      storeEmoji={active?.restaurantEmoji} courierAt={pos.p} courierAngle={pos.angle} />
  )
}

function OfferCard({ order, remaining, onAccept, onDecline }: { order: Order; remaining: number; onAccept: () => void; onDecline: () => void }) {
  const payout = payoutFor(order)
  return (
    <div className="p-5 animate-slide-up">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Badge tone="green" className="mb-2">🔥 Surge 1.6× included</Badge>
          <div className="text-4xl font-extrabold tracking-tight tabular">{money(payout)}</div>
          <div className="text-sm text-slate-500 mt-1">Est. 22 min · 5.1 km total · incl. {money(order.fees.tip)} tip</div>
        </div>
        <CountdownRing remainingMs={remaining} totalMs={OFFER_MS} size={64} stroke={6} />
      </div>
      <div className="mt-5 space-y-0">
        <Leg icon={<Store size={16} />} title={order.restaurantName} sub="Pickup · 1.2 km away · ready in ~4 min" dark />
        <div className="ml-[19px] h-5 border-l-2 border-dashed border-slate-300" />
        <Leg icon={<MapPin size={16} />} title={order.address.split(',').slice(0, 2).join(',')} sub="Drop-off · 3.9 km from store" />
      </div>
      <div className="mt-4 text-xs text-slate-500">{order.lines.length} item{order.lines.length > 1 ? 's' : ''} · {order.dropoff === 'door' ? 'Leave at door' : 'Meet customer'}{order.speed === 'priority' ? ' · Priority' : ''}</div>
      <div className="grid grid-cols-[auto_1fr] gap-2 mt-5">
        <button onClick={onDecline} className="w-14 h-14 rounded-full bg-slate-100 grid place-items-center hover:bg-slate-200" aria-label="Decline"><X size={22} /></button>
        <button onClick={onAccept} className="btn-brand h-14 text-lg">Accept trip</button>
      </div>
    </div>
  )
}

function Leg({ icon, title, sub, dark }: { icon: React.ReactNode; title: string; sub: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('w-10 h-10 rounded-full grid place-items-center shrink-0', dark ? 'bg-black text-white' : 'bg-brand text-white')}>{icon}</span>
      <div className="min-w-0"><div className="font-semibold truncate">{title}</div><div className="text-sm text-slate-500">{sub}</div></div>
    </div>
  )
}

function ActiveTrip({ order }: { order: Order }) {
  const { dispatch } = useStore()
  const initial: Step = order.status === 'on_the_way' ? 'to_customer' : order.status === 'courier_at_store' ? 'verify' : 'to_store'
  const [step, setStep] = useState<Step>(initial)
  const [checked, setChecked] = useState<string[]>([])
  const [photo, setPhoto] = useState<string | null>(null)
  const [completed, setCompleted] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const payout = payoutFor(order)
  const idx = STEPS.findIndex((s) => s.key === step)

  // Sync if another role (customer demo auto-advance / merchant) moved the order on
  useEffect(() => {
    if (order.status === 'cancelled') dispatch({ type: 'courier/complete', orderId: order.id, payout: 0 })
    if (order.status === 'delivered' && completed === null) { setCompleted(payout); setStep('done') }
    if (order.status === 'on_the_way' && idx < 3) setStep('to_customer')
  }, [order.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = (f?: File) => {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(f)
  }
  const complete = () => {
    setCompleted(payout)
    setStep('done')
  }
  const finish = () => dispatch({ type: 'courier/complete', orderId: order.id, payout: completed ?? payout, photo: photo ?? undefined })

  if (step === 'done') {
    return (
      <div className="p-6 text-center animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-brand text-white grid place-items-center mx-auto"><Check size={32} strokeWidth={3} /></div>
        <div className="text-sm text-slate-500 mt-4">Trip complete</div>
        <div className="text-4xl font-extrabold tabular mt-1">+{money(completed ?? payout)}</div>
        {photo && <img src={photo} alt="Proof of delivery" className="w-full h-40 object-cover rounded-2xl mt-4" />}
        <button className="btn-primary w-full mt-6" onClick={finish}>Back to map</button>
      </div>
    )
  }

  return (
    <div className="p-5">
      {/* Stepper */}
      <div className="flex gap-1 mb-4">{STEPS.map((s, i) => <div key={s.key} className={cn('h-1.5 flex-1 rounded-full', i < idx ? 'bg-black' : i === idx ? 'bg-brand' : 'bg-slate-200')} />)}</div>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step {idx + 1} of {STEPS.length}</div>
      <h2 className="text-2xl font-extrabold tracking-tight">{STEPS[idx].label}</h2>

      {(step === 'to_store' || step === 'check_in' || step === 'verify') && (
        <div className="mt-4 card p-4 flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-slate-100 grid place-items-center text-2xl">{order.restaurantEmoji}</span>
          <div className="flex-1 min-w-0"><div className="font-semibold">{order.restaurantName}</div><div className="text-sm text-slate-500">Order #{order.id.replace('EAT-', '')} · {order.lines.length} items</div></div>
          <button className="icon-btn bg-slate-100" aria-label="Call store"><Phone size={18} /></button>
        </div>
      )}
      {(step === 'to_customer' || step === 'proof') && (
        <div className="mt-4 card p-4">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-slate-100 grid place-items-center font-bold">{order.customerName[0]}</span>
            <div className="flex-1 min-w-0"><div className="font-semibold">{order.customerName === 'You' ? 'Alex M.' : order.customerName}</div><div className="text-sm text-slate-500 truncate">{order.address}</div></div>
            <button className="icon-btn bg-slate-100" aria-label="Message"><MessageCircle size={18} /></button>
            <button className="icon-btn bg-slate-100" aria-label="Call"><Phone size={18} /></button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone={order.dropoff === 'door' ? 'slate' : 'amber'}>{order.dropoff === 'door' ? <><DoorClosed size={11} />Leave at door</> : <><UserRound size={11} />Meet outside</>}</Badge>
          </div>
          {order.instructions && <div className="mt-2 text-sm bg-amber-50 text-amber-900 rounded-lg p-2">“{order.instructions}”</div>}
        </div>
      )}

      <div className="mt-5">
        {step === 'to_store' && (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3"><Navigation size={16} className="text-brand" />1.2 km · ~4 min via Providence Hwy</div>
            <button className="btn-primary w-full h-14" onClick={() => setStep('check_in')}>I’ve arrived at the store<ChevronRight size={18} /></button>
          </>
        )}
        {step === 'check_in' && (
          <>
            <p className="text-sm text-slate-600 mb-4">Let the restaurant know you’re here. Their KDS will show you as checked in.</p>
            <button className="w-full h-24 rounded-3xl bg-brand text-white font-extrabold text-xl flex items-center justify-center gap-3 active:scale-[.98] transition animate-alert-ring"
              onClick={() => { if (order.status !== 'courier_at_store') dispatch({ type: 'order/status', id: order.id, status: 'courier_at_store' }); setStep('verify') }}>
              <Check size={26} strokeWidth={3} />Tap to check in
            </button>
          </>
        )}
        {step === 'verify' && (
          <>
            {['placed', 'preparing'].includes(order.status) && <div className="text-sm bg-sky-50 text-sky-900 rounded-xl p-3 mb-3 flex gap-2"><Clock size={16} className="shrink-0" />Kitchen is still preparing — confirm items once handed over.</div>}
            <div className="space-y-2">
              {order.lines.map((l) => {
                const on = checked.includes(l.id)
                return (
                  <button key={l.id} onClick={() => setChecked(on ? checked.filter((x) => x !== l.id) : [...checked, l.id])}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition', on ? 'border-brand bg-emerald-50' : 'border-slate-200')}>
                    <span className={cn('w-6 h-6 rounded-md grid place-items-center border-2 shrink-0', on ? 'bg-brand border-brand text-white' : 'border-slate-300')}>{on && <Check size={14} strokeWidth={3} />}</span>
                    <span className="text-2xl">{l.emoji}</span>
                    <span className="flex-1 min-w-0"><span className="block font-semibold">{l.quantity}× {l.name}</span>{l.selectionLabels.length > 0 && <span className="block text-xs text-slate-500 truncate">{l.selectionLabels.join(', ')}</span>}</span>
                  </button>
                )
              })}
            </div>
            <button className="btn-primary w-full h-14 mt-4" disabled={checked.length !== order.lines.length}
              onClick={() => { dispatch({ type: 'order/status', id: order.id, status: 'on_the_way' }); setStep('to_customer') }}>
              Confirm pickup ({checked.length}/{order.lines.length})
            </button>
          </>
        )}
        {step === 'to_customer' && (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3"><Navigation size={16} className="text-brand" />3.9 km · ~12 min via East Coast Rd</div>
            <button className="btn-primary w-full h-14" onClick={() => setStep('proof')}>I’ve arrived at drop-off<ChevronRight size={18} /></button>
          </>
        )}
        {step === 'proof' && (
          <>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Delivery proof" className="w-full h-52 object-cover rounded-2xl" />
                <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 icon-btn bg-white shadow" aria-label="Retake"><X size={18} /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="w-full h-52 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-black hover:text-black transition">
                <Camera size={32} /><span className="font-semibold">Take a photo of the order at the door</span><span className="text-xs">Required for “Leave at door” deliveries</span>
              </button>
            )}
            <button className="btn-brand w-full h-14 mt-4" disabled={order.dropoff === 'door' && !photo} onClick={complete}>Complete delivery</button>
            {order.dropoff === 'door' && !photo && <button className="w-full text-xs text-slate-500 mt-2 underline" onClick={() => setPhoto(demoPhoto())}>Use demo photo</button>}
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm border-t border-slate-100 pt-4">
        <span className="text-slate-500 inline-flex items-center gap-1.5"><Wallet size={15} />Trip earnings</span>
        <span className="font-bold tabular">{money(payout)}</span>
      </div>
    </div>
  )
}

/** Generates a placeholder "photo" so the flow can be completed without a camera. */
function demoPhoto() {
  const c = document.createElement('canvas')
  c.width = 640; c.height = 400
  const g = c.getContext('2d')!
  const grd = g.createLinearGradient(0, 0, 640, 400)
  grd.addColorStop(0, '#8b5e3c'); grd.addColorStop(1, '#5a3b25')
  g.fillStyle = grd; g.fillRect(0, 0, 640, 400)
  g.fillStyle = '#d6b58c'; g.fillRect(240, 210, 160, 120)
  g.fillStyle = '#06C167'; g.fillRect(240, 250, 160, 18)
  g.fillStyle = '#fff'; g.font = 'bold 22px Inter, sans-serif'; g.fillText('Delivered · ' + new Date().toLocaleTimeString(), 20, 380)
  return c.toDataURL('image/jpeg', 0.8)
}

function EarningsWidget() {
  const { state } = useStore()
  const [hover, setHover] = useState<number | null>(null)
  const week = WEEK.map((w, i) => (i === 6 ? { ...w, v: state.courier.earningsToday } : w))
  const max = Math.max(...week.map((w) => w.v))
  const total = week.reduce((s, w) => s + w.v, 0)
  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Trips', value: String(state.courier.tripsToday), icon: TrendingUp },
          { label: 'Acceptance', value: '94%', icon: Check },
          { label: 'Rating', value: ME_COURIER.rating.toFixed(2), icon: Flame },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            <div className="text-lg font-extrabold tabular">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="flex items-baseline justify-between">
          <div className="font-bold">This week</div>
          <div className="text-sm text-slate-500">Total <b className="text-black tabular">{money(total)}</b></div>
        </div>
        <div className="relative mt-4 h-32 flex items-end gap-[2px] border-b border-slate-200" onMouseLeave={() => setHover(null)}>
          {week.map((w, i) => (
            <div key={w.d} className="flex-1 h-full flex items-end relative" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              <div className={cn('w-full mx-auto max-w-[28px] rounded-t transition-colors', i === 6 ? 'bg-brand' : hover === i ? 'bg-slate-700' : 'bg-slate-300')}
                style={{ height: `${Math.max(2, (w.v / max) * 100)}%` }} />
              {hover === i && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-semibold rounded-md px-2 py-1 whitespace-nowrap z-10">{w.d} · {money(w.v)}</div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-[2px] mt-1.5">{week.map((w, i) => <span key={w.d} className={cn('flex-1 text-center text-[11px]', i === 6 ? 'font-bold text-black' : 'text-slate-500')}>{i === 6 ? 'Today' : w.d}</span>)}</div>
      </div>
    </div>
  )
}
