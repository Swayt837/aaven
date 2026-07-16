import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { GripVertical, ChevronUp, ChevronDown, Trash2, Eye, QrCode, Plus, X, Upload } from 'lucide-react'
import { Button, Card, Input, Textarea, Label } from '../components/ui'
import { Icon } from '../components/Icon'
import { PhoneFrame, BioImmersive } from '../components/PhoneMockup'
import { ThemeEditor } from '../components/ThemeEditor'
import { ImageFramer } from '../components/ImageFramer'
import { ProductsEditor } from '../components/ProductsEditor'
import { ServicesItemsEditor } from '../components/ServicesItemsEditor'
import { LinksEditor } from '../components/LinksEditor'
import { SmartLinkInput, SmartManualTiles, SmartConfigEditor } from '../components/SmartContentEditor'
import { SmartSocialsEditor } from '../components/SmartSocialsEditor'
import { QRModal } from '../components/QRModal'
import { ShareLink } from '../components/ShareLink'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { modeOf, BUTTON_TYPES } from '../lib/modes'
import { getTheme } from '../lib/themes'
import { nanoid } from 'nanoid'

// Réseaux couverts par le rang Smart Socials → retirés du picker de boutons classiques.
// (Les boutons sociaux existants sur les anciennes pages restent affichés et éditables.)
const SOCIALS_IN_RANG = new Set(['instagram', 'tiktok', 'youtube', 'spotify', 'x', 'linkedin', 'facebook'])

// Suggestions de CTA émotionnels par métier (personnalisables).
const EMO_CTAS = {
  creator: {
    fr: ['Soutiens mon travail 💛', 'Offre-moi un café ☕', 'Soutiens ma prochaine création ✨', 'Garde le stream en vie 🎮'],
    en: ['Support my work 💛', 'Buy me a coffee ☕', 'Support my next creation ✨', 'Keep the stream alive 🎮'],
  },
  bar: {
    fr: ['Offre-moi un cocktail 🍸', 'Offre-nous un café ☕', 'Soutiens l’équipe 🙌'],
    en: ['Offer me a cocktail 🍸', 'Buy us a coffee ☕', 'Support the team 🙌'],
  },
  freelance: {
    fr: ['Soutiens mon studio ✨', 'Offre-moi un café ☕', 'Finance mon prochain projet 🚀'],
    en: ['Support my studio ✨', 'Buy me a coffee ☕', 'Fund my next project 🚀'],
  },
}

const SUPPORTERS_SAMPLE = {
  count: 128,
  supporters: [
    { id: 's1', name: 'Thomas', message: 'Merci pour le cocktail 🍸', reply: 'Merci Thomas ❤️' },
    { id: 's2', name: 'Léa', message: 'Continue comme ça ✨', reply: '' },
  ],
}

export default function Editor() {
  const { slug: routeSlug } = useParams()
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const nav = useNavigate()

  const [page, setPage] = useState(null)
  const [buttons, setButtons] = useState([])
  const [products, setProducts] = useState([])
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [slugErr, setSlugErr] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  // Mode assistant mobile : l'aperçu est l'écran principal, l'édition vit dans un
  // bottom sheet par catégorie. null = fermé · 'menu' = choix · sinon catégorie active.
  // Desktop (lg+) : sans effet, l'éditeur complet reste en colonne.
  const [sheet, setSheet] = useState(null)
  const mCat = (k) => (sheet === k ? '' : 'max-lg:hidden') // visibilité mobile d'une carte
  // Échelle de l'aperçu réduit (sheet ouvert) : l'aperçu occupe ~60-70% de l'écran.
  const [pvScale, setPvScale] = useState(0.6)
  useEffect(() => {
    const fit = () => setPvScale(Math.min(0.72, Math.max(0.35, (window.innerHeight * 0.63 - 70) / 660)))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  const [avatarBusy, setAvatarBusy] = useState(false)
  const dragIndex = useRef(null)
  const avatarRef = useRef(null)
  const btnFileRef = useRef(null)
  const pendingBtn = useRef(null)

  function loadProducts() {
    api.products(routeSlug).then((r) => setProducts(r.products || [])).catch(() => {})
  }
  useEffect(() => {
    api.getPage(routeSlug).then(({ page, buttons }) => {
      setPage(page)
      setButtons(buttons.sort((a, b) => a.position - b.position))
    }).catch(() => nav('/dashboard'))
    loadProducts()
  }, [routeSlug, nav])

  if (!page) return <div className="grid min-h-screen place-items-center font-display text-xl">{t('common.loading')}</div>

  const mode = modeOf(page.mode)
  const theme = getTheme(page)
  const activeCount = buttons.filter((b) => b.isActive).length
  const publicUrl = `${window.location.origin}/${page.slug}`

  function setField(k, v) { setPage((p) => ({ ...p, [k]: v })) }
  function setTheme(patch) { setPage((p) => ({ ...p, theme: { ...getTheme(p), ...patch } })) }
  function setAvatarFrame(p) {
    const patch = {}
    if (p.posX != null) patch.avPosX = Math.round(p.posX)
    if (p.posY != null) patch.avPosY = Math.round(p.posY)
    if (p.zoom != null) patch.avZoom = p.zoom
    setTheme(patch)
  }
  function setTipAmount(idx, val) {
    const arr = [...(getTheme(page).tipAmounts || [3, 5, 10, 20])]
    arr[idx] = Math.max(1, Math.round(Number(val) || 0))
    setTheme({ tipAmounts: arr })
  }

  function pickBtnFile(id) {
    pendingBtn.current = id
    btnFileRef.current?.click()
  }
  async function onBtnFile(e) {
    const file = e.target.files?.[0]
    const id = pendingBtn.current
    if (!file || !id) return
    try {
      const { url } = await api.uploadMedia(routeSlug, file)
      updateBtn(id, { url })
    } catch (ex) {
      alert(ex.message)
    } finally {
      pendingBtn.current = null
      if (btnFileRef.current) btnFileRef.current.value = ''
    }
  }

  async function onAvatarFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarBusy(true)
    try {
      const { url } = await api.uploadImage(routeSlug, file)
      setField('avatarUrl', url)
    } catch (ex) {
      alert(ex.message)
    } finally {
      setAvatarBusy(false)
      if (avatarRef.current) avatarRef.current.value = ''
    }
  }

  function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= buttons.length) return
    const next = [...buttons]
    ;[next[i], next[j]] = [next[j], next[i]]
    setButtons(next)
  }
  function onDrop(i) {
    const from = dragIndex.current
    if (from === null || from === i) return
    const next = [...buttons]
    const [moved] = next.splice(from, 1)
    next.splice(i, 0, moved)
    setButtons(next)
    dragIndex.current = null
  }
  function updateBtn(id, patch) {
    setButtons((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }
  function removeBtn(id) {
    setButtons((bs) => bs.filter((b) => b.id !== id))
  }
  function addBtn(type) {
    const def = BUTTON_TYPES[type]
    setButtons((bs) => [
      ...bs,
      {
        id: nanoid(8),
        type,
        label: def.label[lang] || def.label.fr,
        icon: def.icon,
        url: '',
        isActive: true,
        featured: false,
        clicks: 0,
        _new: true,
      },
    ])
    setShowPicker(false)
  }

  // Smart Content : ajoute une carte (config résolue depuis un lien, ou kind manuel).
  function addSmartBtn(config, title) {
    setButtons((bs) => [
      ...bs,
      {
        id: nanoid(8),
        type: 'smart',
        label: (title || 'Smart Content').slice(0, 60),
        icon: 'Sparkles',
        url: config.url || '',
        config,
        isActive: true,
        featured: false,
        clicks: 0,
        _new: true,
      },
    ])
    setShowPicker(false)
  }

  async function save() {
    setSaving(true)
    setSlugErr('')
    try {
      const payload = {
        ...page,
        buttons: buttons.map((b, i) => ({
          id: b._new ? undefined : b.id,
          type: b.type,
          label: b.label,
          icon: b.icon,
          url: b.url,
          config: b.config,
          isActive: b.isActive,
          featured: b.featured,
          position: i,
        })),
      }
      const { page: updated, buttons: nb } = await api.updatePage(routeSlug, payload)
      setPage(updated)
      setButtons(nb.sort((a, b) => a.position - b.position))
      setSavedMsg(t('edit.saved'))
      setTimeout(() => setSavedMsg(''), 2000)
      if (updated.slug !== routeSlug) nav(`/edit/${updated.slug}`, { replace: true })
    } catch (e) {
      if (e.status === 409) setSlugErr(t('edit.slugTaken'))
      else alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Barre sticky */}
      <div className="sticky top-0 z-30 border-b-2 border-ink bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Button as={Link} to="/dashboard" variant="secondary" size="sm">{t('edit.dashboard')}</Button>
          <div className="flex items-center gap-2">
            {savedMsg && <span className="font-display text-sm font-extrabold text-green-700">{savedMsg}</span>}
            <Button variant="secondary" size="sm" onClick={() => setShowQR(true)}><QrCode size={16} /> {t('edit.qr')}</Button>
            <Button as="a" href={`/${page.slug}`} target="_blank" rel="noreferrer" variant="secondary" size="sm"><Eye size={16} /> {t('common.view')}</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? t('common.loading') : t('common.save')}</Button>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 max-lg:pb-24 lg:grid-cols-2">
        {/* Colonne formulaire — bottom sheet sur mobile (52vh max : l'aperçu réduit
            reste visible au-dessus, pas de voile qui le cacherait) */}
        <div
          className={`space-y-6 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:max-h-[38vh] max-lg:overflow-y-auto max-lg:rounded-t-[24px] max-lg:border-2 max-lg:border-b-0 max-lg:border-ink max-lg:bg-cream max-lg:px-4 max-lg:pb-10 max-lg:pt-2 max-lg:shadow-[0_-8px_30px_rgba(10,10,10,0.15)] max-lg:transition-transform max-lg:duration-300 ${sheet ? 'max-lg:translate-y-0' : 'max-lg:translate-y-[110%]'}`}
        >
          {/* En-tête du sheet (mobile) */}
          <div className="sticky -top-2 z-10 -mx-4 border-b border-ink/10 bg-cream px-4 pb-2 pt-2 lg:hidden">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink/20" />
            <div className="flex items-center justify-between">
              {sheet && sheet !== 'menu' ? (
                <button type="button" onClick={() => setSheet('menu')} className="press font-display text-sm font-extrabold">← {t('common.back')}</button>
              ) : (
                <span className="font-display text-sm font-extrabold">{t('edit.m.what')}</span>
              )}
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={save} disabled={saving}>{saving ? '…' : t('common.save')}</Button>
                <button type="button" onClick={() => setSheet(null)} aria-label="Fermer" className="press rounded-full border-2 border-ink p-1.5"><X size={15} /></button>
              </div>
            </div>
          </div>

          {/* Choix de catégorie (mobile) */}
          {sheet === 'menu' && (
            <div className="grid grid-cols-2 gap-2.5 lg:hidden">
              {[
                ['profil', '👤', 'edit.m.profil'],
                ['liens', '🔗', 'edit.m.liens'],
                ['style', '🎨', 'edit.m.style'],
                ['produits', '🛍️', 'edit.m.produits'],
                ['carte', '📱', 'edit.m.carte'],
              ].map(([key, emoji, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSheet(key)}
                  className="press rounded-brutal border-2 border-ink bg-white p-4 text-left shadow-hard-sm"
                >
                  <span className="text-2xl" aria-hidden>{emoji}</span>
                  <span className="font-display mt-1.5 block text-sm font-extrabold">{t(label)}</span>
                </button>
              ))}
            </div>
          )}

          {/* LIEN PUBLIC */}
          <Card className={`p-5 ${mCat('carte')}`}>
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">{t('share.yourLink')}</h2>
            <ShareLink url={publicUrl} className="mt-3" />
            {user?.plan === 'pro' && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(page.slug) && (
              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('share.proLink')}</p>
                <ShareLink url={`https://${page.slug}.aaven.fr`} className="mt-2" />
              </div>
            )}
          </Card>

          {/* IDENTITÉ */}
          <Card className={`p-5 ${mCat('profil')}`}>
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">{t('edit.identity')}</h2>
            <div className="mt-4 space-y-3">
              <div><Label>{t('edit.title')}</Label><Input value={page.title} onChange={(e) => setField('title', e.target.value)} /></div>
              <div><Label>{t('edit.headline')}</Label><Input value={page.headline || ''} onChange={(e) => setField('headline', e.target.value)} placeholder={t('edit.headlinePh')} maxLength={80} /></div>
              <div>
                <Label>{t('edit.slug')}</Label>
                <Input value={page.slug} onChange={(e) => setField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
                {slugErr && <p className="mt-1 text-sm font-bold text-coral">{slugErr}</p>}
              </div>
              <div><Label>{t('edit.bio')}</Label><Textarea rows={2} value={page.bio || ''} onChange={(e) => setField('bio', e.target.value)} placeholder={t('edit.bioPh')} /></div>
              <div><Label>{t('edit.location')}</Label><Input value={theme.location || ''} onChange={(e) => setTheme({ location: e.target.value })} placeholder={t('edit.locationPh')} maxLength={80} /></div>

              <div>
                <Label>{t('edit.avatar')}</Label>
                {page.avatarUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={page.avatarUrl} alt="" className="h-14 w-14 rounded-full border-2 border-ink object-cover" />
                    <Button variant="secondary" size="sm" onClick={() => avatarRef.current?.click()}>{t('edit.change')}</Button>
                    <button type="button" onClick={() => setField('avatarUrl', '')} className="press text-sm font-bold text-coral">{t('edit.removePhoto')}</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => avatarRef.current?.click()}
                    disabled={avatarBusy}
                    className="press flex w-full items-center justify-center gap-2 rounded-brutal border-2 border-ink bg-white py-2.5 font-display text-sm font-extrabold shadow-hard-sm disabled:opacity-50"
                  >
                    <Upload size={16} /> {avatarBusy ? t('edit.uploading') : t('edit.uploadPhoto')}
                  </button>
                )}
                <input ref={avatarRef} type="file" accept="image/*" onChange={onAvatarFile} className="hidden" />
                {page.avatarUrl && (
                  <div className="mt-3">
                    <ImageFramer
                      src={page.avatarUrl}
                      round
                      frame={{ posX: theme.avPosX, posY: theme.avPosY, zoom: theme.avZoom }}
                      onChange={setAvatarFrame}
                    />
                  </div>
                )}
              </div>

              <p className="text-xs font-semibold text-ink/50">{t('edit.imageHint')}</p>

              <button
                type="button"
                onClick={() => setTheme({ noindex: !theme.noindex })}
                className="flex w-full items-center justify-between gap-3 rounded-brutal border-2 border-ink bg-white px-4 py-3 text-left"
              >
                <span>
                  <span className="font-display text-sm font-extrabold">{t('edit.seoIndex')}</span>
                  <span className="block text-[11px] font-semibold text-ink/50">{t('edit.seoIndexHint')}</span>
                </span>
                <span className={`relative h-6 w-10 shrink-0 rounded-full border-2 border-ink transition ${!theme.noindex ? 'bg-coral' : 'bg-white'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full border-2 border-ink bg-white transition-all ${!theme.noindex ? 'left-4' : 'left-0.5'}`} />
                </span>
              </button>
            </div>
          </Card>

          {/* THÈME & STYLE */}
          <Card className={`p-5 ${mCat('style')}`}>
            <h2 className="font-display mb-4 text-lg font-extrabold uppercase tracking-wide">{t('edit.theme')}</h2>
            <ThemeEditor slug={routeSlug} theme={theme} plan={user?.plan || 'free'} onChange={setTheme} />
          </Card>

          {/* BOUTONS */}
          <Card className={`p-5 ${mCat('liens')}`}>
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">
              {t('edit.buttons')} · {activeCount} {t('edit.buttonsActive')}
            </h2>

            <div className="mt-4 space-y-2">
              {buttons.map((b, i) => (
                <div
                  key={b.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(i)}
                  className={`rounded-brutal border-2 border-ink bg-white p-2.5 ${b.isActive ? '' : 'opacity-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      draggable
                      onDragStart={() => (dragIndex.current = i)}
                      aria-hidden
                      className="shrink-0 cursor-grab text-ink/40"
                    >
                      <GripVertical size={16} />
                    </span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-ink" style={{ background: mode.cardBg }}>
                      <Icon name={b.icon} size={16} />
                    </span>
                    <input
                      value={b.label}
                      onChange={(e) => updateBtn(b.id, { label: e.target.value })}
                      className="min-w-0 flex-1 rounded-lg border-2 border-ink px-2 py-1.5 font-display text-sm font-extrabold"
                    />
                    <div className="flex shrink-0 flex-col">
                      <button onClick={() => move(i, -1)} aria-label="↑" className="press"><ChevronUp size={16} /></button>
                      <button onClick={() => move(i, 1)} aria-label="↓" className="press"><ChevronDown size={16} /></button>
                    </div>
                    <button
                      onClick={() => updateBtn(b.id, { isActive: !b.isActive })}
                      className={`relative h-6 w-10 shrink-0 rounded-full border-2 border-ink transition ${b.isActive ? 'bg-coral' : 'bg-white'}`}
                      aria-label="actif"
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full border-2 border-ink bg-white transition-all ${b.isActive ? 'left-4' : 'left-0.5'}`} />
                    </button>
                    <button onClick={() => removeBtn(b.id)} aria-label={t('common.delete')} className="press shrink-0 text-coral"><Trash2 size={16} /></button>
                  </div>
                  {b.type === 'smart' && (
                    <SmartConfigEditor
                      slug={routeSlug}
                      button={b}
                      plan={user?.plan || 'free'}
                      onChange={(config) => updateBtn(b.id, { config, url: config.url || '' })}
                    />
                  )}
                  {b.type !== 'tip' && b.type !== 'smart' && b.type !== 'link' && b.type !== 'products' && BUTTON_TYPES[b.type]?.action !== 'contact' && !(b.type === 'reserve' && (b.config?.mode || 'link') !== 'link') && (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={b.url || ''}
                        onChange={(e) => updateBtn(b.id, { url: e.target.value })}
                        placeholder={BUTTON_TYPES[b.type]?.urlPh || t('edit.url')}
                        className="min-w-0 flex-1 rounded-lg border-2 border-ink/30 px-2 py-1.5 text-sm"
                      />
                      <button type="button" onClick={() => pickBtnFile(b.id)} title={t('edit.uploadFile')} className="press grid shrink-0 place-items-center rounded-lg border-2 border-ink bg-white px-2.5">
                        <Upload size={15} />
                      </button>
                    </div>
                  )}
                  {BUTTON_TYPES[b.type]?.action === 'services' && (
                    <ServicesItemsEditor
                      items={b.config?.items}
                      onChange={(items) => updateBtn(b.id, { config: { ...(b.config || {}), items } })}
                    />
                  )}
                  {b.type === 'link' && (
                    <LinksEditor
                      items={b.config?.links?.length ? b.config.links : (b.url ? [{ url: b.url, label: '' }] : [])}
                      onChange={(links) => updateBtn(b.id, { config: { ...(b.config || {}), links } })}
                    />
                  )}
                  {b.type === 'products' && (
                    <LinksEditor
                      items={b.config?.links?.length ? b.config.links : (b.url ? [{ url: b.url, label: '' }] : [])}
                      onChange={(links) => updateBtn(b.id, { config: { ...(b.config || {}), links } })}
                      labelKeys={{ title: 'edit.products.title', url: 'edit.products.url', label: 'edit.products.label', add: 'edit.products.add' }}
                    />
                  )}
                  {b.type === 'reserve' && (
                    <div className="mt-2">
                      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/40">{t('edit.reserve.mode')}</p>
                      <div className="flex gap-1.5">
                        {['link', 'phone', 'form'].map((m) => {
                          const cur = b.config?.mode || 'link'
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => updateBtn(b.id, { config: { ...(b.config || {}), mode: m } })}
                              className={`press flex-1 rounded-lg border-2 border-ink px-2 py-1.5 text-xs font-bold ${cur === m ? 'bg-ink text-white' : 'bg-white'}`}
                            >
                              {t('edit.reserve.' + m)}
                            </button>
                          )
                        })}
                      </div>
                      {(b.config?.mode || 'link') === 'phone' && (
                        <input
                          value={b.config?.phone || ''}
                          onChange={(e) => updateBtn(b.id, { config: { ...(b.config || {}), phone: e.target.value } })}
                          placeholder="+33 6 12 34 56 78"
                          className="mt-2 w-full rounded-lg border-2 border-ink/30 px-2 py-1.5 text-sm"
                        />
                      )}
                      {(b.config?.mode || 'link') === 'form' && (
                        <p className="mt-2 text-xs font-medium text-ink/55">{t('edit.reserve.formHint')}</p>
                      )}
                    </div>
                  )}
                  {b.type === 'quote' && (
                    <div className="mt-2">
                      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/40">{t('edit.quote.mode')}</p>
                      <div className="flex gap-1.5">
                        {['whatsapp', 'email', 'form'].map((m) => {
                          const cur = b.config?.mode || 'form'
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => updateBtn(b.id, { config: { ...(b.config || {}), mode: m } })}
                              className={`press flex-1 rounded-lg border-2 border-ink px-2 py-1.5 text-xs font-bold ${cur === m ? 'bg-ink text-white' : 'bg-white'}`}
                            >
                              {t('edit.quote.' + m)}
                            </button>
                          )
                        })}
                      </div>
                      {(b.config?.mode || 'form') === 'whatsapp' && (
                        <input
                          value={b.config?.phone || ''}
                          onChange={(e) => updateBtn(b.id, { config: { ...(b.config || {}), phone: e.target.value } })}
                          placeholder="+33 6 12 34 56 78"
                          className="mt-2 w-full rounded-lg border-2 border-ink/30 px-2 py-1.5 text-sm"
                        />
                      )}
                      {(b.config?.mode || 'form') === 'email' && (
                        <input
                          value={b.config?.email || ''}
                          onChange={(e) => updateBtn(b.id, { config: { ...(b.config || {}), email: e.target.value } })}
                          placeholder="contact@exemple.com"
                          className="mt-2 w-full rounded-lg border-2 border-ink/30 px-2 py-1.5 text-sm"
                        />
                      )}
                      <p className="mt-2 text-xs font-medium text-ink/55">{t('edit.quote.hint')}</p>
                    </div>
                  )}
                  {b.type === 'contact' && (
                    <div className="mt-2">
                      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/40">{t('edit.contact.mode')}</p>
                      <div className="flex gap-1.5">
                        {['form', 'email', 'whatsapp'].map((m) => {
                          const cur = b.config?.mode || 'form'
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => updateBtn(b.id, { config: { ...(b.config || {}), mode: m } })}
                              className={`press flex-1 rounded-lg border-2 border-ink px-2 py-1.5 text-xs font-bold ${cur === m ? 'bg-ink text-white' : 'bg-white'}`}
                            >
                              {t('edit.contact.' + m)}
                            </button>
                          )
                        })}
                      </div>
                      {(b.config?.mode || 'form') === 'email' && (
                        <input
                          value={b.config?.email || ''}
                          onChange={(e) => updateBtn(b.id, { config: { ...(b.config || {}), email: e.target.value } })}
                          placeholder="contact@exemple.com"
                          className="mt-2 w-full rounded-lg border-2 border-ink/30 px-2 py-1.5 text-sm"
                        />
                      )}
                      {(b.config?.mode || 'form') === 'whatsapp' && (
                        <input
                          value={b.config?.phone || ''}
                          onChange={(e) => updateBtn(b.id, { config: { ...(b.config || {}), phone: e.target.value } })}
                          placeholder="+33 6 12 34 56 78"
                          className="mt-2 w-full rounded-lg border-2 border-ink/30 px-2 py-1.5 text-sm"
                        />
                      )}
                      <p className="mt-2 text-xs font-medium text-ink/55">{t('edit.contact.hint')}</p>
                    </div>
                  )}
                  {b.type === 'tip' && (
                    <div className="mt-2">
                      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/40">{t('edit.ctaIdeas')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(EMO_CTAS[page.mode]?.[lang] || EMO_CTAS[page.mode]?.fr || []).map((s) => (
                          <button key={s} type="button" onClick={() => updateBtn(b.id, { label: s })} className="press rounded-full border-2 border-ink bg-cream px-2.5 py-1 text-xs font-bold">
                            {s}
                          </button>
                        ))}
                      </div>
                      <p className="mb-1 mt-3 text-[10px] font-extrabold uppercase tracking-wide text-ink/40">{t('edit.tipAmounts')}</p>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            type="number"
                            min="1"
                            value={(theme.tipAmounts || [3, 5, 10, 20])[idx] ?? ''}
                            onChange={(e) => setTipAmount(idx, e.target.value)}
                            className="w-16 rounded-lg border-2 border-ink px-2 py-1.5 text-sm font-bold"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="relative mt-3">
              <Button variant="secondary" className="w-full" onClick={() => setShowPicker((s) => !s)}>
                <Plus size={16} /> {t('edit.addButton')}
              </Button>
              {showPicker && (
                <Card className="absolute left-0 right-0 z-20 mt-2 max-h-96 overflow-auto p-3">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="font-display text-xs font-extrabold uppercase text-ink/60">{t('edit.pickType')}</span>
                    <button onClick={() => setShowPicker(false)}><X size={16} /></button>
                  </div>
                  {/* Smart Content : colle un lien → carte auto, ou carte visuelle manuelle */}
                  <div className="space-y-3 rounded-brutal border-2 border-ink bg-cream/70 p-3">
                    <SmartLinkInput onAdd={addSmartBtn} />
                    <SmartManualTiles onAdd={addSmartBtn} />
                  </div>
                  <p className="mb-1.5 mt-3 px-1 font-display text-xs font-extrabold uppercase text-ink/60">{t('edit.smart.classic')}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(BUTTON_TYPES).filter(([key]) => key !== 'smart' && !SOCIALS_IN_RANG.has(key)).map(([key, def]) => (
                      <button key={key} onClick={() => addBtn(key)} className="press flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-2.5 py-2 text-left text-sm font-bold">
                        <Icon name={def.icon} size={16} /> {def.label[lang] || def.label.fr}
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
            <input ref={btnFileRef} type="file" accept="application/pdf,image/*" onChange={onBtnFile} className="hidden" />
          </Card>

          {/* SMART SOCIALS */}
          <Card className={`p-5 ${mCat('liens')}`}>
            <h2 className="font-display mb-4 text-lg font-extrabold uppercase tracking-wide">{t('edit.socials.title')}</h2>
            <SmartSocialsEditor theme={theme} onChange={setTheme} />
          </Card>

          {/* PRODUITS DIGITAUX */}
          <Card className={`p-5 ${mCat('produits')}`}>
            <h2 className="font-display mb-4 text-lg font-extrabold uppercase tracking-wide">{t('edit.products')}</h2>
            <ProductsEditor slug={routeSlug} products={products} onReload={loadProducts} />
          </Card>
        </div>

        {/* Colonne aperçu live. Mobile + sheet ouvert : l'aperçu se réduit et se fixe
            au-dessus du panneau (échelle calculée sur la hauteur d'écran) → on voit
            ses changements en direct pendant qu'on édite, comme une story. */}
        <div
          className={`lg:sticky lg:top-24 lg:self-start ${sheet ? 'max-lg:fixed max-lg:left-1/2 max-lg:top-14 max-lg:z-30 max-lg:w-[340px] max-lg:origin-top max-lg:-translate-x-1/2 max-lg:scale-[var(--pv-scale)]' : ''}`}
          style={{ '--pv-scale': pvScale }}
        >
          <p className={`font-display mb-3 text-center text-xs font-extrabold uppercase tracking-widest text-ink/50 ${sheet ? 'max-lg:hidden' : ''}`}>{t('edit.preview')}</p>
          <PhoneFrame bg={mode.cardBg} bare>
            <BioImmersive
              page={page}
              buttons={buttons}
              supporters={theme.showSupporters ? SUPPORTERS_SAMPLE : null}
              products={products.filter((p) => p.active)}
              branding={(user?.plan || 'free') !== 'pro'}
              kenBurns={false}
            />
          </PhoneFrame>
        </div>
      </main>

      {/* Assistant mobile : l'aperçu est l'écran, ce bouton ouvre le sheet d'édition */}
      {!sheet && (
        <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden">
          <button
            type="button"
            onClick={() => setSheet('menu')}
            className="press w-full rounded-brutal border-2 border-ink bg-coral py-3.5 font-display text-base font-extrabold text-white shadow-hard"
          >
            ✨ {t('edit.m.modify')}
          </button>
        </div>
      )}

      {showQR && <QRModal url={publicUrl} page={page} onClose={() => setShowQR(false)} />}
    </div>
  )
}
