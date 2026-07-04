import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { X, Download } from 'lucide-react'
import { Button } from './ui'
import { useI18n } from '../lib/i18n'

/* ---------------- Palette (couleurs pleines + dégradés premium) ---------------- */
const SOLIDS = [
  { key: 's-ink', type: 'solid', color: '#0A0A0A' },
  { key: 's-coral', type: 'solid', color: '#FF4D42' },
  { key: 's-pink', type: 'solid', color: '#F0426B' },
  { key: 's-blue', type: 'solid', color: '#2547D0' },
  { key: 's-green', type: 'solid', color: '#1F8A5B' },
]
const GRADIENTS = [
  { key: 'g-sunset', type: 'gradient', from: '#FF4D42', to: '#F0426B' },
  { key: 'g-ocean', type: 'gradient', from: '#2547D0', to: '#22D3EE' },
  { key: 'g-violet', type: 'gradient', from: '#7C3AED', to: '#F472B6' },
  { key: 'g-gold', type: 'gradient', from: '#F59E0B', to: '#F0426B' },
  { key: 'g-midnight', type: 'gradient', from: '#0A0A0A', to: '#2547D0' },
  { key: 'g-emerald', type: 'gradient', from: '#1F8A5B', to: '#A3E635' },
]

/* ---------------- Géométrie (unités de design × SCALE pour l'export HD) --------- */
const SCALE = 3
const CARD_W = 340
const PAD_X = 30
const PAD_TOP = 30
const QR = CARD_W - PAD_X * 2 // QR carré (marge tranquille incluse)
const GAP = 20
const PHRASE_SIZE = 21
const PHRASE_LH = 27
const CAPTION_SIZE = 12.5
const PAD_BOTTOM = 26
const BORDER = 7

const px = (n) => n * SCALE

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Découpe la phrase en ≤ 2 lignes (troncature avec … si trop long).
function wrap(ctx, text, maxW) {
  if (!text) return []
  const words = text.split(/\s+/)
  const lines = []
  let cur = ''
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w } else cur = test
    if (lines.length === 2) break
  }
  if (cur && lines.length < 2) lines.push(cur)
  if (lines.length === 2) {
    let last = lines[1]
    while (ctx.measureText(`${last}…`).width > maxW && last.length) last = last.slice(0, -1)
    if (words.join(' ') !== lines.join(' ')) lines[1] = `${last}…`
  }
  return lines
}

export function QRModal({ url, page, onClose }) {
  const { t } = useI18n()
  const slug = page?.slug || 'aaven'
  const qrHostRef = useRef(null) // conteneur du QRCodeCanvas caché (source des modules)
  const canvasRef = useRef(null) // canvas d'affichage = export exact
  const logoRef = useRef(null)

  const [phrase, setPhrase] = useState(t('qr.phraseDefault'))
  const [fill, setFill] = useState(GRADIENTS[0])
  const [ready, setReady] = useState({ logo: false, font: false })

  // Légende sous la phrase : aaven.fr/slug (sans protocole ni www).
  const caption = (url || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')

  // Préchargement du logo + attente des polices (pour un rendu net du texte).
  useEffect(() => {
    const img = new Image()
    img.onload = () => { logoRef.current = img; setReady((r) => ({ ...r, logo: true })) }
    img.onerror = () => setReady((r) => ({ ...r, logo: true }))
    img.src = '/logo-mark.png'
    if (document.fonts?.ready) document.fonts.ready.then(() => setReady((r) => ({ ...r, font: true })))
    else setReady((r) => ({ ...r, font: true }))
  }, [])

  // (Re)compose le poster à chaque changement.
  useEffect(() => {
    const raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, phrase, fill, ready])

  function draw() {
    const canvas = canvasRef.current
    const qrCanvas = qrHostRef.current?.querySelector('canvas')
    if (!canvas || !qrCanvas) return

    const phraseLines = phrase.trim()
      ? (() => { const c = canvas.getContext('2d'); c.font = `800 ${px(PHRASE_SIZE)}px 'Bricolage Grotesque', system-ui, sans-serif`; return wrap(c, phrase.trim(), px(CARD_W - PAD_X * 2)) })()
      : []

    const cardH = PAD_TOP + QR + (phraseLines.length ? GAP + phraseLines.length * PHRASE_LH + 8 : 12) + CAPTION_SIZE + PAD_BOTTOM
    canvas.width = px(CARD_W)
    canvas.height = px(cardH)
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Cadre dégradé premium + carte blanche intérieure.
    const border = fill.type === 'gradient'
      ? (() => { const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height); g.addColorStop(0, fill.from); g.addColorStop(1, fill.to); return g })()
      : fill.color
    ctx.fillStyle = border
    roundRect(ctx, 0, 0, canvas.width, canvas.height, px(30)); ctx.fill()
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, px(BORDER), px(BORDER), canvas.width - px(BORDER) * 2, canvas.height - px(BORDER) * 2, px(24)); ctx.fill()

    // QR recoloré : on garde la forme des modules (destination-in) → dégradé ou couleur.
    const qX = px((CARD_W - QR) / 2)
    const qY = px(PAD_TOP)
    const tint = document.createElement('canvas')
    tint.width = px(QR); tint.height = px(QR)
    const tctx = tint.getContext('2d')
    if (fill.type === 'gradient') {
      const g = tctx.createLinearGradient(0, 0, tint.width, tint.height)
      g.addColorStop(0, fill.from); g.addColorStop(1, fill.to); tctx.fillStyle = g
    } else tctx.fillStyle = fill.color
    tctx.fillRect(0, 0, tint.width, tint.height)
    tctx.globalCompositeOperation = 'destination-in'
    tctx.imageSmoothingEnabled = false
    tctx.drawImage(qrCanvas, 0, 0, tint.width, tint.height)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tint, qX, qY)
    ctx.imageSmoothingEnabled = true

    // Badge logo au centre (pastille blanche pour préserver le scan).
    const badge = px(QR * 0.24)
    const bx = qX + (px(QR) - badge) / 2
    const by = qY + (px(QR) - badge) / 2
    ctx.save()
    ctx.shadowColor = 'rgba(10,10,10,0.12)'; ctx.shadowBlur = px(6); ctx.shadowOffsetY = px(2)
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, bx, by, badge, badge, badge * 0.28); ctx.fill()
    ctx.restore()
    if (logoRef.current) {
      const lp = badge * 0.2
      ctx.drawImage(logoRef.current, bx + lp, by + lp, badge - lp * 2, badge - lp * 2)
    }

    // Phrase + légende.
    let ty = qY + px(QR) + px(GAP)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#0A0A0A'
    ctx.font = `800 ${px(PHRASE_SIZE)}px 'Bricolage Grotesque', system-ui, sans-serif`
    for (const line of phraseLines) { ctx.fillText(line, canvas.width / 2, ty); ty += px(PHRASE_LH) }
    if (phraseLines.length) ty += px(8)
    ctx.fillStyle = 'rgba(10,10,10,0.5)'
    ctx.font = `600 ${px(CAPTION_SIZE)}px Manrope, system-ui, sans-serif`
    ctx.fillText(caption, canvas.width / 2, ty)
  }

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `aaven-qr-${slug}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const swatchStyle = (o) => o.type === 'gradient'
    ? { background: `linear-gradient(135deg, ${o.from}, ${o.to})` }
    : { background: o.color }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-brutal border-2 border-ink bg-white p-6 shadow-hard-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">{t('qr.title')}</h2>
          <button onClick={onClose} aria-label="Fermer" className="press rounded-full border-2 border-ink p-1.5">
            <X size={18} />
          </button>
        </div>

        {/* Aperçu (= export exact) */}
        <div className="mx-auto mt-4 w-[240px]">
          <canvas ref={canvasRef} className="w-full" />
        </div>
        {/* Source des modules — hors écran */}
        <div ref={qrHostRef} className="pointer-events-none absolute -left-[9999px] top-0" aria-hidden>
          <QRCodeCanvas value={url} size={px(QR)} level="H" includeMargin fgColor="#000000" bgColor="rgba(255,255,255,0)" />
        </div>

        {/* Phrase personnalisable */}
        <div className="mt-5">
          <label className="text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('qr.phrase')}</label>
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value.slice(0, 42))}
            placeholder={t('qr.phrasePh')}
            className="mt-1.5 w-full rounded-card border-2 border-ink/15 px-3 py-2 text-sm font-semibold outline-none transition focus:border-ink"
          />
        </div>

        {/* Couleurs pleines */}
        <div className="mt-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('qr.color')}</p>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {SOLIDS.map((o) => (
              <button
                key={o.key} type="button" onClick={() => setFill(o)} aria-label={o.key}
                className={`h-8 w-8 rounded-full border-2 transition ${fill.key === o.key ? 'scale-110 border-ink' : 'border-ink/20 hover:scale-105'}`}
                style={swatchStyle(o)}
              />
            ))}
          </div>
        </div>

        {/* Dégradés premium */}
        <div className="mt-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('qr.gradient')}</p>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {GRADIENTS.map((o) => (
              <button
                key={o.key} type="button" onClick={() => setFill(o)} aria-label={o.key}
                className={`h-8 w-8 rounded-full border-2 transition ${fill.key === o.key ? 'scale-110 border-ink' : 'border-ink/20 hover:scale-105'}`}
                style={swatchStyle(o)}
              />
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-ink/50">{t('qr.hint')}</p>

        <Button className="mt-3 w-full" onClick={download}>
          <Download size={18} /> {t('qr.download')}
        </Button>
      </div>
    </div>
  )
}
