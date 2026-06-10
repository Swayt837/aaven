import { Link } from 'react-router-dom'

// Logo Aaven — wordmark premium épuré (mark "A" linéaire monochrome + texte).
export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="press inline-flex items-center gap-2 text-ink">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4.5 20 L12 4 L19.5 20" />
        <path d="M8.2 13.6 H15.8" />
      </svg>
      <span className="font-sans text-[1.35rem] font-bold tracking-[-0.04em]">Aaven</span>
    </Link>
  )
}
