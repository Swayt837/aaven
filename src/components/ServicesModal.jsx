import { X, ArrowUpRight } from 'lucide-react'
import { useI18n } from '../lib/i18n'

// Liste de services intégrée (nom + prix + description + CTA optionnel par ligne).
export function ServicesModal({ title, items, accent = '#EF5A4C', onClose }) {
  const { t } = useI18n()
  const list = items || []
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[28px] border-2 border-ink bg-white p-6 shadow-hard-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label={t('contact.close')} className="press rounded-full border-2 border-ink p-1.5"><X size={18} /></button>
        </div>

        <div className="mt-4 divide-y-2 divide-ink/10">
          {list.map((it, i) => (
            <div key={i} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-base font-extrabold">{it.name}</span>
                {it.price ? <span className="shrink-0 font-display text-base font-extrabold" style={{ color: accent }}>{it.price}</span> : null}
              </div>
              {it.desc ? <p className="mt-0.5 text-sm font-medium text-ink/65">{it.desc}</p> : null}
              {it.ctaUrl ? (
                <a
                  href={it.ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="press mt-2 inline-flex items-center gap-1 rounded-full border-2 border-ink px-3 py-1 text-xs font-extrabold"
                  style={{ background: accent, color: '#fff' }}
                >
                  {it.ctaLabel || t('card.buy')} <ArrowUpRight size={13} strokeWidth={3} />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
