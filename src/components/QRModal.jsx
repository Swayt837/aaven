import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { X, Download } from 'lucide-react'
import { Button } from './ui'
import { useI18n } from '../lib/i18n'

// Modale QR code, téléchargeable en PNG (généré côté client).
export function QRModal({ url, slug, onClose }) {
  const { t } = useI18n()
  const ref = useRef(null)

  function download() {
    const canvas = ref.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `bioboost-${slug}.png`
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

        <div ref={ref} className="mt-4 flex justify-center rounded-brutal border-2 border-ink bg-white p-4">
          <QRCodeCanvas value={url} size={220} level="H" includeMargin />
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
