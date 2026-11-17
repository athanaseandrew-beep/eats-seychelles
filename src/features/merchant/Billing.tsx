import { CalendarClock, Check, CreditCard, Landmark, Loader2, Receipt, ShieldCheck, Smartphone, Truck } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../components/ui/primitives'
import { useNow } from '../../hooks'
import { createPayment, daysLeft, nextPeriodStart, PAYMENT_METHODS, storeStatement, subscriptionState } from '../../lib/billing'
import { cn, money, shortDate } from '../../lib/format'
import { useStore } from '../../store/AppStore'
import type { PaymentMethod } from '../../types'

const METHOD_ICON = { card: CreditCard, mobile_banking: Smartphone, bank_transfer: Landmark } as const

/** Merchant billing: monthly listing plan, payments, and per-trip commission statement. */
export function Billing({ restaurantId }: { restaurantId: string }) {
  const { state, dispatch } = useStore()
  const now = useNow(60_000)
  const r = state.restaurants.find((x) => x.id === restaurantId)!
  const sub = r.subscription
  const st = subscriptionState(sub, now)
  const fee = state.feeConfig.subscriptionFee
  const statement = storeStatement(state.orders, r, state.feeConfig)
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)

  const pay = () => {
    setPaying(true)
    // Demo: a real integration confirms the payment with the gateway on the server first.
    setTimeout(() => {
      dispatch({ type: 'subscription/pay', restaurantId, payment: createPayment(fee, method, nextPeriodStart(sub, Date.now())) })
      setPaying(false); setPaid(true)
      setTimeout(() => setPaid(false), 4000)
    }, 1000)
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-5 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
      {/* min-w-0 lets the payment table scroll inside its card instead of widening the page on phones */}
      <div className="space-y-4 min-w-0">
        {/* Plan status */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listing plan</div>
              <div className="text-2xl font-extrabold mt-1">{money(sub?.monthlyFee ?? fee)} <span className="text-base font-semibold text-slate-500">/ 30 days</span></div>
            </div>
            <Badge tone={st === 'active' ? 'green' : st === 'due_soon' ? 'amber' : st === 'overdue' ? 'red' : 'slate'} className="h-7 px-3">
              {st === 'active' ? 'Active' : st === 'due_soon' ? 'Due soon' : st === 'overdue' ? 'Overdue' : 'Not started'}
            </Badge>
          </div>
          {sub ? (
            <div className={cn('mt-4 rounded-xl p-3 text-sm flex items-center gap-2', st === 'overdue' ? 'bg-red-50 text-red-800' : st === 'due_soon' ? 'bg-amber-50 text-amber-900' : 'bg-slate-50')}>
              <CalendarClock size={18} className="shrink-0" />
              {st === 'overdue'
                ? <span>Your listing expired on <b>{shortDate(sub.paidUntil)}</b> ({-daysLeft(sub, now)} days ago). Pay now to stay visible to customers.</span>
                : <span>Paid until <b>{shortDate(sub.paidUntil)}</b> · {daysLeft(sub, now)} days left. Paying early adds 30 days to the end of your plan.</span>}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">This store has no plan yet. Your first payment starts a 30-day listing.</p>
          )}
        </div>

        {/* Per-trip commission statement */}
        <div className="card p-5">
          <div className="font-bold flex items-center gap-2"><Truck size={18} />Sales & commission</div>
          <div className="text-xs text-slate-500">Delivered orders in this session</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <Stat label="Delivered orders" value={String(statement.delivered)} />
            <Stat label="Food sales" value={money(statement.sales)} />
            <Stat label={`Trip fees (${money(state.feeConfig.perTripCommission)} × ${statement.trips})`} value={`− ${money(statement.tripCommission)}`} />
            <Stat label={`Commission (${state.feeConfig.commission[r.tier]}%)`} value={`− ${money(statement.percentCommission)}`} />
          </div>
          <div className="mt-3 rounded-xl bg-emerald-50 text-emerald-900 p-3 flex justify-between font-semibold">
            <span>Your payout</span><span className="tabular">{money(statement.payout)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{money(state.feeConfig.perTripCommission)} is deducted for every delivered trip. Pickup orders have no trip fee.</p>
        </div>

        {/* Payment history */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 font-bold flex items-center gap-2"><Receipt size={18} />Payment history</div>
          {sub?.payments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr>{['Paid', 'Period', 'Method', 'Reference', 'Amount'].map((h) => <th key={h} className="text-left font-semibold px-5 py-2.5">{h}</th>)}</tr></thead>
                <tbody>
                  {sub.payments.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="px-5 py-3">{shortDate(p.at)}</td>
                      <td className="px-5 py-3 text-slate-600">{p.period}</td>
                      <td className="px-5 py-3">{PAYMENT_METHODS.find((m) => m.key === p.method)?.label}</td>
                      <td className="px-5 py-3 font-mono text-xs">{p.reference}</td>
                      <td className="px-5 py-3 tabular font-semibold">{money(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="px-5 pb-5 text-sm text-slate-500">No payments yet.</p>}
        </div>
      </div>

      {/* Pay */}
      <div className="card p-5 h-fit lg:sticky lg:top-40">
        <div className="font-bold">{st === 'overdue' || st === 'none' ? 'Pay listing fee' : 'Renew early'}</div>
        <div className="text-sm text-slate-500">30 days · {sub ? `from ${shortDate(nextPeriodStart(sub, now))}` : 'starts today'}</div>
        <div className="space-y-2 mt-4" role="radiogroup" aria-label="Payment method">
          {PAYMENT_METHODS.map((m) => {
            const Icon = METHOD_ICON[m.key]
            return (
              <button key={m.key} type="button" role="radio" aria-checked={method === m.key} onClick={() => setMethod(m.key)}
                className={cn('w-full h-12 px-3.5 rounded-xl border-2 flex items-center gap-3 text-sm font-semibold transition', method === m.key ? 'border-black' : 'border-slate-200')}>
                <Icon size={18} /><span className="flex-1 text-left">{m.label}</span>{method === m.key && <Check size={16} />}
              </button>
            )
          })}
        </div>
        <button className="btn-brand w-full mt-4" onClick={pay} disabled={paying}>
          {paying ? <><Loader2 size={18} className="animate-spin" />Processing…</> : `Pay ${money(fee)}`}
        </button>
        {paid && <p className="mt-3 text-sm text-emerald-700 font-semibold flex items-center gap-1.5" role="status"><Check size={16} />Payment received — thank you!</p>}
        <p className="mt-3 text-xs text-slate-500 flex gap-1.5"><ShieldCheck size={14} className="shrink-0 mt-px" />Demo mode: no money is taken.</p>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 min-w-0">
      <div className="text-[11px] text-slate-500 leading-tight">{label}</div>
      <div className="font-bold tabular mt-1 truncate">{value}</div>
    </div>
  )
}
