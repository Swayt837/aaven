import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { readDraft } from '../lib/draft'

const GLYPHS = '✦ ✚ ◆ ⬡ ✜ ❖ ✱ ◇ ✦ ✚ ◆ ⬡ ✜ ❖ ✱ ◇'

export default function Login() {
  const { t } = useI18n()
  const { user, login } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()

  // Arrivée depuis une landing métier : on garde la profession à travers le
  // détour OAuth (redirections externes) → réappliquée par l'onboarding.
  useEffect(() => {
    const prof = params.get('profession')
    if (prof) { try { localStorage.setItem('bb_profession', prof) } catch { /* private mode */ } }
  }, [params])

  useEffect(() => {
    if (user) nav('/dashboard', { replace: true })
  }, [user, nav])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cream px-4">
      {/* filigrane de symboles */}
      <div className="pointer-events-none absolute left-0 top-6 w-full select-none text-center text-2xl tracking-[0.5em] text-ink/10">
        {GLYPHS}
      </div>
      <div className="pointer-events-none absolute bottom-6 left-0 w-full select-none text-center text-2xl tracking-[0.5em] text-ink/10">
        {GLYPHS}
      </div>

      <div className="absolute left-4 top-4">
        <Logo />
      </div>

      <div className="w-full max-w-sm text-center">
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-ink/50">
          {t('login.eyebrow')}
        </p>
        <h1 className="font-display mt-2 text-5xl">{t('login.title')}</h1>

        {/* Guest onboarding : sa page l'attend, la connexion sert à la mettre en ligne */}
        {readDraft() && (
          <p className="mx-auto mt-5 max-w-xs rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink shadow-soft">
            ✨ {t('login.draft')}
          </p>
        )}

        <Button variant="dark" size="lg" className="mt-8 w-full" onClick={login}>
          <GoogleG /> {t('login.google')}
        </Button>

        <p className="mt-4 px-4 text-xs font-medium text-ink/50">{t('login.legal')}</p>
      </div>

      <div className="absolute bottom-12 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-ink/40">
        {t('login.secured')} <Logo />
      </div>
    </div>
  )
}

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.5-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 7.1 29.6 5 24 5 16 5 9.1 9.5 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 36 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.1 40.4 16 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.1 5.5l6.3 5.3C39.6 41 43 36 43 24c0-1.4-.1-2.5-.4-3.5z" />
    </svg>
  )
}
