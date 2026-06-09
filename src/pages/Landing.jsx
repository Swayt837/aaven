import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Marquee from 'react-fast-marquee'
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import {
  Sparkles, ArrowRight, Check, Star, Menu, X, Instagram, Youtube, CalendarCheck,
  ShoppingBag, MapPin, Dumbbell, Palette, UserCircle2, Wand2, Rocket, Zap, BarChart3,
  Mail, QrCode, Smartphone, Globe, Heart,
} from 'lucide-react'
import { useAuth } from '../lib/auth'

const EASE = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const viewport = { once: true, margin: '-100px' }

/* ============================ Primitives ============================ */
function Logo() {
  return (
    <a href="/" data-testid="logo" className="inline-flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-brand-neon font-display text-base font-extrabold text-brand-ink">Bio</span>
      <span className="font-display text-xl font-extrabold tracking-[-0.03em] text-brand-ink">Boost</span>
    </a>
  )
}

function PrimaryButton({ children, className = '', testid, ...props }) {
  return (
    <button
      data-testid={testid}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-brand-coral px-7 py-3.5 font-display text-base font-extrabold text-white shadow-[5px_5px_0px_#0A0A0A] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, className = '', testid, ...props }) {
  return (
    <button
      data-testid={testid}
      className={`inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand-ink bg-white px-7 py-3.5 font-display text-base font-extrabold text-brand-ink transition-colors duration-200 hover:bg-brand-ink hover:text-white ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function Badge({ children, tone = 'neon', className = '', testid }) {
  const tones = { neon: 'bg-brand-neon text-brand-ink', coral: 'bg-brand-coral text-white', white: 'bg-white text-brand-ink' }
  return (
    <span data-testid={testid} className={`inline-flex items-center gap-1.5 rounded-full border-2 border-brand-ink px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.18em] shadow-[3px_3px_0px_#0A0A0A] ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

const Container = ({ children, className = '' }) => <div className={`mx-auto max-w-7xl px-5 md:px-10 ${className}`}>{children}</div>

/* ============================ Header ============================ */
function Header({ onStart }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const links = [
    ['#features', 'Fonctionnalités'],
    ['#examples', 'Exemples'],
    ['#pricing', 'Tarifs'],
    ['#testimonials', 'Témoignages'],
  ]
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-brand-cream/75 backdrop-blur-xl border-b border-brand-line' : 'bg-transparent'}`}>
      <Container className="flex h-16 items-center justify-between md:h-20">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} data-testid={`nav-${label.toLowerCase()}`} className="font-sans text-sm font-semibold text-brand-muted transition-colors hover:text-brand-ink">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden items-center overflow-hidden rounded-full border-2 border-brand-ink text-[11px] font-extrabold sm:flex">
            <span className="bg-brand-ink px-2.5 py-1 text-white">FR</span>
            <span className="px-2.5 py-1 text-brand-muted">EN</span>
          </div>
          <button data-testid="header-start" onClick={onStart} className="hidden rounded-full bg-brand-ink px-5 py-2.5 font-display text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5 sm:inline-flex">Commencer</button>
          <button data-testid="mobile-menu-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu" className="grid h-10 w-10 place-items-center rounded-xl border-2 border-brand-ink bg-white md:hidden">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </Container>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-b border-brand-line bg-brand-cream/95 backdrop-blur-xl md:hidden">
            <Container className="flex flex-col gap-1 py-4">
              {links.map(([href, label]) => (
                <a key={href} href={href} onClick={() => setOpen(false)} className="py-2.5 font-display text-lg font-extrabold text-brand-ink">{label}</a>
              ))}
              <PrimaryButton testid="mobile-start" onClick={() => { setOpen(false); onStart() }} className="mt-2 w-full">Commencer <ArrowRight size={18} strokeWidth={3} /></PrimaryButton>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/* ============================ Hero ============================ */
function Hero({ onStart }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-28 md:pt-36" data-testid="hero">
      {/* Blobs ambiants */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-10 h-[26rem] w-[26rem] rounded-full bg-brand-neon/40 blur-[90px]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-[24rem] w-[24rem] rounded-full bg-brand-coral/30 blur-[90px]" />

      <Container className="relative">
        <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto max-w-4xl text-center">
          <motion.div variants={fadeUp} className="flex justify-center">
            <Badge testid="hero-badge"><Sparkles size={13} strokeWidth={3} /> Ta carte d’identité digitale</Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} className="mt-7 font-display text-[44px] font-extrabold leading-[0.95] tracking-[-0.04em] text-brand-ink sm:text-6xl md:text-7xl lg:text-[88px]">
            Ta bio se transforme en{' '}
            <span className="font-serif font-medium italic">carte</span>{' '}
            <span className="relative inline-block -rotate-2 bg-brand-coral px-3 text-white">identité</span>{' '}
            digitale qui{' '}
            <span className="font-serif font-medium italic">génère</span> du business.
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mt-7 max-w-2xl font-sans text-lg text-brand-muted md:text-xl">
            Pas une simple page de liens. Une interface vivante qui montre qui tu es, ce que tu fais, et transforme tes visiteurs en clients, réservations ou revenus.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryButton testid="hero-primary-cta" onClick={onStart}>Créer ma page gratuite <ArrowRight size={18} strokeWidth={3} className="transition-transform group-hover:translate-x-1" /></PrimaryButton>
            <SecondaryButton testid="hero-secondary-cta" onClick={() => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' })}>Voir les exemples</SecondaryButton>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-5 font-sans text-sm font-semibold text-brand-muted">✦ Gratuit pour démarrer · Évolue quand tu veux</motion.p>
          <motion.ul variants={fadeUp} className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {['30 secondes', 'Sans carte bancaire', 'Sans engagement'].map((f) => (
              <li key={f} className="flex items-center gap-1.5 font-sans text-sm font-bold text-brand-ink"><Check size={16} className="text-brand-coral" strokeWidth={3} /> {f}</li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Floating cards (desktop) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7, ease: EASE }} className="pointer-events-none absolute left-2 top-40 hidden -rotate-6 lg:block" data-testid="hero-float-left">
          <div className="animate-float rounded-2xl border-2 border-brand-ink bg-white px-4 py-3 shadow-[5px_5px_0px_#0A0A0A]">
            <div className="flex items-center gap-2.5">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=70" alt="" className="h-9 w-9 rounded-full object-cover" />
              <div><p className="font-display text-sm font-extrabold">Nouveau client</p><p className="font-sans text-xs text-brand-muted">Léa vient de réserver</p></div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.7, ease: EASE }} className="pointer-events-none absolute right-2 top-52 hidden rotate-[5deg] lg:block" data-testid="hero-float-right">
          <div className="animate-float rounded-2xl border-2 border-brand-ink bg-brand-neon px-4 py-3 shadow-[5px_5px_0px_#0A0A0A]" style={{ animationDelay: '-1.5s' }}>
            <p className="font-display text-sm font-extrabold text-brand-ink">+12 DEVIS</p>
            <p className="font-sans text-xs font-semibold text-brand-ink/70">Cette semaine</p>
          </div>
        </motion.div>
      </Container>

      {/* Marquee strip */}
      <div className="mt-16 border-y-2 border-brand-ink bg-brand-ink py-4">
        <Marquee speed={42} autoFill>
          {['10 000+ créateurs', 'Tips & dons', 'Réservations', 'Lead capture', 'Analytics'].map((w, i) => (
            <span key={i} className="mx-6 inline-flex items-center gap-6 font-display text-lg font-extrabold uppercase tracking-wide text-brand-cream">
              {w} <Star size={16} className={i % 2 ? 'text-brand-neon' : 'text-brand-coral'} fill="currentColor" />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

/* ============================ Profile Showcase (sticky) ============================ */
const SUPA = 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium'
const PROFILES = [
  {
    id: 'lea-creator', name: 'Léa', handle: '@lea.mode', role: 'Créatrice mode', bio: 'Outfits quotidiens & bons plans shopping.',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=70',
    video: `${SUPA}/Premium%20Createur/56d5bd7f-9154-414f-a051-5bb904c0f8a6-2-3.1-invideo-seedance_2_0.mp4`,
    accent: '#FF4D42',
    links: [['Me soutenir (tip)', Heart], ['Instagram', Instagram], ['Mes pièces favorites', ShoppingBag]],
  },
  {
    id: 'marco-resto', name: 'Chef Marco', handle: '@trattoria.marco', role: 'Restaurant', bio: 'Cuisine italienne de saison à Lyon.',
    img: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=70',
    video: `${SUPA}/Premium%20Etablissement/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-2-2.1-invideo-seedance_2_0.mp4`,
    accent: '#F7C948',
    links: [['Réserver une table', CalendarCheck], ['Le menu', ShoppingBag], ['Itinéraire', MapPin]],
  },
  {
    id: 'sofia-coach', name: 'Sofia', handle: '@sofia.fit', role: 'Coach fitness', bio: 'Programmes & coaching en ligne.',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=200&q=70',
    video: `${SUPA}/Premium%20Createur/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-4-4.1-invideo-seedance_2_0.mp4`,
    accent: '#D6FF00',
    links: [['Me soutenir (tip)', Heart], ['Réserver une séance', CalendarCheck], ['Mes programmes', Dumbbell]],
  },
  {
    id: 'noah-designer', name: 'Noah', handle: '@noah.studio', role: 'Designer freelance', bio: 'Identités de marque & sites premium.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=70',
    video: `${SUPA}/Premium%20Freelance/b9861429-b87f-4c9d-bc04-0edc89cd21f3-1-1.1-invideo-seedance_2_0.mp4`,
    accent: '#38BDF8',
    links: [['Voir mes projets', Palette], ['Demander un devis', Mail], ['Réserver un call', CalendarCheck]],
  },
]

// Vidéo de fond : chargée et jouée uniquement quand visible (perf), en pause hors écran.
function VideoBg({ src }) {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.getAttribute('src')) v.setAttribute('src', src)
        const p = v.play()
        if (p && p.catch) p.catch(() => {})
      } else {
        v.pause()
      }
    }, { threshold: 0.2 })
    io.observe(v)
    return () => io.disconnect()
  }, [src])
  return <video ref={ref} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
}

function PhoneCard({ p }) {
  const rowCls = 'border border-white/20 bg-white/10 text-white backdrop-blur-md'
  return (
    <div className="relative mx-auto w-[320px]" data-testid={`profile-card-${p.id}`}>
      <div className="relative overflow-hidden rounded-[42px] border-[10px] border-brand-ink shadow-[10px_10px_0px_#0A0A0A]">
        <div className="absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-brand-ink" />
        <div className="relative min-h-[560px] px-6 pb-8 pt-12 text-white">
          <VideoBg src={p.video} />
          {/* Vignette pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/75" aria-hidden />
          {/* Glow chaud signature */}
          <div className="absolute inset-0" style={{ background: `radial-gradient(60% 45% at 50% 38%, ${p.accent}33, transparent 70%)` }} aria-hidden />

          <div className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img src={p.img} alt={p.name} className="h-24 w-24 rounded-full border-4 border-white/80 object-cover shadow-lg" />
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white" style={{ background: p.accent }} />
              </div>
              <h3 className="mt-4 font-display text-2xl font-extrabold tracking-[-0.02em] drop-shadow">{p.name}</h3>
              <p className="font-sans text-sm font-semibold text-white/70">{p.handle}</p>
              <span className="mt-2 rounded-full border px-3 py-0.5 font-display text-[11px] font-extrabold uppercase tracking-[0.15em]" style={{ borderColor: p.accent, color: p.accent }}>{p.role}</span>
              <p className="mt-3 font-sans text-sm text-white/80">{p.bio}</p>
            </div>
            <div className="mt-6 space-y-3">
              {p.links.map(([label, Icon], i) => {
                const primary = i === 0
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 font-display text-sm font-extrabold ${primary ? 'text-brand-ink' : rowCls}`}
                    style={primary ? { background: p.accent } : undefined}
                  >
                    <Icon size={18} strokeWidth={2.5} /> {label}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Notif flottante (tips) */}
      <div className="absolute -right-4 top-24 rotate-3 animate-float rounded-2xl border-2 border-brand-ink bg-white px-3 py-2 shadow-[4px_4px_0px_#0A0A0A]">
        <p className="flex items-center gap-1.5 font-display text-xs font-extrabold"><Heart size={12} className="text-brand-coral" fill="currentColor" /> +1 soutien</p>
      </div>
    </div>
  )
}

function ProfileShowcase({ onStart }) {
  return (
    <section id="examples" className="scroll-mt-24 bg-white py-24 md:py-32" data-testid="profile-showcase">
      <Container>
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <Badge tone="coral" testid="showcase-badge">Profils en action</Badge>
              <h2 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-brand-ink md:text-6xl lg:text-7xl">
                Ils ont boosté leur business.{' '}
                <span className="font-serif font-medium italic text-brand-coral">À ton tour.</span>
              </h2>
              <p className="mt-6 max-w-md font-sans text-lg text-brand-muted">Une page qui s’adapte à ton métier — créateur, restaurant, coach, freelance, artiste.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Créateur', 'Restaurant', 'Coach', 'Freelance', 'Artiste'].map((tag) => (
                  <span key={tag} className="rounded-full border-2 border-brand-ink px-3 py-1 font-display text-xs font-extrabold">{tag}</span>
                ))}
              </div>
              <PrimaryButton testid="showcase-cta" onClick={onStart} className="mt-8">Créer la mienne <ArrowRight size={18} strokeWidth={3} /></PrimaryButton>
            </div>
          </div>
          <div className="space-y-36 lg:col-span-7">
            {PROFILES.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.7, ease: EASE }}>
                <PhoneCard p={p} />
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ============================ How it works ============================ */
function HowItWorks() {
  const steps = [
    { n: '01', icon: UserCircle2, title: 'Choisis ton identité', card: 'bg-brand-ink text-white', accent: 'text-brand-neon' },
    { n: '02', icon: Wand2, title: 'Personnalise en 30 secondes', card: 'bg-brand-coral text-white', accent: 'text-white' },
    { n: '03', icon: Rocket, title: 'Partage. Capture. Convertis.', card: 'bg-brand-neon text-brand-ink', accent: 'text-brand-ink' },
  ]
  return (
    <section className="bg-brand-cream py-24 md:py-32" data-testid="how-it-works">
      <Container>
        <Badge testid="how-badge">Comment ça marche</Badge>
        <h2 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-brand-ink md:text-6xl lg:text-7xl">
          Trois étapes. <span className="font-serif font-medium italic">Zéro</span> excuse.
        </h2>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewport} className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div key={s.n} variants={fadeUp} transition={{ delay: i * 0.12 }} className={`group relative h-[340px] overflow-hidden rounded-[28px] border-2 border-brand-ink p-7 shadow-[6px_6px_0px_#0A0A0A] ${s.card}`} data-testid={`step-${i}`}>
              <span className={`font-display text-7xl font-extrabold opacity-30 transition-opacity duration-300 group-hover:opacity-100 ${s.accent}`}>{s.n}</span>
              <s.icon size={40} strokeWidth={2.5} className={`mt-6 ${s.accent}`} />
              <h3 className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-[-0.02em]">{s.title}</h3>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}

/* ============================ Bento features ============================ */
const CHART = [{ v: 8 }, { v: 14 }, { v: 11 }, { v: 22 }, { v: 18 }, { v: 30 }, { v: 26 }, { v: 38 }]

function BentoFeatures() {
  return (
    <section id="features" className="scroll-mt-24 bg-brand-cream py-24 md:py-32" data-testid="bento-features">
      <Container>
        <Badge tone="coral" testid="features-badge">Toutes les armes</Badge>
        <h2 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-brand-ink md:text-6xl lg:text-7xl">
          Un seul lien. Des possibilités <span className="font-serif font-medium italic">infinies.</span>
        </h2>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewport} className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-8 lg:grid-cols-12">
          {/* Analytics */}
          <motion.div variants={fadeUp} className="rounded-[28px] border-2 border-brand-ink bg-brand-ink p-7 text-white shadow-[6px_6px_0px_#0A0A0A] md:col-span-8 lg:col-span-7" data-testid="feature-analytics">
            <div className="flex items-start justify-between">
              <div>
                <BarChart3 className="text-brand-neon" />
                <h3 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em]">Analytics Pro</h3>
                <p className="mt-1 font-sans text-sm text-white/60">Sache exactement ce qui convertit.</p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-extrabold text-brand-neon">+842</p>
                <p className="font-sans text-xs text-white/60">clics · +34% vs sem.</p>
              </div>
            </div>
            <div className="mt-4 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={CHART}><Line type="monotone" dataKey="v" stroke="#D6FF00" strokeWidth={3} dot={false} /></LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Lead capture */}
          <motion.div variants={fadeUp} className="rounded-[28px] border-2 border-brand-ink bg-white p-7 shadow-[6px_6px_0px_#0A0A0A] md:col-span-8 lg:col-span-5" data-testid="feature-leads">
            <Mail className="text-brand-coral" />
            <h3 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em]">Capture de leads</h3>
            <p className="mt-1 font-sans text-sm text-brand-muted">Transforme tes visiteurs en contacts.</p>
            <div className="mt-5 flex gap-2">
              <input data-testid="feature-leads-input" placeholder="ton@email.com" className="min-w-0 flex-1 rounded-full border-2 border-brand-ink px-4 py-2.5 font-sans text-sm outline-none" />
              <button className="rounded-full bg-brand-coral px-4 py-2.5 font-display text-sm font-extrabold text-white shadow-[3px_3px_0px_#0A0A0A]">OK</button>
            </div>
          </motion.div>

          {/* Tips & soutiens */}
          <motion.div variants={fadeUp} className="flex flex-col rounded-[28px] border-2 border-brand-ink bg-brand-neon p-7 shadow-[6px_6px_0px_#0A0A0A] md:col-span-4 lg:col-span-4" data-testid="feature-tips">
            <Heart className="text-brand-ink" fill="currentColor" />
            <h3 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em] text-brand-ink">Tips & soutiens</h3>
            <p className="mt-1 font-sans text-sm text-brand-ink/70">Ton audience te soutient en 1 clic. Tu encaisses direct.</p>
            <div className="mt-4 flex gap-2">
              {['3€', '5€', '10€'].map((a) => (
                <span key={a} className="rounded-full border-2 border-brand-ink bg-white px-3.5 py-1.5 font-display text-sm font-extrabold">{a}</span>
              ))}
            </div>
            <p className="mt-auto pt-5 font-display text-3xl font-extrabold text-brand-ink">+248€ <span className="text-sm font-bold text-brand-ink/60">ce mois</span></p>
          </motion.div>

          {/* Personnalisation */}
          <motion.div variants={fadeUp} className="rounded-[28px] border-2 border-brand-ink bg-white p-7 shadow-[6px_6px_0px_#0A0A0A] md:col-span-4 lg:col-span-5" data-testid="feature-custom">
            <Palette className="text-brand-coral" />
            <h3 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em]">Personnalisation</h3>
            <p className="mt-1 font-sans text-sm text-brand-muted">Des templates qui te ressemblent.</p>
            <div className="mt-5 flex gap-2.5">
              {['#FF4D42', '#D6FF00', '#0A0A0A', '#F0426B', '#38BDF8', '#F7C948'].map((c) => (
                <span key={c} className="h-8 w-8 rounded-full border-2 border-brand-ink" style={{ background: c }} />
              ))}
            </div>
          </motion.div>

          {/* 30 secondes */}
          <motion.div variants={fadeUp} className="flex flex-col justify-between rounded-[28px] border-2 border-brand-ink bg-brand-coral p-7 text-white shadow-[6px_6px_0px_#0A0A0A] md:col-span-8 lg:col-span-3" data-testid="feature-speed">
            <Zap fill="currentColor" />
            <div><p className="font-display text-4xl font-extrabold">30s</p><p className="font-sans text-sm text-white/80">pour être en ligne.</p></div>
          </motion.div>

          {/* Domaine + QR + Mobile */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-5 rounded-[28px] border-2 border-brand-ink bg-white p-7 shadow-[6px_6px_0px_#0A0A0A] md:col-span-8 lg:col-span-12 lg:flex-row lg:justify-between" data-testid="feature-domain">
            <div className="flex items-center gap-6">
              <Globe className="text-brand-ink" />
              <QrCode className="text-brand-ink" />
              <Smartphone className="text-brand-ink" />
            </div>
            <div className="rounded-full border-2 border-brand-ink bg-brand-cream px-5 py-2.5 font-display text-lg font-extrabold">bioboost.fr/<span className="text-brand-coral">toi</span></div>
            <p className="font-sans text-sm font-semibold text-brand-muted">Domaine perso · QR code · 100% mobile</p>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}

/* ============================ Testimonials ============================ */
const TESTI = [
  { name: 'Camille', role: 'Créatrice mode', quote: 'Mes ventes ont doublé en 2 mois. La page convertit vraiment.' },
  { name: 'Antoine', role: 'Restaurateur', quote: 'Les réservations arrivent directement depuis mon lien Insta.' },
  { name: 'Sofia', role: 'Coach', quote: 'Mes clients réservent leurs séances en 2 clics. Magique.' },
  { name: 'Noah', role: 'Designer', quote: 'Mes devis ont explosé. L’interface fait premium direct.' },
  { name: 'Marco', role: 'Chef étoilé', quote: 'Enfin une page à la hauteur de mon restaurant.' },
]

function TestiCard({ t }) {
  return (
    <div className="mx-3 w-[380px] rounded-[28px] border-2 border-brand-ink bg-brand-cream p-6 shadow-[5px_5px_0px_#0A0A0A]">
      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} className="text-brand-coral" fill="currentColor" />)}</div>
      <p className="mt-4 font-display text-lg font-bold leading-snug tracking-[-0.01em] text-brand-ink">“{t.quote}”</p>
      <div className="mt-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-brand-ink bg-brand-neon font-display font-extrabold">{t.name[0]}</span>
        <div><p className="font-display text-sm font-extrabold">{t.name}</p><p className="font-sans text-xs text-brand-muted">{t.role}</p></div>
      </div>
    </div>
  )
}

function Testimonials() {
  const stats = [['10 000+', 'créateurs'], ['2,4M', 'clics générés'], ['94%', 'recommandent'], ['4,9★', 'note moyenne']]
  return (
    <section id="testimonials" className="scroll-mt-24 overflow-hidden bg-white py-24 md:py-32" data-testid="testimonials">
      <Container>
        <Badge testid="testi-badge">Ils en parlent</Badge>
        <h2 className="mt-6 max-w-4xl font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-brand-ink md:text-6xl lg:text-7xl">
          Rejoins +10 000 créateurs qui ont <span className="font-serif font-medium italic">changé de ligue.</span>
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map(([n, l], i) => (
            <div key={l} className="text-center md:text-left" data-testid={`stat-${i}`}>
              <p className="font-display text-4xl font-extrabold tracking-[-0.03em] text-brand-ink md:text-5xl">{n}</p>
              <p className="mt-1 font-sans text-sm font-semibold text-brand-muted">{l}</p>
            </div>
          ))}
        </div>
      </Container>
      <div className="mt-14 space-y-5">
        <Marquee speed={32} gradient gradientColor="#FFFFFF" pauseOnHover>{TESTI.map((t, i) => <TestiCard key={i} t={t} />)}</Marquee>
        <Marquee speed={28} direction="right" gradient gradientColor="#FFFFFF" pauseOnHover>{[...TESTI].reverse().map((t, i) => <TestiCard key={i} t={t} />)}</Marquee>
      </div>
    </section>
  )
}

/* ============================ Pricing ============================ */
const TIERS = [
  { key: 'free', name: 'Free', price: '0€', per: '', fee: '5% de commission', highlight: false,
    features: ['1 page + tous les boutons', 'Templates basiques', '1 template vidéo offert', 'Tips & analytics inclus'] },
  { key: 'creator', name: 'Creator', price: '7€', per: '/mois', fee: '1% de commission', highlight: true,
    features: ['Sans branding BioBoost', 'Templates vidéo premium', 'Produits illimités', 'CTA personnalisés'] },
  { key: 'pro', name: 'Pro', price: '15€', per: '/mois', fee: '0% de commission', highlight: false,
    features: ['Tout de Creator', 'Ton lien pro perso', 'Widgets premium', 'Support prioritaire'] },
]

function Pricing({ onStart }) {
  return (
    <section id="pricing" className="scroll-mt-24 bg-white py-24 md:py-32" data-testid="pricing">
      <Container>
        <Badge tone="neon" testid="pricing-badge">Tarifs</Badge>
        <h2 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-brand-ink md:text-6xl lg:text-7xl">
          Commence gratuit. <span className="font-serif font-medium italic text-brand-coral">Monétise</span> quand tu veux.
        </h2>
        <p className="mt-6 max-w-xl font-sans text-lg text-brand-muted">Sur les tips et les ventes, BioBoost ne prélève qu’une petite commission — tu gardes presque tout.</p>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewport} className="mt-12 grid items-start gap-6 md:grid-cols-3">
          {TIERS.map((tier, i) => {
            const dark = tier.highlight
            return (
              <motion.div
                key={tier.key}
                variants={fadeUp}
                transition={{ delay: i * 0.1 }}
                className={`relative flex h-full flex-col rounded-[28px] border-2 border-brand-ink p-8 ${dark ? 'bg-brand-coral text-white shadow-[6px_6px_0px_#D6FF00] md:-mt-4' : 'bg-white text-brand-ink shadow-[6px_6px_0px_#0A0A0A]'}`}
                data-testid={`pricing-${tier.key}`}
              >
                {dark && <span className="absolute right-6 top-6 rounded-full bg-brand-neon px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-ink">Populaire</span>}
                <h3 className="font-display text-xl font-extrabold uppercase tracking-wide">{tier.name}</h3>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.03em]">
                  {tier.price}{tier.per && <span className={`text-lg font-bold ${dark ? 'text-white/70' : 'text-brand-muted'}`}>{tier.per}</span>}
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 font-sans text-sm font-semibold">
                      <Check size={16} strokeWidth={3} className={dark ? 'text-brand-neon' : 'text-brand-coral'} /> {f}
                    </li>
                  ))}
                </ul>
                <div className={`mt-6 rounded-2xl px-4 py-2.5 text-center font-display text-sm font-extrabold ${dark ? 'bg-white/15' : 'bg-brand-cream'}`}>{tier.fee}</div>
                <button
                  data-testid={`pricing-cta-${tier.key}`}
                  onClick={onStart}
                  className={`mt-5 w-full rounded-full px-6 py-3.5 font-display text-base font-extrabold transition-transform hover:-translate-y-0.5 ${dark ? 'bg-brand-ink text-white shadow-[4px_4px_0px_#D6FF00]' : 'bg-brand-coral text-white shadow-[4px_4px_0px_#0A0A0A]'}`}
                >
                  {tier.key === 'free' ? 'Commencer gratuitement' : `Passer ${tier.name}`}
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}

/* ============================ Final CTA + Footer ============================ */
function FinalCTA({ onStart }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [60, -60])
  const features = ['Sans code', 'Paiements Stripe', 'Analytics', 'QR code', 'Domaine perso', 'Mobile-first']
  return (
    <section ref={ref} className="relative overflow-hidden rounded-t-[60px] bg-brand-ink px-5 py-32 text-white md:py-40" data-testid="final-cta">
      <div aria-hidden className="pointer-events-none absolute -left-10 top-10 h-72 w-72 rounded-full bg-brand-coral/40 blur-[100px]" />
      <div aria-hidden className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-brand-neon/30 blur-[100px]" />
      <Container className="relative text-center">
        <motion.div style={{ y }} className="flex justify-center">
          <Badge testid="final-badge">Dernière étape</Badge>
        </motion.div>
        <h2 className="mx-auto mt-7 max-w-4xl font-display text-6xl font-extrabold leading-[0.92] tracking-[-0.04em] md:text-8xl lg:text-[112px]">
          Prêt à <span className="font-serif font-medium italic text-brand-coral">dominer</span> ton marché ?
        </h2>
        <p className="mx-auto mt-7 max-w-xl font-sans text-lg text-white/70">Crée ta page en 30 secondes. Sans carte bancaire, sans engagement.</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <button data-testid="final-cta-button" onClick={onStart} className="group inline-flex items-center gap-2 rounded-full bg-brand-coral px-9 py-4 font-display text-lg font-extrabold text-white shadow-[6px_6px_0px_#D6FF00] transition-transform hover:-translate-y-0.5">
            Créer ma page gratuite <ArrowRight size={20} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
          </button>
          <a href="#examples" className="font-display text-base font-extrabold underline underline-offset-4 hover:text-brand-neon">Voir les exemples</a>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f} className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 font-sans text-sm font-semibold backdrop-blur">{f}</div>
          ))}
        </div>

        <footer className="mt-24 border-t border-white/10 pt-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-brand-neon font-display text-sm font-extrabold text-brand-ink">Bio</span>
              <span className="font-display text-lg font-extrabold">Boost</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-sans text-sm font-semibold text-white/60">
              <a href="/legal/mentions-legales" className="hover:text-white">Mentions légales</a>
              <a href="/legal/cgu" className="hover:text-white">CGU</a>
              <a href="/legal/confidentialite" className="hover:text-white">Confidentialité</a>
              <a href="/legal/cgv" className="hover:text-white">Contact</a>
            </div>
            <p className="font-sans text-sm text-white/40">© 2026 BioBoost</p>
          </div>
        </footer>
      </Container>
    </section>
  )
}

/* ============================ Page ============================ */
export default function Landing() {
  const { user } = useAuth()
  const nav = useNavigate()
  const onStart = () => nav(user ? '/onboarding' : '/login')
  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-ink antialiased">
      <Header onStart={onStart} />
      <Hero onStart={onStart} />
      <ProfileShowcase onStart={onStart} />
      <HowItWorks />
      <BentoFeatures />
      <Testimonials />
      <Pricing onStart={onStart} />
      <FinalCTA onStart={onStart} />
    </div>
  )
}
