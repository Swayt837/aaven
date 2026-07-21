import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { useI18n } from '../lib/i18n'

// Widget intégré (connecteurs niveau 3) : le lien d'une plateforme embarquable
// (Calendly, Cal.com, ZenChef, Planity…) s'ouvre dans une iframe plein écran au
// lieu d'une redirection — le visiteur réserve sans quitter la page. Le lien
// « ouvrir dans un nouvel onglet » reste toujours accessible : certains sites
// refusent l'iframe (X-Frame-Options) et ce refus n'est pas détectable en JS.
export function EmbedModal({ url, openUrl, title, brand, accent = '#EF5A4C', onClose }) {
  const { t } = useI18n()
  const [loaded, setLoaded] = useState(false)
  const external = openUrl || url

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50" onClick={onClose}>
      <div
        className="flex h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border-2 border-ink bg-white shadow-hard-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-ink/10 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-extrabold">{title}</h2>
            {brand ? <p className="text-[11px] font-bold text-ink/45">{t('embed.via', { brand })}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={external}
              target="_blank"
              rel="noopener noreferrer"
              title={t('embed.open')}
              aria-label={t('embed.open')}
              className="press grid h-9 w-9 place-items-center rounded-full border-2 border-ink"
            >
              <ExternalLink size={15} />
            </a>
            <button onClick={onClose} aria-label={t('contact.close')} className="press grid h-9 w-9 place-items-center rounded-full border-2 border-ink">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="relative flex-1 bg-cream">
          {!loaded && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink/15" style={{ borderTopColor: accent }} aria-hidden />
            </div>
          )}
          <iframe
            src={url}
            title={title}
            onLoad={() => setLoaded(true)}
            className="h-full w-full"
            style={{ border: 0 }}
            allow="payment"
          />
        </div>

        <a
          href={external}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-t border-ink/10 bg-white px-4 py-2.5 text-center text-xs font-bold text-ink/55"
        >
          {t('embed.fallback')} <span className="underline">{t('embed.open')}</span>
        </a>
      </div>
    </div>
  )
}
