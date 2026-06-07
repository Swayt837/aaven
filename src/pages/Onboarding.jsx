import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Button, Card, Input, Textarea, Label } from '../components/ui'
import { ShareLink } from '../components/ShareLink'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'
import { MODES } from '../lib/modes'

export default function Onboarding() {
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState(null)
  const [title, setTitle] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null) // page créée → écran de succès

  const cards = [
    { m: MODES.creator, label: 'onb.creator.label', desc: 'onb.creator.desc', name: 'Créateur', color: '#F0426B' },
    { m: MODES.bar, label: 'onb.bar.label', desc: 'onb.bar.desc', name: 'Établissement', color: '#EF5A4C' },
    { m: MODES.freelance, label: 'onb.freelance.label', desc: 'onb.freelance.desc', name: 'Freelance', color: '#2547D0' },
  ]

  async function create() {
    if (!title.trim()) return
    setBusy(true)
    try {
      const { page } = await api.createPage({ title: title.trim(), headline: headline.trim(), bio: bio.trim(), mode })
      setCreated(page)
      setStep(3)
    } catch (e) {
      alert(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header variant="dashboard" />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl">{t('onb.title')}</h1>
        <p className="mt-3 text-lg font-medium text-ink/70">{t('onb.subtitle')}</p>

        {step === 1 && (
          <div className="mt-8 grid gap-4">
            {cards.map(({ m, label, desc, name, color }) => (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); setStep(2) }}
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
          </div>
        )}

        {step === 2 && (
          <Card className="mt-8 p-6" style={{ background: MODES[mode].cardBg }}>
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
                <Button variant="secondary" onClick={() => setStep(1)}>{t('common.back')}</Button>
                <Button className="flex-1" onClick={create} disabled={busy || !title.trim()}>
                  {busy ? t('common.loading') : t('onb.step2.create')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && created && (
          <Card className="mt-8 p-6 text-center" style={{ background: MODES[mode].cardBg }}>
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
