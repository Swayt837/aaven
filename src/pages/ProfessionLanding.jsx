import { useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { track } from '../lib/analytics'
import { Icon } from '../components/Icon'
import { PROFESSIONS, professionBySlug } from '../lib/professions'
import { blockToButton, themeForProfession } from '../lib/professionEngine'
import { BUTTON_TYPES } from '../lib/modes'

// Landing page métier — 100% pilotée par les données (src/lib/professions.js).
// Une seule route dynamique rend les 33 pages : aaven.fr/<slug-metier>.
export default function ProfessionLanding({ slug }) {
  const { lang } = useI18n()
  const { user } = useAuth()
  const nav = useNavigate()
  const p = professionBySlug(slug)

  useEffect(() => {
    if (p) {
      document.title = p.seo_title
      track('profession_landing_view', { slug: p.slug, category: p.category })
    }
  }, [p])

  if (!p) return <Navigate to="/" replace />

  const theme = themeForProfession(p)
  const heroText = theme.text === 'light' ? 'text-white' : 'text-brand-ink'
  const heroMuted = theme.text === 'light' ? 'text-white/70' : 'text-brand-ink/60'
  const gradient = `linear-gradient(${theme.gradAngle}deg, ${theme.gradFrom}, ${theme.gradTo})`

  // CTA → onboarding pré-appliqué, connecté OU invité (guest onboarding : la
  // connexion n'arrive qu'au moment de publier). localStorage pour survivre
  // au détour OAuth du login.
  const start = () => {
    track('cta_start', { source: 'profession_landing', profession: p.slug })
    try { localStorage.setItem('bb_profession', p.slug) } catch { /* private mode */ }
    nav(`/onboarding?profession=${p.slug}`)
  }

  const blocks = p.template_blocks.map(blockToButton)
  const madeFor = lang === 'en' ? `Made for ${p.profession_en}s` : `Pensé pour les ${p.profession_en}s`
  const microLabel = lang === 'en' ? '30 seconds · No credit card' : '30 secondes · Sans carte bancaire'
  const others = PROFESSIONS.filter((x) => x.slug !== p.slug)

  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-ink antialiased">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 md:px-10">
        <Link to="/" className="font-sans text-xl font-bold tracking-[-0.04em]">Aaven</Link>
        <button onClick={start} className="rounded-full bg-brand-ink px-5 py-2.5 font-display text-sm font-extrabold text-white">{lang === 'en' ? 'Get started' : 'Commencer'}</button>
      </header>

      <main className="mx-auto max-w-5xl px-5 md:px-10">
        {/* Hero thémé aux couleurs du métier */}
        <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-brand-ink bg-white px-4 py-1.5 font-display text-xs font-extrabold uppercase tracking-[0.14em]">
              <span aria-hidden>{p.emoji}</span> {madeFor}
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] md:text-6xl">{p.landing_title}</h1>
            <p className="mt-5 max-w-xl font-sans text-lg text-brand-muted md:text-xl">{p.landing_subtitle}</p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button onClick={start} className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-display text-base font-extrabold text-white shadow-[5px_5px_0px_#0A0A0A] transition-transform hover:-translate-y-0.5" style={{ background: theme.accent }}>
                {p.cta} <ArrowRight size={18} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
              </button>
              <span className="font-sans text-sm font-semibold text-brand-muted">{microLabel}</span>
            </div>
          </div>

          {/* Mockup de démo : la page du métier, blocs dans l'ordre des données */}
          <div className="mx-auto w-[300px]">
            <div className="relative overflow-hidden rounded-[38px] border-[9px] border-brand-ink shadow-[10px_10px_0px_#0A0A0A]">
              <div className="absolute left-1/2 top-0 z-20 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-brand-ink" />
              <div className={`relative min-h-[520px] px-5 pb-7 pt-12 ${heroText}`} style={{ background: gradient }}>
                <div className="text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-white/40 bg-white/15 text-3xl backdrop-blur-sm" aria-hidden>{p.emoji}</span>
                  <p className="mt-3 font-display text-lg font-extrabold">{p.profession_en}</p>
                  <p className={`text-xs font-semibold ${heroMuted}`}>@your-name</p>
                </div>
                <div className="mt-6 space-y-2.5">
                  {blocks.map((b, i) => {
                    const iconName = (BUTTON_TYPES[b.type] || BUTTON_TYPES.link).icon
                    const primary = i === 0
                    return (
                      <div
                        key={`${b.label}-${i}`}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold backdrop-blur-md ${primary ? 'border-transparent text-brand-ink' : theme.text === 'light' ? 'border-white/25 bg-white/10 text-white' : 'border-brand-ink/15 bg-white/60 text-brand-ink'}`}
                        style={primary ? { background: '#ffffff' } : undefined}
                      >
                        <Icon name={iconName} size={17} />
                        <span className="flex-1 text-center">{b.label}</span>
                        <span className="w-[17px]" aria-hidden />
                      </div>
                    )
                  })}
                </div>
                <p className={`mt-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] ${heroMuted}`}>Made with Aaven</p>
              </div>
            </div>
          </div>
        </section>

        {/* Ce que contient le template (données → bénéfices) */}
        <section className="grid gap-5 pb-12 md:grid-cols-3 md:pb-20">
          {blocks.slice(0, 3).map((b) => (
            <div key={b.label} className="rounded-[24px] border-2 border-brand-ink bg-white p-6 shadow-[5px_5px_0px_#0A0A0A]">
              <span className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: theme.accent }}><Check size={18} strokeWidth={3} /></span>
              <h2 className="mt-4 font-display text-xl font-extrabold tracking-[-0.02em]">{b.label}</h2>
              <p className="mt-2 font-sans text-sm text-brand-muted">
                {lang === 'en' ? 'Ready out of the box — included in your template.' : 'Prêt dès la création — inclus dans ton template.'}
              </p>
            </div>
          ))}
        </section>

        {/* CTA final */}
        <section className="mb-16 rounded-[28px] border-2 border-brand-ink px-6 py-12 text-center" style={{ background: gradient }}>
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.18em] backdrop-blur-sm ${heroText}`}>
            <Sparkles size={13} /> {madeFor}
          </span>
          <h2 className={`mx-auto mt-4 max-w-xl font-display text-3xl font-extrabold tracking-[-0.03em] md:text-4xl ${heroText}`}>{p.landing_title}</h2>
          <button onClick={start} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-display text-lg font-extrabold text-brand-ink shadow-[6px_6px_0px_#0A0A0A] transition-transform hover:-translate-y-0.5">
            {p.cta} <ArrowRight size={20} strokeWidth={3} />
          </button>
        </section>
      </main>

      {/* Maillage interne : toutes les autres professions */}
      <footer className="border-t border-brand-line">
        <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
          <p className="font-display text-xs font-extrabold uppercase tracking-[0.16em] text-brand-muted">Aaven for</p>
          <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-sans text-sm font-semibold text-brand-muted">
            {others.map((x) => (
              <Link key={x.slug} to={`/${x.slug}`} className="hover:text-brand-ink">{x.emoji} {x.profession_en}s</Link>
            ))}
          </nav>
          <p className="mt-6 font-sans text-sm text-brand-muted">© 2026 Aaven · <Link to="/" className="hover:text-brand-ink">aaven.fr</Link></p>
        </div>
      </footer>
    </div>
  )
}
