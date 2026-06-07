import { X, ArrowUpRight } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { faviconUrl } from '../lib/modes'

// Modale listant plusieurs liens d'un même bouton, chacun avec son favicon.
export function LinksModal({ title, links, accent = '#111111', onClose }) {
  const { t } = useI18n()
  const list = (links || []).filter((l) => l && l.url)
  const hostOf = (u) => { try { return new URL(/^https?:\/\//.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, '') } catch { return u } }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[28px] border-2 border-ink bg-white p-6 shadow-hard-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label={t('contact.close')} className="press rounded-full border-2 border-ink p-1.5"><X size={18} /></button>
        </div>

        <div className="mt-4 space-y-2.5">
          {list.map((l, i) => {
            const fav = faviconUrl(l.url)
            return (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noreferrer noopener"
                className="press flex items-center gap-3 rounded-brutal border-2 border-ink bg-white px-4 py-3 font-extrabold shadow-hard-sm"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border-2 border-ink/15 bg-cream">
                  {fav ? <img src={fav} alt="" width={18} height={18} onError={(e) => { e.currentTarget.style.display = 'none' }} /> : <ArrowUpRight size={16} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate leading-tight">{l.label || hostOf(l.url)}</span>
                  {l.label ? <span className="block truncate text-xs font-semibold text-ink/45">{hostOf(l.url)}</span> : null}
                </span>
                <ArrowUpRight size={16} strokeWidth={3} className="shrink-0" style={{ color: accent }} />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
