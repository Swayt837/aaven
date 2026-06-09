import { useEffect, useRef, useState } from 'react'

// Révèle son contenu (fondu + montée) quand il entre dans le viewport.
// Respecte prefers-reduced-motion et reste visible si l'IO n'est pas dispo.
export function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) { setShown(true); return }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }),
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag ref={ref} style={delay ? { transitionDelay: `${delay}ms` } : undefined} className={`bb-in ${shown ? 'is-in' : ''} ${className}`}>
      {children}
    </Tag>
  )
}
