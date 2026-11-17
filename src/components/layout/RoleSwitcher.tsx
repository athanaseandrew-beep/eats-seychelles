import { Bike, ShieldCheck, ShoppingBag, Store } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/format'
import { useStore } from '../../store/AppStore'
import type { Role } from '../../types'

const ROLES: { role: Role; to: string; label: string; short: string; icon: typeof Store }[] = [
  { role: 'customer', to: '/', label: 'Customer', short: 'Customer', icon: ShoppingBag },
  { role: 'merchant', to: '/merchant', label: 'Restaurant Merchant', short: 'Merchant', icon: Store },
  { role: 'courier', to: '/courier', label: 'Courier Partner', short: 'Courier', icon: Bike },
  { role: 'admin', to: '/admin', label: 'Platform Admin', short: 'Admin', icon: ShieldCheck },
]

export const ROLE_BAR_H = 44 // px — other sticky elements offset by this

/** Dev-only preview bar pinned to the very top of every view. */
export function RoleSwitcher() {
  const { pathname } = useLocation()
  const { state } = useStore()
  const newOrders = state.orders.filter((o) => o.status === 'placed').length
  const active = pathname.startsWith('/merchant') ? 'merchant' : pathname.startsWith('/courier') ? 'courier' : pathname.startsWith('/admin') ? 'admin' : 'customer'
  return (
    <div className="sticky top-0 z-[60] h-11 bg-slate-950 text-white">
      <div className="h-full max-w-[1600px] mx-auto px-2 md:px-4 flex items-center gap-2">
        <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" /> Preview as
        </span>
        <nav className="flex-1 flex gap-0.5 md:gap-1 overflow-x-auto scrollbar-hide" aria-label="Role switcher">
          {ROLES.map(({ role, to, label, short, icon: Icon }) => (
            <NavLink key={role} to={to}
              className={cn('relative shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 md:px-3 rounded-full text-[11.5px] md:text-[13px] font-semibold transition',
                active === role ? 'bg-white text-black' : 'text-slate-300 hover:text-white hover:bg-white/10')}>
              <Icon size={15} />
              <span className="md:hidden">{short}</span>
              <span className="hidden md:inline">{label}</span>
              {role === 'merchant' && newOrders > 0 && (
                <span className="ml-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-brand text-white text-[10px] font-bold">{newOrders}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <span className="hidden md:inline text-[11px] text-slate-500 whitespace-nowrap">Shared mock state · actions sync across roles</span>
      </div>
    </div>
  )
}
