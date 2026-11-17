import { AlertTriangle, Bell, Bike, Check, CheckCircle2, ChefHat, Clock, DoorClosed, Flame, Minus, PackageCheck, Plus, UserRound, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Badge, CountdownRing, EmptyState, Segmented } from '../../components/ui/primitives'
import { playAlert, useInterval, useNow } from '../../hooks'
import { clockTime, cn, mmss } from '../../lib/format'
import { useStore } from '../../store/AppStore'
import type { Order } from '../../types'

type Col = 'new' | 'prep' | 'ready'
const REJECT_REASONS = ['Item(s) unavailable', 'Kitchen too busy', 'Closing soon', 'Can’t fulfil special instructions']
const ACCEPT_WINDOW = 90_000

export function KDSBoard({ restaurantId, sound }: { restaurantId: string; sound: boolean }) {
  const { state, dispatch } = useStore()
  const now = useNow(1000)
  const [mobileCol, setMobileCol] = useState<Col>('new')
  const [rejecting, setRejecting] = useState<Order | null>(null)
  const r = state.restaurants.find((x) => x.id === restaurantId)!
  const orders = state.orders.filter((o) => o.restaurantId === restaurantId)
  const cols: Record<Col, Order[]> = {
    new: orders.filter((o) => o.status === 'placed').sort((a, b) => a.placedAt - b.placedAt),
    prep: orders.filter((o) => o.status === 'preparing').sort((a, b) => (a.acceptedAt ?? 0) - (b.acceptedAt ?? 0)),
    ready: orders.filter((o) => o.status === 'ready' || o.status === 'courier_at_store'),
  }

  // Auto-reject orders that weren't accepted in time
  useEffect(() => {
    cols.new.forEach((o) => {
      if (now > o.acceptDeadline) dispatch({ type: 'order/status', id: o.id, status: 'cancelled', patch: { rejectReason: 'The restaurant didn’t confirm in time.' } })
    })
  }, [now]) // eslint-disable-line react-hooks/exhaustive-deps

  // Audio alert: once on new arrival, then every 8s while orders are waiting
  const prevCount = useRef(cols.new.length)
  useEffect(() => {
    if (sound && cols.new.length > prevCount.current) playAlert()
    prevCount.current = cols.new.length
  }, [cols.new.length, sound])
  useInterval(() => { if (sound && cols.new.length) playAlert() }, 8000)

  const accept = (o: Order, prep: number) => dispatch({ type: 'order/status', id: o.id, status: 'preparing', patch: { prepMinutes: prep } })

  const columns: { key: Col; title: string; icon: typeof Bell; tone: string }[] = [
    { key: 'new', title: 'New incoming', icon: Bell, tone: 'bg-amber-500' },
    { key: 'prep', title: 'In preparation', icon: ChefHat, tone: 'bg-sky-500' },
    { key: 'ready', title: 'Ready for pickup', icon: PackageCheck, tone: 'bg-violet-500' },
  ]

  return (
    <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4">
      {cols.new.length > 0 && (
        <div className="mb-4 rounded-2xl bg-amber-400 text-black px-4 py-3 flex items-center gap-3 font-semibold animate-pulse md:animate-none">
          <Bell size={18} className="animate-bounce" /> {cols.new.length} new order{cols.new.length > 1 ? 's' : ''} waiting for confirmation
          {!sound && <span className="ml-auto text-xs font-medium hidden sm:inline">Tip: turn on sound alerts in the header</span>}
        </div>
      )}

      <Segmented className="md:hidden w-full mb-3" value={mobileCol} onChange={setMobileCol}
        options={columns.map((c) => ({ value: c.key, label: <>{c.title.split(' ')[0]} <span className="ml-1 text-xs opacity-70">{cols[c.key].length}</span></> }))} />

      <div className="grid md:grid-cols-3 gap-4 items-start">
        {columns.map((c) => (
          <section key={c.key} className={cn('md:block bg-slate-100/70 rounded-3xl p-3 min-h-[60vh]', mobileCol === c.key ? 'block' : 'hidden')}>
            <div className="flex items-center gap-2 px-1 pb-3">
              <span className={cn('w-2.5 h-2.5 rounded-full', c.tone)} />
              <h2 className="font-bold">{c.title}</h2>
              <span className="ml-auto text-sm font-bold bg-white rounded-full w-7 h-7 grid place-items-center">{cols[c.key].length}</span>
            </div>
            <div className="space-y-3">
              {cols[c.key].length === 0 && <EmptyState icon={<c.icon />} title={c.key === 'new' ? 'No new orders' : c.key === 'prep' ? 'Nothing cooking' : 'Nothing waiting'} body={c.key === 'new' ? 'Use “Simulate order” or place one from the Customer view.' : undefined} />}
              {c.key === 'new' && cols.new.map((o) => <NewTicket key={o.id} o={o} now={now} busy={r.busyMode} onAccept={accept} onReject={() => setRejecting(o)} />)}
              {c.key === 'prep' && cols.prep.map((o) => <PrepTicket key={o.id} o={o} now={now} busy={r.busyMode} />)}
              {c.key === 'ready' && cols.ready.map((o) => <ReadyTicket key={o.id} o={o} now={now} />)}
            </div>
          </section>
        ))}
      </div>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={`Reject #${rejecting?.id}?`} size="sm">
        <p className="text-sm text-slate-600 mb-3">The customer will be notified and refunded. Frequent rejections affect your store ranking.</p>
        <div className="space-y-2">
          {REJECT_REASONS.map((reason) => (
            <button key={reason} className="w-full h-12 px-4 rounded-xl border border-slate-200 text-left font-medium hover:border-red-400 hover:bg-red-50"
              onClick={() => { dispatch({ type: 'order/status', id: rejecting!.id, status: 'cancelled', patch: { rejectReason: `Restaurant rejected: ${reason}.` } }); setRejecting(null) }}>
              {reason}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function TicketHeader({ o, now }: { o: Order; now: number }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="font-extrabold text-lg leading-tight">#{o.id.replace('EAT-', '')}</div>
        <div className="text-sm text-slate-600">{o.customerName} · {o.lines.reduce((n, l) => n + l.quantity, 0)} items</div>
      </div>
      <div className="text-right">
        <div className="text-xs text-slate-500">{clockTime(o.placedAt)}</div>
        <div className="text-xs font-semibold tabular">{mmss(now - o.placedAt)} ago</div>
      </div>
    </div>
  )
}

function Items({ o }: { o: Order }) {
  return (
    <ul className="mt-3 space-y-2 text-sm">
      {o.lines.map((l) => (
        <li key={l.id} className="flex gap-2">
          <span className="font-extrabold w-6 shrink-0">{l.quantity}×</span>
          <div className="min-w-0">
            <div className="font-semibold">{l.name}</div>
            {l.selectionLabels.length > 0 && <div className="text-slate-500">{l.selectionLabels.join(' · ')}</div>}
            {l.instructions && <div className="text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 mt-0.5 inline-flex items-center gap-1"><AlertTriangle size={12} />{l.instructions}</div>}
          </div>
        </li>
      ))}
    </ul>
  )
}

function Tags({ o }: { o: Order }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {o.speed === 'priority' && <Badge tone="black"><Zap size={11} />Priority</Badge>}
      {o.mode === 'pickup' && <Badge tone="blue">Customer pickup</Badge>}
      <Badge>{o.dropoff === 'door' ? <><DoorClosed size={11} />Leave at door</> : <><UserRound size={11} />Meet outside</>}</Badge>
      {o.customerName === 'You' && <Badge tone="green">From Customer view</Badge>}
    </div>
  )
}

function NewTicket({ o, now, busy, onAccept, onReject }: { o: Order; now: number; busy: boolean; onAccept: (o: Order, prep: number) => void; onReject: () => void }) {
  const base = o.prepMinutes + (busy ? 15 : 0)
  const [prep, setPrep] = useState(base)
  useEffect(() => setPrep(o.prepMinutes + (busy ? 15 : 0)), [busy, o.prepMinutes])
  const remaining = o.acceptDeadline - now
  return (
    <article className="bg-white rounded-2xl p-4 border-2 border-amber-400 animate-alert-ring">
      <div className="flex gap-3">
        <div className="flex-1 min-w-0"><TicketHeader o={o} now={now} /></div>
        <CountdownRing remainingMs={remaining} totalMs={ACCEPT_WINDOW} label={mmss(remaining)} size={56} />
      </div>
      <Items o={o} />
      <Tags o={o} />
      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><Clock size={12} />Prep time {busy && <span className="text-orange-600 inline-flex items-center gap-0.5"><Flame size={11} />busy +15</span>}</div>
        <div className="grid grid-cols-4 gap-1.5">
          {[base - 5, base, base + 5, base + 10].filter((m) => m > 0).map((m) => (
            <button key={m} onClick={() => setPrep(m)} className={cn('h-9 rounded-lg text-sm font-semibold', prep === m ? 'bg-black text-white' : 'bg-slate-100 hover:bg-slate-200')}>{m}m</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-2 mt-3">
        <button onClick={onReject} className="btn-danger h-12 px-4" aria-label="Reject"><X size={18} /></button>
        <button onClick={() => onAccept(o, prep)} className="btn-brand"><Check size={18} />Accept · {prep} min</button>
      </div>
    </article>
  )
}

function PrepTicket({ o, now, busy }: { o: Order; now: number; busy: boolean }) {
  const { dispatch } = useStore()
  const elapsed = now - (o.acceptedAt ?? now)
  const total = o.prepMinutes * 60000
  const pct = Math.min(1, elapsed / total)
  const overdue = elapsed > total
  const adjust = (d: number) => dispatch({ type: 'order/patch', id: o.id, patch: { prepMinutes: Math.max(1, o.prepMinutes + d) } })
  return (
    <article className={cn('bg-white rounded-2xl p-4 border', overdue ? 'border-red-400' : 'border-slate-200')}>
      <TicketHeader o={o} now={now} />
      <div className="mt-3">
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className={overdue ? 'text-red-600' : 'text-slate-500'}>{overdue ? `Overdue by ${mmss(elapsed - total)}` : `${mmss(total - elapsed)} left`}</span>
          <span className="text-slate-500">{o.prepMinutes} min target</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className={cn('h-full rounded-full transition-all', overdue ? 'bg-red-500' : pct > 0.75 ? 'bg-amber-500' : 'bg-sky-500')} style={{ width: `${pct * 100}%` }} /></div>
      </div>
      <Items o={o} />
      <Tags o={o} />
      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
        <Bike size={15} />
        {o.courierName ? <span><b>{o.courierName}</b> assigned{o.courierEtaToStore ? ` · ~${o.courierEtaToStore} min away` : ''}</span> : <span>Finding a courier…</span>}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <div className="inline-flex items-center bg-slate-100 rounded-full">
          <button onClick={() => adjust(-5)} className="w-10 h-10 grid place-items-center rounded-full hover:bg-slate-200" aria-label="Less time"><Minus size={16} /></button>
          <span className="text-xs font-bold w-12 text-center">{o.prepMinutes}m</span>
          <button onClick={() => adjust(5)} className="w-10 h-10 grid place-items-center rounded-full hover:bg-slate-200" aria-label="More time"><Plus size={16} /></button>
        </div>
        {busy && <span className="text-xs text-orange-600 font-semibold">Busy</span>}
        <button onClick={() => dispatch({ type: 'order/status', id: o.id, status: 'ready' })} className="btn-primary h-10 flex-1 text-sm"><CheckCircle2 size={16} />Mark ready</button>
      </div>
    </article>
  )
}

function ReadyTicket({ o, now }: { o: Order; now: number }) {
  const { dispatch } = useStore()
  const checkedIn = o.status === 'courier_at_store'
  const waiting = now - (o.timeline.ready ?? now)
  return (
    <article className={cn('bg-white rounded-2xl p-4 border-2', checkedIn ? 'border-brand' : 'border-slate-200')}>
      <TicketHeader o={o} now={now} />
      <div className={cn('mt-3 rounded-xl p-3 flex items-center gap-3', checkedIn ? 'bg-emerald-50' : 'bg-slate-50')}>
        <span className={cn('w-10 h-10 rounded-full grid place-items-center text-white font-bold', checkedIn ? 'bg-brand' : 'bg-slate-400')}>{o.courierName?.[0] ?? '?'}</span>
        <div className="flex-1 min-w-0 text-sm">
          <div className="font-semibold">{o.courierName ?? 'Courier pending'}</div>
          <div className={checkedIn ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
            {checkedIn ? '✓ Checked in at counter' : o.courierName ? `Arriving · ~${o.courierEtaToStore ?? 4} min` : 'Searching nearby couriers'}
          </div>
        </div>
        <span className="text-xs text-slate-500 tabular">waiting {mmss(waiting)}</span>
      </div>
      <Items o={o} />
      <div className="mt-4 grid gap-2">
        {checkedIn ? (
          <button onClick={() => dispatch({ type: 'order/status', id: o.id, status: 'on_the_way' })} className="btn-brand"><PackageCheck size={18} />Confirm handoff to {o.courierName?.split(' ')[0]}</button>
        ) : (
          <button onClick={() => dispatch({ type: 'order/status', id: o.id, status: 'courier_at_store' })} className="btn-secondary h-11 text-sm">Simulate courier check-in</button>
        )}
      </div>
    </article>
  )
}
