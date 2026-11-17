import { Activity, AlertOctagon, Bike, Check, CheckCircle2, Clock, DollarSign, FileCheck2, FileX2, LayoutDashboard, MessageSquareWarning, Percent, RotateCcw, Save, Store, Undo2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Drawer } from '../../components/ui/Drawer'
import { Badge, EmptyState, Segmented, StatusBadge } from '../../components/ui/primitives'
import { DEFAULT_FEE_CONFIG } from '../../data/mock'
import { useInterval } from '../../hooks'
import { MARKET } from '../../config/market'
import { clockTime, CURRENCY, cn, money, moneyShort, timeAgo } from '../../lib/format'
import { useStore } from '../../store/AppStore'
import type { Dispute, DisputeStatus, FeeConfig, PartnerTier } from '../../types'
import { Logo } from '../customer/CustomerLayout'

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/onboarding', label: 'Onboarding', icon: Store },
  { to: '/admin/fees', label: 'Fees & commission', icon: Percent },
  { to: '/admin/disputes', label: 'Disputes', icon: MessageSquareWarning },
]

export function AdminDashboard() {
  const { state } = useStore()
  const pendingApps = state.applications.filter((a) => a.status === 'pending').length
  const openDisputes = state.disputes.filter((d) => d.status === 'open' || d.status === 'investigating').length
  const badge: Record<string, number> = { '/admin/onboarding': pendingApps, '/admin/disputes': openDisputes }
  return (
    <div className="min-h-[calc(100vh-44px)] bg-slate-50 lg:flex">
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200 sticky top-11 h-[calc(100vh-44px)] p-4">
        <div className="px-2 py-2 mb-4"><Logo suffix="Admin" /></div>
        <nav className="space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-semibold transition', isActive ? 'bg-black text-white' : 'text-slate-600 hover:bg-slate-100')}>
              <Icon size={17} /><span className="flex-1">{label}</span>{badge[to] ? <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[11px] grid place-items-center">{badge[to]}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-3 rounded-2xl bg-slate-50 text-xs text-slate-500">Region: <b className="text-black">{MARKET.defaultRegionLabel}</b><br />Signed in as {MARKET.opsEmail}</div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-11 z-30 bg-white border-b border-slate-200 flex overflow-x-auto scrollbar-hide px-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('shrink-0 h-12 px-3 inline-flex items-center gap-2 text-sm font-semibold border-b-2', isActive ? 'border-black' : 'border-transparent text-slate-500')}>
              <Icon size={16} />{label}{badge[to] ? <span className="w-5 h-5 rounded-full bg-brand text-white text-[11px] grid place-items-center">{badge[to]}</span> : null}
            </NavLink>
          ))}
        </div>
        <div className="max-w-[1280px] mx-auto p-4 md:p-6">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="fees" element={<Fees />} />
            <Route path="disputes" element={<Disputes />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div><h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>{sub && <p className="text-slate-500 text-sm mt-1">{sub}</p>}</div>
      {right}
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────
const HOURLY = [2.1, 1.2, 0.6, 0.3, 0.2, 0.6, 2.4, 6.8, 9.6, 8.1, 10.4, 19.2, 26.5, 22.8, 14.1, 11.6, 13.9, 21.7, 30.4, 34.8, 29.6, 20.3, 11.2, 5.4] // SCR thousands

function Overview() {
  const { state } = useStore()
  const [jitter, setJitter] = useState({ gmv: 0, couriers: 0, orders: 0 })
  useInterval(() => setJitter((j) => ({ gmv: j.gmv + Math.random() * 900, couriers: Math.round((Math.random() - 0.5) * 6), orders: Math.round((Math.random() - 0.4) * 4) })), 2500)
  const [hover, setHover] = useState<number | null>(null)
  const live = state.orders.filter((o) => !['delivered', 'cancelled'].includes(o.status))
  const liveGmv = state.orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.fees.total, 0)
  const hourNow = new Date().getHours()
  const hours = HOURLY.slice(0, hourNow + 1)
  const max = Math.max(...HOURLY)

  const kpis = [
    { label: 'GMV today', value: moneyShort(286_400 + liveGmv + jitter.gmv), delta: '+12.4%', icon: DollarSign },
    { label: 'Active orders', value: (54 + live.length + jitter.orders).toLocaleString(), delta: '+6', icon: Activity },
    { label: 'Online couriers', value: (148 + jitter.couriers + (state.courier.online ? 1 : 0)).toLocaleString(), delta: '89% utilised', icon: Bike },
    { label: 'Avg delivery time', value: '27.4 min', delta: '−1.8 min', icon: Clock },
  ]
  const byStatus = (['placed', 'preparing', 'ready', 'courier_at_store', 'on_the_way'] as const).map((s) => ({ s, n: state.orders.filter((o) => o.status === s).length }))

  return (
    <>
      <PageTitle title="Marketplace operations" sub={`Live · updated ${clockTime(Date.now())}`} right={<Badge tone="green" className="h-7 px-3"><span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />All systems normal</Badge>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">{k.label}<k.icon size={16} /></div>
            <div className="text-2xl md:text-[28px] font-extrabold tabular mt-2 truncate">{k.value}</div>
            <div className="text-xs font-semibold text-emerald-700 mt-1">{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-4 mt-4">
        <div className="card p-5">
          <div className="flex items-baseline justify-between">
            <div><div className="font-bold">GMV by hour</div><div className="text-xs text-slate-500">{CURRENCY} thousands · today</div></div>
            {hover !== null && <div className="text-sm"><b className="tabular">{hover}:00</b> · {moneyShort(HOURLY[hover] * 1000)}</div>}
          </div>
          <div className="mt-4 h-48 flex items-end gap-[2px] border-b border-slate-200" onMouseLeave={() => setHover(null)}>
            {HOURLY.map((v, i) => (
              <div key={i} className="flex-1 h-full flex items-end cursor-default" onMouseEnter={() => setHover(i)}>
                <div className={cn('w-full rounded-t-[4px] transition-colors', i > hourNow ? 'bg-slate-100' : hover === i ? 'bg-emerald-700' : i === hourNow ? 'bg-brand' : 'bg-emerald-300')}
                  style={{ height: `${(v / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-1.5"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
          <div className="text-xs text-slate-500 mt-3">So far today: <b className="text-black tabular">{moneyShort(hours.reduce((s, v) => s + v, 0) * 1000)}</b> across {hours.length} hours · peak at 19:00</div>
        </div>
        <div className="card p-5">
          <div className="font-bold mb-3">Order pipeline</div>
          <div className="space-y-3">
            {byStatus.map(({ s, n }) => (
              <div key={s} className="flex items-center gap-3">
                <span className="w-32"><StatusBadge status={s} /></span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-slate-800 rounded-full" style={{ width: `${Math.min(100, n * 25)}%` }} /></div>
                <span className="w-6 text-right font-bold tabular text-sm">{n}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500 text-xs">Stores online</div><div className="font-bold">{state.restaurants.filter((r) => r.online).length}/{state.restaurants.length}</div></div>
            <div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500 text-xs">Cancel rate</div><div className="font-bold">1.8%</div></div>
          </div>
        </div>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="px-5 py-4 font-bold flex items-center justify-between">Live orders <span className="text-xs font-medium text-slate-500">Synced from customer, merchant & courier views</span></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr>{['Order', 'Store', 'Customer', 'Courier', 'Placed', 'Total', 'Status'].map((h) => <th key={h} className="text-left font-semibold px-5 py-2.5">{h}</th>)}</tr></thead>
            <tbody>
              {state.orders.slice(0, 12).map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-semibold">{o.id}</td>
                  <td className="px-5 py-3">{o.restaurantEmoji} {o.restaurantName}</td>
                  <td className="px-5 py-3">{o.customerName}</td>
                  <td className="px-5 py-3 text-slate-600">{o.courierName ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{timeAgo(o.placedAt)}</td>
                  <td className="px-5 py-3 tabular">{money(o.fees.total)}</td>
                  <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ── Onboarding ────────────────────────────────────────────────
const DOCS: { key: keyof import('../../types').OnboardingApplication['documents']; label: string }[] = [
  { key: 'tradeLicense', label: 'Trade license' }, { key: 'foodSafety', label: 'Food safety cert.' },
  { key: 'bankDetails', label: 'Bank details' }, { key: 'menuUploaded', label: 'Menu uploaded' },
]

function Onboarding() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const apps = state.applications.filter((a) => filter === 'all' || a.status === 'pending' || a.status === 'info_requested')
  return (
    <>
      <PageTitle title="Restaurant onboarding" sub="Review applications before stores go live on the marketplace."
        right={<Segmented value={filter} onChange={setFilter} options={[{ value: 'pending', label: 'Queue' }, { value: 'all', label: 'All' }]} />} />
      {apps.length === 0 && <EmptyState icon="🎉" title="Queue is clear" body="New applications will appear here." />}
      <div className="grid md:grid-cols-2 gap-4">
        {apps.map((a) => {
          const complete = Object.values(a.documents).every(Boolean)
          return (
            <div key={a.id} className="card p-5">
              <div className="flex items-start gap-4">
                <span className="w-14 h-14 rounded-2xl bg-slate-100 grid place-items-center text-3xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg">{a.businessName}</div>
                  <div className="text-sm text-slate-500">{a.cuisine} · {a.area}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{a.owner} · submitted {timeAgo(a.submittedAt)}</div>
                </div>
                <Badge tone={a.status === 'approved' ? 'green' : a.status === 'rejected' ? 'red' : a.status === 'info_requested' ? 'amber' : 'slate'}>{a.status.replace('_', ' ')}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {DOCS.map((d) => (
                  <div key={d.key} className={cn('flex items-center gap-2 text-sm rounded-lg px-2.5 py-2', a.documents[d.key] ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700')}>
                    {a.documents[d.key] ? <FileCheck2 size={15} /> : <FileX2 size={15} />}{d.label}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-sm"><span className="text-slate-500">Partner tier</span><Badge tone="purple" className="capitalize">{a.tier} · {state.feeConfig.commission[a.tier]}% commission</Badge></div>
              {(a.status === 'pending' || a.status === 'info_requested') && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button className="btn-danger h-10 text-sm" onClick={() => dispatch({ type: 'application/decide', id: a.id, status: 'rejected' })}><X size={15} />Reject</button>
                  <button className="btn-secondary h-10 text-sm" onClick={() => dispatch({ type: 'application/decide', id: a.id, status: 'info_requested' })}>Request info</button>
                  <button className="btn h-10 text-sm bg-black text-white hover:bg-slate-800" disabled={!complete} title={complete ? '' : 'All documents required'} onClick={() => dispatch({ type: 'application/decide', id: a.id, status: 'approved' })}><Check size={15} />Approve</button>
                </div>
              )}
              {a.status === 'approved' && <div className="mt-4 text-sm text-emerald-700 font-semibold flex items-center gap-1.5"><CheckCircle2 size={16} />Live — now visible in the Customer feed</div>}
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Fees ──────────────────────────────────────────────────────
function Fees() {
  const { state, dispatch } = useStore()
  const [draft, setDraft] = useState<FeeConfig>(state.feeConfig)
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.feeConfig)
  const num = (v: string) => Number(v.replace(/[^\d.]/g, '')) || 0
  const tierStores = (t: PartnerTier) => state.restaurants.filter((r) => r.tier === t)
  const exampleSubtotal = 400
  const example = useMemo(() => {
    const service = Math.min(draft.serviceFeeMax, Math.max(draft.serviceFeeMin, exampleSubtotal * draft.serviceFeePct / 100))
    return { service, delivery: 25 * draft.deliveryFeeMultiplier }
  }, [draft])

  const rows: { key: keyof FeeConfig; label: string; hint: string; unit: string }[] = [
    { key: 'serviceFeePct', label: 'Service fee', hint: 'Percent of subtotal charged to customer', unit: '%' },
    { key: 'serviceFeeMin', label: 'Service fee minimum', hint: 'Floor per order', unit: 'CUR' },
    { key: 'serviceFeeMax', label: 'Service fee cap', hint: 'Ceiling per order', unit: 'CUR' },
    { key: 'deliveryFeeMultiplier', label: 'Delivery fee multiplier', hint: '1 = store default, 0 = free delivery everywhere', unit: '×' },
    { key: 'smallOrderThreshold', label: 'Small order threshold', hint: 'Subtotal below which small order fee applies', unit: 'CUR' },
    { key: 'smallOrderFee', label: 'Small order fee', hint: '', unit: 'CUR' },
    { key: 'priorityFee', label: 'Priority delivery fee', hint: '', unit: 'CUR' },
    { key: 'taxPct', label: 'VAT', hint: 'Applied to subtotal + fees', unit: '%' },
  ]

  return (
    <>
      <PageTitle title="Fees & commission" sub="Changes apply instantly to Customer checkout and store cards."
        right={<div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={() => setDraft(DEFAULT_FEE_CONFIG)}><RotateCcw size={15} />Defaults</button>
          <button className="btn-primary h-10 text-sm" disabled={!dirty} onClick={() => dispatch({ type: 'fees/set', config: draft })}><Save size={15} />Publish changes</button>
        </div>} />
      {dirty && <div className="mb-4 p-3 rounded-xl bg-amber-50 text-amber-900 text-sm font-medium">You have unpublished changes.</div>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 font-bold">Merchant commission by partner tier</div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="text-left px-5 py-2.5 font-semibold">Tier</th><th className="text-left px-5 py-2.5 font-semibold hidden sm:table-cell">Stores</th><th className="text-right px-5 py-2.5 font-semibold">Commission</th></tr></thead>
              <tbody>
                {(['standard', 'plus', 'premium'] as PartnerTier[]).map((t) => (
                  <tr key={t} className="border-t border-slate-100">
                    <td className="px-5 py-3"><div className="font-semibold capitalize">{t}</div><div className="text-xs text-slate-500">{t === 'premium' ? 'Exclusive, marketing boost' : t === 'plus' ? 'Featured placement' : 'Basic listing'}</div></td>
                    <td className="px-5 py-3 hidden sm:table-cell text-slate-600">{tierStores(t).map((r) => r.emoji).join(' ')} <span className="text-xs">({tierStores(t).length})</span></td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1 h-10 px-3 rounded-xl bg-slate-100 focus-within:ring-2 focus-within:ring-black">
                        <input className="w-12 bg-transparent outline-none text-right font-semibold tabular" value={draft.commission[t]} onChange={(e) => setDraft({ ...draft, commission: { ...draft.commission, [t]: num(e.target.value) } })} />
                        <span className="text-slate-500">%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-4 font-bold">Customer fees</div>
            <table className="w-full text-sm">
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t border-slate-100">
                    <td className="px-5 py-3"><div className="font-semibold">{r.label}</div>{r.hint && <div className="text-xs text-slate-500">{r.hint}</div>}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1 h-10 px-3 rounded-xl bg-slate-100 focus-within:ring-2 focus-within:ring-black">
                        {r.unit === 'CUR' && <span className="text-slate-500 text-xs">{CURRENCY}</span>}
                        <input className="w-14 bg-transparent outline-none text-right font-semibold tabular" value={draft[r.key] as number} onChange={(e) => setDraft({ ...draft, [r.key]: num(e.target.value) })} />
                        {r.unit !== 'CUR' && <span className="text-slate-500">{r.unit}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card p-5 h-fit lg:sticky lg:top-16">
          <div className="font-bold">Preview · {CURRENCY} 400 order</div>
          <div className="text-xs text-slate-500 mb-3">Standard-tier store, {CURRENCY} 25 base delivery</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Service fee</span><span className="tabular">{money(example.service)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Delivery fee</span><span className="tabular">{money(example.delivery)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">VAT</span><span className="tabular">{money((exampleSubtotal + example.service + example.delivery) * draft.taxPct / 100)}</span></div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold"><span>Platform take</span><span className="tabular">{money(example.service + exampleSubtotal * draft.commission.standard / 100)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Merchant payout</span><span className="tabular">{money(exampleSubtotal * (1 - draft.commission.standard / 100))}</span></div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Disputes ──────────────────────────────────────────────────
const D_TONE: Record<DisputeStatus, 'amber' | 'blue' | 'green' | 'red'> = { open: 'amber', investigating: 'blue', refunded: 'green', rejected: 'red' }

function Disputes() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState<DisputeStatus | 'all'>('all')
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [partial, setPartial] = useState('')
  const list = state.disputes.filter((d) => filter === 'all' || d.status === filter)
  const current = selected ? state.disputes.find((d) => d.id === selected.id)! : null
  const resolve = (status: DisputeStatus, refundAmount?: number) => { dispatch({ type: 'dispute/resolve', id: current!.id, status, refundAmount }); setPartial('') }
  const refunded = state.disputes.reduce((s, d) => s + (d.refundAmount ?? 0), 0)

  return (
    <>
      <PageTitle title="Dispute resolution" sub={`${state.disputes.filter((d) => d.status === 'open').length} open · ${money(refunded)} refunded today`} />
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3">
        {(['all', 'open', 'investigating', 'refunded', 'rejected'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn(filter === f ? 'pill-on' : 'pill-off', 'capitalize shrink-0')}>{f} <span className="opacity-60">{f === 'all' ? state.disputes.length : state.disputes.filter((d) => d.status === f).length}</span></button>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr>{['Case', 'Order', 'Customer', 'Store', 'Issue', 'Amount', 'Opened', 'Status'].map((h) => <th key={h} className="text-left font-semibold px-4 py-2.5">{h}</th>)}</tr></thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} onClick={() => setSelected(d)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-3 font-semibold">{d.id}</td>
                  <td className="px-4 py-3 text-slate-600">{d.orderId}</td>
                  <td className="px-4 py-3">{d.customer}</td>
                  <td className="px-4 py-3">{d.restaurant}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><AlertOctagon size={14} className="text-slate-400" />{d.type}</span></td>
                  <td className="px-4 py-3 tabular">{money(d.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{timeAgo(d.createdAt)}</td>
                  <td className="px-4 py-3"><Badge tone={D_TONE[d.status]} className="capitalize">{d.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <EmptyState icon="✅" title="No disputes here" />}
        </div>
      </div>

      <Drawer open={!!current} onClose={() => setSelected(null)}>
        {current && (
          <>
            <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-100">
              <button className="icon-btn" onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button>
              <div className="flex-1 font-bold">Case {current.id}</div>
              <Badge tone={D_TONE[current.status]} className="capitalize">{current.status}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <div className="text-2xl font-extrabold">{current.type}</div>
                <div className="text-sm text-slate-500">{current.customer} · {current.restaurant} · {current.orderId}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Claimed amount</div><div className="font-bold">{money(current.amount)}</div></div>
                <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Refunded</div><div className="font-bold">{current.refundAmount ? money(current.refundAmount) : '—'}</div></div>
              </div>
              <div><div className="label">Notes</div><p className="text-sm bg-slate-50 rounded-xl p-3">{current.note}</p></div>
              <div>
                <div className="label">Activity</div>
                <ol className="text-sm space-y-2">
                  <li className="flex gap-2"><span className="w-2 h-2 rounded-full bg-slate-400 mt-1.5" />Case opened by customer · {timeAgo(current.createdAt)}</li>
                  {current.status !== 'open' && <li className="flex gap-2"><span className="w-2 h-2 rounded-full bg-black mt-1.5" />Status set to <b className="capitalize">{current.status}</b></li>}
                </ol>
              </div>
            </div>
            {(current.status === 'open' || current.status === 'investigating') && (
              <div className="border-t border-slate-200 p-4 space-y-2 pb-safe">
                {current.status === 'open' && <button className="btn-secondary w-full h-11" onClick={() => resolve('investigating')}>Mark investigating</button>}
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 h-11 px-3 rounded-xl bg-slate-100 flex-1"><span className="text-xs text-slate-500">{CURRENCY}</span><input value={partial} onChange={(e) => setPartial(e.target.value.replace(/[^\d.]/g, ''))} placeholder="Partial amount" className="bg-transparent outline-none flex-1 min-w-0" /></div>
                  <button className="btn-secondary h-11" disabled={!partial || Number(partial) > current.amount} onClick={() => resolve('refunded', Number(partial))}><Undo2 size={15} />Partial</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-danger h-12" onClick={() => resolve('rejected')}>Reject claim</button>
                  <button className="btn-brand" onClick={() => resolve('refunded', current.amount)}>Refund {money(current.amount)}</button>
                </div>
              </div>
            )}
          </>
        )}
      </Drawer>
    </>
  )
}
