import { useEffect, type ReactNode } from 'react'
import { useLockBody } from '../../hooks'
import { cn } from '../../lib/format'

/** Right slide-over on desktop, full-screen sheet on mobile. */
export function Drawer({ open, onClose, children, width = 'md:w-[440px]' }: {
  open: boolean; onClose: () => void; children: ReactNode; width?: string
}) {
  useLockBody(open)
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/40 animate-fade-in hidden md:block" onClick={onClose} />
      <aside className={cn('absolute inset-0 md:inset-y-0 md:left-auto md:right-0 bg-white flex flex-col shadow-2xl animate-slide-up md:animate-slide-in-right', width)}>
        {children}
      </aside>
    </div>
  )
}
