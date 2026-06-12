import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

// Bouton « Partager » discret sur la page publique : partage le lien de la page
// via la feuille de partage native (fallback : copie du lien).
export function ShareStory({ page, slug }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/${slug}`

  async function share() {
    const title = page.title || slug
    if (navigator.share) {
      try { await navigator.share({ title, text: title, url }) } catch { /* annulé */ }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* noop */ }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Partager le lien"
      className="fixed left-4 top-4 z-30 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
    >
      {copied ? <Check size={16} /> : <Share2 size={16} />}
    </button>
  )
}
