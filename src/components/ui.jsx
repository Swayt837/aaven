// Composants UI BioBoost — néo-brutalisme premium (contours bold + élévation douce).

function cx(...a) {
  return a.filter(Boolean).join(' ')
}

// CTA & boutons : contour net + ombre douce/glow, interactions fluides (lift + tap).
const VARIANTS = {
  primary: 'bg-gradient-to-b from-[#FF5D52] to-coral text-white border border-coral/40 shadow-glow-coral hover:shadow-[0_18px_48px_-10px_rgba(255,77,66,.6)]',
  secondary: 'bg-white text-ink border border-ink/12 shadow-soft hover:border-ink/25',
  dark: 'bg-ink text-white border border-ink shadow-float',
  pink: 'bg-pink text-white border border-pink/40 shadow-glow-pink',
  sun: 'bg-sun text-ink border border-ink/15 shadow-glow-sun',
  danger: 'bg-white text-coral border border-coral/30 shadow-soft hover:bg-coral hover:text-white hover:border-coral',
  ghost: 'bg-transparent text-ink border border-transparent shadow-none hover:bg-ink/5',
}

export function Button({
  as = 'button',
  variant = 'primary',
  size = 'md',
  className,
  children,
  style,
  ...props
}) {
  const Comp = as
  const sizes = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-7 py-3.5 text-lg',
  }
  return (
    <Comp
      className={cx(
        'press inline-flex items-center justify-center gap-2 font-display font-extrabold',
        'rounded-2xl',
        sizes[size],
        VARIANTS[variant],
        'cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </Comp>
  )
}

// Surface premium : contour hairline + radius généreux + élévation douce.
export function Card({ className, children, style, ...props }) {
  return (
    <div
      className={cx('rounded-card border border-ink/10 bg-white shadow-soft', className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}

const BADGE_COLORS = {
  sun: 'bg-sun text-ink border border-ink/10',
  pink: 'bg-pink text-white',
  coral: 'bg-coral text-white',
  white: 'bg-white text-ink border border-ink/12 shadow-soft',
  ink: 'bg-ink text-white',
  lime: 'bg-lime text-ink',
}

export function Badge({ color = 'sun', className, children, style }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-3 py-1',
        'font-display text-xs font-extrabold uppercase tracking-wide',
        BADGE_COLORS[color],
        className
      )}
      style={style}
    >
      {children}
    </span>
  )
}

export function Label({ children, className }) {
  return (
    <label className={cx('mb-1.5 block font-display text-xs font-extrabold uppercase tracking-wide text-ink/55', className)}>
      {children}
    </label>
  )
}

const FIELD = 'w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base placeholder:text-ink/35 transition focus:outline-none focus:border-coral/50 focus:ring-2 focus:ring-coral/20'

export function Input({ className, ...props }) {
  return <input className={cx(FIELD, className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return <textarea className={cx(FIELD, 'resize-none', className)} {...props} />
}
