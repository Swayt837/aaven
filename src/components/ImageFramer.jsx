import { useRef } from 'react'
import { useI18n } from '../lib/i18n'
import { frameScale } from '../lib/templates'

const clamp = (v) => Math.max(0, Math.min(100, v))

// Recadrage interactif : glisser l'image pour la repositionner, curseur pour zoomer.
// frame = { posX, posY, zoom } ; onChange reçoit un patch partiel de ces clés.
export function ImageFramer({ src, video, frame, onChange, round = false, aspect = '1 / 1' }) {
  const { t } = useI18n()
  const boxRef = useRef(null)
  const drag = useRef(null)

  function onDown(e) {
    drag.current = { x: e.clientX, y: e.clientY, px: frame.posX ?? 50, py: frame.posY ?? 50 }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  function onMove(e) {
    if (!drag.current || !boxRef.current) return
    const box = boxRef.current.getBoundingClientRect()
    const dx = ((e.clientX - drag.current.x) / box.width) * 100
    const dy = ((e.clientY - drag.current.y) / box.height) * 100
    // glisser vers la droite révèle la gauche → la position diminue
    onChange({ posX: clamp(drag.current.px - dx), posY: clamp(drag.current.py - dy) })
  }
  function onUp(e) {
    drag.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  return (
    <div>
      <div
        ref={boxRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        className={`relative mx-auto w-44 cursor-move touch-none select-none overflow-hidden border-2 border-ink shadow-hard-sm ${round ? 'rounded-full' : 'rounded-xl'}`}
        style={{ aspectRatio: aspect }}
      >
        {video ? (
          <video
            src={video}
            muted
            loop
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${frame.posX ?? 50}% ${frame.posY ?? 50}%`, transform: `scale(${frameScale(frame.zoom ?? 1)})` }}
          />
        ) : (
          <img
            src={src}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${frame.posX ?? 50}% ${frame.posY ?? 50}%`, transform: `scale(${frameScale(frame.zoom ?? 1)})` }}
          />
        )}
        {/* Grille repère */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/30" />
          ))}
        </div>
      </div>
      <label className="mt-2 block text-xs font-bold">
        {t('edit.zoom')} · {Math.round((frame.zoom ?? 1) * 100)}%
        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={frame.zoom ?? 1}
          onChange={(e) => onChange({ zoom: Number(e.target.value) })}
          className="mt-1 w-full accent-coral"
        />
      </label>
      <p className="text-center text-[11px] font-semibold text-ink/50">{t('edit.frameHint')}</p>
    </div>
  )
}
