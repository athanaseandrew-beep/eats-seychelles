import { ArrowLeft, Calendar, Check, ChevronRight, CreditCard, DoorClosed, Info, MapPin, Minus, Plus, ShoppingBag, Tag, Trash2, UserRound, X, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState, Segmented } from '../../components/ui/primitives'
import { cn, LOCALE, money, orderId } from '../../lib/format'
import { computeFees, validatePromo, type PromoResult } from '../../lib/pricing'
import { selectRestaurant, useStore } from '../../store/AppStore'
import type { DeliverySpeed, DropoffOption, Order } from '../../types'

const TIP_PCTS = [0, 10, 15, 20]
const SLOTS = (() => {
  const out: string[] = []
  const d = new Date()
  d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30 + 60, 0, 0)
  for (let i = 0; i < 8; i++) {
    const a = new Date(d.getTime() + i * 30 * 60000)
    const b = new Date(a.getTime() + 30 * 60000)
    const f = (x: Date) => x.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' })
    out.push(`Today ${f(a)} – ${f(b)}`)
  }
  return out
})()

export function CartDrawer() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
  const [dropoff, setDropoff] = useState<DropoffOption>('door')
  const [instructions, setInstructions] = useState('')
  const [speed, setSpeed] = useState<DeliverySpeed>('standard')
  const [slot, setSlot] = useState(SLOTS[0])
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<PromoResult | null>(null)
  const [tipPct, setTipPct] = useState(15)
  const [customTip, setCustomTip] = useState('')
  const [payment, setPayment] = useState<'card' | 'mastercard' | 'cash'>('card')
  const [placing, setPlacing] = useState(false)

  const r = selectRestaurant(state, state.cart.restaurantId)
  const lines = state.cart.lines
  const close = () => { dispatch({ type: 'cart/open', open: false }); setTimeout(() => setStep('cart'), 300) }
  const delivery = state.mode === 'delivery'

  const subtotalOnly = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
  const tip = customTip !== '' ? Math.max(0, Number(customTip) || 0) : (subtotalOnly * tipPct) / 100
  const fees = useMemo(() => computeFees({
    lines, restaurant: r, config: state.feeConfig, mode: state.mode, speed, tip,
    promoCode: promo?.ok ? promo.code : undefined,
  }), [lines, r, state.feeConfig, state.mode, speed, tip, promo])

  const applyPromo = () => promoInput.trim() && setPromo(validatePromo(promoInput, fees.subtotal))

  const placeOrder = () => {
    if (!r) return
    setPlacing(true)
    setTimeout(() => {
      const now = Date.now()
      const order: Order = {
        id: orderId(), restaurantId: r.id, restaurantName: r.name, restaurantEmoji: r.emoji, customerName: 'You',
        address: `${state.address.line1}, ${state.address.line2}`, lines, fees, status: 'placed', placedAt: now,
        acceptDeadline: now + 90_000, prepMinutes: r.busyMode ? 25 : 12, dropoff, instructions, speed,
        scheduledFor: speed === 'scheduled' ? slot : undefined, mode: state.mode, timeline: { placed: now },
      }
      dispatch({ type: 'order/place', order })
      setPlacing(false)
      setStep('cart')
      setPromo(null); setPromoInput('')
      navigate(`/track/${order.id}`)
    }, 900)
  }

  return (
    <Drawer open={state.cartOpen} onClose={close}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-100 shrink-0">
        {step === 'checkout' ? (
          <button className="icon-btn" onClick={() => setStep('cart')} aria-label="Back"><ArrowLeft size={20} /></button>
        ) : <button className="icon-btn" onClick={close} aria-label="Close"><X size={20} /></button>}
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{step === 'cart' ? (r ? r.name : 'Your cart') : 'Checkout'}</div>
          {r && step === 'cart' && <div className="text-xs text-slate-500 truncate">{r.address}</div>}
        </div>
        {step === 'cart' && lines.length > 0 && <button className="btn-ghost text-sm text-red-600" onClick={() => dispatch({ type: 'cart/clear' })}>Clear</button>}
      </div>

      {lines.length === 0 ? (
        <div className="flex-1 grid place-items-center">
          <EmptyState icon={<ShoppingBag />} title="Your cart is empty" body="Add items from a store to start a new order." action={<button className="btn-primary" onClick={close}>Start shopping</button>} />
        </div>
      ) : step === 'cart' ? (
        <>
          <div className="flex-1 overflow-y-auto px-4">
            {!r?.online && <div className="mt-4 p-3 rounded-xl bg-amber-50 text-amber-900 text-sm flex gap-2"><Info size={16} className="shrink-0 mt-0.5" />{r?.name} is paused. You can’t check out until it’s back online.</div>}
            <div className="divide-y divide-slate-100">
              {lines.map((l) => (
                <div key={l.id} className="py-4 flex gap-3">
                  <span className="w-16 h-16 rounded-xl bg-slate-100 grid place-items-center text-3xl shrink-0">{l.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{l.name}</div>
                    {l.selectionLabels.length > 0 && <div className="text-sm text-slate-500">{l.selectionLabels.join(' · ')}</div>}
                    {l.instructions && <div className="text-sm text-slate-500 italic">“{l.instructions}”</div>}
                    <div className="text-sm font-semibold mt-1 tabular">{money(l.unitPrice * l.quantity)}</div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="inline-flex items-center bg-slate-100 rounded-full">
                      <button className="w-8 h-8 grid place-items-center" onClick={() => dispatch({ type: 'cart/qty', lineId: l.id, delta: -1 })} aria-label="Decrease">{l.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}</button>
                      <span className="w-5 text-center text-sm font-semibold">{l.quantity}</span>
                      <button className="w-8 h-8 grid place-items-center" onClick={() => dispatch({ type: 'cart/qty', lineId: l.id, delta: 1 })} aria-label="Increase"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {fees.subtotal < state.feeConfig.smallOrderThreshold && delivery && (
              <div className="p-3 rounded-xl bg-slate-50 text-sm text-slate-600 mb-4">Add {money(state.feeConfig.smallOrderThreshold - fees.subtotal)} more to avoid the {money(state.feeConfig.smallOrderFee)} small order fee.</div>
            )}
          </div>
          <div className="border-t border-slate-200 p-4 pb-safe shrink-0">
            <div className="flex justify-between font-semibold mb-3"><span>Subtotal</span><span className="tabular">{money(fees.subtotal)}</span></div>
            <button className="btn-primary w-full" disabled={!r?.online} onClick={() => setStep('checkout')}>Go to checkout</button>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <Segmented className="w-full" value={state.mode} onChange={(mode) => dispatch({ type: 'mode/set', mode })}
                options={[{ value: 'delivery', label: 'Delivery' }, { value: 'pickup', label: 'Pickup' }]} />
            </div>

            <Section title={delivery ? 'Delivery details' : 'Pickup from'}>
              <Row icon={<MapPin size={18} />} title={delivery ? state.address.line1 : r?.name ?? ''} sub={delivery ? state.address.line2 : r?.address} />
              {delivery && (
                <>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {([['door', 'Leave at door', DoorClosed], ['meet', 'Meet outside', UserRound]] as const).map(([v, label, Icon]) => (
                      <button key={v} onClick={() => setDropoff(v)} className={cn('h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold text-sm transition', dropoff === v ? 'border-black bg-slate-50' : 'border-slate-200')}>
                        <Icon size={16} />{label}
                      </button>
                    ))}
                  </div>
                  <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} placeholder="Instructions for courier (building, gate code, landmark)…" className="input h-auto py-3 mt-3 resize-none" />
                </>
              )}
            </Section>

            {delivery && (
              <Section title="Delivery time">
                <div className="space-y-2">
                  {([
                    ['priority', 'Priority', `${(r?.etaMin ?? 15) - 5}–${(r?.etaMax ?? 25) - 5} min · Direct to you`, money(state.feeConfig.priorityFee), Zap],
                    ['standard', 'Standard', `${r?.etaMin}–${r?.etaMax} min`, 'Free', Check],
                    ['scheduled', 'Schedule', 'Choose a time', '', Calendar],
                  ] as const).map(([v, label, sub, extra, Icon]) => (
                    <button key={v} onClick={() => setSpeed(v)} className={cn('w-full p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition', speed === v ? 'border-black' : 'border-slate-200')}>
                      <Icon size={18} className={v === 'priority' ? 'text-brand' : ''} />
                      <span className="flex-1"><span className="block font-semibold text-sm">{label}</span><span className="block text-xs text-slate-500">{sub}</span></span>
                      {extra && <span className="text-sm font-semibold">{v === 'priority' ? '+' : ''}{extra}</span>}
                    </button>
                  ))}
                  {speed === 'scheduled' && (
                    <select value={slot} onChange={(e) => setSlot(e.target.value)} className="input">
                      {SLOTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              </Section>
            )}

            <Section title="Payment">
              <div className="space-y-2">
                {([['card', 'Visa •••• 4242', CreditCard], ['mastercard', 'Mastercard •••• 8812', CreditCard], ['cash', 'Cash on delivery', CreditCard]] as const).map(([v, label, Icon]) => (
                  <button key={v} onClick={() => setPayment(v)} className={cn('w-full h-12 px-3.5 rounded-xl border-2 flex items-center gap-3 text-sm font-semibold transition', payment === v ? 'border-black' : 'border-slate-200')}>
                    <Icon size={18} /><span className="flex-1 text-left">{label}</span>{payment === v && <Check size={18} />}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Promotions">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 h-11 px-3.5 rounded-xl bg-slate-100 focus-within:ring-2 focus-within:ring-black">
                  <Tag size={16} className="text-slate-500" />
                  <input value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && applyPromo()} placeholder="Promo code" className="bg-transparent outline-none flex-1 uppercase" />
                </div>
                <button className="btn-secondary h-11" onClick={applyPromo}>Apply</button>
              </div>
              {promo && <div className={cn('text-sm mt-2 font-medium', promo.ok ? 'text-emerald-700' : 'text-red-600')}>{promo.ok ? '✓ ' : ''}{promo.message}</div>}
              <div className="flex gap-2 mt-2 flex-wrap">
                {['EATS20', 'FREEDEL', 'WELCOME50'].map((c) => <button key={c} onClick={() => { setPromoInput(c); setPromo(validatePromo(c, fees.subtotal)) }} className="text-xs font-semibold px-2.5 py-1 rounded-md border border-dashed border-slate-300 hover:border-black">{c}</button>)}
              </div>
            </Section>

            {delivery && (
              <Section title="Courier tip" hint="100% of the tip goes to your courier.">
                <div className="grid grid-cols-5 gap-2">
                  {TIP_PCTS.map((p) => (
                    <button key={p} onClick={() => { setTipPct(p); setCustomTip('') }} className={cn('h-12 rounded-xl text-sm font-semibold transition', customTip === '' && tipPct === p ? 'bg-black text-white' : 'bg-slate-100 hover:bg-slate-200')}>
                      {p === 0 ? 'None' : `${p}%`}
                    </button>
                  ))}
                  <input inputMode="decimal" value={customTip} onChange={(e) => setCustomTip(e.target.value.replace(/[^\d.]/g, ''))} placeholder="Other" className={cn('h-12 rounded-xl text-center text-sm font-semibold outline-none transition', customTip !== '' ? 'bg-black text-white placeholder:text-slate-400' : 'bg-slate-100')} />
                </div>
              </Section>
            )}

            <Section title="Order summary">
              <div className="space-y-2 text-sm">
                <FeeRow label={`Subtotal (${lines.reduce((n, l) => n + l.quantity, 0)} items)`} value={fees.subtotal} />
                {delivery && <FeeRow label="Delivery fee" value={fees.deliveryFee} free={fees.deliveryFee === 0} info="Based on distance and courier availability." />}
                <FeeRow label="Service fee" value={fees.serviceFee} info={`${state.feeConfig.serviceFeePct}% of subtotal (min ${money(state.feeConfig.serviceFeeMin)}, max ${money(state.feeConfig.serviceFeeMax)}). Helps run the platform.`} />
                {fees.smallOrderFee > 0 && <FeeRow label="Small order fee" value={fees.smallOrderFee} />}
                {fees.priorityFee > 0 && <FeeRow label="Priority delivery" value={fees.priorityFee} />}
                {fees.discount > 0 && <FeeRow label={`Promo (${promo?.code})`} value={-fees.discount} green />}
                <FeeRow label={`VAT (${state.feeConfig.taxPct}%)`} value={fees.tax} />
                {delivery && <FeeRow label="Courier tip" value={fees.tip} />}
              </div>
            </Section>
          </div>
          <div className="border-t border-slate-200 p-4 pb-safe shrink-0 bg-white">
            <div className="flex justify-between text-lg font-bold mb-3"><span>Total</span><span className="tabular">{money(fees.total)}</span></div>
            <button className="btn-brand w-full text-base" disabled={placing} onClick={placeOrder}>
              {placing ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <>Place order<ChevronRight size={18} /></>}
            </button>
          </div>
        </>
      )}
    </Drawer>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="px-4 py-4 border-t-8 border-slate-50">
      <div className="font-bold mb-0.5">{title}</div>
      {hint && <div className="text-xs text-slate-500 mb-3">{hint}</div>}
      <div className={hint ? '' : 'mt-3'}>{children}</div>
    </section>
  )
}

function Row({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-full bg-slate-100 grid place-items-center shrink-0">{icon}</span>
      <span className="min-w-0"><span className="block font-semibold truncate">{title}</span>{sub && <span className="block text-sm text-slate-500 truncate">{sub}</span>}</span>
    </div>
  )
}

function FeeRow({ label, value, info, free, green }: { label: string; value: number; info?: string; free?: boolean; green?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className="flex justify-between items-center">
        <span className="text-slate-600 inline-flex items-center gap-1">{label}{info && <button onClick={() => setOpen(!open)} aria-label="Fee info"><Info size={13} className="text-slate-400" /></button>}</span>
        <span className={cn('tabular', green && 'text-emerald-700 font-semibold', free && 'text-emerald-700 font-semibold')}>{free ? 'Free' : value < 0 ? `−${money(-value)}` : money(value)}</span>
      </div>
      {open && info && <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 mt-1">{info}</div>}
    </div>
  )
}
