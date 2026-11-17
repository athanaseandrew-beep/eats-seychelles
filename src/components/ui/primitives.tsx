import { Minus, Plus, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/format'
import type { OrderStatus } from '../../types'

export function Toggle({ checked, onChange, label, size = 'md', tone = 'brand', srOnly }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; size?: 'sm' | 'md'; tone?: 'brand' | 'dark' | 'red'
  /** keep label for screen readers only */
  srOnly?: boolean
}) {
  const on = { brand: 'bg-brand', dark: 'bg-black', red: 'bg-red-500' }[tone]
  const dims = size === 'sm' ? 'w-9 h-5' : 'w-12 h-7'
  const knob = size === 'sm' ? 'w-4 h-4 peer-checked:translate-x-4' : 'w-6 h-6 peer-checked:translate-x-5'
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span className="relative inline-flex">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
        <span className={cn('rounded-full transition-colors', dims, checked ? on : 'bg-slate-300')} />
        <span className={cn('absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform', knob)} />
      </span>
      {label && !srOnly && <span className="text-sm font-medium">{label}</span>}
    </label>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} />
}

export function Badge({ children, tone = 'slate', className }: { children: ReactNode; tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'black' | 'purple'; className?: string }) {
  const t = {
    slate: 'bg-slate-100 text-slate-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-800',
    red: 'bg-red-50 text-red-700', blue: 'bg-sky-50 text-sky-700', black: 'bg-black text-white', purple: 'bg-violet-50 text-violet-700',
  }[tone]
  return <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap', t, className)}>{children}</span>
}

export function QtyStepper({ value, onChange, min = 1, size = 'md' }: { value: number; onChange: (v: number) => void; min?: number; size?: 'sm' | 'md' }) {
  const b = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  return (
    <div className="inline-flex items-center bg-slate-100 rounded-full">
      <button className={cn(b, 'grid place-items-center rounded-full hover:bg-slate-200 disabled:opacity-30')} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Decrease"><Minus size={16} /></button>
      <span className="w-7 text-center font-semibold tabular">{value}</span>
      <button className={cn(b, 'grid place-items-center rounded-full hover:bg-slate-200')} onClick={() => onChange(value + 1)} aria-label="Increase"><Plus size={16} /></button>
    </div>
  )
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
      <Star size={14} className="fill-current" />
      <span className="font-semibold">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-slate-500">({count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}+)</span>}
    </span>
  )
}

/** Circular countdown — used for accept timers in KDS and courier offers. */
export function CountdownRing({ remainingMs, totalMs, size = 52, stroke = 5, label }: { remainingMs: number; totalMs: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, remainingMs / totalMs))
  const urgent = pct < 0.3
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={urgent ? '#ef4444' : '#06C167'} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <span className={cn('absolute inset-0 grid place-items-center text-xs font-bold tabular', urgent && 'text-red-600')}>
        {label ?? Math.ceil(remainingMs / 1000)}
      </span>
    </div>
  )
}

export const STATUS_META: Record<OrderStatus, { label: string; tone: 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'black' | 'purple' }> = {
  placed: { label: 'New', tone: 'amber' },
  preparing: { label: 'Preparing', tone: 'blue' },
  ready: { label: 'Ready', tone: 'purple' },
  courier_at_store: { label: 'Courier at store', tone: 'purple' },
  on_the_way: { label: 'On the way', tone: 'black' },
  delivered: { label: 'Delivered', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'red' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status]
  return <Badge tone={m.tone}>{m.label}</Badge>
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={cn('inline-flex p-1 bg-slate-100 rounded-full', className)}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cn('h-8 px-4 rounded-full text-sm font-semibold transition flex-1 whitespace-nowrap', value === o.value ? 'bg-white shadow-sm text-black' : 'text-slate-600 hover:text-black')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      <div className="w-16 h-16 rounded-full bg-slate-100 grid place-items-center text-3xl mb-4">{icon}</div>
      <div className="font-bold text-lg">{title}</div>
      {body && <p className="text-slate-500 text-sm mt-1 max-w-xs">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
