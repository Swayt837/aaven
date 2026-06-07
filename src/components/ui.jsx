// Composants néo-brutalistes réutilisables : Button, Card, Badge, Input, Textarea, Label.

function cx(...a) {
  return a.filter(Boolean).join(' ')
}

const VARIANTS = {
  primary: 'bg-coral text-white border-ink',
  secondary: 'bg-white text-ink border-ink',
  dark: 'bg-ink text-white border-ink',
  pink: 'bg-pink text-white border-ink',
  sun: 'bg-sun text-ink border-ink',
  danger: 'bg-coral text-white border-ink',
  ghost: 'bg-transparent text-ink border-transparent shadow-none',
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
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-7 py-4 text-lg',
  }
  return (
    <Comp
      className={cx(
        'press inline-flex items-center justify-center gap-2 font-display font-extrabold',
        'rounded-brutal border-2',
        variant !== 'ghost' && 'shadow-hard',
        sizes[size],
        VARIANTS[variant],
        'cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </Comp>
  )
}

export function Card({ className, children, style, ...props }) {
  return (
    <div
      className={cx('rounded-brutal border-2 border-ink bg-white shadow-hard', className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}

const BADGE_COLORS = {
  sun: 'bg-sun text-ink',
  pink: 'bg-pink text-white',
  coral: 'bg-coral text-white',
  white: 'bg-white text-ink',
  ink: 'bg-ink text-white',
}

export function Badge({ color = 'sun', className, children, style }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border-2 border-ink px-3 py-1',
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
    <label className={cx('mb-1 block font-display text-xs font-extrabold uppercase tracking-wide text-ink/70', className)}>
      {children}
    </label>
  )
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cx(
        'w-full rounded-brutal border-2 border-ink bg-white px-4 py-3 text-base',
        'placeholder:text-ink/40 focus:outline-none',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cx(
        'w-full rounded-brutal border-2 border-ink bg-white px-4 py-3 text-base',
        'placeholder:text-ink/40 focus:outline-none resize-none',
        className
      )}
      {...props}
    />
  )
}
