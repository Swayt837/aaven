import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import { useI18n } from '../lib/i18n'

// Bloc « lien public » : URL affichée + bouton Copier (clipboard) + Partager natif (mobile).
export function ShareLink({ url, className = '' }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback navigateurs sans Clipboard API (ou hors HTTPS)
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  async function share() {
    try { await navigator.share({ url, title: 'Aaven' }) } catch { /* annulé */ }
  }

  return (
    <div className={`flex items-stretch gap-2 ${className}`}>
      <div className="flex min-w-0 flex-1 items-center rounded-brutal border border-ink/15 bg-white px-3 text-sm font-bold">
        <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
      </div>
      <button
        type="button"
        onClick={copy}
        className={`press flex shrink-0 items-center gap-1.5 rounded-brutal border border-ink/15 px-3 py-2 text-sm font-extrabold ${copied ? 'bg-green-200' : 'bg-sun'}`}
      >
        {copied ? <><Check size={16} strokeWidth={3} /> {t('share.copied')}</> : <><Copy size={16} /> {t('share.copy')}</>}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={share}
          aria-label={t('share.share')}
          className="press flex shrink-0 items-center justify-center rounded-brutal border border-ink/15 bg-white px-3 py-2"
        >
          <Share2 size={16} />
        </button>
      )}
    </div>
  )
}
