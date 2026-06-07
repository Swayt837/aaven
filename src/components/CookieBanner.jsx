import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

const KEY = 'bb_cookie_ack'

// Bandeau d'information cookies. BioBoost n'utilise qu'un cookie de session
// strictement nécessaire (exempté de consentement) + une mesure d'audience
// anonyme côté serveur → bandeau informatif avec acquittement.
export function CookieBanner() {
  const { t } = useI18n()
  const [show, setShow] = useState(false)

  useEffect(() => {
    try { setShow(localStorage.getItem(KEY) !== '1') } catch { setShow(false) }
  }, [])

  function ack() {
    try { localStorage.setItem(KEY, '1') } catch { /* ignore */ }
    setShow(false)
  }

  if (!show) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-brutal border-2 border-ink bg-white p-4 shadow-hard-lg sm:flex-row sm:items-center">
        <p className="flex-1 text-sm font-medium text-ink/75">
          {t('cookie.text')}{' '}
          <Link to="/legal/confidentialite" className="font-extrabold underline">{t('cookie.link')}</Link>
        </p>
        <button
          onClick={ack}
          className="press shrink-0 rounded-brutal border-2 border-ink bg-sun px-4 py-2 text-sm font-extrabold"
        >
          {t('cookie.ok')}
        </button>
      </div>
    </div>
  )
}
