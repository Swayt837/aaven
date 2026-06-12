import { useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { track } from '../lib/analytics'
import { SEO_PAGES, SEO_META, SEO_SLUGS } from '../lib/seoContent'

// Pages SEO dédiées (acquisition organique). Contenu riche + JSON-LD FAQ + maillage interne.
export default function SeoLanding({ slug }) {
  const { lang } = useI18n()
  const { user } = useAuth()
  const nav = useNavigate()
  const data = SEO_PAGES[slug] && (SEO_PAGES[slug][lang] || SEO_PAGES[slug].fr)
  const meta = SEO_META[slug] && (SEO_META[slug][lang] || SEO_META[slug].fr)

  useEffect(() => { if (meta?.title) document.title = meta.title }, [meta])

  if (!data) return <Navigate to="/" replace />

  const start = () => { track('cta_start', { source: 'seo', page: slug }); nav(user ? '/dashboard' : '/login') }
  const others = SEO_SLUGS.filter((s) => s !== slug)
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  const ctaLabel = lang === 'en' ? 'Create my free page' : 'Créer ma page gratuite'
  const microLabel = lang === 'en' ? '30 seconds · No credit card' : '30 secondes · Sans carte bancaire'

  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-ink antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 md:px-10">
        <Link to="/" className="font-sans text-xl font-bold tracking-[-0.04em]">Aaven</Link>
        <button onClick={start} className="rounded-full bg-brand-ink px-5 py-2.5 font-display text-sm font-extrabold text-white">{lang === 'en' ? 'Get started' : 'Commencer'}</button>
      </header>

      <main className="mx-auto max-w-5xl px-5 md:px-10">
        {/* Hero */}
        <section className="py-12 md:py-20">
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] md:text-6xl">{data.h1}</h1>
          <p className="mt-6 max-w-2xl font-sans text-lg text-brand-muted md:text-xl">{data.sub}</p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <button onClick={start} className="group inline-flex items-center gap-2 rounded-full bg-brand-coral px-7 py-3.5 font-display text-base font-extrabold text-white shadow-[5px_5px_0px_#0A0A0A] transition-transform hover:-translate-y-0.5">
              {ctaLabel} <ArrowRight size={18} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
            </button>
            <span className="font-sans text-sm font-semibold text-brand-muted">{microLabel}</span>
          </div>
        </section>

        {/* Bénéfices */}
        <section className="grid gap-5 pb-12 md:grid-cols-3 md:pb-20">
          {data.bullets.map((b) => (
            <div key={b.t} className="rounded-[24px] border-2 border-brand-ink bg-white p-6 shadow-[5px_5px_0px_#0A0A0A]">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-coral text-white"><Check size={18} strokeWidth={3} /></span>
              <h2 className="mt-4 font-display text-xl font-extrabold tracking-[-0.02em]">{b.t}</h2>
              <p className="mt-2 font-sans text-sm text-brand-muted">{b.d}</p>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="pb-12 md:pb-20">
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">FAQ</h2>
          <div className="mt-6 space-y-4">
            {data.faq.map((f) => (
              <div key={f.q} className="rounded-[20px] border-2 border-brand-ink bg-white p-5">
                <h3 className="font-display text-lg font-extrabold">{f.q}</h3>
                <p className="mt-2 font-sans text-sm text-brand-muted">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="mb-16 rounded-[28px] border-2 border-brand-ink bg-brand-ink px-6 py-12 text-center text-white">
          <h2 className="mx-auto max-w-xl font-display text-3xl font-extrabold tracking-[-0.03em] md:text-4xl">{lang === 'en' ? 'Ready to create your page?' : 'Prêt à créer ta page ?'}</h2>
          <button onClick={start} className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-coral px-8 py-4 font-display text-lg font-extrabold text-white shadow-[6px_6px_0px_#D6FF00] transition-transform hover:-translate-y-0.5">
            {ctaLabel} <ArrowRight size={20} strokeWidth={3} />
          </button>
        </section>
      </main>

      {/* Maillage interne + footer */}
      <footer className="border-t border-brand-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-8 md:flex-row md:items-center md:justify-between md:px-10">
          <nav className="flex flex-wrap gap-x-5 gap-y-2 font-sans text-sm font-semibold text-brand-muted">
            <Link to="/" className="hover:text-brand-ink">Aaven</Link>
            {others.map((s) => (
              <Link key={s} to={`/${s}`} className="hover:text-brand-ink">{(SEO_META[s] && (SEO_META[s][lang] || SEO_META[s].fr).title.replace(' — Aaven', '')) || s}</Link>
            ))}
            <Link to="/legal/mentions-legales" className="hover:text-brand-ink">{lang === 'en' ? 'Legal' : 'Mentions légales'}</Link>
          </nav>
          <p className="font-sans text-sm text-brand-muted">© 2026 Aaven</p>
        </div>
      </footer>
    </div>
  )
}
