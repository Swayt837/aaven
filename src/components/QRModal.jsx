import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { X, Download } from 'lucide-react'
import { Button } from './ui'
import { useI18n } from '../lib/i18n'

// Couleurs de marque proposées pour le QR.
const COLORS = ['#0A0A0A', '#FF4D42', '#F0426B', '#2547D0', '#1F8A5B']

// Modale QR code : couleur personnalisable + logo Aaven au centre, téléchargeable en PNG.
export function QRModal({ url, slug, onClose }) {
  const { t } = useI18n()
  const ref = useRef(null)
  const [color, setColor] = useState('#0A0A0A')

  function download() {
    const canvas = ref.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `aaven-${slug}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-brutal border-2 border-ink bg-white p-6 shadow-hard-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">{t('qr.title')}</h2>
          <button onClick={onClose} aria-label="Fermer" className="press rounded-full border-2 border-ink p-1.5">
            <X size={18} />
          </button>
        </div>

        <div ref={ref} className="mx-auto mt-4 w-fit rounded-card border-2 border-ink bg-white p-5 shadow-hard-sm">
          <QRCodeCanvas
            value={url}
            size={224}
            level="H"
            includeMargin
            fgColor={color}
            bgColor="#ffffff"
            imageSettings={{ src: '/logo-mark.png', height: 46, width: 46, excavate: true }}
          />
        </div>

        {/* Couleurs */}
        <div className="mt-4 flex items-center justify-center gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Couleur ${c}`}
              className={`h-7 w-7 rounded-full border-2 transition ${color === c ? 'scale-110 border-ink' : 'border-ink/20 hover:scale-105'}`}
              style={{ background: c }}
            />
          ))}
        </div>

        <p className="mt-3 break-all text-center text-xs font-medium text-ink/60">{url}</p>
        <p className="mt-1 text-center text-xs text-ink/50">{t('qr.hint')}</p>

        <Button className="mt-4 w-full" onClick={download}>
          <Download size={18} /> {t('qr.download')}
        </Button>
      </div>
    </div>
  )
}
