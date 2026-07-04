import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { Button, Card, Input, Textarea, Label } from '../components/ui'
import { ShareLink } from '../components/ShareLink'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'
import { MODES } from '../lib/modes'
import { track } from '../lib/analytics'
import { PROFESSIONS_BY_CATEGORY, professionBySlug } from '../lib/professions'
import { modeForCategory } from '../lib/professionEngine'

export default function Onboarding() {
  const { t } = useI18n()
  const nav = useNavigate()
  const [params] = useSearchParams()
  // steps : 'profession' (picker) → 'mode' (fallback générique) → 'identity' → 'done'
  const [step, setStep] = useState('profession')
  const [profession, setProfession] = useState(null) // objet profession ou null (générique)
  const [mode, setMode] = useState(null)
  const [title, setTitle] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null) // page créée → écran de succès

  // Arrivée depuis une landing métier (?profession= ou localStorage à travers le login)
  // → on saute le picker et on pré-applique le template.
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

  async function create() {
    if (!title.trim()) return
    setBusy(true)
    try {
      const body = { title: title.trim(), headline: headline.trim(), bio: bio.trim(), mode }
      if (profession) body.profession = profession.slug
      const { page } = await api.createPage(body)
      track('page_created', { mode, profession: profession?.slug || 'generic' })
      if (profession) track('template_applied', { profession: profession.slug })
      try { localStorage.removeItem('bb_profession') } catch { /* noop */ }
      setCreated(page)
      setStep('done')
    } catch (e) {
      alert(e.message)
      setBusy(false)
    }
  }

  const cardBg = mode ? MODES[mode].cardBg : '#FFFFFF'

  return (
    <div className="min-h-screen bg-cream" style={{ background: 'radial-gradient(110% 60% at 85% -5%, #FFF1EC 0%, transparent 55%), radial-gradient(90% 50% at 0% 0%, #FBFCEB 0%, transparent 50%), #F7F7F5' }}>
      <Header variant="dashboard" />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl">{t('onb.title')}</h1>
        <p className="mt-3 text-lg font-medium text-ink/70">{step === 'profession' ? t('onb.prof.subtitle') : t('onb.subtitle')}</p>

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

        {step === 'done' && created && (
          <Card className="mt-8 p-6 text-center" style={{ background: cardBg }}>
            <div className="rounded-brutal border-2 border-ink bg-white p-6">
              <h2 className="font-display text-2xl font-extrabold">{t('onb.done.title')}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-ink/70">{t('onb.done.sub')}</p>
              <ShareLink url={`${window.location.origin}/${created.slug}`} className="mx-auto mt-5 max-w-md" />
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
    </div>
  )
}
