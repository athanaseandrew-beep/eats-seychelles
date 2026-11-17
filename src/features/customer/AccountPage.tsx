import { Bell, ChevronRight, CreditCard, Heart, HelpCircle, MapPin, Tag, User } from 'lucide-react'
import { useStore } from '../../store/AppStore'

export function AccountPage() {
  const { state } = useStore()
  const rows = [
    { icon: Heart, label: 'Saved stores', value: `${state.favorites.length}` },
    { icon: MapPin, label: 'Addresses', value: state.address.label },
    { icon: CreditCard, label: 'Payment', value: 'Visa •••• 4242' },
    { icon: Tag, label: 'Promotions', value: '3 available' },
    { icon: Bell, label: 'Notifications' },
    { icon: HelpCircle, label: 'Help' },
  ]
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-6">
      <div className="flex items-center gap-4">
        <span className="w-16 h-16 rounded-full bg-slate-100 grid place-items-center"><User size={28} /></span>
        <div><div className="text-2xl font-extrabold">Alex Morgan</div><div className="text-sm text-slate-500">Eats One member · since 2024</div></div>
      </div>
      <div className="mt-6 card divide-y divide-slate-100">
        {rows.map(({ icon: Icon, label, value }) => (
          <button key={label} className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50">
            <Icon size={20} /><span className="flex-1 font-medium">{label}</span>{value && <span className="text-sm text-slate-500">{value}</span>}<ChevronRight size={18} className="text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  )
}
