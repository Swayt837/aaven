import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { QrCode, Wallet } from 'lucide-react'
import { Header } from '../components/Header'
import { Button, Card, Input, Textarea, Label } from '../components/ui'
import { ShareLink } from '../components/ShareLink'
import { QRModal } from '../components/QRModal'
import { PhoneFrame, BioImmersive } from '../components/PhoneMockup'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { MODES, PRESETS, BUTTON_TYPES } from '../lib/modes'
import { track } from '../lib/analytics'
import { PROFESSIONS_BY_CATEGORY, professionBySlug } from '../lib/professions'
import { modeForCategory, themeForProfession, blockToButton, SOCIAL_BUTTON_TYPES } from '../lib/professionEngine'
import { saveDraft, readDraft, clearDraft } from '../lib/draft'
import { toast } from '../components/Toast'

// Étape 1 : l'objectif compte plus que le métier (un photographe et un bartender
// peuvent vouloir la même chose). Sert l'analytics + le sentiment de progression.
const GOALS = [
  { key: 'clients', emoji: '🎯' },
  { key: 'sell', emoji: '💰' },
  { key: 'community', emoji: '📱' },
  { key: 'present', emoji: '🤝' },
]

export default function Onboarding() {
  const { t, lang } = useI18n()
  const { user, loading } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  // steps : 'goal' (objectif) → 'profession' (picker) → 'mode' (fallback) → 'identity'
  //         → 'preview' (invités : aperçu de LA page avant le login) → 'done'
  const [step, setStep] = useState('goal')
  const [goal, setGoal] = useState(null)
  const [profession, setProfession] = useState(null) // objet profession ou null (générique)
  const [mode, setMode] = useState(null)
  const [title, setTitle] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null) // page créée → écran de succès
  const [wallet, setWallet] = useState(null) // dispo Apple/Google Wallet (config serveur)
  const [showQR, setShowQR] = useState(false)

  // Arrivée depuis une landing métier (?profession= ou localStorage à travers le login)
  // → on saute objectif + picker et on pré-applique le template.
  useEffect(() => {
    let slug = params.get('profession')
    if (!slug) { try { slug = localStorage.getItem('bb_profession') } catch { /* private mode */ } }
    const p = slug && professionBySlug(slug)
    if (p) {
      setProfession(p)
      setMode(modeForCategory(p.category))
      setStep('identity')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pickGoal(g) {
    setGoal(g)
    track('onboarding_goal', { goal: g })
    setStep('profession')
  }

  const cards = [
    { m: MODES.creator, label: 'onb.creator.label', desc: 'onb.creator.desc', name: 'Créateur', color: '#F0426B' },
    { m: MODES.bar, label: 'onb.bar.label', desc: 'onb.bar.desc', name: 'Établissement', color: '#EF5A4C' },
    { m: MODES.freelance, label: 'onb.freelance.label', desc: 'onb.freelance.desc', name: 'Freelance', color: '#2547D0' },
  ]

  function pickProfession(p) {
    setProfession(p)
    setMode(modeForCategory(p.category))
    track('profession_selected', { profession: p.slug, category: p.category })
    setStep('identity')
  }

  // Création serveur — utilisée par le flux connecté ET par la reprise de brouillon
  // post-login (qui ne peut pas dépendre du state React, mis à jour de façon asynchrone).
  async function createFrom(d) {
    setBusy(true)
    try {
      const body = { title: d.title.trim(), headline: (d.headline || '').trim(), bio: (d.bio || '').trim(), mode: d.mode }
      if (d.profession) body.profession = d.profession
      const { page } = await api.createPage(body)
      track('page_created', { mode: d.mode, profession: d.profession || 'generic', goal: d.goal || 'skipped' })
      if (d.profession) track('template_applied', { profession: d.profession })
      try { localStorage.removeItem('bb_profession') } catch { /* noop */ }
      clearDraft()
      // Dispo Wallet (dépend de la config serveur) pour le « moment magique ».
      api.publicPage(page.slug).then((w) => setWallet(w.wallet || null)).catch(() => {})
      setCreated(page)
      setStep('done')
    } catch (e) {
      toast.error(e.message)
      setStep('identity') // reprise manuelle, champs préremplis
    } finally {
      setBusy(false)
    }
  }

  function create() {
    if (!title.trim()) return
    // Invité : pas de mur de connexion ici — on lui montre d'abord SA page.
    if (!user) {
      track('guest_preview', { profession: profession?.slug || 'generic' })
      setStep('preview')
      return
    }
    createFrom({ title, headline, bio, mode, profession: profession?.slug, goal })
  }

  // Invité qui veut publier : le brouillon traverse le login via localStorage
  // (les redirections OAuth externes perdent le state React), puis la création
  // est rejouée automatiquement au retour.
  function publishAsGuest() {
    saveDraft({ title: title.trim(), headline: headline.trim(), bio: bio.trim(), mode, profession: profession?.slug || '', goal })
    if (profession) { try { localStorage.setItem('bb_profession', profession.slug) } catch { /* noop */ } }
    track('guest_draft_saved', { profession: profession?.slug || 'generic' })
    nav('/login')
  }

  // Reprise post-login : brouillon invité en attente → restauration + création auto.
  const resumedRef = useRef(false)
  useEffect(() => {
    if (loading || !user || resumedRef.current) return
    const d = readDraft()
    if (!d) return
    resumedRef.current = true
    const p = d.profession ? professionBySlug(d.profession) : null
    const m = p ? modeForCategory(p.category) : d.mode
    setProfession(p)
    setMode(m)
    setGoal(d.goal || null)
    setTitle(d.title)
    setHeadline(d.headline || '')
    setBio(d.bio || '')
    track('guest_draft_resumed', { profession: d.profession || 'generic' })
    createFrom({ ...d, mode: m })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  // Aperçu local invité : même dérivation que le serveur (Profession Engine) —
  // thème du métier + boutons des template_blocks (réseaux sociaux exclus,
  // 1er bouton mis en avant) ; repli sur le preset du mode générique.
  function buildGuestPreview() {
    const page = { title: title.trim(), headline: headline.trim(), bio: bio.trim(), mode, slug: '', theme: profession ? themeForProfession(profession) : {} }
    const blocks = profession
      ? profession.template_blocks.map(blockToButton).filter((b) => !SOCIAL_BUTTON_TYPES.has(b.type)).map((b, i) => ({ ...b, featured: i === 0 }))
      : (PRESETS[mode] || []).map((p) => ({ type: p.type, label: BUTTON_TYPES[p.type].label[lang] || BUTTON_TYPES[p.type].label.fr, featured: !!p.featured }))
    const buttons = blocks.map((b, i) => ({ id: 'g' + i, type: b.type, label: b.label, icon: BUTTON_TYPES[b.type]?.icon || 'Link', url: '', isActive: true, featured: b.featured, position: i, clicks: 0 }))
    return { page, buttons }
  }

  const cardBg = mode ? MODES[mode].cardBg : '#FFFFFF'

  return (
    <div className="min-h-screen bg-cream" style={{ background: 'radial-gradient(110% 60% at 85% -5%, #FFF1EC 0%, transparent 55%), radial-gradient(90% 50% at 0% 0%, #FBFCEB 0%, transparent 50%), #F7F7F5' }}>
      <Header variant="dashboard" />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl">{step === 'goal' ? t('onb.goal.title') : step === 'preview' ? t('onb.preview.title') : t('onb.title')}</h1>
        <p className="mt-3 text-lg font-medium text-ink/70">{step === 'goal' ? t('onb.goal.subtitle') : step === 'profession' ? t('onb.prof.subtitle') : step === 'preview' ? t('onb.preview.subtitle') : t('onb.subtitle')}</p>

        {/* Étape 0 — l'objectif (plus important que le métier) */}
        {step === 'goal' && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {GOALS.map(({ key, emoji }) => (
              <button
                key={key}
                type="button"
                onClick={() => pickGoal(key)}
                className="press rounded-brutal border-2 border-ink bg-white p-5 text-left shadow-hard transition hover:-translate-y-0.5"
              >
                <span className="text-3xl" aria-hidden>{emoji}</span>
                <h3 className="font-display mt-2 text-lg font-extrabold">{t(`onb.goal.${key}`)}</h3>
                <p className="mt-1 text-sm font-medium text-ink/60">{t(`onb.goal.${key}Desc`)}</p>
              </button>
            ))}
          </div>
        )}

        {/* Étape 1 — picker de profession, groupé par catégorie (100% data-driven) */}
        {step === 'profession' && (
          <div className="mt-8 space-y-7">
            {Object.entries(PROFESSIONS_BY_CATEGORY).map(([category, profs]) => (
              <div key={category}>
                <p className="font-display text-xs font-extrabold uppercase tracking-[0.16em] text-ink/50">{category}</p>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  {profs.map((p) => (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => pickProfession(p)}
                      className="press inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-2 font-display text-sm font-extrabold shadow-hard-sm transition hover:-translate-y-0.5"
                    >
                      <span aria-hidden>{p.emoji}</span> {p.profession_en}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setStep('mode')}
              className="press mt-2 w-full rounded-brutal border-2 border-dashed border-ink/40 bg-white/60 p-4 text-center font-display text-sm font-extrabold text-ink/60 transition hover:border-ink hover:text-ink"
            >
              {t('onb.prof.generic')}
            </button>
          </div>
        )}

        {/* Étape 1bis — fallback : les 3 styles génériques historiques */}
        {step === 'mode' && (
          <div className="mt-8 grid gap-4">
            {cards.map(({ m, label, desc, name, color }) => (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); setStep('identity') }}
                className="press rounded-brutal border-2 border-ink p-6 text-left shadow-hard"
                style={{ background: m.cardBg }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{m.emoji}</div>
                  <div>
                    <span
                      className="inline-block rounded-full border-2 border-ink px-3 py-0.5 font-display text-xs font-extrabold uppercase tracking-wide text-white"
                      style={{ background: color }}
                    >
                      {t(label)}
                    </span>
                    <h3 className="font-display mt-2 text-2xl font-extrabold">{name}</h3>
                    <p className="mt-1 text-sm font-medium text-ink/70">{t(desc)}</p>
                  </div>
                </div>
              </button>
            ))}
            <button type="button" onClick={() => setStep('profession')} className="press text-sm font-bold text-ink/50 hover:text-ink">← {t('common.back')}</button>
          </div>
        )}

        {/* Étape 2 — identité (badge métier si applicable) */}
        {step === 'identity' && (
          <Card className="mt-8 p-6" style={{ background: cardBg }}>
            {profession && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-1.5 font-display text-xs font-extrabold uppercase tracking-wide">
                <span aria-hidden>{profession.emoji}</span> {profession.profession_en} · {t('onb.prof.ready')}
              </div>
            )}
            <div className="rounded-brutal border-2 border-ink bg-white p-5">
              <div className="mb-4">
                <Label>{t('onb.step2.titleLabel')}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('onb.step2.titlePh')} autoFocus />
              </div>
              <div className="mb-4">
                <Label>{t('onb.step2.headlineLabel')}</Label>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={t(`onb.headlinePh.${mode}`)} maxLength={80} />
              </div>
              <div>
                <Label>{t('onb.step2.bioLabel')}</Label>
                <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('onb.step2.bioPh')} />
              </div>
              <div className="mt-5 flex gap-3">
                <Button variant="secondary" onClick={() => { setProfession(null); setStep('profession') }}>{t('common.back')}</Button>
                <Button className="flex-1" onClick={create} disabled={busy || !title.trim()}>
                  {busy ? t('common.loading') : t('onb.step2.create')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Étape invité — l'aperçu de SA page AVANT le login : le moment de
            conversion. La connexion n'est demandée que pour la mettre en ligne. */}
        {step === 'preview' && (() => {
          const pv = buildGuestPreview()
          return (
            <div className="mt-8">
              <div className="mx-auto w-full max-w-[320px]">
                <PhoneFrame bg={cardBg} bare>
                  <BioImmersive page={pv.page} buttons={pv.buttons} products={[]} branding kenBurns={false} />
                </PhoneFrame>
              </div>
              <div className="mx-auto mt-6 flex max-w-md flex-col gap-2">
                <Button size="lg" className="w-full" onClick={publishAsGuest}>🚀 {t('onb.preview.publish')}</Button>
                <Button variant="secondary" className="w-full" onClick={() => setStep('identity')}>{t('onb.preview.edit')}</Button>
                <p className="mt-1 text-center text-xs font-semibold text-ink/50">{t('onb.preview.note')}</p>
              </div>
            </div>
          )
        })()}

        {/* Le moment magique : la carte est réelle → Wallet + QR immédiatement. */}
        {step === 'done' && created && (
          <Card className="mt-8 p-6 text-center" style={{ background: cardBg }}>
            <div className="rounded-brutal border-2 border-ink bg-white p-6">
              <h2 className="font-display text-2xl font-extrabold">{t('onb.done.title')}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-ink/70">{t('onb.done.sub')}</p>
              <ShareLink url={`${window.location.origin}/${created.slug}`} className="mx-auto mt-5 max-w-md" />

              {/* Wallet + QR : « j'ai créé quelque chose de réel » */}
              <div className="mx-auto mt-5 flex max-w-md flex-col gap-2">
                {wallet?.apple && (
                  <a
                    href={`/api/wallet/apple/${created.slug}`}
                    onClick={() => track('wallet_added', { type: 'apple', source: 'onboarding' })}
                    className="press inline-flex items-center justify-center gap-2 rounded-brutal border-2 border-ink bg-black px-4 py-3 font-display text-sm font-extrabold text-white"
                  >
                    <Wallet size={16} />  {t('wallet.apple')}
                  </a>
                )}
                {wallet?.google && (
                  <a
                    href={`/api/wallet/google/${created.slug}`}
                    onClick={() => track('wallet_added', { type: 'google', source: 'onboarding' })}
                    className="press inline-flex items-center justify-center gap-2 rounded-brutal border-2 border-ink bg-white px-4 py-3 font-display text-sm font-extrabold text-ink"
                  >
                    <Wallet size={16} /> {t('wallet.google')}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => { track('qr_opened', { source: 'onboarding' }); setShowQR(true) }}
                  className="press inline-flex items-center justify-center gap-2 rounded-brutal border-2 border-ink bg-cream px-4 py-3 font-display text-sm font-extrabold text-ink"
                >
                  <QrCode size={16} /> {t('onb.done.qr')}
                </button>
              </div>

              <div className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row">
                <Button as="a" href={`/${created.slug}`} target="_blank" rel="noreferrer" variant="secondary" className="flex-1">
                  {t('onb.done.view')}
                </Button>
                <Button className="flex-1" onClick={() => nav(`/edit/${created.slug}`)}>
                  {t('onb.done.customize')}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </main>
      {showQR && created && <QRModal url={`${window.location.origin}/${created.slug}`} page={created} onClose={() => setShowQR(false)} />}
    </div>
  )
}
