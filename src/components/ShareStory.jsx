import { useRef, useState } from 'react'
import { Share2, Loader2 } from 'lucide-react'
import { toBlob } from 'html-to-image'
import { BioImmersive } from './PhoneMockup'
import { getTheme } from '../lib/themes'

// Bouton « Partager en story » (discret) sur la page publique.
// - Page à VIDÉO de fond → on capture l'overlay (en-tête + boutons + watermark, fond
//   transparent) et le serveur le superpose sur la vidéo (ffmpeg) → mp4 9:16.
// - Sinon → on capture toute la card en image 9:16.
// Puis feuille de partage native (Insta/TikTok/…). Watermark Aaven imposé, pas de QR.
export function ShareStory({ page, buttons, supporters, products, slug }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)

  const theme = getTheme(page)
  const hasVideo = !!(theme.introVideo || theme.bgVideo)
  // Page « story » pour la capture image : on neutralise la vidéo (poster/image utilisé).
  const storyPage = {
    ...page,
    theme: { ...theme, bgVideo: '', introVideo: '', bgVideoOwn: false, bgType: theme.bgImage ? 'image' : theme.bgType },
  }
  const url = `${window.location.origin}/${slug}`

  async function shareFile(file) {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: page.title || slug, text: `${page.title || slug} · aaven.fr/${slug}`, url })
      return true
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = file.name
    a.click()
    URL.revokeObjectURL(a.href)
    return true
  }

  async function share() {
    if (busy) return
    setBusy(true)
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready
      // Capture : overlay transparent (vidéo) ou card complète (image)
      const opts = hasVideo ? { pixelRatio: 2, cacheBust: true } : { pixelRatio: 2, cacheBust: true, backgroundColor: '#0b0b10' }
      const blob = await toBlob(ref.current, opts)
      if (!blob) throw new Error('capture')

      if (hasVideo) {
        // Le serveur superpose l'overlay sur la vidéo → mp4
        const fd = new FormData()
        fd.append('overlay', blob, 'overlay.png')
        const res = await fetch(`/api/story/${slug}`, { method: 'POST', body: fd })
        if (!res.ok) throw new Error('story')
        const mp4 = await res.blob()
        await shareFile(new File([mp4], `aaven-${slug}.mp4`, { type: 'video/mp4' }))
      } else {
        await shareFile(new File([blob], `aaven-${slug}.png`, { type: 'image/png' }))
      }
    } catch {
      // Échec/annulation → on tente au minimum de partager le lien
      try { if (navigator.share) await navigator.share({ title: page.title || slug, text: `${page.title || slug}`, url }) } catch { /* noop */ }
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
        <div ref={ref} style={{ position: 'relative', width: 540, height: 960, overflow: 'hidden', background: hasVideo ? 'transparent' : '#0b0b10' }}>
          <BioImmersive
            page={hasVideo ? page : storyPage}
            buttons={buttons}
            supporters={supporters}
            products={products}
            branding={false}
            kenBurns={false}
            overlayOnly={hasVideo}
          />
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
