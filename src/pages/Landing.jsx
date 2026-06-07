import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, Plus, Minus, Star, MousePointerClick, Palette, Share2 } from 'lucide-react'
import { Header } from '../components/Header'
import { Button, Card, Badge } from '../components/ui'
import { PhoneFrame, Avatar } from '../components/PhoneMockup'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { MODES } from '../lib/modes'

export default function Landing() {
  const { t } = useI18n()
  const { user } = useAuth()
  const nav = useNavigate()
  const go = () => nav(user ? '/onboarding' : '/login')

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* ---------- HERO ---------- */}
      <section className="mx-auto max-w-5xl px-4 pb-12 pt-10">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Badge color="sun">{t('hero.badge')}</Badge>
            <h1 className="font-display mt-5 text-5xl leading-[0.95] md:text-6xl">
              {t('hero.title.a')} <span className="highlight">{t('hero.title.b')}</span>{' '}
              {t('hero.title.c')} <em className="italic">{t('hero.title.d')}</em>{' '}
              {t('hero.title.e')}
            </h1>
            <p className="mt-5 max-w-md text-lg font-medium text-ink/70">{t('hero.subtitle')}</p>

            <div className="mt-7">
              <Button size="lg" onClick={go}>{t('hero.cta')}</Button>
              <p className="mt-2 text-sm font-semibold text-ink/60">{t('hero.note')}</p>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {['hero.f1', 'hero.f2', 'hero.f3'].map((k) => (
                <li key={k} className="flex items-center gap-1.5 text-sm font-bold">
                  <Check size={18} className="text-coral" strokeWidth={3} /> {t(k)}
                </li>
              ))}
            </ul>
          </div>

          {/* Mockup démo — rotation des 3 modes */}
          <HeroMockup />
        </div>
      </section>

      {/* ---------- SOCIAL PROOF (stats) ---------- */}
      <section className="border-y-2 border-ink bg-ink py-7 text-cream">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
          {[
            ['social.s1.n', 'social.s1.l'],
            ['social.s2.n', 'social.s2.l'],
            ['social.s3.n', 'social.s3.l'],
            ['social.s4.n', 'social.s4.l'],
          ].map(([n, l]) => (
            <div key={n} className="text-center">
              <p className="font-display text-3xl font-extrabold text-sun md:text-4xl">{t(n)}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-cream/70">{t(l)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 3 MODES ---------- */}
      <section id="modes" className="bg-white py-14">
        <div className="mx-auto max-w-5xl px-4">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest" style={{ color: '#caa511' }}>
            {t('modes.eyebrow')}
          </p>
          <h2 className="font-display mt-2 max-w-2xl text-4xl">{t('modes.title')}</h2>
          <p className="mt-3 max-w-xl text-lg font-medium text-ink/70">{t('modes.subtitle')}</p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { m: MODES.creator, eb: 'modes.creator.eyebrow', b: 'modes.creator.b', name: 'Créateur' },
              { m: MODES.bar, eb: 'modes.bar.eyebrow', b: 'modes.bar.b', name: 'Établissement' },
              { m: MODES.freelance, eb: 'modes.freelance.eyebrow', b: 'modes.freelance.b', name: 'Freelance' },
            ].map(({ m, eb, b, name }) => (
              <Card key={m.key} className="p-6 transition-transform hover:-translate-y-1" style={{ background: m.cardBg }}>
                <div className="text-4xl">{m.emoji}</div>
                <p className="font-display mt-3 text-xs font-extrabold uppercase tracking-widest text-ink/60">
                  {t(eb)}
                </p>
                <h3 className="font-display mt-1 text-2xl font-extrabold">{name}</h3>
                <p className="mt-2 text-sm font-medium text-ink/70">{t(b)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- COMMENT ÇA MARCHE ---------- */}
      <section id="how" className="border-y-2 border-ink py-14">
        <div className="mx-auto max-w-5xl px-4">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest" style={{ color: '#caa511' }}>
            {t('how.eyebrow')}
          </p>
          <h2 className="font-display mt-2 max-w-2xl text-4xl">{t('how.title')}</h2>
          <p className="mt-3 max-w-xl text-lg font-medium text-ink/70">{t('how.subtitle')}</p>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              { n: '1', icon: MousePointerClick, bg: '#FCE7EF', t: 'how.s1.t', d: 'how.s1.d' },
              { n: '2', icon: Palette, bg: '#E8EDFC', t: 'how.s2.t', d: 'how.s2.d' },
              { n: '3', icon: Share2, bg: '#FFF3CC', t: 'how.s3.t', d: 'how.s3.d' },
            ].map(({ n, icon: I, bg, t: tk, d }) => (
              <Card key={n} className="relative p-6">
                <span className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-ink font-display text-lg font-extrabold text-white shadow-hard-sm">
                  {n}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-brutal border-2 border-ink" style={{ background: bg }}>
                  <I size={24} strokeWidth={2.5} />
                </span>
                <h3 className="font-display mt-4 text-xl font-extrabold">{t(tk)}</h3>
                <p className="mt-2 text-sm font-medium text-ink/70">{t(d)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- COMPARATIF ---------- */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-3xl px-4">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-coral">
            {t('compare.eyebrow')}
          </p>
          <h2 className="font-display mt-2 text-4xl">{t('compare.title')}</h2>

          <Card className="mt-8 overflow-hidden p-0">
            <div className="grid grid-cols-[1fr_auto_auto] items-stretch">
              <div className="border-b-2 border-ink bg-cream px-5 py-3" />
              <div className="flex items-center justify-center border-b-2 border-l-2 border-ink bg-cream px-5 py-3 font-display text-xs font-extrabold uppercase tracking-wide text-ink/60">
                {t('compare.them')}
              </div>
              <div className="flex items-center justify-center border-b-2 border-l-2 border-ink bg-sun px-5 py-3 font-display text-xs font-extrabold uppercase tracking-wide">
                {t('compare.us')}
              </div>

              {['compare.r1', 'compare.r2', 'compare.r3', 'compare.r4', 'compare.r5', 'compare.r6'].map((k, i, arr) => {
                const last = i === arr.length - 1
                const edge = last ? '' : 'border-b-2 border-ink'
                return (
                  <div key={k} className="contents">
                    <div className={`px-5 py-3.5 text-sm font-bold ${edge}`}>{t(k)}</div>
                    <div className={`flex items-center justify-center border-l-2 border-ink px-5 py-3.5 ${edge}`}>
                      <X size={20} strokeWidth={3} className="text-ink/30" />
                    </div>
                    <div className={`flex items-center justify-center border-l-2 border-ink bg-sun/20 px-5 py-3.5 ${edge}`}>
                      <Check size={20} strokeWidth={3} className="text-coral" />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </section>

      {/* ---------- TÉMOIGNAGES ---------- */}
      <section className="border-y-2 border-ink py-14">
        <div className="mx-auto max-w-5xl px-4">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest" style={{ color: '#caa511' }}>
            {t('testi.eyebrow')}
          </p>
          <h2 className="font-display mt-2 text-4xl">{t('testi.title')}</h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { q: 'testi.1.q', a: 'testi.1.a', emoji: '🎬', bg: '#FCE7EF' },
              { q: 'testi.2.q', a: 'testi.2.a', emoji: '🍸', bg: '#EFEDE6' },
              { q: 'testi.3.q', a: 'testi.3.a', emoji: '💼', bg: '#E8EDFC' },
            ].map(({ q, a, emoji, bg }) => (
              <Card key={q} className="flex flex-col p-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className="text-sun" fill="#F7C948" strokeWidth={2} />
                  ))}
                </div>
                <p className="mt-3 flex-1 text-base font-semibold leading-snug">“{t(q)}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar emoji={emoji} size={40} />
                  <span className="text-sm font-extrabold">{t(a)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <Faq />

      {/* ---------- PRICING ---------- */}
      <section id="pricing" className="border-t-2 border-ink py-14">
        <div className="mx-auto max-w-5xl px-4">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-coral">
            {t('pricing.eyebrow')}
          </p>
          <h2 className="font-display mt-2 text-4xl">{t('pricing.title')}</h2>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              { key: 'free', highlight: false, per: false },
              { key: 'creator', highlight: true, per: true },
              { key: 'pro', highlight: false, per: true },
            ].map((tier) => (
              <Card
                key={tier.key}
                className={`relative flex flex-col p-6 ${tier.highlight ? 'md:-translate-y-2' : ''}`}
                style={tier.highlight ? { background: '#F7C948' } : undefined}
              >
                {tier.key === 'creator' && (
                  <Badge color="ink" className="absolute -top-3 left-1/2 -translate-x-1/2">{t('pricing.creator.tag')}</Badge>
                )}
                <h3 className="font-display text-xl font-extrabold">{t(`pricing.${tier.key}.name`)}</h3>
                <p className="font-display mt-1 text-4xl font-extrabold">
                  {t(`pricing.${tier.key}.price`)}
                  {tier.per && <span className="text-lg font-bold">{t('pricing.perMonth')}</span>}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {['f1', 'f2', 'f3', 'f4'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm font-semibold">
                      <Check size={16} className={tier.highlight ? '' : 'text-coral'} strokeWidth={3} /> {t(`pricing.${tier.key}.${f}`)}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-brutal border-2 border-ink bg-white/70 px-3 py-2 text-center">
                  <p className="font-display text-sm font-extrabold">{t(`pricing.${tier.key}.fee`)}</p>
                  {tier.key === 'creator' && (
                    <p className="text-[11px] font-bold text-ink/60">{t('pricing.creator.feeNote')}</p>
                  )}
                </div>
                <Button variant={tier.highlight ? 'primary' : 'secondary'} className="mt-4 w-full" onClick={go}>
                  {t(`pricing.${tier.key}.cta`)}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="border-t-2 border-ink bg-coral py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-4xl leading-tight md:text-5xl">{t('cta.title')}</h2>
          <p className="mx-auto mt-4 max-w-lg text-lg font-medium text-white/90">{t('cta.sub')}</p>
          <div className="mt-7">
            <Button variant="dark" size="lg" onClick={go}>{t('cta.btn')}</Button>
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-ink py-8 text-center text-sm font-bold text-ink/50">
        {t('common.madeWith')} · © 2026 BioBoost
      </footer>
    </div>
  )
}

/* ---------- Mockup hero rotatif (3 modes) ---------- */
const DEMOS = [
  { key: 'creator', emoji: '🎬', bg: MODES.creator.cardBg, accent: MODES.creator.accent },
  { key: 'bar', emoji: '🍸', bg: MODES.bar.cardBg, accent: MODES.bar.accent },
  { key: 'freelance', emoji: '💼', bg: MODES.freelance.cardBg, accent: MODES.freelance.accent },
]

function HeroMockup() {
  const { t } = useI18n()
  const [i, setI] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = setInterval(() => setI((p) => (p + 1) % DEMOS.length), 3200)
    return () => clearInterval(id)
  }, [])

  const d = DEMOS[i]
  const p = `hero.demo.${d.key}.`

  return (
    <div className="relative">
      <PhoneFrame bg={d.bg} className="transition-colors duration-500">
        <div key={d.key} className="flex flex-col items-center text-center bb-fade">
          <Avatar emoji={d.emoji} size={72} />
          <h3 className="font-display mt-2 text-xl font-extrabold">{t(p + 'handle')}</h3>
          <p className="text-xs font-bold uppercase tracking-wide text-ink/60">{t(p + 'mode')}</p>
          <div className="mt-4 flex w-full flex-col gap-2.5">
            <div className="rounded-brutal border-2 border-ink py-3 font-display font-extrabold text-white shadow-hard" style={{ background: d.accent }}>
              {t(p + 'b1')}
            </div>
            <div className="rounded-brutal border-2 border-ink bg-white py-3 font-display font-extrabold shadow-hard">
              {t(p + 'b2')}
            </div>
            <div className="rounded-brutal border-2 border-ink bg-white py-3 font-display font-extrabold shadow-hard">
              {t(p + 'b3')}
            </div>
          </div>
        </div>
      </PhoneFrame>

      <div className="absolute -right-2 -top-3 rotate-6">
        <Badge color="sun" className="text-sm shadow-hard">{t(p + 'badge')}</Badge>
      </div>

      {/* Indicateurs de mode */}
      <div className="mt-5 flex justify-center gap-2">
        {DEMOS.map((dm, idx) => (
          <button
            key={dm.key}
            onClick={() => setI(idx)}
            aria-label={dm.key}
            className={`h-2.5 rounded-full border-2 border-ink transition-all ${idx === i ? 'w-7 bg-ink' : 'w-2.5 bg-white'}`}
          />
        ))}
      </div>
    </div>
  )
}

/* ---------- FAQ (accordéon) ---------- */
function Faq() {
  const { t } = useI18n()
  const [open, setOpen] = useState(0)
  const items = [
    ['faq.q1', 'faq.a1'],
    ['faq.q2', 'faq.a2'],
    ['faq.q3', 'faq.a3'],
    ['faq.q4', 'faq.a4'],
    ['faq.q5', 'faq.a5'],
  ]

  return (
    <section id="faq" className="bg-white py-14">
      <div className="mx-auto max-w-2xl px-4">
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-coral">
          {t('faq.eyebrow')}
        </p>
        <h2 className="font-display mt-2 text-4xl">{t('faq.title')}</h2>

        <div className="mt-8 space-y-3">
          {items.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <Card key={q} className="overflow-hidden p-0">
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-lg font-extrabold"
                  aria-expanded={isOpen}
                >
                  <span>{t(q)}</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-sun">
                    {isOpen ? <Minus size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                  </span>
                </button>
                {isOpen && (
                  <p className="border-t-2 border-ink px-5 py-4 text-sm font-medium text-ink/75">
                    {t(a)}
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
