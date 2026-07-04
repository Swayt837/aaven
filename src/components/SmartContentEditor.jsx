import { useRef, useState } from 'react'
import { Sparkles, ImagePlus, Columns2, GalleryHorizontal, Grid3x3, Trash2, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'

// ============================ Smart Content — éditeur ============================
// 1. SmartLinkInput : l'utilisateur colle un lien → détection auto (YouTube, TikTok,
//    Spotify, Calendly, boutique…) → la bonne carte est créée, aucun choix manuel.
// 2. SmartManualTiles : cartes visuelles à base d'images (Image, Avant/Après,
//    Carrousel, Grille Insta) — remplies via upload.
// 3. SmartConfigEditor : réglages d'une carte existante (images, lien, mode Peek).

// Colle un lien → carte auto.
export function SmartLinkInput({ onAdd }) {
  const { t } = useI18n()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function resolve() {
    const clean = url.trim()
    if (!clean) return
    setBusy(true)
    setErr('')
    try {
      const r = await api.smartResolve(clean.startsWith('http') ? clean : `https://${clean}`)
      onAdd({
        kind: r.kind,
        url: r.url,
        peek: true,
        meta: r.meta || {},
        images: [],
      }, r.meta?.title)
      setUrl('')
    } catch (e) {
      setErr(e.message || t('edit.smart.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 font-display text-xs font-extrabold uppercase tracking-wide text-ink/60">
        <Sparkles size={13} /> {t('edit.smart.title')}
      </p>
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !busy && resolve()}
          placeholder={t('edit.smart.paste')}
          className="min-w-0 flex-1 rounded-lg border-2 border-ink px-2.5 py-2 text-sm font-semibold"
        />
        <button
          type="button"
          onClick={resolve}
          disabled={busy || !url.trim()}
          className="press shrink-0 rounded-lg border-2 border-ink bg-ink px-3 py-2 text-sm font-extrabold text-white disabled:opacity-40"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : t('edit.smart.add')}
        </button>
      </div>
      {err && <p className="mt-1 text-xs font-bold text-coral">{err}</p>}
      <p className="mt-1 text-[11px] font-medium text-ink/45">{t('edit.smart.pasteHint')}</p>
    </div>
  )
}

// Tuiles de création manuelle (cartes à base d'images).
const MANUAL_KINDS = [
  { kind: 'image', icon: ImagePlus, labelKey: 'edit.smart.image' },
  { kind: 'beforeafter', icon: Columns2, labelKey: 'edit.smart.beforeafter' },
  { kind: 'carousel', icon: GalleryHorizontal, labelKey: 'edit.smart.carousel' },
  { kind: 'instagram', icon: Grid3x3, labelKey: 'edit.smart.instagrid' },
]

export function SmartManualTiles({ onAdd }) {
  const { t } = useI18n()
  return (
    <div>
      <p className="mb-1.5 font-display text-xs font-extrabold uppercase tracking-wide text-ink/60">{t('edit.smart.manual')}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {MANUAL_KINDS.map(({ kind, icon: Ic, labelKey }) => (
          <button
            key={kind}
            type="button"
            onClick={() => onAdd({ kind, url: '', peek: kind !== 'beforeafter', meta: {}, images: [] }, t(labelKey))}
            className="press flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-2.5 py-2 text-left text-sm font-bold"
          >
            <Ic size={16} /> {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  )
}

// Réglages d'une carte smart existante (dans la liste des boutons).
export function SmartConfigEditor({ slug, button, onChange }) {
  const { t } = useI18n()
  const cfg = button.config || { kind: 'generic', meta: {}, images: [] }
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const set = (patch) => onChange({ ...cfg, ...patch })
  const maxImages = cfg.kind === 'beforeafter' ? 2 : cfg.kind === 'instagram' ? 9 : cfg.kind === 'carousel' ? 10 : 1
  const needsImages = ['image', 'beforeafter', 'carousel', 'instagram'].includes(cfg.kind)

  async function onFiles(e) {
    const files = [...(e.target.files || [])].slice(0, maxImages - (cfg.images?.length || 0))
    if (!files.length) return
    setUploading(true)
    try {
      const urls = []
      for (const f of files) {
        const { url } = await api.uploadImage(slug, f)
        urls.push(url)
      }
      set({ images: [...(cfg.images || []), ...urls].slice(0, maxImages) })
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Images (kinds visuels) */}
      {needsImages && (
        <div>
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/40">
            {cfg.kind === 'beforeafter' ? `${t('edit.smart.before')} / ${t('edit.smart.after')}` : t('edit.smart.images')} ({cfg.images?.length || 0}/{maxImages})
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {(cfg.images || []).map((src, i) => (
              <span key={i} className="group relative">
                <img src={src} alt="" className="h-12 w-12 rounded-lg border-2 border-ink object-cover" />
                {cfg.kind === 'beforeafter' && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded bg-ink px-1 text-[8px] font-extrabold uppercase text-white">
                    {i === 0 ? t('edit.smart.before') : t('edit.smart.after')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => set({ images: cfg.images.filter((_, j) => j !== i) })}
                  className="absolute -right-1.5 -top-1.5 grid h-4.5 w-4.5 place-items-center rounded-full border border-ink bg-coral p-0.5 text-white"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={9} />
                </button>
              </span>
            ))}
            {(cfg.images?.length || 0) < maxImages && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="press grid h-12 w-12 place-items-center rounded-lg border-2 border-dashed border-ink/40 text-ink/50 hover:border-ink hover:text-ink"
                aria-label={t('edit.smart.addImages')}
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple={maxImages > 1} onChange={onFiles} className="hidden" />
        </div>
      )}

      {/* Lien au clic */}
      <input
        value={cfg.url || ''}
        onChange={(e) => set({ url: e.target.value })}
        placeholder={t('edit.smart.destination')}
        className="w-full rounded-lg border-2 border-ink/30 px-2 py-1.5 text-sm"
      />

      {/* Mode Peek */}
      {cfg.kind !== 'beforeafter' && cfg.kind !== 'spotify' && cfg.kind !== 'music' && cfg.kind !== 'booking' && (
        <button
          type="button"
          onClick={() => set({ peek: !cfg.peek })}
          className="flex w-full items-center justify-between gap-2 rounded-lg border-2 border-ink/20 bg-cream/60 px-2.5 py-2 text-left"
        >
          <span>
            <span className="block text-xs font-extrabold">{t('edit.smart.peek')}</span>
            <span className="block text-[10px] font-medium text-ink/50">{t('edit.smart.peekHint')}</span>
          </span>
          <span className={`relative h-5 w-9 shrink-0 rounded-full border-2 border-ink transition ${cfg.peek ? 'bg-coral' : 'bg-white'}`}>
            <span className={`absolute top-0.5 h-3 w-3 rounded-full border-2 border-ink bg-white transition-all ${cfg.peek ? 'left-4' : 'left-0.5'}`} />
          </span>
        </button>
      )}
    </div>
  )
}
