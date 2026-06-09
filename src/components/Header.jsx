import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { Logo } from './Logo'
import { Button } from './ui'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'

function LangToggle() {
  const { lang, setLang } = useI18n()
  return (
    <div className="flex items-center overflow-hidden rounded-full border border-ink/12 bg-white/80 text-xs font-extrabold shadow-soft backdrop-blur">
      {['fr', 'en'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 uppercase transition ${lang === l ? 'bg-ink text-white' : 'text-ink/60 hover:text-ink'}`}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

const NAV_LINKS = [
  { href: '#modes', key: 'nav.modes' },
  { href: '#how', key: 'nav.how' },
  { href: '#pricing', key: 'nav.pricing' },
  { href: '#faq', key: 'nav.faq' },
]

// variant: 'landing' | 'dashboard'
export function Header({ variant = 'landing' }) {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const showNav = variant === 'landing'

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Logo to={user ? '/dashboard' : '/'} />

        {showNav && (
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="press font-display text-sm font-extrabold text-ink/70 hover:text-ink"
              >
                {t(l.key)}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <LangToggle />
          {variant === 'dashboard' ? (
            <Button variant="secondary" size="sm" onClick={async () => { await logout(); nav('/') }}>
              <LogOut size={16} /> {t('nav.logout')}
            </Button>
          ) : user ? (
            <Button variant="dark" size="sm" onClick={() => nav('/dashboard')}>
              {t('nav.dashboard')}
            </Button>
          ) : (
            <Button variant="dark" size="sm" className="hidden sm:inline-flex" onClick={() => nav('/login')}>
              {t('nav.login')}
            </Button>
          )}

          {/* Burger (mobile, landing uniquement) */}
          {showNav && (
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={open}
              className="press grid h-9 w-9 place-items-center rounded-xl border border-ink/12 bg-white shadow-soft md:hidden"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Panneau mobile */}
      {showNav && open && (
        <div className="border-t border-ink/10 bg-cream/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-5xl flex-col px-4 py-2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-ink/10 py-3 font-display text-base font-extrabold text-ink"
              >
                {t(l.key)}
              </a>
            ))}
            {!user && (
              <button
                onClick={() => { setOpen(false); nav('/login') }}
                className="py-3 text-left font-display text-base font-extrabold text-coral"
              >
                {t('nav.login')} →
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
