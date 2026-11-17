import { ChevronRight, Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, StatusBadge } from '../../components/ui/primitives'
import { clockTime, money } from '../../lib/format'
import { useStore } from '../../store/AppStore'

export function OrdersPage() {
  const { state } = useStore()
  const mine = state.orders.filter((o) => o.customerName === 'You')
  const active = mine.filter((o) => !['delivered', 'cancelled'].includes(o.status))
  const past = mine.filter((o) => ['delivered', 'cancelled'].includes(o.status))
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Orders</h1>
      {mine.length === 0 && <EmptyState icon={<Receipt />} title="No orders yet" body="When you place an order, you can track it here." action={<Link to="/" className="btn-primary">Find food</Link>} />}
      {[['In progress', active], ['Past orders', past]].map(([label, list]) => (list as typeof mine).length > 0 && (
        <section key={label as string} className="mt-6">
          <h2 className="font-bold text-lg mb-2">{label as string}</h2>
          <div className="space-y-2">
            {(list as typeof mine).map((o) => (
              <Link key={o.id} to={`/track/${o.id}`} className="card p-4 flex items-center gap-4 hover:border-slate-400 transition">
                <span className="w-14 h-14 rounded-xl bg-slate-100 grid place-items-center text-3xl">{o.restaurantEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{o.restaurantName}</div>
                  <div className="text-sm text-slate-500 truncate">{o.lines.reduce((n, l) => n + l.quantity, 0)} items · {money(o.fees.total)} · {clockTime(o.placedAt)}</div>
                  <div className="mt-1"><StatusBadge status={o.status} /></div>
                </div>
                <ChevronRight className="text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
