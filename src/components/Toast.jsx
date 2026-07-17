import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Toasts premium — remplacent les alert()/confirm() natifs du navigateur.
// Pilule sombre qui descend du haut de l'écran, action optionnelle (ex. « Annuler »
// après une suppression), disparition automatique.
//
// API (importable partout, sans hook ni contexte) :
//   toast('Message')                          → info
//   toast.error('Message')                    → erreur (point coral)
//   toast('Supprimé', { action: { label: 'Annuler', onClick } })
//
// <Toasts /> est monté une seule fois dans App.jsx.
let push = null
let seq = 0

export function toast(message, opts = {}) {
  if (!message) return
  push?.({
    id: ++seq,
    message: String(message),
    type: opts.type || 'info',
    action: opts.action,
    duration: opts.duration ?? (opts.action ? 5000 : 3200),
  })
}
toast.error = (message, opts = {}) => toast(message, { ...opts, type: 'error' })

export function Toasts() {
  const [items, setItems] = useState([])
  useEffect(() => {
    push = (item) => {
      setItems((list) => [...list.slice(-2), item]) // 3 toasts visibles max
      setTimeout(() => setItems((list) => list.filter((x) => x.id !== item.id)), item.duration)
    }
    return () => { push = null }
  }, [])
  const close = (id) => setItems((list) => list.filter((x) => x.id !== id))
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {items.map((it) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            role="status"
            className="pointer-events-auto flex max-w-[92vw] items-center gap-3 rounded-full border border-white/10 bg-ink px-4 py-2.5 text-white shadow-float backdrop-blur"
          >
            {it.type === 'error' && <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-coral" />}
            <span className="font-display min-w-0 text-sm font-bold">{it.message}</span>
            {it.action && (
              <button
                type="button"
                onClick={() => { close(it.id); it.action.onClick() }}
                className="press shrink-0 rounded-full bg-white/15 px-3 py-1 font-display text-xs font-extrabold uppercase tracking-wide text-lime"
              >
                {it.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
