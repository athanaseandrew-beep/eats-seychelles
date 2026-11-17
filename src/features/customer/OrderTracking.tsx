import { ArrowLeft, Bike, Check, ChefHat, ChevronDown, MessageCircle, Phone, PhoneOff, Receipt, Send, Star, Store, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CityMap, DEFAULT_ROUTE, pointAlong, type Pt } from '../../components/ui/CityMap'
import { Drawer } from '../../components/ui/Drawer'
import { Modal } from '../../components/ui/Modal'
import { EmptyState, Toggle } from '../../components/ui/primitives'
import { COURIERS } from '../../data/mock'
import { useNow } from '../../hooks'
import { clockTime, cn, mmss, money } from '../../lib/format'
import { newMessage, useStore } from '../../store/AppStore'
import type { Order, OrderStatus } from '../../types'

/** Customer-facing stages (merchant "ready" is folded into Preparing). */
const STAGES: { key: OrderStatus; label: string; sub: string; icon: typeof Check }[] = [
  { key: 'placed', label: 'Order placed', sub: 'Waiting for the restaurant to confirm', icon: Receipt },
  { key: 'preparing', label: 'Preparing', sub: 'The kitchen is working on your order', icon: ChefHat },
  { key: 'courier_at_store', label: 'Courier arrived at store', sub: 'Your courier is picking up your order', icon: Store },
  { key: 'on_the_way', label: 'On the way', sub: 'Heading to you now', icon: Bike },
  { key: 'delivered', label: 'Delivered', sub: 'Enjoy your meal!', icon: Check },
]
const stageIndex = (s: OrderStatus) => ({ placed: 0, preparing: 1, ready: 1, courier_at_store: 2, on_the_way: 3, delivered: 4, cancelled: -1 })[s]

/** Demo auto-advance timings (ms spent in each status). */
const SIM_MS: Partial<Record<OrderStatus, number>> = { placed: 6000, preparing: 10000, ready: 5000, courier_at_store: 6000, on_the_way: 30000 }
const APPROACH: Pt[] = [[20, 40], [140, 40], [140, 150], [88, 150], [88, 214]]

export function useCourierPosition(order: Order | undefined, now: number) {
  return useMemo(() => {
    if (!order) return { pos: undefined as Pt | undefined, angle: 0, progress: 0 }
    const s = order.status
    if (s === 'placed' || s === 'cancelled') return { pos: undefined, angle: 0, progress: 0 }
    if (s === 'preparing' || s === 'ready') {
      const t = Math.min(1, (now - (order.acceptedAt ?? now)) / 15000)
      const { p, angle } = pointAlong(APPROACH, t * 0.92)
      return { pos: p, angle, progress: 0 }
    }
    if (s === 'courier_at_store') return { pos: DEFAULT_ROUTE[0], angle: -90, progress: 0 }
    if (s === 'on_the_way') {
      const t = Math.min(0.97, (now - (order.timeline.on_the_way ?? now)) / (SIM_MS.on_the_way ?? 30000))
      const { p, angle } = pointAlong(DEFAULT_ROUTE, t)
      return { pos: p, angle, progress: t }
    }
    return { pos: DEFAULT_ROUTE[DEFAULT_ROUTE.length - 1], angle: 0, progress: 1 }
  }, [order, now])
}

function remainingMinutes(o: Order, progress: number, now: number) {
  const travel = 12
  switch (o.status) {
    case 'placed': return o.prepMinutes + travel + 2
    case 'preparing': return Math.max(3, o.prepMinutes - Math.floor((now - (o.acceptedAt ?? now)) / 60000)) + travel
    case 'ready': return travel + 3
    case 'courier_at_store': return travel
    case 'on_the_way': return Math.max(1, Math.ceil(travel * (1 - progress)))
    default: return 0
  }
}

export function OrderTracking() {
  const { orderId = '' } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useStore()
  const order = state.orders.find((o) => o.id === orderId)
  const now = useNow(500)
  const [auto, setAuto] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const { pos, angle, progress } = useCourierPosition(order, now)

  // Demo auto-advance (the merchant & courier views drive the same order when this is off)
  useEffect(() => {
    if (!auto || !order) return
    const ms = SIM_MS[order.status]
    if (!ms) return
    const since = order.timeline[order.status] ?? order.placedAt
    if (now - since >= ms) dispatch({ type: 'order/advance', id: order.id })
  }, [auto, order, now, dispatch])

  if (!order) return <EmptyState icon="🧾" title="Order not found" action={<Link to="/" className="btn-primary">Back home</Link>} />

  const idx = stageIndex(order.status)
  const mins = remainingMinutes(order, progress, now)
  const courier = COURIERS.find((c) => c.id === order.courierId)
  const done = order.status === 'delivered'
  const cancelled = order.status === 'cancelled'
  const headline = cancelled ? 'Order cancelled' : done ? 'Order delivered' : order.status === 'placed' ? 'Confirming your order…' : `Arriving in ${mins} min`

  return (
    <div className="lg:h-[calc(100vh-44px)] lg:flex bg-white">
      {/* ── Map ── */}
      <div className="relative h-[42vh] lg:h-auto lg:flex-1 bg-slate-100">
        <CityMap className="absolute inset-0" courierAt={pos} courierAngle={angle} routeProgress={progress} storeEmoji={order.restaurantEmoji} showRoute={order.mode === 'delivery'} />
        <button onClick={() => navigate('/')} className="absolute top-3 left-3 icon-btn bg-white shadow-lg" aria-label="Back"><ArrowLeft size={20} /></button>
        <div className="absolute top-3 right-3 bg-white/95 rounded-full shadow-lg pl-3 pr-2 h-10 flex items-center gap-2 text-xs font-semibold">
          Demo auto-advance <Toggle size="sm" checked={auto} onChange={setAuto} />
        </div>
        {pos && !done && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:left-4 lg:translate-x-0 bg-black text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" /> Live courier location
          </div>
        )}
      </div>

      {/* ── Panel ── */}
      <div className="relative -mt-5 lg:mt-0 rounded-t-3xl lg:rounded-none bg-white lg:w-[440px] lg:border-l border-slate-200 lg:overflow-y-auto pb-10">
        <div className="lg:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-300" />
        <div className="p-5">
          <div className="text-sm text-slate-500 font-medium">{order.restaurantName} · #{order.id}</div>
          <h1 className="text-[28px] font-extrabold tracking-tight mt-0.5">{headline}</h1>
          {!done && !cancelled && order.status !== 'placed' && (
            <div className="text-slate-600 text-sm mt-0.5">Estimated arrival <b>{clockTime(now + mins * 60000)}</b>{order.speed === 'priority' && ' · ⚡ Priority'}</div>
          )}
          {order.status === 'placed' && <div className="text-slate-600 text-sm mt-0.5">Restaurant has <b className="tabular">{mmss(order.acceptDeadline - now)}</b> to accept</div>}
          {cancelled && <div className="text-red-600 text-sm mt-1">{order.rejectReason ?? 'The restaurant couldn’t take your order.'} You haven’t been charged.</div>}

          {/* Segmented progress */}
          {!cancelled && (
            <div className="grid grid-cols-5 gap-1.5 mt-4">
              {STAGES.map((s, i) => (
                <div key={s.key} className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className={cn('h-full bg-brand transition-all duration-700', i < idx ? 'w-full' : i === idx ? (done ? 'w-full' : 'w-1/2 animate-pulse') : 'w-0')} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Courier card */}
        {courier && order.mode === 'delivery' && !cancelled && (
          <div className="mx-5 card p-4 flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white grid place-items-center font-bold">{courier.name[0]}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{courier.name} <span className="text-sm font-normal text-slate-500 inline-flex items-center gap-0.5">· <Star size={12} className="fill-current" />{courier.rating}</span></div>
              <div className="text-sm text-slate-500 truncate">{courier.vehicle} · {courier.plate}</div>
            </div>
            {!done && <>
              <button onClick={() => setChatOpen(true)} className="icon-btn bg-slate-100 relative" aria-label="Chat"><MessageCircle size={18} />{(state.chats[order.id]?.length ?? 0) > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand" />}</button>
              <button onClick={() => setCallOpen(true)} className="icon-btn bg-slate-100" aria-label="Call"><Phone size={18} /></button>
            </>}
          </div>
        )}

        {/* Timeline */}
        {!cancelled && (
          <ol className="px-5 mt-5">
            {STAGES.map((s, i) => {
              const reached = i <= idx
              const current = i === idx && !done
              const ts = order.timeline[s.key] ?? (s.key === 'preparing' ? order.timeline.ready : undefined)
              const Icon = s.icon
              return (
                <li key={s.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={cn('w-8 h-8 rounded-full grid place-items-center transition', reached ? 'bg-black text-white' : 'bg-slate-100 text-slate-400', current && 'ring-4 ring-brand/30 bg-brand')}><Icon size={15} /></span>
                    {i < STAGES.length - 1 && <span className={cn('w-0.5 flex-1 min-h-[22px] my-1', i < idx ? 'bg-black' : 'bg-slate-200')} />}
                  </div>
                  <div className="pb-4 pt-1 flex-1">
                    <div className={cn('font-semibold text-sm flex justify-between', !reached && 'text-slate-400')}>{s.label}{ts && <span className="font-normal text-slate-500 tabular">{clockTime(ts)}</span>}</div>
                    {current && <div className="text-sm text-slate-500">{s.sub}</div>}
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        {done && (
          <div className="mx-5 p-5 rounded-2xl bg-slate-50 text-center">
            {order.proofPhoto && <img src={order.proofPhoto} alt="Proof of delivery" className="w-full h-40 object-cover rounded-xl mb-3" />}
            <div className="font-bold">How was your order?</div>
            <div className="flex justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}><Star size={32} className={cn(n <= rating ? 'fill-black text-black' : 'text-slate-300')} /></button>)}
            </div>
            {rating > 0 && <div className="text-sm text-emerald-700 mt-2 font-medium">Thanks for the feedback!</div>}
          </div>
        )}

        {/* Order details */}
        <div className="mx-5 mt-4 border-t border-slate-100 pt-4">
          <button onClick={() => setDetailsOpen(!detailsOpen)} className="w-full flex items-center justify-between font-semibold">
            Order details <ChevronDown size={18} className={cn('transition', detailsOpen && 'rotate-180')} />
          </button>
          {detailsOpen && (
            <div className="mt-3 text-sm space-y-2 animate-fade-in">
              {order.lines.map((l) => <div key={l.id} className="flex justify-between"><span>{l.quantity}× {l.name}{l.selectionLabels.length > 0 && <span className="text-slate-500"> · {l.selectionLabels.join(', ')}</span>}</span><span className="tabular">{money(l.unitPrice * l.quantity)}</span></div>)}
              <div className="border-t border-slate-100 pt-2 flex justify-between font-semibold"><span>Total charged</span><span className="tabular">{money(order.fees.total)}</span></div>
              <div className="text-slate-500">{order.mode === 'delivery' ? `${order.dropoff === 'door' ? 'Leave at door' : 'Meet outside'} · ${order.address}` : 'Pickup'}</div>
            </div>
          )}
        </div>
      </div>

      {courier && <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} orderId={order.id} courierName={courier.name} />}
      {courier && <CallModal open={callOpen} onClose={() => setCallOpen(false)} name={courier.name} />}
    </div>
  )
}

const QUICK = ['Thanks!', 'Please leave it at the door', 'I’m coming down now', 'Call me when you arrive']
const AUTO_REPLY = ['On my way 👍', 'Got it, thanks!', 'Be there in a few minutes.', 'No problem!']

function ChatDrawer({ open, onClose, orderId, courierName }: { open: boolean; onClose: () => void; orderId: string; courierName: string }) {
  const { state, dispatch } = useStore()
  const [text, setText] = useState('')
  const msgs = state.chats[orderId] ?? []
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length, open])

  const send = (t: string) => {
    if (!t.trim()) return
    dispatch({ type: 'chat/send', orderId, message: newMessage('customer', t.trim()) })
    setText('')
    setTimeout(() => dispatch({ type: 'chat/send', orderId, message: newMessage('courier', AUTO_REPLY[Math.floor(Math.random() * AUTO_REPLY.length)]) }), 1400)
  }

  return (
    <Drawer open={open} onClose={onClose} width="md:w-[400px]">
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100">
        <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        <div className="flex-1"><div className="font-bold">{courierName}</div><div className="text-xs text-slate-500">Your courier · messages are monitored for safety</div></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
        {msgs.length === 0 && <div className="text-center text-sm text-slate-500 py-10">Send a message to your courier.</div>}
        {msgs.map((m) => (
          <div key={m.id} className={cn('flex', m.from === 'customer' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[78%] px-3.5 py-2 rounded-2xl text-sm', m.from === 'customer' ? 'bg-black text-white rounded-br-md' : 'bg-white border border-slate-200 rounded-bl-md')}>
              {m.text}<div className={cn('text-[10px] mt-0.5', m.from === 'customer' ? 'text-slate-400' : 'text-slate-400')}>{clockTime(m.at)}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-slate-200 pb-safe">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-2">
          {QUICK.map((q) => <button key={q} onClick={() => send(q)} className="pill-off shrink-0 h-8 text-xs">{q}</button>)}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(text) }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" className="input flex-1 rounded-full" />
          <button className="w-11 h-11 rounded-full bg-black text-white grid place-items-center disabled:opacity-30" disabled={!text.trim()} aria-label="Send"><Send size={18} /></button>
        </form>
      </div>
    </Drawer>
  )
}

function CallModal({ open, onClose, name }: { open: boolean; onClose: () => void; name: string }) {
  const [start, setStart] = useState(0)
  const now = useNow(1000)
  useEffect(() => { if (open) setStart(Date.now()) }, [open])
  const elapsed = now - start
  return (
    <Modal open={open} onClose={onClose} size="sm" hideClose>
      <div className="text-center py-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white grid place-items-center text-2xl font-bold">{name[0]}</div>
        <div className="font-bold text-xl mt-4">{name}</div>
        <div className="text-slate-500 text-sm mt-1 tabular">{elapsed < 3000 ? 'Calling…' : mmss(elapsed - 3000)}</div>
        <div className="text-xs text-slate-400 mt-3">Your number is masked for privacy.</div>
        <button onClick={onClose} className="mt-8 w-16 h-16 rounded-full bg-red-500 text-white grid place-items-center mx-auto hover:bg-red-600" aria-label="End call"><PhoneOff size={24} /></button>
      </div>
    </Modal>
  )
}
