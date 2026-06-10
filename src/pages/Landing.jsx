import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Marquee from 'react-fast-marquee'
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import {
  Sparkles, ArrowRight, Check, Star, Menu, X, Instagram, CalendarCheck,
  ShoppingBag, MapPin, Dumbbell, Palette, Zap, BarChart3,
  Mail, QrCode, Smartphone, Globe, Heart,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'

const EASE = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const viewport = { once: true, margin: '-100px' }

// Vitesse de marquee responsive : un peu plus rapide sur mobile.
function useMarqueeSpeed(base, mobile) {
  const [speed, setSpeed] = useState(base)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setSpeed(mq.matches ? mobile : base)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [base, mobile])
  return speed
}

/* ============================ Copy (FR / EN) ============================ */
const T = {
  fr: {
    nav: { features: 'Fonctionnalités', examples: 'Exemples', pricing: 'Tarifs', testimonials: 'Témoignages' },
    start: 'Commencer',
    heroBadge: 'Ta carte de visite digitale',
    heroSub: 'Pas une simple page de liens. Une interface vivante qui montre qui tu es, ce que tu fais, et transforme tes visiteurs en clients, réservations ou revenus.',
    heroCta: 'Créer ma page gratuite', heroSee: 'Voir les exemples',
    heroMicro: '✦ Gratuit pour démarrer · Évolue quand tu veux',
    heroChecks: ['30 secondes', 'Sans carte bancaire', 'Sans engagement'],
    marquee: ['10 000+ créateurs', 'Tips & dons', 'Réservations', 'Lead capture', 'Analytics'],
    floatClient: ['Nouveau client', 'Léa vient de réserver'], floatQuotes: ['+12 DEVIS', 'Cette semaine'], floatTips: 'de tips ce mois',
    showBadge: 'Profils en action', showSub: 'Une présence digitale unique, pensée pour toi.',
    showTags: ['Créateur', 'Restaurant', 'Coach', 'Freelance', 'Artiste'], showCta: 'Créer la mienne', notif: '+1 soutien', wallLabel: 'soutiens',
    howBadge: 'Comment ça marche', howSteps: ['Choisis ton identité', 'Personnalise en 30 secondes', 'Partage. Capture. Convertis.'],
    feBadge: 'Toutes les armes',
    fe: {
      analytics: ['Analytics Pro', 'Sache exactement ce qui convertit.', 'clics · +34% vs sem.'],
      leads: ['Capture de leads', 'Transforme tes visiteurs en contacts.'],
      tips: ['Tips & soutiens', 'Ton audience te soutient en 1 clic. Tu encaisses direct.', 'ce mois'],
      custom: ['Personnalisation', 'Des templates qui te ressemblent.'],
      speed: ['pour être en ligne.'],
      domain: 'Domaine perso · QR code · 100% mobile',
    },
    tBadge: 'Ils en parlent',
    stats: [['10 000+', 'créateurs'], ['2,4M', 'clics générés'], ['94%', 'recommandent'], ['4,9★', 'note moyenne']],
    prBadge: 'Tarifs', prSub: 'Sur les tips et les ventes, Aaven ne prélève qu’une petite commission — tu gardes presque tout.',
    popular: 'Populaire', feeWord: 'de commission', ctaFree: 'Commencer gratuitement', ctaGo: 'Passer',
    finalBadge: 'Dernière étape', finalSub: 'Crée ta page en 30 secondes. Sans carte bancaire, sans engagement.',
    finalCta: 'Créer ma page gratuite', finalSee: 'Voir les exemples',
    finalFeatures: ['Zéro compétence technique', 'Encaisse en 1 clic', 'Analytics', 'QR code', 'Domaine perso', 'Sublime sur mobile'],
    footer: ['Mentions légales', 'CGU', 'Confidentialité', 'Contact'],
  },
  en: {
    nav: { features: 'Features', examples: 'Examples', pricing: 'Pricing', testimonials: 'Reviews' },
    start: 'Get started',
    heroBadge: 'Your digital business card',
    heroSub: 'Not just a list of links. A living interface that shows who you are, what you do, and turns visitors into clients, bookings or revenue.',
    heroCta: 'Create my free page', heroSee: 'See examples',
    heroMicro: '✦ Free to start · Upgrade anytime',
    heroChecks: ['30 seconds', 'No credit card', 'No commitment'],
    marquee: ['10,000+ creators', 'Tips & donations', 'Bookings', 'Lead capture', 'Analytics'],
    floatClient: ['New client', 'Léa just booked'], floatQuotes: ['+12 QUOTES', 'This week'], floatTips: 'in tips this month',
    showBadge: 'Profiles in action', showSub: 'A unique digital presence, built for you.',
    showTags: ['Creator', 'Restaurant', 'Coach', 'Freelance', 'Artist'], showCta: 'Create mine', notif: '+1 support', wallLabel: 'supporters',
    howBadge: 'How it works', howSteps: ['Choose your identity', 'Customize in 30 seconds', 'Share. Capture. Convert.'],
    feBadge: 'Every tool',
    fe: {
      analytics: ['Analytics Pro', 'Know exactly what converts.', 'clicks · +34% vs last wk.'],
      leads: ['Lead capture', 'Turn your visitors into contacts.'],
      tips: ['Tips & support', 'Your audience supports you in 1 tap. You cash in.', 'this month'],
      custom: ['Customization', 'Templates that look like you.'],
      speed: ['to go live.'],
      domain: 'Custom domain · QR code · 100% mobile',
    },
    tBadge: 'What they say',
    stats: [['10,000+', 'creators'], ['2.4M', 'clicks generated'], ['94%', 'recommend'], ['4.9★', 'average rating']],
    prBadge: 'Pricing', prSub: 'On tips and sales, Aaven only takes a small fee — you keep almost everything.',
    popular: 'Popular', feeWord: 'fee', ctaFree: 'Start for free', ctaGo: 'Go',
    finalBadge: 'Last step', finalSub: 'Create your page in 30 seconds. No credit card, no commitment.',
    finalCta: 'Create my free page', finalSee: 'See examples',
    finalFeatures: ['No tech skills needed', 'Get paid in 1 tap', 'Analytics', 'QR code', 'Custom domain', 'Stunning on mobile'],
    footer: ['Legal notice', 'Terms', 'Privacy', 'Contact'],
  },
}
const useCopy = () => { const { lang } = useI18n(); return T[lang] || T.fr }

/* ============================ Primitives ============================ */
function Logo() {
  return (
    <a href="/" data-testid="logo" className="inline-flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="text-brand-ink" aria-hidden>
        <path d="M4.5 20 L12 4 L19.5 20" />
        <path d="M8.2 13.6 H15.8" />
      </svg>
      <span className="font-sans text-[1.4rem] font-bold tracking-[-0.04em] text-brand-ink">Aaven</span>
    </a>
  )
}

function PrimaryButton({ children, className = '', testid, ...props }) {
  return (
    <button data-testid={testid} className={`group inline-flex items-center justify-center gap-2 rounded-full bg-brand-coral px-7 py-3.5 font-display text-base font-extrabold text-white shadow-[5px_5px_0px_#0A0A0A] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 ${className}`} {...props}>{children}</button>
  )
}
function SecondaryButton({ children, className = '', testid, ...props }) {
  return (
    <button data-testid={testid} className={`inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand-ink bg-white px-7 py-3.5 font-display text-base font-extrabold text-brand-ink transition-colors duration-200 hover:bg-brand-ink hover:text-white ${className}`} {...props}>{children}</button>
  )
}
function Badge({ children, tone = 'neon', className = '', testid }) {
  const tones = { neon: 'bg-brand-neon text-brand-ink', coral: 'bg-brand-coral text-white', white: 'bg-white text-brand-ink' }
  return <span data-testid={testid} className={`inline-flex items-center gap-1.5 rounded-full border-2 border-brand-ink px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.18em] shadow-[3px_3px_0px_#0A0A0A] ${tones[tone]} ${className}`}>{children}</span>
}
const Container = ({ children, className = '' }) => <div className={`mx-auto max-w-7xl px-5 md:px-10 ${className}`}>{children}</div>

/* ============================ Header ============================ */
function Header({ onStart }) {
  const c = useCopy()
  const { lang, setLang } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const links = [['#features', c.nav.features], ['#examples', c.nav.examples], ['#pricing', c.nav.pricing], ['#testimonials', c.nav.testimonials]]
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-brand-cream/75 backdrop-blur-xl border-b border-brand-line' : 'bg-transparent'}`}>
      <Container className="flex h-16 items-center justify-between md:h-20">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} data-testid={`nav-${href.slice(1)}`} className="font-sans text-sm font-semibold text-brand-muted transition-colors hover:text-brand-ink">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden items-center overflow-hidden rounded-full border-2 border-brand-ink text-[11px] font-extrabold sm:flex">
            {['fr', 'en'].map((l) => (
              <button key={l} data-testid={`lang-${l}`} onClick={() => setLang(l)} aria-pressed={lang === l} className={`px-2.5 py-1 uppercase transition-colors ${lang === l ? 'bg-brand-ink text-white' : 'text-brand-muted hover:text-brand-ink'}`}>{l}</button>
            ))}
          </div>
          <button data-testid="header-start" onClick={onStart} className="hidden rounded-full bg-brand-ink px-5 py-2.5 font-display text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5 sm:inline-flex">{c.start}</button>
          <button data-testid="mobile-menu-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu" className="grid h-10 w-10 place-items-center rounded-xl border-2 border-brand-ink bg-white md:hidden">{open ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </Container>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-b border-brand-line bg-brand-cream/95 backdrop-blur-xl md:hidden">
            <Container className="flex flex-col gap-1 py-4">
              {links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)} className="py-2.5 font-display text-lg font-extrabold text-brand-ink">{label}</a>)}
              <div className="mt-2 flex items-center gap-2">
                {['fr', 'en'].map((l) => (
                  <button key={l} onClick={() => setLang(l)} className={`rounded-full border-2 border-brand-ink px-3 py-1 text-xs font-extrabold uppercase ${lang === l ? 'bg-brand-ink text-white' : 'text-brand-ink'}`}>{l}</button>
                ))}
              </div>
              <PrimaryButton testid="mobile-start" onClick={() => { setOpen(false); onStart() }} className="mt-3 w-full">{c.start} <ArrowRight size={18} strokeWidth={3} /></PrimaryButton>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/* ============================ Hero ============================ */
function Hero({ onStart }) {
  const c = useCopy()
  const { lang } = useI18n()
  const marqueeSpeed = useMarqueeSpeed(42, 75)
  return (
    <section className="relative overflow-hidden pb-16 pt-28 md:pt-36" data-testid="hero">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-10 h-[26rem] w-[26rem] rounded-full bg-brand-neon/40 blur-[90px]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-[24rem] w-[24rem] rounded-full bg-brand-coral/30 blur-[90px]" />
      <Container className="relative">
        <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto max-w-4xl text-center">
          <motion.div variants={fadeUp} className="flex justify-center">
            <Badge testid="hero-badge"><Sparkles size={13} strokeWidth={3} /> {c.heroBadge}</Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="mt-7 font-display text-[44px] font-extrabold leading-[0.95] tracking-[-0.04em] text-brand-ink sm:text-6xl md:text-7xl lg:text-[88px]">
            {lang === 'en' ? (
              <>Your{' '}<span className="font-serif font-medium italic">personalized</span> digital business card, built to{' '}<span className="relative inline-block -rotate-2 bg-brand-coral px-3 text-white">convert</span>.</>
            ) : (
              <>Ta carte de visite digitale{' '}<span className="font-serif font-medium italic">personnalisée</span>, pensée pour{' '}<span className="relative inline-block -rotate-2 bg-brand-coral px-3 text-white">convertir</span>.</>
            )}
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-7 max-w-2xl font-sans text-lg text-brand-muted md:text-xl">{c.heroSub}</motion.p>
          <motion.div variants={fadeUp} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryButton testid="hero-primary-cta" onClick={onStart}>{c.heroCta} <ArrowRight size={18} strokeWidth={3} className="transition-transform group-hover:translate-x-1" /></PrimaryButton>
            <SecondaryButton testid="hero-secondary-cta" onClick={() => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' })}>{c.heroSee}</SecondaryButton>
          </motion.div>
          <motion.p variants={fadeUp} className="mt-5 font-sans text-sm font-semibold text-brand-muted">{c.heroMicro}</motion.p>
          <motion.ul variants={fadeUp} className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {c.heroChecks.map((f) => <li key={f} className="flex items-center gap-1.5 font-sans text-sm font-bold text-brand-ink"><Check size={16} className="text-brand-coral" strokeWidth={3} /> {f}</li>)}
          </motion.ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7, ease: EASE }} className="pointer-events-none absolute left-2 top-40 hidden -rotate-6 lg:block" data-testid="hero-float-left">
          <div className="animate-float rounded-2xl border-2 border-brand-ink bg-white px-4 py-3 shadow-[5px_5px_0px_#0A0A0A]">
            <div className="flex items-center gap-2.5">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=70" alt="" className="h-9 w-9 rounded-full object-cover" />
              <div><p className="font-display text-sm font-extrabold">{c.floatClient[0]}</p><p className="font-sans text-xs text-brand-muted">{c.floatClient[1]}</p></div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.7, ease: EASE }} className="pointer-events-none absolute right-2 top-52 hidden rotate-[5deg] lg:block" data-testid="hero-float-right">
          <div className="animate-float rounded-2xl border-2 border-brand-ink bg-brand-neon px-4 py-3 shadow-[5px_5px_0px_#0A0A0A]" style={{ animationDelay: '-1.5s' }}>
            <p className="font-display text-sm font-extrabold text-brand-ink">{c.floatQuotes[0]}</p>
            <p className="font-sans text-xs font-semibold text-brand-ink/70">{c.floatQuotes[1]}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.7, ease: EASE }} className="pointer-events-none absolute bottom-24 left-8 hidden -rotate-3 lg:block" data-testid="hero-float-tips">
          <div className="animate-float rounded-2xl border-2 border-brand-ink bg-brand-coral px-4 py-3 text-white shadow-[5px_5px_0px_#0A0A0A]" style={{ animationDelay: '-0.8s' }}>
            <p className="flex items-center gap-1.5 font-display text-sm font-extrabold"><Heart size={13} fill="currentColor" /> +427€</p>
            <p className="font-sans text-xs font-semibold text-white/80">{c.floatTips}</p>
          </div>
        </motion.div>
      </Container>

      <div className="mt-16 border-y-2 border-brand-ink bg-brand-ink py-4">
        <Marquee speed={marqueeSpeed} autoFill>
          {c.marquee.map((w, i) => <span key={i} className="mx-6 inline-flex items-center gap-6 font-display text-lg font-extrabold uppercase tracking-wide text-brand-cream">{w} <Star size={16} className={i % 2 ? 'text-brand-neon' : 'text-brand-coral'} fill="currentColor" /></span>)}
        </Marquee>
      </div>
    </section>
  )
}

/* ============================ Profile Showcase ============================ */
const SUPA = 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium'
const PROFILE_META = [
  { id: 'lea-creator', name: 'Léa', handle: '@lea.mode', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=70', video: `${SUPA}/Premium%20Createur/56d5bd7f-9154-414f-a051-5bb904c0f8a6-2-3.1-invideo-seedance_2_0.mp4`, accent: '#FF4D42', icons: [Heart, Instagram, ShoppingBag], wall: '1,2k' },
  { id: 'marco-resto', name: 'Chef Marco', handle: '@trattoria.marco', img: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=70', video: `${SUPA}/Premium%20Etablissement/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-2-2.1-invideo-seedance_2_0.mp4`, accent: '#F7C948', icons: [CalendarCheck, ShoppingBag, MapPin] },
  { id: 'sofia-coach', name: 'Sofia', handle: '@sofia.fit', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=200&q=70', video: `${SUPA}/Premium%20Createur/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-4-4.1-invideo-seedance_2_0.mp4`, accent: '#D6FF00', icons: [Heart, CalendarCheck, Dumbbell], wall: '480' },
  { id: 'noah-designer', name: 'Noah', handle: '@noah.studio', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=70', video: `${SUPA}/Premium%20Freelance/b9861429-b87f-4c9d-bc04-0edc89cd21f3-1-1.1-invideo-seedance_2_0.mp4`, accent: '#38BDF8', icons: [Palette, Mail, CalendarCheck] },
]
const PROFILE_COPY = {
  fr: {
    'lea-creator': { role: 'Créatrice mode', bio: 'Outfits quotidiens & bons plans shopping.', links: ['Me soutenir (tip)', 'Instagram', 'Mes pièces favorites'], supporters: [{ name: 'Manon', msg: 'Tes lookbooks sont incroyables 😍', reply: 'Merci Manon, ça me touche ! 💕' }, { name: 'Inès', msg: 'Hâte de la prochaine collab !' }] },
    'marco-resto': { role: 'Restaurant', bio: 'Cuisine italienne de saison à Lyon.', links: ['Réserver une table', 'Le menu', 'Itinéraire'] },
    'sofia-coach': { role: 'Coach fitness', bio: 'Programmes & coaching en ligne.', links: ['Me soutenir (tip)', 'Réserver une séance', 'Mes programmes'], supporters: [{ name: 'Karim', msg: 'Programme au top, merci coach 💪', reply: 'On lâche rien Karim ! 🔥' }, { name: 'Julie', msg: '+3 kg de muscle en 2 mois !' }] },
    'noah-designer': { role: 'Designer freelance', bio: 'Identités de marque & sites premium.', links: ['Voir mes projets', 'Demander un devis', 'Réserver un call'] },
  },
  en: {
    'lea-creator': { role: 'Fashion creator', bio: 'Daily outfits & shopping tips.', links: ['Support me (tip)', 'Instagram', 'My favorite picks'], supporters: [{ name: 'Manon', msg: 'Your lookbooks are incredible 😍', reply: 'Thank you Manon, means a lot! 💕' }, { name: 'Inès', msg: 'Can’t wait for the next collab!' }] },
    'marco-resto': { role: 'Restaurant', bio: 'Seasonal Italian cuisine in Lyon.', links: ['Book a table', 'Menu', 'Directions'] },
    'sofia-coach': { role: 'Fitness coach', bio: 'Online programs & coaching.', links: ['Support me (tip)', 'Book a session', 'My programs'], supporters: [{ name: 'Karim', msg: 'Best program ever, thanks coach 💪', reply: 'Keep pushing Karim! 🔥' }, { name: 'Julie', msg: '+3 kg of muscle in 2 months!' }] },
    'noah-designer': { role: 'Freelance designer', bio: 'Brand identities & premium sites.', links: ['See my work', 'Request a quote', 'Book a call'] },
  },
}

function VideoBg({ src }) {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!v.getAttribute('src')) v.setAttribute('src', src); const p = v.play(); if (p && p.catch) p.catch(() => {}) } else v.pause()
    }, { threshold: 0.2 })
    io.observe(v)
    return () => io.disconnect()
  }, [src])
  return <video ref={ref} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
}

function PhoneCard({ p, copy, notif, wallLabel }) {
  const rowCls = 'border border-white/20 bg-white/10 text-white backdrop-blur-md'
  return (
    <div className="relative mx-auto w-[320px]" data-testid={`profile-card-${p.id}`}>
      <div className="relative overflow-hidden rounded-[42px] border-[10px] border-brand-ink shadow-[10px_10px_0px_#0A0A0A]">
        <div className="absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-brand-ink" />
        <div className="relative min-h-[560px] px-6 pb-8 pt-12 text-white">
          <VideoBg src={p.video} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/75" aria-hidden />
          <div className="absolute inset-0" style={{ background: `radial-gradient(60% 45% at 50% 38%, ${p.accent}33, transparent 70%)` }} aria-hidden />
          <div className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img src={p.img} alt={p.name} className="h-24 w-24 rounded-full border-4 border-white/80 object-cover shadow-lg" />
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white" style={{ background: p.accent }} />
              </div>
              <h3 className="mt-4 font-display text-2xl font-extrabold tracking-[-0.02em] drop-shadow">{p.name}</h3>
              <p className="font-sans text-sm font-semibold text-white/70">{p.handle}</p>
              <span className="mt-2 rounded-full border px-3 py-0.5 font-display text-[11px] font-extrabold uppercase tracking-[0.15em]" style={{ borderColor: p.accent, color: p.accent }}>{copy.role}</span>
              <p className="mt-3 font-sans text-sm text-white/80">{copy.bio}</p>
            </div>
            <div className="mt-6 space-y-3">
              {p.icons.map((Icon, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 font-display text-sm font-extrabold ${i === 0 ? 'text-brand-ink' : rowCls}`} style={i === 0 ? { background: p.accent } : undefined}>
                  <Icon size={18} strokeWidth={2.5} /> {copy.links[i]}
                </div>
              ))}
            </div>
            {p.wall && (
              <div className="mt-6" data-testid={`supporter-wall-${p.id}`}>
                <div className="mb-3 flex items-center justify-center gap-1.5 font-display text-sm font-extrabold text-white">
                  <Heart size={14} fill={p.accent} stroke={p.accent} /> {p.wall} {wallLabel}
                </div>
                {copy.supporters?.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {copy.supporters.map((s, i) => (
                      <div key={i} className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-md">
                        <p className="font-sans text-sm text-white/90"><span className="font-display font-extrabold text-white">{s.name}</span> <span className="text-white/70">· {s.msg}</span></p>
                        {s.reply && <p className="mt-1 font-sans text-xs font-semibold" style={{ color: p.accent }}>↳ {s.reply}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="absolute -right-4 top-24 rotate-3 animate-float rounded-2xl border-2 border-brand-ink bg-white px-3 py-2 shadow-[4px_4px_0px_#0A0A0A]">
        <p className="flex items-center gap-1.5 font-display text-xs font-extrabold"><Heart size={12} className="text-brand-coral" fill="currentColor" /> {notif}</p>
      </div>
    </div>
  )
}

function ProfileShowcase({ onStart }) {
  const c = useCopy()
  const { lang } = useI18n()
  const pc = PROFILE_COPY[lang] || PROFILE_COPY.fr
  return (
    <section id="examples" className="scroll-mt-24 bg-white py-24 md:py-32" data-testid="profile-showcase">
      <Container>
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <Badge tone="coral" testid="showcase-badge">{c.showBadge}</Badge>
              <h2 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-brand-ink md:text-6xl lg:text-7xl">
                {lang === 'en' ? (<>They boosted their revenue and visibility.{' '}<span className="font-serif font-medium italic text-brand-coral">Your turn.</span></>) : (<>Ils ont boosté leurs revenus et leur visibilité.{' '}<span className="font-serif font-medium italic text-brand-coral">À ton tour.</span></>)}
              </h2>
              <p className="mt-6 max-w-md font-sans text-lg text-brand-muted">{c.showSub}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {c.showTags.map((tag) => <span key={tag} className="rounded-full border-2 border-brand-ink px-3 py-1 font-display text-xs font-extrabold">{tag}</span>)}
              </div>
              <PrimaryButton testid="showcase-cta" onClick={onStart} className="mt-8">{c.showCta} <ArrowRight size={18} strokeWidth={3} /></PrimaryButton>
            </div>
          </div>
          <div className="space-y-36 lg:col-span-7">
            {PROFILE_META.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.7, ease: EASE }}>
                <PhoneCard p={p} copy={pc[p.id]} notif={c.notif} wallLabel={c.wallLabel} />
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ============================ Bento features ============================ */
const CHART = [{ v: 8 }, { v: 14 }, { v: 11 }, { v: 22 }, { v: 18 }, { v: 30 }, { v: 26 }, { v: 38 }]
function BentoFeatures() {
  const c = useCopy()
  const { lang } = useI18n()
  const fe = c.fe
  return (
    <section id="features" className="scroll-mt-24 bg-brand-cream py-24 md:py-32" data-testid="bento-features">
      <Container>
        <Badge tone="coral" testid="features-badge">{c.feBadge}</Badge>
        <h2 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-brand-ink md:text-6xl lg:text-7xl">
          {lang === 'en' ? (<>One link. <span className="font-serif font-medium italic">Infinite</span> possibilities.</>) : (<>Un seul lien. Des possibilités <span className="font-serif font-medium italic">infinies.</span></>)}
        </h2>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewport} className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-8 lg:grid-cols-12">
          <motion.div variants={fadeUp} className="rounded-[28px] border-2 border-brand-ink bg-brand-ink p-7 text-white shadow-[6px_6px_0px_#0A0A0A] md:col-span-8 lg:col-span-7" data-testid="feature-analytics">
            <div className="flex items-start justify-between">
              <div><BarChart3 className="text-brand-neon" /><h3 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em]">{fe.analytics[0]}</h3><p className="mt-1 font-sans text-sm text-white/60">{fe.analytics[1]}</p></div>
              <div className="text-right"><p className="font-display text-3xl font-extrabold text-brand-neon">+842</p><p className="font-sans text-xs text-white/60">{fe.analytics[2]}</p></div>
            </div>
            <div className="mt-4 h-28"><ResponsiveContainer width="100%" height="100%"><LineChart data={CHART}><Line type="monotone" dataKey="v" stroke="#D6FF00" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
          </motion.div>
          <motion.div variants={fadeUp} className="rounded-[28px] border-2 border-brand-ink bg-white p-7 shadow-[6px_6px_0px_#0A0A0A] md:col-span-8 lg:col-span-5" data-testid="feature-leads">
            <Mail className="text-brand-coral" /><h3 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em]">{fe.leads[0]}</h3><p className="mt-1 font-sans text-sm text-brand-muted">{fe.leads[1]}</p>
            <div className="mt-5 flex gap-2"><input data-testid="feature-leads-input" placeholder="ton@email.com" className="min-w-0 flex-1 rounded-full border-2 border-brand-ink px-4 py-2.5 font-sans text-sm outline-none" /><button className="rounded-full bg-brand-coral px-4 py-2.5 font-display text-sm font-extrabold text-white shadow-[3px_3px_0px_#0A0A0A]">OK</button></div>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-col rounded-[28px] border-2 border-brand-ink bg-brand-neon p-7 shadow-[6px_6px_0px_#0A0A0A] md:col-span-4 lg:col-span-4" data-testid="feature-tips">
            <Heart className="text-brand-ink" fill="currentColor" /><h3 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em] text-brand-ink">{fe.tips[0]}</h3><p className="mt-1 font-sans text-sm text-brand-ink/70">{fe.tips[1]}</p>
            <div className="mt-4 flex gap-2">{['3€', '5€', '10€'].map((a) => <span key={a} className="rounded-full border-2 border-brand-ink bg-white px-3.5 py-1.5 font-display text-sm font-extrabold">{a}</span>)}</div>
            <p className="mt-auto pt-5 font-display text-3xl font-extrabold text-brand-ink">+248€ <span className="text-sm font-bold text-brand-ink/60">{fe.tips[2]}</span></p>
          </motion.div>
          <motion.div variants={fadeUp} className="rounded-[28px] border-2 border-brand-ink bg-white p-7 shadow-[6px_6px_0px_#0A0A0A] md:col-span-4 lg:col-span-5" data-testid="feature-custom">
            <Palette className="text-brand-coral" /><h3 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em]">{fe.custom[0]}</h3><p className="mt-1 font-sans text-sm text-brand-muted">{fe.custom[1]}</p>
            <div className="mt-5 flex gap-2.5">{['#FF4D42', '#D6FF00', '#0A0A0A', '#F0426B', '#38BDF8', '#F7C948'].map((col) => <span key={col} className="h-8 w-8 rounded-full border-2 border-brand-ink" style={{ background: col }} />)}</div>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-col justify-between rounded-[28px] border-2 border-brand-ink bg-brand-coral p-7 text-white shadow-[6px_6px_0px_#0A0A0A] md:col-span-8 lg:col-span-3" data-testid="feature-speed">
            <Zap fill="currentColor" /><div><p className="font-display text-4xl font-extrabold">30s</p><p className="font-sans text-sm text-white/80">{fe.speed[0]}</p></div>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-5 rounded-[28px] border-2 border-brand-ink bg-white p-7 shadow-[6px_6px_0px_#0A0A0A] md:col-span-8 lg:col-span-12 lg:flex-row lg:justify-between" data-testid="feature-domain">
            <div className="flex items-center gap-6"><Globe className="text-brand-ink" /><QrCode className="text-brand-ink" /><Smartphone className="text-brand-ink" /></div>
            <div className="rounded-full border-2 border-brand-ink bg-brand-cream px-5 py-2.5 font-display text-lg font-extrabold">aaven.bio/<span className="text-brand-coral">toi</span></div>
            <p className="font-sans text-sm font-semibold text-brand-muted">{fe.domain}</p>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}

/* ============================ Testimonials ============================ */
const TESTI_IMG = {
  camille: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=120&q=70',
  antoine: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70',
  sofia: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=70',
  noah: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=70',
  marco: 'https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?auto=format&fit=crop&w=120&q=70',
}
const TESTI_FR = [
  { name: 'Camille', role: 'Créatrice mode', img: TESTI_IMG.camille, quote: 'Mes ventes ont doublé en 2 mois. La page convertit vraiment.' },
  { name: 'Antoine', role: 'Restaurateur', img: TESTI_IMG.antoine, quote: 'Les réservations arrivent directement depuis mon lien Insta.' },
  { name: 'Sofia', role: 'Coach', img: TESTI_IMG.sofia, quote: 'Mes clients réservent leurs séances en 2 clics. Magique.' },
  { name: 'Noah', role: 'Designer', img: TESTI_IMG.noah, quote: 'Mes devis ont explosé. L’interface fait premium direct.' },
  { name: 'Marco', role: 'Chef étoilé', img: TESTI_IMG.marco, quote: 'Enfin une page à la hauteur de mon restaurant.' },
]
const TESTI_EN = [
  { name: 'Camille', role: 'Fashion creator', img: TESTI_IMG.camille, quote: 'My sales doubled in 2 months. The page really converts.' },
  { name: 'Antoine', role: 'Restaurant owner', img: TESTI_IMG.antoine, quote: 'Bookings come straight from my Insta link.' },
  { name: 'Sofia', role: 'Coach', img: TESTI_IMG.sofia, quote: 'My clients book sessions in 2 taps. Magic.' },
  { name: 'Noah', role: 'Designer', img: TESTI_IMG.noah, quote: 'My quotes exploded. The interface feels instantly premium.' },
  { name: 'Marco', role: 'Michelin chef', img: TESTI_IMG.marco, quote: 'Finally a page worthy of my restaurant.' },
]
function TestiCard({ t }) {
  return (
    <div className="mx-3 w-[380px] rounded-[28px] border-2 border-brand-ink bg-brand-cream p-6 shadow-[5px_5px_0px_#0A0A0A]">
      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} className="text-brand-coral" fill="currentColor" />)}</div>
      <p className="mt-4 font-display text-lg font-bold leading-snug tracking-[-0.01em] text-brand-ink">“{t.quote}”</p>
      <div className="mt-5 flex items-center gap-3"><img src={t.img} alt={t.name} loading="lazy" className="h-10 w-10 rounded-full border-2 border-brand-ink object-cover" /><div><p className="font-display text-sm font-extrabold">{t.name}</p><p className="font-sans text-xs text-brand-muted">{t.role}</p></div></div>
    </div>
  )
}
function Testimonials() {
  const c = useCopy()
  const { lang } = useI18n()
  const list = lang === 'en' ? TESTI_EN : TESTI_FR
  return (
    <section id="testimonials" className="scroll-mt-24 overflow-hidden bg-white py-24 md:py-32" data-testid="testimonials">
      <Container>
        <Badge testid="testi-badge">{c.tBadge}</Badge>
        <h2 className="mt-6 max-w-4xl font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-brand-ink md:text-6xl lg:text-7xl">
          {lang === 'en' ? (<>Join 10,000+ creators who <span className="font-serif font-medium italic">leveled up.</span></>) : (<>Rejoins +10 000 créateurs qui ont <span className="font-serif font-medium italic">changé de ligue.</span></>)}
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {c.stats.map(([n, l], i) => <div key={l} className="text-center md:text-left" data-testid={`stat-${i}`}><p className="font-display text-4xl font-extrabold tracking-[-0.03em] text-brand-ink md:text-5xl">{n}</p><p className="mt-1 font-sans text-sm font-semibold text-brand-muted">{l}</p></div>)}
        </div>
      </Container>
      <div className="mt-14 space-y-5">
        <Marquee speed={32} gradient gradientColor="#FFFFFF" pauseOnHover>{list.map((t, i) => <TestiCard key={i} t={t} />)}</Marquee>
        <Marquee speed={28} direction="right" gradient gradientColor="#FFFFFF" pauseOnHover>{[...list].reverse().map((t, i) => <TestiCard key={i} t={t} />)}</Marquee>
      </div>
    </section>
  )
}

/* ============================ Pricing ============================ */
const TIERS_BASE = [
  { key: 'free', name: 'Free', price: '0€', per: '', fee: '5%', highlight: false },
  { key: 'creator', name: 'Creator', price: '7€', perKey: 'mo', fee: '1%', highlight: true },
  { key: 'pro', name: 'Pro', price: '15€', perKey: 'mo', fee: '0%', highlight: false },
]
const TIER_FEATURES = {
  fr: {
    free: ['1 page + tous les boutons', '3 produits digitaux', '3 templates vidéo offerts', 'Importe ta photo de fond', 'Tips & analytics inclus'],
    creator: ['Sans branding Aaven', 'Templates vidéo premium', 'Importe GIF/vidéo (5 s)', 'Produits illimités', 'Ton lien pro perso'],
    pro: ['Tout de Creator', 'Importe ta vidéo (15 s max)', 'Support prioritaire'],
  },
  en: {
    free: ['1 page + all buttons', '3 digital products', '3 free video templates', 'Upload your background photo', 'Tips & analytics included'],
    creator: ['No Aaven branding', 'Premium video templates', 'Upload GIF/video (5s)', 'Unlimited products', 'Your pro custom link'],
    pro: ['Everything in Creator', 'Upload your video (15s max)', 'Priority support'],
  },
}
function Pricing({ onStart }) {
  const c = useCopy()
  const { lang } = useI18n()
  const feats = TIER_FEATURES[lang] || TIER_FEATURES.fr
  const per = lang === 'en' ? '/mo' : '/mois'
  return (
    <section id="pricing" className="scroll-mt-24 bg-white py-24 md:py-32" data-testid="pricing">
      <Container>
        <Badge tone="neon" testid="pricing-badge">{c.prBadge}</Badge>
        <h2 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-brand-ink md:text-6xl lg:text-7xl">
          {lang === 'en' ? (<>Start free. <span className="font-serif font-medium italic text-brand-coral">Upgrade</span> when you want.</>) : (<>Commence gratuit. <span className="font-serif font-medium italic text-brand-coral">Évolue</span> quand tu veux.</>)}
        </h2>
        <p className="mt-6 max-w-xl font-sans text-lg text-brand-muted">{c.prSub}</p>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewport} className="mt-12 grid items-start gap-6 md:grid-cols-3">
          {TIERS_BASE.map((tier, i) => {
            const dark = tier.highlight
            return (
              <motion.div key={tier.key} variants={fadeUp} transition={{ delay: i * 0.1 }} className={`relative flex h-full flex-col rounded-[28px] border-2 border-brand-ink p-8 ${dark ? 'bg-brand-coral text-white shadow-[6px_6px_0px_#D6FF00] md:-mt-4' : 'bg-white text-brand-ink shadow-[6px_6px_0px_#0A0A0A]'}`} data-testid={`pricing-${tier.key}`}>
                {dark && <span className="absolute right-6 top-6 rounded-full bg-brand-neon px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-ink">{c.popular}</span>}
                <h3 className="font-display text-xl font-extrabold uppercase tracking-wide">{tier.name}</h3>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.03em]">{tier.price}{tier.perKey && <span className={`text-lg font-bold ${dark ? 'text-white/70' : 'text-brand-muted'}`}>{per}</span>}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {feats[tier.key].map((f) => <li key={f} className="flex items-center gap-2 font-sans text-sm font-semibold"><Check size={16} strokeWidth={3} className={dark ? 'text-brand-neon' : 'text-brand-coral'} /> {f}</li>)}
                </ul>
                <div className={`mt-6 rounded-2xl px-4 py-2.5 text-center font-display text-sm font-extrabold ${dark ? 'bg-white/15' : 'bg-brand-cream'}`}>{tier.fee} {c.feeWord}</div>
                <button data-testid={`pricing-cta-${tier.key}`} onClick={onStart} className={`mt-5 w-full rounded-full px-6 py-3.5 font-display text-base font-extrabold transition-transform hover:-translate-y-0.5 ${dark ? 'bg-brand-ink text-white shadow-[4px_4px_0px_#D6FF00]' : 'bg-brand-coral text-white shadow-[4px_4px_0px_#0A0A0A]'}`}>
                  {tier.key === 'free' ? c.ctaFree : `${c.ctaGo} ${tier.name}`}
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
  const c = useCopy()
  const { lang } = useI18n()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [60, -60])
  return (
    <section ref={ref} className="relative overflow-hidden rounded-t-[60px] bg-brand-ink px-5 py-32 text-white md:py-40" data-testid="final-cta">
      <div aria-hidden className="pointer-events-none absolute -left-10 top-10 h-72 w-72 rounded-full bg-brand-coral/40 blur-[100px]" />
      <div aria-hidden className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-brand-neon/30 blur-[100px]" />
      <Container className="relative text-center">
        <motion.div style={{ y }} className="flex justify-center"><Badge testid="final-badge">{c.finalBadge}</Badge></motion.div>
        <h2 className="mx-auto mt-7 max-w-4xl font-display text-6xl font-extrabold leading-[0.92] tracking-[-0.04em] md:text-8xl lg:text-[112px]">
          {lang === 'en' ? (<>Ready to <span className="font-serif font-medium italic text-brand-coral">dominate</span> your market?</>) : (<>Prêt à <span className="font-serif font-medium italic text-brand-coral">dominer</span> ton marché ?</>)}
        </h2>
        <p className="mx-auto mt-7 max-w-xl font-sans text-lg text-white/70">{c.finalSub}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <button data-testid="final-cta-button" onClick={onStart} className="group inline-flex items-center gap-2 rounded-full bg-brand-coral px-9 py-4 font-display text-lg font-extrabold text-white shadow-[6px_6px_0px_#D6FF00] transition-transform hover:-translate-y-0.5">{c.finalCta} <ArrowRight size={20} strokeWidth={3} className="transition-transform group-hover:translate-x-1" /></button>
          <a href="#examples" className="font-display text-base font-extrabold underline underline-offset-4 hover:text-brand-neon">{c.finalSee}</a>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
          {c.finalFeatures.map((f) => <div key={f} className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 font-sans text-sm font-semibold backdrop-blur">{f}</div>)}
        </div>
        <footer className="mt-24 border-t border-white/10 pt-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2 text-white"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4.5 20 L12 4 L19.5 20" /><path d="M8.2 13.6 H15.8" /></svg><span className="font-sans text-lg font-bold tracking-[-0.04em]">Aaven</span></div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-sans text-sm font-semibold text-white/60">
              <a href="/legal/mentions-legales" className="hover:text-white">{c.footer[0]}</a>
              <a href="/legal/cgu" className="hover:text-white">{c.footer[1]}</a>
              <a href="/legal/confidentialite" className="hover:text-white">{c.footer[2]}</a>
              <a href="/legal/cgv" className="hover:text-white">{c.footer[3]}</a>
            </div>
            <p className="font-sans text-sm text-white/40">© 2026 Aaven</p>
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
      <BentoFeatures />
      <Testimonials />
      <Pricing onStart={onStart} />
      <FinalCTA onStart={onStart} />
    </div>
  )
}
