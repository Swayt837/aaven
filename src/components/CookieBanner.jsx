import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { analyticsAvailable, consentState, grantConsent, denyConsent } from '../lib/analytics'

// Bandeau de consentement cookies. Cookie de session = strictement nécessaire (exempté).
// Mesure d'audience PostHog = opt-in : ne se charge qu'après « Accepter ».
export function CookieBanner() {
  const { t } = useI18n()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Si l'analytics n'est pas configuré, rien à demander → on n'affiche pas.
    if (!analyticsAvailable()) { setShow(false); return }
    setShow(consentState() === null)
  }, [])

  function accept() { grantConsent(); setShow(false) }
  function refuse() { denyConsent(); setShow(false) }

  if (!show) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-brutal border-2 border-ink bg-white p-4 shadow-hard-lg sm:flex-row sm:items-center">
        <p className="flex-1 text-sm font-medium text-ink/75">
          {t('cookie.text')}{' '}
          <Link to="/legal/confidentialite" className="font-extrabold underline">{t('cookie.link')}</Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={refuse}
            className="press rounded-brutal border-2 border-ink bg-white px-4 py-2 text-sm font-extrabold"
          >
            {t('cookie.refuse')}
          </button>
          <button
            onClick={accept}
            className="press rounded-brutal border-2 border-ink bg-sun px-4 py-2 text-sm font-extrabold"
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
