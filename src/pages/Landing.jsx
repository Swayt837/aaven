import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, Plus, Minus, Star, ArrowRight, MousePointerClick, Palette, Share2 } from 'lucide-react'
import { Header } from '../components/Header'
import { Button, Card, Badge } from '../components/ui'
import { Reveal } from '../components/Reveal'
import { PhoneFrame, Avatar } from '../components/PhoneMockup'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { MODES } from '../lib/modes'

// Position de scroll (rAF, passive) → parallaxe ultra subtile.
function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { setY(window.scrollY); raf = 0 }) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [])
  return y
}

// CTA à inertie : suit légèrement le curseur puis revient (ressort).
function MagneticButton({ children, onClick, className = '' }) {
  const ref = useRef(null)
  function move(e) {
    const el = ref.current
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) * 0.25
    const y = (e.clientY - r.top - r.height / 2) * 0.35
    el.style.transform = `translate(${x}px, ${y}px)`
  }
  function reset() { if (ref.current) ref.current.style.transform = '' }
  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={move}
      onMouseLeave={reset}
      className={`group relative inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-b from-[#F2695B] to-coral px-8 py-4 font-display text-lg font-extrabold text-white shadow-glow-coral transition-[box-shadow,transform] duration-400 ease-spring hover:shadow-[0_26px_60px_-12px_rgba(239,90,76,.7)] ${className}`}
      style={{ transition: 'transform 600ms cubic-bezier(0.22,1,0.36,1), box-shadow 400ms ease' }}
    >
      <span className="bb-sheen opacity-60" aria-hidden />
      <span className="relative">{children}</span>
      <ArrowRight size={20} strokeWidth={3} className="relative transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  )
}

export default function Landing() {
  const { t } = useI18n()
  const { user } = useAuth()
  const nav = useNavigate()
  const go = () => nav(user ? '/onboarding' : '/login')
  const sy = useScrollY()

  return (
    <div className="min-h-screen bg-cream" style={{ background: 'radial-gradient(120% 70% at 80% -5%, #FFF4EC 0%, transparent 55%), radial-gradient(110% 60% at 0% 0%, #FBF3FF 0%, transparent 50%), #FAF6EE' }}>
      <Header />

      {/* ---------- HERO (cinématique) ---------- */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden px-5 pb-20 pt-8">
        {/* Atmosphère : halos qui dérivent + parallaxe ultra subtile */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div style={{ transform: `translateY(${sy * 0.18}px)` }} className="absolute -left-32 -top-24 h-[26rem] w-[26rem]">
            <div className="bb-glow bb-drift h-full w-full bg-coral/30" />
          </div>
          <div style={{ transform: `translateY(${sy * 0.32}px)` }} className="absolute -right-24 top-4 h-[22rem] w-[22rem]">
            <div className="bb-glow bb-drift-slow bb-breathe-soft h-full w-full bg-sun/40" />
          </div>
          <div style={{ transform: `translateY(${sy * 0.1}px)` }} className="absolute bottom-[-6rem] left-1/3 h-[24rem] w-[24rem]">
            <div className="bb-glow bb-drift-rev h-full w-full bg-pink/20" />
          </div>
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-6">
          {/* Colonne texte — composition éditoriale */}
          <div className="bb-reveal max-w-xl">
            <Badge color="white" className="bb-glass">{t('hero.badge')}</Badge>
            <h1 className="font-display mt-6 text-[3.1rem] leading-[0.92] sm:text-6xl md:text-[4.2rem]">
              {t('hero.title.a')}{' '}
              <span className="highlight">{t('hero.title.b')}</span>{' '}
              <span className="text-ink/45">{t('hero.title.c')}</span>{' '}
              <em className="font-editorial text-coral font-medium italic">{t('hero.title.d')}</em>
              <span className="text-ink/45">{t('hero.title.e')}</span>
            </h1>
            <p className="mt-7 max-w-md text-lg font-medium leading-relaxed text-ink/60">{t('hero.subtitle')}</p>

            <div className="mt-9 flex flex-col items-start gap-3">
              <MagneticButton onClick={go}>{t('hero.cta')}</MagneticButton>
              <p className="text-sm font-semibold text-ink/50">{t('hero.note')}</p>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
              {['hero.f1', 'hero.f2', 'hero.f3'].map((k) => (
                <li key={k} className="flex items-center gap-1.5 text-sm font-bold text-ink/70">
                  <Check size={17} className="text-coral" strokeWidth={3} /> {t(k)}
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne visuelle — mockup flottant + cartes de profondeur */}
          <div className="relative bb-reveal bb-reveal-2" style={{ transform: `translateY(${sy * -0.05}px)` }}>
            <div className="bb-float-slow">
              <HeroMockup />
            </div>
            {/* Cartes flottantes (profondeur) */}
            <div className="bb-float-slow-2 absolute -left-3 top-10 hidden rounded-2xl bg-white/80 px-3.5 py-2.5 shadow-float backdrop-blur sm:block" style={{ '--r': '-5deg' }}>
              <p className="font-display text-sm font-extrabold">+427€ <span className="text-ink/50">ce mois</span></p>
            </div>
            <div className="bb-float-slow absolute -right-2 bottom-16 hidden rounded-2xl bg-white/80 px-3.5 py-2.5 shadow-float backdrop-blur sm:block" style={{ '--r': '4deg', animationDelay: '-1.5s' }}>
              <p className="flex items-center gap-1.5 font-display text-sm font-extrabold"><Star size={14} className="text-sun" fill="#F7C948" /> 4,9 · 1.2k</p>
            </div>
          </div>
        </div>

        {/* Indice de scroll */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <span className="bb-float-slow text-xs font-bold uppercase tracking-[0.25em] text-ink/30">scroll</span>
        </div>
      </section>

      {/* ---------- POSITIONNEMENT ---------- */}
      <section className="py-20">
        <Reveal className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-4xl md:text-[2.8rem]">{t('pos.title')}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg font-medium leading-relaxed text-ink/60">{t('pos.body')}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            {['pos.a1', 'pos.a2', 'pos.a3', 'pos.a4'].map((k) => (
              <span key={k} className="rounded-full border border-ink/10 bg-white/80 px-4 py-2 font-display text-sm font-extrabold shadow-soft backdrop-blur">{t(k)}</span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------- SOCIAL PROOF (panneau flottant) ---------- */}
      <section className="px-5 pb-4">
        <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-card bg-ink py-9 text-cream shadow-float">
          <div className="bb-glow bb-drift-slow absolute -right-10 -top-10 h-48 w-48 bg-coral/30" aria-hidden />
          <div className="relative grid grid-cols-2 gap-6 px-6 md:grid-cols-4">
            {[
              ['social.s1.n', 'social.s1.l'],
              ['social.s2.n', 'social.s2.l'],
              ['social.s3.n', 'social.s3.l'],
              ['social.s4.n', 'social.s4.l'],
            ].map(([n, l]) => (
              <div key={n} className="text-center">
                <p className="font-display text-3xl font-extrabold text-sun md:text-4xl">{t(n)}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-cream/60">{t(l)}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------- 3 MODES ---------- */}
      <section id="modes" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em]" style={{ color: '#caa511' }}>
              {t('modes.eyebrow')}
            </p>
            <h2 className="font-display mt-3 max-w-2xl text-4xl md:text-5xl">{t('modes.title')}</h2>
            <p className="mt-4 max-w-xl text-lg font-medium leading-relaxed text-ink/60">{t('modes.subtitle')}</p>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { m: MODES.creator, eb: 'modes.creator.eyebrow', b: 'modes.creator.b', name: 'Créateur' },
              { m: MODES.bar, eb: 'modes.bar.eyebrow', b: 'modes.bar.b', name: 'Établissement' },
              { m: MODES.freelance, eb: 'modes.freelance.eyebrow', b: 'modes.freelance.b', name: 'Freelance' },
            ].map(({ m, eb, b, name }, i) => (
              <Reveal key={m.key} delay={i * 110} className="bb-hover">
                <Card className="relative h-full overflow-hidden p-6" style={{ background: m.cardBg }}>
                  <span className="bb-sheen" aria-hidden />
                  <div className="relative text-4xl">{m.emoji}</div>
                  <p className="relative mt-4 font-display text-xs font-extrabold uppercase tracking-[0.2em] text-ink/50">{t(eb)}</p>
                  <h3 className="relative mt-1 font-display text-2xl font-extrabold">{name}</h3>
                  <p className="relative mt-2 text-sm font-medium text-ink/65">{t(b)}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- COMMENT ÇA MARCHE ---------- */}
      <section id="how" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em]" style={{ color: '#caa511' }}>
              {t('how.eyebrow')}
            </p>
            <h2 className="font-display mt-3 max-w-2xl text-4xl md:text-5xl">{t('how.title')}</h2>
            <p className="mt-4 max-w-xl text-lg font-medium leading-relaxed text-ink/60">{t('how.subtitle')}</p>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { n: '1', icon: MousePointerClick, bg: '#FCE7EF', t: 'how.s1.t', d: 'how.s1.d' },
              { n: '2', icon: Palette, bg: '#E8EDFC', t: 'how.s2.t', d: 'how.s2.d' },
              { n: '3', icon: Share2, bg: '#FFF3CC', t: 'how.s3.t', d: 'how.s3.d' },
            ].map(({ n, icon: I, bg, t: tk, d }, i) => (
              <Reveal key={n} delay={i * 110} className="bb-hover">
                <Card className="relative h-full p-6">
                  <span className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink font-display text-lg font-extrabold text-white shadow-float">
                    {n}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-soft" style={{ background: bg }}>
                    <I size={24} strokeWidth={2.5} />
                  </span>
                  <h3 className="font-display mt-5 text-xl font-extrabold">{t(tk)}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-ink/65">{t(d)}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- COMPARATIF ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-coral">
              {t('compare.eyebrow')}
            </p>
            <h2 className="font-display mt-3 text-4xl md:text-5xl">{t('compare.title')}</h2>
          </Reveal>

          <Reveal className="mt-10">
            <Card className="overflow-hidden p-0">
            <div className="grid grid-cols-[1fr_auto_auto] items-stretch">
              <div className="border-b border-ink/10 bg-cream px-5 py-3" />
              <div className="flex items-center justify-center border-b-2 border-l border-ink/10 bg-cream px-5 py-3 font-display text-xs font-extrabold uppercase tracking-wide text-ink/60">
                {t('compare.them')}
              </div>
              <div className="flex items-center justify-center border-b-2 border-l border-ink/10 bg-sun px-5 py-3 font-display text-xs font-extrabold uppercase tracking-wide">
                {t('compare.us')}
              </div>

              {['compare.r1', 'compare.r2', 'compare.r3', 'compare.r4', 'compare.r5', 'compare.r6'].map((k, i, arr) => {
                const last = i === arr.length - 1
                const edge = last ? '' : 'border-b border-ink/10'
                return (
                  <div key={k} className="contents">
                    <div className={`px-5 py-3.5 text-sm font-bold ${edge}`}>{t(k)}</div>
                    <div className={`flex items-center justify-center border-l border-ink/10 px-5 py-3.5 ${edge}`}>
                      <X size={20} strokeWidth={3} className="text-ink/30" />
                    </div>
                    <div className={`flex items-center justify-center border-l border-ink/10 bg-sun/20 px-5 py-3.5 ${edge}`}>
                      <Check size={20} strokeWidth={3} className="text-coral" />
                    </div>
                  </div>
                )
              })}
            </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ---------- TÉMOIGNAGES ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em]" style={{ color: '#caa511' }}>
              {t('testi.eyebrow')}
            </p>
            <h2 className="font-display mt-3 text-4xl md:text-5xl">{t('testi.title')}</h2>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { q: 'testi.1.q', a: 'testi.1.a', emoji: '🎬' },
              { q: 'testi.2.q', a: 'testi.2.a', emoji: '🍸' },
              { q: 'testi.3.q', a: 'testi.3.a', emoji: '💼' },
            ].map(({ q, a, emoji }, i) => (
              <Reveal key={q} delay={i * 110} className="bb-hover">
                <Card className="flex h-full flex-col p-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={16} className="text-sun" fill="#F7C948" strokeWidth={2} />
                    ))}
                  </div>
                  <p className="mt-4 flex-1 font-editorial text-lg italic leading-snug text-ink/85">“{t(q)}”</p>
                  <div className="mt-6 flex items-center gap-3">
                    <Avatar emoji={emoji} size={40} />
                    <span className="text-sm font-extrabold">{t(a)}</span>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <Faq />

      {/* ---------- PRICING ---------- */}
      <section id="pricing" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-coral">
              {t('pricing.eyebrow')}
            </p>
            <h2 className="font-display mt-3 text-4xl md:text-5xl">{t('pricing.title')}</h2>
          </Reveal>

          <div className="mt-12 grid items-start gap-5 md:grid-cols-3">
            {[
              { key: 'free', highlight: false, per: false },
              { key: 'creator', highlight: true, per: true },
              { key: 'pro', highlight: false, per: true },
            ].map((tier, i) => (
              <Reveal key={tier.key} delay={i * 110} className={tier.highlight ? 'md:-mt-3' : ''}>
                <Card
                  className={`relative flex h-full flex-col overflow-hidden p-6 ${tier.highlight ? 'shadow-glow-sun' : ''}`}
                  style={tier.highlight ? { background: '#F7C948' } : undefined}
                >
                  {tier.highlight && <span className="bb-sheen" aria-hidden />}
                  {tier.key === 'creator' && (
                    <Badge color="ink" className="absolute right-5 top-5">{t('pricing.creator.tag')}</Badge>
                  )}
                  <h3 className="relative font-display text-xl font-extrabold">{t(`pricing.${tier.key}.name`)}</h3>
                  <p className="relative mt-1 font-display text-5xl font-extrabold tracking-tight">
                    {t(`pricing.${tier.key}.price`)}
                    {tier.per && <span className="text-lg font-bold text-ink/50">{t('pricing.perMonth')}</span>}
                  </p>
                  <ul className="relative mt-5 flex-1 space-y-2.5">
                    {['f1', 'f2', 'f3', 'f4'].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm font-semibold">
                        <Check size={16} className="text-coral" strokeWidth={3} /> {t(`pricing.${tier.key}.${f}`)}
                      </li>
                    ))}
                  </ul>
                  <div className="relative mt-5 rounded-xl bg-white/60 px-3 py-2.5 text-center backdrop-blur">
                    <p className="font-display text-sm font-extrabold">{t(`pricing.${tier.key}.fee`)}</p>
                    {tier.key === 'creator' && (
                      <p className="text-[11px] font-bold text-ink/55">{t('pricing.creator.feeNote')}</p>
                    )}
                  </div>
                  <Button variant={tier.highlight ? 'dark' : 'primary'} className="relative mt-5 w-full" onClick={go}>
                    {t(`pricing.${tier.key}.cta`)}
                  </Button>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA FINAL (cinématique) ---------- */}
      <section className="px-5 py-20">
        <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-xl2 bg-coral px-6 py-20 text-center text-white shadow-glow-coral">
          <div className="bb-glow bb-drift absolute -left-10 top-0 h-56 w-56 bg-pink/40" aria-hidden />
          <div className="bb-glow bb-drift-rev absolute -right-10 bottom-0 h-56 w-56 bg-sun/40" aria-hidden />
          <span className="bb-sheen opacity-40" aria-hidden />
          <h2 className="relative mx-auto max-w-2xl font-display text-4xl leading-tight md:text-5xl">{t('cta.title')}</h2>
          <p className="relative mx-auto mt-5 max-w-lg text-lg font-medium text-white/90">{t('cta.sub')}</p>
          <div className="relative mt-8 flex justify-center">
            <Button variant="dark" size="lg" onClick={go}>{t('cta.btn')}</Button>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-ink/10 py-8 text-center text-sm font-bold text-ink/50">
        <div className="mb-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
          <a href="/legal/mentions-legales" className="hover:text-ink">{t('legal.mentions')}</a>
          <a href="/legal/cgu" className="hover:text-ink">{t('legal.cgu')}</a>
          <a href="/legal/cgv" className="hover:text-ink">{t('legal.cgv')}</a>
          <a href="/legal/confidentialite" className="hover:text-ink">{t('legal.privacy')}</a>
        </div>
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
                  <p className="border-t border-ink/10 px-5 py-4 text-sm font-medium text-ink/75">
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
