import { Link } from 'react-router-dom'

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="press inline-flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-lime font-display text-base font-extrabold text-ink">
        Bio
      </span>
      <span className="font-display text-xl font-extrabold tracking-[-0.03em]">Boost</span>
    </Link>
  )
}
