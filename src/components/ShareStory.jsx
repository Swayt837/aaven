import { useRef, useState } from 'react'
import { Share2, Loader2 } from 'lucide-react'
import { toBlob } from 'html-to-image'
import { BioImmersive } from './PhoneMockup'
import { getTheme } from '../lib/themes'

// Bouton « Partager en story » (discret) sur la page publique.
// PHASE 1 : capture la card entière en image 9:16 (avec watermark Aaven imposé),
// puis ouvre la feuille de partage native (Insta/TikTok/…). La vidéo de fond est
// remplacée par son poster/image pour la capture — la version vidéo arrive en phase 2.
export function ShareStory({ page, buttons, supporters, products, slug }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)

  // Page « story » : on neutralise la vidéo (html-to-image ne capture pas les <video>).
  const theme = getTheme(page)
  const storyPage = {
    ...page,
    theme: { ...theme, bgVideo: '', introVideo: '', bgVideoOwn: false, bgType: theme.bgImage ? 'image' : theme.bgType },
  }

  async function share() {
    if (busy) return
    setBusy(true)
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready
      const blob = await toBlob(ref.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#0b0b10' })
      if (!blob) throw new Error('capture')
      const file = new File([blob], `aaven-${slug}.png`, { type: 'image/png' })
      const url = `${window.location.origin}/${slug}`
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: page.title || slug, text: `${page.title || slug} · aaven.fr/${slug}`, url })
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = file.name
        a.click()
        URL.revokeObjectURL(a.href)
      }
    } catch {
      /* partage annulé ou non supporté → on ignore */
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={share}
        disabled={busy}
        aria-label="Partager en story"
        className="fixed left-4 top-4 z-30 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60 disabled:opacity-60"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
      </button>

      {/* Rendu story 9:16 hors-écran, uniquement pour la capture */}
      <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, width: 540, height: 960, pointerEvents: 'none' }}>
        <div ref={ref} style={{ position: 'relative', width: 540, height: 960, overflow: 'hidden', background: '#0b0b10' }}>
          <BioImmersive page={storyPage} buttons={buttons} supporters={supporters} products={products} branding={false} kenBurns={false} />
          {/* Watermark Aaven imposé */}
          <div
            style={{
              position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center',
              color: 'rgba(255,255,255,0.95)', fontFamily: "'Plus Jakarta Sans','Manrope',sans-serif",
              fontWeight: 700, letterSpacing: '0.06em', fontSize: 19, textShadow: '0 1px 8px rgba(0,0,0,.55)',
            }}
          >
            aaven.fr/{slug}
          </div>
        </div>
      </div>
    </>
  )
}
