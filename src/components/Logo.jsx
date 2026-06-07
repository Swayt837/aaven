import { Link } from 'react-router-dom'

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="press inline-flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border-2 border-ink bg-sun font-display text-base font-extrabold shadow-hard-sm">
        Bio
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">Boost</span>
    </Link>
  )
}
