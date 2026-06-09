import { useRef, useState } from 'react'
import { Upload, Check, Sparkles, Lock, Film } from 'lucide-react'
import { Label } from './ui'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'
import { LAYOUTS } from '../lib/themes'
import { STYLES, FONTS, BUTTON_STYLES, TEMPLATES, PERSONAS } from '../lib/templates'
import { ImageFramer } from './ImageFramer'

// Vignette vidéo : affiche la DERNIÈRE frame (cale la lecture à la fin, sans jouer).
function VideoThumb({ src, poster }) {
  return (
    <video
      src={src}
      poster={poster}
      muted
      playsInline
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
      onLoadedMetadata={(e) => {
        const v = e.currentTarget
        try { v.currentTime = Math.max(0, (v.duration || 0) - 0.05) } catch { /* noop */ }
      }}
    />
  )
}

export function ThemeEditor({ slug, theme, plan = 'free', onChange }) {
  const { t, lang } = useI18n()
  const fileRef = useRef(null)
  const videoRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [err, setErr] = useState('')
  const isFree = (plan || 'free') === 'free'
  const isPro = plan === 'pro'

  // Lit la durée d'un fichier vidéo (pour la limite 15 s).
  function readDuration(file) {
    return new Promise((res, rej) => {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.onloadedmetadata = () => { try { URL.revokeObjectURL(v.src) } catch { /* noop */ } res(v.duration || 0) }
      v.onerror = () => rej(new Error('invalid'))
      v.src = URL.createObjectURL(file)
    })
  }

  // Upload média perso : Creator = GIF/vidéo 5 s max · Pro = vidéo 15 s max · Free = verrouillé.
  async function onVideoFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (isFree) { e.target.value = ''; return alert(t('edit.mediaLocked')) }
    setErr('')
    try {
      const isGif = file.type === 'image/gif'
      if (!isGif) {
        const dur = await readDuration(file).catch(() => 0)
        const max = isPro ? 15.5 : 5.5
        if (dur > max) { e.target.value = ''; return alert(isPro ? t('edit.videoMax15') : t('edit.videoMax5')) }
      }
      setUploadingVideo(true)
      const { url } = await api.uploadMedia(slug, file)
      if (isGif) {
        // GIF animé → fond image (l'<img> anime tout seul).
        set({ preset: 'upload', bgType: 'image', bgImage: url, bgVideo: '', bgVideoOwn: false, introVideo: '', animation: 'none', text: 'light', overlay: 0.4, bgPosX: 50, bgPosY: 50, bgZoom: 1 })
      } else {
        set({ bgVideo: url, bgVideoOwn: true, bgImage: '', introVideo: '', animation: 'none', bgPosX: 50, bgPosY: 50, bgZoom: 1 })
      }
    } catch (ex) {
      setErr(ex.message || 'Upload échoué')
    } finally {
      setUploadingVideo(false)
      if (videoRef.current) videoRef.current.value = ''
    }
  }

  const set = (patch) => onChange(patch)
  // Réinitialise le groupe fond/vidéo/animation avant d'appliquer un template
  // (sinon des champs d'un template précédent restent collés : vidéo qui ne change pas, etc.)
  const TPL_RESET = { introVideo: '', bgVideo: '', bgVideoOwn: false, ambientAudio: '', animation: 'none', bgImage: '', overlay: 0.35, bgPosX: 50, bgPosY: 50, bgZoom: 1 }
  const applyTemplate = (tpl) => {
    if (tpl.premium && isFree) return alert(t('edit.premiumLocked'))
    set({ ...TPL_RESET, ...tpl.apply })
  }

  const setBgFrame = (p) => {
    const patch = {}
    if (p.posX != null) patch.bgPosX = Math.round(p.posX)
    if (p.posY != null) patch.bgPosY = Math.round(p.posY)
    if (p.zoom != null) patch.bgZoom = p.zoom
    set(patch)
  }

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr('')
    setUploading(true)
    try {
      const { url } = await api.uploadImage(slug, file)
      set({ preset: 'upload', bgType: 'image', bgImage: url, text: 'light', overlay: 0.4 })
    } catch (ex) {
      setErr(ex.message || 'Upload échoué')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* TEMPLATES curés par persona */}
      <div>
        <Label>{t('edit.templates')}</Label>
        <div className="space-y-3">
          {PERSONAS.map((p) => (
            <div key={p.key}>
              <p className="mb-1 font-display text-[11px] font-extrabold uppercase tracking-wide text-ink/50">{p.label[lang] || p.label.fr}</p>
              <div className="grid grid-cols-3 gap-2.5">
                {TEMPLATES.filter((tpl) => tpl.persona === p.key).map((tpl) => {
                  const vid = tpl.apply.introVideo || tpl.apply.bgVideo
                  return (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    title={tpl.desc[lang] || tpl.desc.fr}
                    className={`group relative aspect-[3/4] overflow-hidden rounded-xl border-2 border-ink text-left shadow-hard-sm transition ${theme.template === tpl.key ? 'ring-2 ring-coral ring-offset-2' : 'hover:-translate-y-0.5'}`}
                  >
                    {vid ? (
                      <VideoThumb src={vid} poster={tpl.preview} />
                    ) : (
                      <span className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105" style={{ backgroundImage: `url("${tpl.preview}")` }} />
                    )}
                    <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.78) 12%, rgba(0,0,0,.05) 60%)' }} />
                    {tpl.premium && (
                      <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full border-2 border-ink bg-sun px-1.5 py-0.5 text-[8px] font-extrabold uppercase">
                        {isFree ? <Lock size={9} strokeWidth={3} /> : '✨'} Pro
                      </span>
                    )}
                    {theme.template === tpl.key && (
                      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full border-2 border-ink bg-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 p-2 text-[11px] font-extrabold leading-tight text-white">{tpl.name}</span>
                  </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IMAGE / VIDÉO — importer son propre fond (juste sous les thèmes) */}
      <div>
        <Label>{t('edit.bgImage')}</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="press flex flex-1 items-center justify-center gap-2 rounded-brutal border-2 border-ink bg-white py-2.5 font-display text-sm font-extrabold shadow-hard-sm disabled:opacity-50"
          >
            <Upload size={16} /> {uploading ? t('edit.uploading') : t('edit.upload')}
          </button>
          <button
            type="button"
            onClick={() => (!isFree ? videoRef.current?.click() : alert(t('edit.mediaLocked')))}
            disabled={uploadingVideo}
            className="press flex flex-1 items-center justify-center gap-2 rounded-brutal border-2 border-ink bg-white py-2.5 font-display text-sm font-extrabold shadow-hard-sm disabled:opacity-50"
          >
            {!isFree ? <Film size={16} /> : <Lock size={14} />} {uploadingVideo ? t('edit.uploading') : t('edit.uploadMedia')}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <input ref={videoRef} type="file" accept="video/*,image/gif" onChange={onVideoFile} className="hidden" />
        <p className="mt-1 text-center text-[11px] font-semibold text-ink/50">{t('edit.uploadHint')} · {t('edit.mediaHint')}</p>
        {err && <p className="mt-1 text-center text-xs font-bold text-coral">{err}</p>}

        {theme.bgVideo && theme.bgVideoOwn ? (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-brutal border-2 border-ink bg-cream px-3 py-2 text-sm font-bold">
              <span className="flex items-center gap-2"><Film size={16} /> {t('edit.videoSet')}</span>
              <button type="button" onClick={() => set({ bgVideo: '', bgVideoOwn: false })} className="text-coral">{t('edit.removePhoto')}</button>
            </div>
            <div>
              <Label>{t('edit.frame')}</Label>
              <ImageFramer
                video={theme.bgVideo}
                aspect="9 / 16"
                frame={{ posX: theme.bgPosX, posY: theme.bgPosY, zoom: theme.bgZoom }}
                onChange={setBgFrame}
              />
            </div>
          </div>
        ) : !theme.bgVideo && theme.bgImage ? (
          <div className="mt-3 space-y-3">
            <label className="block text-xs font-bold">
              {t('edit.overlay')} · {Math.round((theme.overlay ?? 0.35) * 100)}%
              <input type="range" min="0" max="0.8" step="0.05" value={theme.overlay ?? 0.35} onChange={(e) => set({ overlay: Number(e.target.value) })} className="mt-1 w-full accent-coral" />
            </label>
            <div>
              <Label>{t('edit.frame')}</Label>
              <ImageFramer
                src={theme.bgImage}
                aspect="9 / 16"
                frame={{ posX: theme.bgPosX, posY: theme.bgPosY, zoom: theme.bgZoom }}
                onChange={setBgFrame}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* STYLE (skin) */}
      <div>
        <Label>{t('edit.style')}</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {Object.entries(STYLES).map(([key, s]) => (
            <button
              key={key}
              type="button"
              onClick={() => set({ style: key, font: s.font, btnStyle: s.btn })}
              className={`rounded-lg border-2 border-ink px-1 py-2 text-[11px] font-extrabold transition ${theme.style === key ? 'bg-ink text-white' : 'bg-white hover:-translate-y-0.5'}`}
            >
              {s.name[lang] || s.name.fr}
            </button>
          ))}
        </div>
      </div>

      {/* LAYOUT */}
      <div>
        <Label>{t('edit.layout')}</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {LAYOUTS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => set({ layout: l.key })}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 border-ink px-1 py-2 text-[10px] font-extrabold uppercase transition ${theme.layout === l.key ? 'bg-ink text-white' : 'bg-white hover:-translate-y-0.5'}`}
            >
              <span className="text-base leading-none">{l.emoji}</span>
              {l.label[lang] || l.label.fr}
            </button>
          ))}
        </div>
      </div>

      {/* Police */}
      <div>
        <Label>{t('edit.font')}</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {Object.entries(FONTS).map(([key, f]) => (
            <button
              key={key}
              type="button"
              onClick={() => set({ font: key })}
              title={f.name[lang] || f.name.fr}
              style={{ fontFamily: f.css }}
              className={`rounded-lg border-2 border-ink px-1 py-2 text-base font-extrabold transition ${theme.font === key ? 'bg-ink text-white' : 'bg-white hover:-translate-y-0.5'}`}
            >
              Aa
            </button>
          ))}
        </div>
      </div>

      {/* Style de bouton */}
      <div>
        <Label>{t('edit.button')}</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {Object.entries(BUTTON_STYLES).map(([key, b]) => (
            <button
              key={key}
              type="button"
              onClick={() => set({ btnStyle: key })}
              className={`rounded-lg border-2 border-ink px-1 py-2 text-[11px] font-extrabold transition ${theme.btnStyle === key ? 'bg-ink text-white' : 'bg-white hover:-translate-y-0.5'}`}
            >
              {b.name[lang] || b.name.fr}
            </button>
          ))}
        </div>
      </div>

      {/* Style d'accroche */}
      <div>
        <Label>{t('edit.headlineStyle')}</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {[['pill', 'edit.hl.pill'], ['line', 'edit.hl.line'], ['accent', 'edit.hl.accent'], ['outline', 'edit.hl.outline'], ['serif', 'edit.hl.serif']].map(([k, lab]) => (
            <button key={k} type="button" onClick={() => set({ headlineStyle: k })} className={`rounded-lg border-2 border-ink px-1 py-2 text-[10px] font-extrabold transition ${(theme.headlineStyle || 'pill') === k ? 'bg-ink text-white' : 'bg-white hover:-translate-y-0.5'}`}>
              {t(lab)}
            </button>
          ))}
        </div>
      </div>

      {/* Ambiance animée (premium) */}
      <div>
        <Label>✨ {t('edit.ambiance')}</Label>
        {isFree ? (
          <p className="rounded-brutal border-2 border-dashed border-ink/30 px-3 py-2 text-xs font-semibold text-ink/50">{t('edit.premiumLocked')}</p>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {[['none', 'edit.anim.none'], ['breathe', 'edit.anim.breathe'], ['pulse', 'edit.anim.pulse'], ['shimmer', 'edit.anim.shimmer']].map(([k, lab]) => (
              <button key={k} type="button" onClick={() => set({ animation: k })} className={`rounded-lg border-2 border-ink px-1 py-2 text-[11px] font-extrabold transition ${(theme.animation || 'none') === k ? 'bg-ink text-white' : 'bg-white hover:-translate-y-0.5'}`}>
                {t(lab)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Réglages communs : texte + accent */}
      <div className="flex flex-wrap items-end gap-4 border-t-2 border-ink/10 pt-3">
        <div>
          <Label>{t('edit.textColor')}</Label>
          <div className="inline-flex overflow-hidden rounded-lg border-2 border-ink text-xs font-extrabold">
            <button type="button" onClick={() => set({ text: 'dark' })} className={`px-3 py-1.5 ${theme.text === 'dark' ? 'bg-ink text-white' : 'bg-white'}`}>{t('edit.textDark')}</button>
            <button type="button" onClick={() => set({ text: 'light' })} className={`px-3 py-1.5 ${theme.text === 'light' ? 'bg-ink text-white' : 'bg-white'}`}>{t('edit.textLight')}</button>
          </div>
        </div>
        <label className="text-xs font-bold">
          <span className="mb-1 flex items-center gap-1"><Sparkles size={12} /> {t('edit.accent')}</span>
          <input type="color" value={theme.accent} onChange={(e) => set({ accent: e.target.value })} className="h-9 w-14 cursor-pointer rounded-lg border-2 border-ink" />
        </label>
      </div>

      {/* Mur de supporters */}
      <button
        type="button"
        onClick={() => set({ showSupporters: !theme.showSupporters })}
        className="flex w-full items-center justify-between gap-3 rounded-brutal border-2 border-ink bg-white px-4 py-3 text-left"
      >
        <span>
          <span className="font-display text-sm font-extrabold">{t('edit.supporters')}</span>
          <span className="block text-[11px] font-semibold text-ink/50">{t('edit.supportersHint')}</span>
        </span>
        <span className={`relative h-6 w-10 shrink-0 rounded-full border-2 border-ink transition ${theme.showSupporters ? 'bg-coral' : 'bg-white'}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full border-2 border-ink bg-white transition-all ${theme.showSupporters ? 'left-4' : 'left-0.5'}`} />
        </span>
      </button>
    </div>
  )
}
