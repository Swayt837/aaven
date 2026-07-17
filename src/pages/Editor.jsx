import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { GripVertical, ChevronUp, ChevronDown, ChevronLeft, Trash2, Eye, QrCode, Plus, X, Upload, RotateCcw, Check } from 'lucide-react'
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
import { toast } from '../components/Toast'
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

// Picker de boutons groupé par OBJECTIF (plutôt qu'une grille plate de 16 types) :
// l'utilisateur pense « je veux encaisser / être réservé », pas « type de bouton ».
const PICK_GROUPS = [
  ['cash', '💶', ['tip', 'services', 'course']],
  ['book', '📅', ['reserve', 'bookcall']],
  ['contact', '📞', ['contact', 'quote', 'call', 'whatsapp']],
  ['show', '🎬', ['products', 'menu', 'reviews', 'directions']],
  ['other', '✨', ['link', 'twitch', 'snapchat']],
]

// Raccourcis d'édition contextuelle affichés sur l'aperçu : le chemin naturel
// devient « je touche ce que je veux changer », le menu par catégories reste en secours.
const EDIT_CHIPS = [
  ['profil', '👤', 'edit.m.profil'],
  ['liens', '🔗', 'edit.m.liens'],
  ['style', '🎨', 'edit.m.style'],
  ['produits', '🛍️', 'edit.m.produits'],
]

// Types de boutons « qui convertissent » pour la checklist de progression.
const CONVERT_TYPES = new Set(['tip', 'services', 'course', 'reserve', 'bookcall', 'quote', 'contact'])

// Checklist « Ta page est prête à X % » : activation + guidage sans tutoriel.
// Chaque étape manquante est cliquable et ouvre directement la bonne section.
function Checklist({ page, theme, buttons, t, onGo }) {
  const activeCount = buttons.filter((b) => b.isActive).length
  const items = [
    ['photo', !!page.avatarUrl, 'profil'],
    ['headline', !!(page.headline || page.bio), 'profil'],
    ['style', !!theme.template || theme.bgType === 'video' || !!theme.bgImage, 'style'],
    ['links', activeCount >= 3, 'liens'],
    ['convert', buttons.some((b) => b.isActive && CONVERT_TYPES.has(b.type)), 'liens'],
  ]
  const done = items.filter(([, ok]) => ok).length
  const pct = Math.round((done / items.length) * 100)
  return (
    <div className="rounded-brutal border-2 border-ink bg-white p-4 shadow-hard-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-sm font-extrabold">
          {pct === 100 ? t('edit.check.done') : t('edit.check.title', { pct })}
        </p>
        <span className="font-display text-sm font-extrabold text-coral">{pct}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-coral transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {pct < 100 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.map(([key, ok, cat]) => (
            <button
              key={key}
              type="button"
              onClick={() => !ok && onGo(cat)}
              disabled={ok}
              className={`press inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${ok ? 'border-transparent bg-ink/5 text-ink/40 line-through' : 'border-ink bg-cream text-ink'}`}
            >
              {ok && <Check size={12} strokeWidth={3} />} {t('edit.check.' + key)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
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
  const [slugErr, setSlugErr] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  // Mode assistant mobile : l'aperçu est l'écran principal, l'édition vit dans un
  // bottom sheet par catégorie. null = fermé · 'menu' = choix · sinon catégorie active.
  // Desktop (lg+) : sans effet, l'éditeur complet reste en colonne.
  const [sheet, setSheet] = useState(null)
  // Sheet extensible : 38vh par défaut (l'aperçu reste roi), 75vh pour les panneaux
  // longs (Style). Toggle via la poignée ou le chevron de l'en-tête.
  const [sheetTall, setSheetTall] = useState(false)
  // Surbrillance temporaire d'une carte (desktop) quand on y accède via un chip.
  const [highlightCat, setHighlightCat] = useState(null)
  const mCat = (k) => (sheet === k ? '' : 'max-lg:hidden') // visibilité mobile d'une carte
  function openCat(k) { setSheet(k); setSheetTall(k === 'style') }
  // Édition contextuelle : ouvre la bonne section depuis un chip sur l'aperçu.
  // Mobile → sheet direct (sans passer par le menu) · desktop → scroll + surbrillance.
  function openSection(cat) {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      openCat(cat)
    } else {
      document.getElementById('sec-' + cat)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setHighlightCat(cat)
      setTimeout(() => setHighlightCat(null), 1500)
    }
  }
  const hl = (k) => (highlightCat === k ? ' ring-4 ring-coral/40' : '')
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

  // Dispo Wallet (config serveur) → boutons « Ajouter au Wallet » dans la carte lien.
  const [wallet, setWallet] = useState(null)
  useEffect(() => {
    api.publicPage(routeSlug).then((d) => setWallet(d.wallet || null)).catch(() => {})
  }, [routeSlug])

  // ---------- Autosave + annulation ----------
  const [dirty, setDirty] = useState(false) // modifs non encore persistées
  const [canUndo, setCanUndo] = useState(false)
  const [slugDraft, setSlugDraft] = useState(null) // le slug ne s'autosave qu'au blur
  const history = useRef([]) // snapshots {page, buttons} pour l'annulation
  const lastAction = useRef({ key: '', t: 0 }) // groupage des rafales (frappe clavier…)
  const rev = useRef(0) // version locale : détecte les modifs pendant un save en vol
  const saveTimer = useRef(null)
  const savingRef = useRef(false)
  const applyingRef = useRef(false) // évite de ré-autosaver la réponse serveur
  const loadedRef = useRef(false) // évite d'autosaver l'état initial du fetch

  function loadProducts() {
    api.products(routeSlug).then((r) => setProducts(r.products || [])).catch(() => {})
  }
  useEffect(() => {
    loadedRef.current = false
    api.getPage(routeSlug).then(({ page, buttons }) => {
      setPage(page)
      setButtons(buttons.sort((a, b) => a.position - b.position))
    }).catch(() => nav('/dashboard'))
    loadProducts()
  }, [routeSlug, nav])

  // Chaque modification (page ou boutons) déclenche un save 1,2 s après la dernière frappe.
  useEffect(() => {
    if (!page) return
    if (!loadedRef.current) { loadedRef.current = true; return } // état initial : rien à sauver
    if (applyingRef.current) { applyingRef.current = false; return } // réponse serveur appliquée
    rev.current++
    setDirty(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(autoSave, 1200)
    return () => clearTimeout(saveTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, buttons])

  if (!page) return <div className="grid min-h-screen place-items-center font-display text-xl">{t('common.loading')}</div>

  const mode = modeOf(page.mode)
  const theme = getTheme(page)
  const activeCount = buttons.filter((b) => b.isActive).length
  const publicUrl = `${window.location.origin}/${page.slug}`

  // Capture l'état AVANT une modification (pour ↩ Annuler). Les rafales d'une même
  // action (frappe dans un champ, glissement d'un slider) sont groupées en 1 snapshot.
  function snapshot(key) {
    const now = Date.now()
    if (lastAction.current.key === key && now - lastAction.current.t < 1200) {
      lastAction.current.t = now
      return
    }
    lastAction.current = { key, t: now }
    history.current.push({ page: structuredClone(page), buttons: structuredClone(buttons) })
    if (history.current.length > 40) history.current.shift()
    setCanUndo(true)
  }
  function undo() {
    const snap = history.current.pop()
    if (!snap) return
    setCanUndo(history.current.length > 0)
    lastAction.current = { key: '', t: 0 }
    setPage(snap.page)
    setButtons(snap.buttons) // l'autosave persiste l'état restauré
  }

  function setField(k, v) { snapshot('field:' + k); setPage((p) => ({ ...p, [k]: v })) }
  function setTheme(patch) { snapshot('theme:' + Object.keys(patch).join(',')); setPage((p) => ({ ...p, theme: { ...getTheme(p), ...patch } })) }
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
      toast.error(ex.message)
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
      toast.error(ex.message)
    } finally {
      setAvatarBusy(false)
      if (avatarRef.current) avatarRef.current.value = ''
    }
  }

  function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= buttons.length) return
    snapshot('move')
    const next = [...buttons]
    ;[next[i], next[j]] = [next[j], next[i]]
    setButtons(next)
  }
  function onDrop(i) {
    const from = dragIndex.current
    if (from === null || from === i) return
    snapshot('move')
    const next = [...buttons]
    const [moved] = next.splice(from, 1)
    next.splice(i, 0, moved)
    setButtons(next)
    dragIndex.current = null
  }
  function updateBtn(id, patch) {
    snapshot('btn:' + id + ':' + Object.keys(patch).join(','))
    setButtons((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }
  function removeBtn(id) {
    snapshot('rm:' + id)
    setButtons((bs) => bs.filter((b) => b.id !== id))
    // Suppression réversible : pas de confirm() bloquant, un toast avec Annuler.
    toast(t('edit.btnDeleted'), { action: { label: t('edit.undo'), onClick: undo } })
  }
  function addBtn(type) {
    snapshot('add')
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
    snapshot('add')
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

  // Autosave : sérialisé (un save à la fois). Si l'utilisateur modifie pendant le
  // vol, la réponse serveur n'est PAS appliquée (elle écraserait ses frappes) —
  // le timer déjà réarmé repartira avec l'état le plus récent.
  async function autoSave() {
    if (savingRef.current) {
      saveTimer.current = setTimeout(autoSave, 600)
      return
    }
    savingRef.current = true
    const myRev = rev.current
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
      if (rev.current === myRev) {
        // Réconciliation : ids serveur des nouveaux boutons + valeurs assainies.
        applyingRef.current = true
        setPage(updated)
        setButtons(nb.sort((a, b) => a.position - b.position))
        setDirty(false)
        if (updated.slug !== routeSlug) nav(`/edit/${updated.slug}`, { replace: true })
      }
    } catch (e) {
      if (e.status === 409) setSlugErr(t('edit.slugTaken'))
      else console.warn('Autosave échoué:', e.message) // silencieux, retentera à la prochaine modif
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Barre sticky — desktop uniquement (mobile : boutons flottants, plus d'aperçu) */}
      <div className="sticky top-0 z-30 border-b-2 border-ink bg-cream/95 backdrop-blur max-lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Button as={Link} to="/dashboard" variant="secondary" size="sm">{t('edit.dashboard')}</Button>
          <div className="flex items-center gap-2">
            {/* Statut autosave : plus de bouton Enregistrer */}
            <span className={`font-display text-sm font-extrabold ${saving || dirty ? 'text-ink/45' : 'text-green-700'}`}>
              {saving ? t('edit.autosaving') : dirty ? t('edit.autosaving') : t('edit.saved')}
            </span>
            <Button variant="secondary" size="sm" onClick={undo} disabled={!canUndo} title={t('edit.undo')}><RotateCcw size={16} /> {t('edit.undo')}</Button>
            <Button variant="secondary" size="sm" onClick={() => setShowQR(true)}><QrCode size={16} /> {t('edit.qr')}</Button>
            <Button as="a" href={`/${page.slug}`} target="_blank" rel="noreferrer" variant="secondary" size="sm"><Eye size={16} /> {t('common.view')}</Button>
          </div>
        </div>
      </div>

      {/* Mobile : boutons flottants minimaux (retour + voir) — la barre est masquée */}
      <div className="fixed left-3 top-3 z-30 lg:hidden">
        <Link to="/dashboard" aria-label={t('edit.dashboard')} className="press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-white shadow-hard-sm">
          <ChevronLeft size={18} strokeWidth={2.5} />
        </Link>
      </div>
      <div className="fixed right-3 top-3 z-30 lg:hidden">
        <a href={`/${page.slug}`} target="_blank" rel="noreferrer" aria-label={t('common.view')} className="press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-white shadow-hard-sm">
          <Eye size={17} />
        </a>
      </div>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 max-lg:pb-24 max-lg:pt-16 lg:grid-cols-2">
        {/* Colonne formulaire — bottom sheet sur mobile (52vh max : l'aperçu réduit
            reste visible au-dessus, pas de voile qui le cacherait) */}
        <div
          className={`space-y-6 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:overflow-y-auto max-lg:rounded-t-[24px] max-lg:border-2 max-lg:border-b-0 max-lg:border-ink max-lg:bg-cream max-lg:px-4 max-lg:pb-10 max-lg:pt-2 max-lg:shadow-[0_-8px_30px_rgba(10,10,10,0.15)] max-lg:transition-all max-lg:duration-300 ${sheetTall ? 'max-lg:max-h-[75vh]' : 'max-lg:max-h-[38vh]'} ${sheet ? 'max-lg:translate-y-0' : 'max-lg:translate-y-[110%]'}`}
        >
          {/* En-tête du sheet (mobile) — la poignée agrandit/réduit le panneau */}
          <div className="sticky -top-2 z-10 -mx-4 border-b border-ink/10 bg-cream px-4 pb-2 pt-2 lg:hidden">
            <button
              type="button"
              onClick={() => setSheetTall((s) => !s)}
              aria-label={sheetTall ? t('edit.sheetShrink') : t('edit.sheetExpand')}
              className="mx-auto -mt-1 mb-1 block w-20 py-1.5"
            >
              <span className="mx-auto block h-1 w-10 rounded-full bg-ink/20" />
            </button>
            <div className="flex items-center justify-between">
              {sheet && sheet !== 'menu' ? (
                <button type="button" onClick={() => setSheet('menu')} className="press font-display text-sm font-extrabold">{t('common.back')}</button>
              ) : (
                <span className="font-display text-sm font-extrabold">{t('edit.m.what')}</span>
              )}
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold ${saving || dirty ? 'text-ink/40' : 'text-green-700'}`}>
                  {saving || dirty ? t('edit.autosaving') : t('edit.saved')}
                </span>
                <button type="button" onClick={undo} disabled={!canUndo} aria-label={t('edit.undo')} className="press rounded-full border-2 border-ink p-1.5 disabled:opacity-30"><RotateCcw size={15} /></button>
                <button
                  type="button"
                  onClick={() => setSheetTall((s) => !s)}
                  aria-label={sheetTall ? t('edit.sheetShrink') : t('edit.sheetExpand')}
                  className="press rounded-full border-2 border-ink p-1.5"
                >
                  {sheetTall ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                </button>
                <button type="button" onClick={() => setSheet(null)} aria-label="Fermer" className="press rounded-full border-2 border-ink p-1.5"><X size={15} /></button>
              </div>
            </div>
          </div>

          {/* Choix de catégorie (mobile) — précédé de la checklist de progression */}
          {sheet === 'menu' && (
            <div className="space-y-2.5 lg:hidden">
              <Checklist page={page} theme={theme} buttons={buttons} t={t} onGo={openCat} />
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['profil', '👤', 'edit.m.profil'],
                  ['liens', '🔗', 'edit.m.liens'],
                  ['reseaux', '📲', 'edit.m.reseaux'],
                  ['style', '🎨', 'edit.m.style'],
                  ['produits', '🛍️', 'edit.m.produits'],
                  ['carte', '📱', 'edit.m.carte'],
                ].map(([key, emoji, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => openCat(key)}
                    className="press rounded-brutal border-2 border-ink bg-white p-4 text-left shadow-hard-sm"
                  >
                    <span className="text-2xl" aria-hidden>{emoji}</span>
                    <span className="font-display mt-1.5 block text-sm font-extrabold">{t(label)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Checklist de progression (desktop — sur mobile elle vit dans le menu du sheet) */}
          <div className="max-lg:hidden">
            <Checklist page={page} theme={theme} buttons={buttons} t={t} onGo={openSection} />
          </div>

          {/* LIEN PUBLIC */}
          <Card id="sec-carte" className={`scroll-mt-24 p-5 transition-shadow ${mCat('carte')}${hl('carte')}`}>
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">{t('share.yourLink')}</h2>
            <ShareLink url={publicUrl} className="mt-3" />
            {/* QR accessible sur mobile (la barre du haut qui le portait y est masquée) */}
            <Button variant="secondary" size="sm" className="mt-3 w-full lg:hidden" onClick={() => setShowQR(true)}>
              <QrCode size={15} /> {t('edit.qr')}
            </Button>
            {/* Ajouter sa propre carte au Wallet (si configuré côté serveur) */}
            {wallet?.apple && (
              <a href={`/api/wallet/apple/${page.slug}`} className="press mt-3 inline-flex w-full items-center justify-center gap-2 rounded-brutal border-2 border-ink bg-black px-4 py-2.5 font-display text-sm font-extrabold text-white">
                 {t('wallet.apple')}
              </a>
            )}
            {wallet?.google && (
              <a href={`/api/wallet/google/${page.slug}`} className="press mt-2 inline-flex w-full items-center justify-center gap-2 rounded-brutal border-2 border-ink bg-white px-4 py-2.5 font-display text-sm font-extrabold text-ink">
                {t('wallet.google')}
              </a>
            )}
            {user?.plan === 'pro' && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(page.slug) && (
              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('share.proLink')}</p>
                <ShareLink url={`https://${page.slug}.aaven.fr`} className="mt-2" />
              </div>
            )}
          </Card>

          {/* IDENTITÉ */}
          <Card id="sec-profil" className={`scroll-mt-24 p-5 transition-shadow ${mCat('profil')}${hl('profil')}`}>
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">{t('edit.identity')}</h2>
            <div className="mt-4 space-y-3">
              <div><Label>{t('edit.title')}</Label><Input value={page.title} onChange={(e) => setField('title', e.target.value)} /></div>
              <div><Label>{t('edit.headline')}</Label><Input value={page.headline || ''} onChange={(e) => setField('headline', e.target.value)} placeholder={t('edit.headlinePh')} maxLength={80} /></div>
              <div>
                <Label>{t('edit.slug')}</Label>
                {/* Brouillon local : le slug ne part à l'autosave qu'au blur (sinon on
                    enregistrerait des slugs partiels à chaque pause de frappe). */}
                <Input
                  value={slugDraft ?? page.slug}
                  onChange={(e) => setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  onBlur={() => {
                    if (slugDraft != null && slugDraft !== page.slug && slugDraft.replace(/^-+|-+$/g, '')) setField('slug', slugDraft)
                    setSlugDraft(null)
                  }}
                />
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
          <Card id="sec-style" className={`scroll-mt-24 p-5 transition-shadow ${mCat('style')}${hl('style')}`}>
            <h2 className="font-display mb-4 text-lg font-extrabold uppercase tracking-wide">{t('edit.theme')}</h2>
            <ThemeEditor slug={routeSlug} theme={theme} plan={user?.plan || 'free'} onChange={setTheme} />
          </Card>

          {/* BOUTONS */}
          <Card id="sec-liens" className={`scroll-mt-24 p-5 transition-shadow ${mCat('liens')}${hl('liens')}`}>
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
                  {/* Boutons classiques groupés par objectif : on choisit un BUT
                      (encaisser, être réservé…), pas un « type de bouton ». */}
                  {PICK_GROUPS.map(([group, emoji, keys]) => {
                    const entries = keys.filter((k) => BUTTON_TYPES[k] && !SOCIALS_IN_RANG.has(k))
                    if (!entries.length) return null
                    return (
                      <div key={group}>
                        <p className="mb-1.5 mt-3 px-1 font-display text-xs font-extrabold uppercase text-ink/60">
                          <span aria-hidden>{emoji}</span> {t('edit.pick.' + group)}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {entries.map((key) => {
                            const def = BUTTON_TYPES[key]
                            return (
                              <button key={key} onClick={() => addBtn(key)} className="press flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-2.5 py-2 text-left text-sm font-bold">
                                <Icon name={def.icon} size={16} /> {def.label[lang] || def.label.fr}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </Card>
              )}
            </div>
            <input ref={btnFileRef} type="file" accept="application/pdf,image/*" onChange={onBtnFile} className="hidden" />
          </Card>

          {/* SMART SOCIALS — catégorie mobile dédiée « Réseaux » (séparée des boutons) */}
          <Card id="sec-reseaux" className={`scroll-mt-24 p-5 transition-shadow ${mCat('reseaux')}${hl('reseaux')}`}>
            <h2 className="font-display mb-4 text-lg font-extrabold uppercase tracking-wide">{t('edit.socials.title')}</h2>
            <SmartSocialsEditor theme={theme} onChange={setTheme} />
          </Card>

          {/* PRODUITS DIGITAUX */}
          <Card id="sec-produits" className={`scroll-mt-24 p-5 transition-shadow ${mCat('produits')}${hl('produits')}`}>
            <h2 className="font-display mb-4 text-lg font-extrabold uppercase tracking-wide">{t('edit.products')}</h2>
            <ProductsEditor slug={routeSlug} products={products} onReload={loadProducts} />
          </Card>
        </div>

        {/* Colonne aperçu live. Mobile + sheet ouvert : l'aperçu se réduit et se fixe
            au-dessus du panneau (échelle calculée sur la hauteur d'écran) → on voit
            ses changements en direct pendant qu'on édite, comme une story. */}
        <div
          className={`relative lg:sticky lg:top-24 lg:self-start ${sheet ? 'max-lg:fixed max-lg:left-1/2 max-lg:top-14 max-lg:z-30 max-lg:w-[340px] max-lg:origin-top max-lg:-translate-x-1/2 max-lg:scale-[var(--pv-scale)]' : ''}`}
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
          {/* Chips d'édition contextuelle (desktop) : on touche ce qu'on veut changer */}
          <div className="absolute right-0 top-16 hidden flex-col gap-2 lg:flex">
            {EDIT_CHIPS.map(([cat, emoji, label]) => (
              <button
                key={cat}
                type="button"
                onClick={() => openSection(cat)}
                title={t(label)}
                aria-label={t(label)}
                className="press grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-white text-lg shadow-hard-sm transition-transform hover:-translate-y-0.5"
              >
                <span aria-hidden>{emoji}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Assistant mobile : l'aperçu est l'écran, ce bouton ouvre le sheet d'édition.
          Les chips verticaux à droite ouvrent directement la bonne section. */}
      {!sheet && (
        <>
          <div className="fixed right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 lg:hidden">
            {EDIT_CHIPS.map(([cat, emoji, label]) => (
              <button
                key={cat}
                type="button"
                onClick={() => openSection(cat)}
                aria-label={t(label)}
                className="press grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-white/95 text-lg shadow-hard-sm backdrop-blur"
              >
                <span aria-hidden>{emoji}</span>
              </button>
            ))}
          </div>
          <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden">
            <button
              type="button"
              onClick={() => setSheet('menu')}
              className="press w-full rounded-brutal border-2 border-ink bg-coral py-3.5 font-display text-base font-extrabold text-white shadow-hard"
            >
              ✨ {t('edit.m.modify')}
            </button>
          </div>
        </>
      )}

      {showQR && <QRModal url={publicUrl} page={page} onClose={() => setShowQR(false)} />}
    </div>
  )
}
