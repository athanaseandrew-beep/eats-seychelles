import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useLockBody } from '../../hooks'
import { cn } from '../../lib/format'

/**
 * Responsive dialog: bottom sheet on mobile, centered card on ≥md.
 */
export function Modal({ open, onClose, title, children, footer, size = 'md', hideClose }: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  hideClose?: boolean
}) {
  useLockBody(open)
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])
  if (!open) return null
  const w = { sm: 'md:max-w-md', md: 'md:max-w-xl', lg: 'md:max-w-3xl' }[size]
  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className={cn('relative w-full bg-white rounded-t-3xl md:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl animate-slide-up md:animate-scale-in', w)}>
        <div className="md:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-300" />
        {(title || !hideClose) && (
          <div className="flex items-center justify-between gap-3 px-5 pt-3 md:pt-5 pb-2">
            <div className="text-lg font-bold">{title}</div>
            {!hideClose && <button className="icon-btn bg-slate-100 shrink-0" onClick={onClose} aria-label="Close"><X size={18} /></button>}
          </div>
        )}
        <div className="overflow-y-auto overscroll-contain px-5 pb-5 flex-1">{children}</div>
        {footer && <div className="border-t border-slate-200 p-4 pb-safe">{footer}</div>}
      </div>
    </div>
  )
}
