import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useMotionTemplate, useSpring, useReducedMotion } from 'framer-motion'
import Marquee from 'react-fast-marquee'
import {
  Sparkles, ArrowRight, Check, Star, Menu, X, Instagram, CalendarCheck,
  ShoppingBag, MapPin, Dumbbell, Palette, Zap, BarChart3,
  Mail, QrCode, Smartphone, Globe, Heart,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { track } from '../lib/analytics'
import { PROFESSIONS } from '../lib/professions'
import { SmartSocials } from '../components/SmartSocials'
import { SmartCard } from '../components/SmartCard'
import { BioImmersive } from '../components/PhoneMockup'
import { api } from '../lib/api'
import { QRCodeCanvas } from 'qrcode.react'

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
    login: 'Se connecter',
    heroBadge: 'Ton identité professionnelle',
    heroSub: 'Quand quelqu’un te découvre, ton Aaven te présente, convertit et encaisse pour toi. Ajoute-le à Apple Wallet ou Google Wallet et partage-le en un scan, par QR code ou NFC.',
    heroCta: 'Créer mon Aaven gratuitement', heroSee: 'Voir un exemple',
    heroMicro: '✦ Gratuit pour démarrer · Évolue quand tu veux',
    heroChecks: ['60 secondes', 'Sans carte bancaire', 'Sans engagement'],
    compare: {
      title: 'Le déclic',
      before: ['Carte papier perdue', 'Instagram uniquement', 'Des liens dispersés partout', 'Aucun suivi'],
      after: ['Une identité professionnelle', 'Toujours dans ton téléphone', 'Partage instantané (QR, NFC, Wallet)', 'Tes clients te contactent, réservent, achètent'],
      beforeLabel: 'Avant Aaven', afterLabel: 'Avec Aaven',
    },
    metiers: {
      badge: 'Pour ton métier',
      title: 'Ton Aaven s’adapte à ton métier',
      sub: 'Peu importe ton activité, ton identité professionnelle mérite une vitrine.',
      more: 'autres métiers',
      cards: [
        { slug: 'bartender', emoji: '🍸', name: 'Bartender', desc: 'Montre tes prestations et reçois des demandes d’événements.' },
        { slug: 'photographer', emoji: '📸', name: 'Photographe', desc: 'Présente ton portfolio et transforme tes visiteurs en clients.' },
        { slug: 'freelancer', emoji: '💼', name: 'Freelance', desc: 'Une carte professionnelle qui travaille pour toi.' },
        { slug: 'artist', emoji: '🎨', name: 'Artiste', desc: 'Partage ton univers partout.' },
        { slug: 'barber', emoji: '💈', name: 'Barbier', desc: 'Ta vitrine digitale accessible par QR code en boutique.' },
      ],
    },
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
    login: 'Log in',
    heroBadge: 'Your professional identity',
    heroSub: 'When someone discovers you, your Aaven introduces you, converts and gets you paid. Add it to Apple Wallet or Google Wallet and share it in one scan, via QR code or NFC.',
    heroCta: 'Create my Aaven for free', heroSee: 'See an example',
    heroMicro: '✦ Free to start · Upgrade anytime',
    heroChecks: ['60 seconds', 'No credit card', 'No commitment'],
    compare: {
      title: 'The switch',
      before: ['Lost paper business card', 'Instagram only', 'Links scattered everywhere', 'No tracking'],
      after: ['One professional identity', 'Always in your phone', 'Instant sharing (QR, NFC, Wallet)', 'Clients contact you, book, buy'],
      beforeLabel: 'Before Aaven', afterLabel: 'With Aaven',
    },
    metiers: {
      badge: 'For your craft',
      title: 'Your Aaven adapts to your craft',
      sub: 'Whatever you do, your professional identity deserves a showcase.',
      more: 'more professions',
      cards: [
        { slug: 'bartender', emoji: '🍸', name: 'Bartender', desc: 'Show your services and get event requests.' },
        { slug: 'photographer', emoji: '📸', name: 'Photographer', desc: 'Showcase your portfolio and turn visitors into clients.' },
        { slug: 'freelancer', emoji: '💼', name: 'Freelancer', desc: 'A business card that works for you.' },
        { slug: 'artist', emoji: '🎨', name: 'Artist', desc: 'Share your universe everywhere.' },
        { slug: 'barber', emoji: '💈', name: 'Barber', desc: 'Your digital storefront, one QR code away.' },
      ],
    },
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

/* ============================ Tilt 3D (Apple-like) ============================ */
// Effet « vitrine produit » : l'objet suit le curseur avec une rotation 3D amortie
// (spring) et un reflet lumineux qui glisse sur la vitre, comme sur les pages
// produit Apple. Actif uniquement à la souris (pointer: fine) et coupé si
// l'utilisateur préfère réduire les animations.
function Tilt3D({ children, max = 9, radius = 40, depth = false, className = '' }) {
  const reduced = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const update = () => setEnabled(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const hover = useMotionValue(0)
  const spring = { stiffness: 150, damping: 18, mass: 0.5 }
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), spring)
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), spring)
  const gx = useTransform(px, (v) => `${v * 100}%`)
  const gy = useTransform(py, (v) => `${v * 100}%`)
  const glare = useMotionTemplate`radial-gradient(320px circle at ${gx} ${gy}, rgba(255,255,255,0.32), rgba(255,255,255,0.07) 45%, transparent 68%)`
  const glareOpacity = useSpring(hover, { stiffness: 120, damping: 20 })

  if (!enabled || reduced) return <div className={className}>{children}</div>

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
    hover.set(1)
  }
  const onLeave = () => { px.set(0.5); py.set(0.5); hover.set(0) }
  return (
    <div className={className} style={{ perspective: '1100px' }} onPointerMove={onMove} onPointerLeave={onLeave}>
      <motion.div className="relative will-change-transform" style={{ rotateX: rx, rotateY: ry, transformStyle: depth ? 'preserve-3d' : undefined }}>
        {children}
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-30" style={{ background: glare, opacity: glareOpacity, borderRadius: radius, transform: depth ? 'translateZ(1px)' : undefined }} />
      </motion.div>
    </div>
  )
}

/* ============================ Header ============================ */
function Header({ onStart }) {
  const c = useCopy()
  const { lang, setLang } = useI18n()
  // Initialisé depuis la position réelle : au rechargement avec restauration de
  // scroll (iOS), le premier rendu doit déjà avoir le fond — sinon le contenu
  // chevauche le header transparent pendant les premières secondes.
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 12)
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
          {/* Accès direct au compte : le CTA principal part vers l'onboarding invité,
              le login n'est donc plus sur son chemin. (Déjà connecté → /login
              redirige vers le dashboard.) */}
          <a data-testid="header-login" href="/login" className="hidden font-sans text-sm font-semibold text-brand-muted transition-colors hover:text-brand-ink sm:inline-flex">{c.login}</a>
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
              <a data-testid="mobile-login" href="/login" className="mt-3 inline-flex w-full items-center justify-center rounded-full border-2 border-brand-ink bg-white px-7 py-3 font-display text-base font-extrabold text-brand-ink">{c.login}</a>
              <PrimaryButton testid="mobile-start" onClick={() => { setOpen(false); onStart() }} className="mt-2 w-full">{c.start} <ArrowRight size={18} strokeWidth={3} /></PrimaryButton>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/* ============================ Hero ============================ */
// Visuel du hero : LA VRAIE page aaven.fr/flo-btt rendue en live dans le téléphone
// (mêmes composants que la page publique : fond vidéo, Smart Socials, Smart Cards).
// Repli sur un mockup statique si la page ne charge pas. Tout clic ouvre la vraie page.
const HERO_PROFILE_SLUG = 'flo-btt'
const HERO_PROFILE_URL = `https://www.aaven.fr/${HERO_PROFILE_SLUG}`

function HeroPhoneStatic({ lang }) {
  const fr = lang !== 'en'
  const rows = fr
    ? [['🍸', 'Réserver une prestation'], ['🎥', 'Voir mes performances'], ['💬', 'Contact']]
    : [['🍸', 'Book a gig'], ['🎥', 'Watch my performances'], ['💬', 'Contact']]
  return (
    <div className="relative min-h-[560px] px-5 pb-16 pt-12 text-white" style={{ background: 'linear-gradient(165deg, #1c1330, #3d2a68 55%, #0e2a3f)' }}>
      <div className="flex flex-col items-center text-center">
        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70" alt="" className="h-20 w-20 rounded-full border-4 border-white/80 object-cover shadow-lg" />
        <p className="mt-3 font-display text-xl font-extrabold tracking-[-0.02em]">Florian</p>
        <p className="font-sans text-xs font-semibold text-white/60">Flair Bartender</p>
      </div>
      <div className="mt-4 flex justify-center gap-2.5">
        {[Instagram, Globe, Mail].map((Ic, i) => (
          <span key={i} className="grid h-9 w-9 place-items-center rounded-[32%] border border-white/25 bg-white/12 backdrop-blur-md"><Ic size={15} /></span>
        ))}
      </div>
      <div className="mt-5 space-y-2.5">
        {rows.map(([emo, label], i) => (
          <div key={label} className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-3 font-display text-[13px] font-extrabold backdrop-blur-md ${i === 0 ? 'bg-white text-brand-ink' : 'border border-white/20 bg-white/10 text-white'}`}>
            <span>{emo}</span> {label}
          </div>
        ))}
      </div>
      <p className="mt-5 text-center text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/40">Made with Aaven</p>
    </div>
  )
}

function HeroPhone({ lang }) {
  const [real, setReal] = useState(null) // { page, buttons } de flo-btt (vraie page)
  const [supporters, setSupporters] = useState(null)
  useEffect(() => {
    api.publicPage(HERO_PROFILE_SLUG).then(setReal).catch(() => {})
    api.supporters(HERO_PROFILE_SLUG).then(setSupporters).catch(() => {})
  }, [])

  return (
    <div className="relative mx-auto w-[290px] sm:mb-44">
      {/* Téléphone : la vraie page en live, DÉFILABLE (molette/doigt).
          Un clic (pas un scroll) ouvre aaven.fr/flo-btt dans un nouvel onglet.
          Le tilt 3D vit sur un wrapper AU-DESSUS du conteneur qui clippe : si le
          conteneur overflow-hidden arrondi est lui-même animé, Chrome perd le clip
          pendant la transition et les coins carrés de la vidéo dépassent du cadre. */}
      <Tilt3D className="relative z-10" max={8} radius={40}>
        <div
          role="link"
          tabIndex={0}
          aria-label="Voir un profil Aaven réel"
          onClick={() => { track('hero_profile_click'); window.open(HERO_PROFILE_URL, '_blank', 'noopener') }}
          onKeyDown={(e) => e.key === 'Enter' && window.open(HERO_PROFILE_URL, '_blank', 'noopener')}
          className="relative cursor-pointer rounded-[40px] border-[9px] border-brand-ink shadow-[10px_10px_0px_#0A0A0A]"
        >
          {/* clip-path + mask webkit (et non overflow+radius seul) : seuls clips
              arrondis fiables pour un layer vidéo — clip-path pour Chrome sous
              transform 3D (Tilt), mask pour iOS Safari qui perd l'overflow arrondi
              sur la vidéo pendant les premières secondes (compositing). */}
          <div
            className="isolate relative overflow-hidden rounded-[31px]"
            style={{
              clipPath: 'inset(0 round 31px)',
              WebkitMaskImage: '-webkit-radial-gradient(white, black)',
              transform: 'translateZ(0)',
              // Confinement de peinture : le navigateur DOIT peindre tous les
              // descendants (vidéo/poster en chargement inclus) à l'intérieur de
              // cette boîte — la garantie la plus forte contre les coins qui
              // dépassent du cadre sur iOS pendant les premières secondes.
              contain: 'paint',
            }}
          >
            <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-brand-ink" />
            {real?.page ? (
              /* IMPORTANT iOS : aucun ancêtre de la vidéo ne doit être animé
                 (opacity/transform) sinon Safari perd le clip arrondi pendant
                 l'animation. Le fondu d'attente est donc un VOILE par-dessus
                 (calque frère) qui s'efface, pas un fondu du conteneur. */
              <div className="relative h-[560px]" style={{ background: 'linear-gradient(165deg, #1c1330, #3d2a68 55%, #0e2a3f)' }}>
                <BioImmersive
                  page={real.page}
                  buttons={real.buttons}
                  supporters={supporters}
                  branding={real.branding !== false}
                  kenBurns={false}
                />
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
                  className="pointer-events-none absolute inset-0 z-10"
                  style={{ background: 'linear-gradient(165deg, #1c1330, #3d2a68 55%, #0e2a3f)' }}
                  aria-hidden
                />
              </div>
            ) : (
              <HeroPhoneStatic lang={lang} />
            )}
          </div>
        </div>
      </Tilt3D>

      {/* Carte Wallet : glisse de sous le téléphone puis reste posée en dessous.
          Départ caché derrière le téléphone (y:-90) → slide vers le bas. */}
      <motion.div
        initial={{ opacity: 0, y: -110 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.9, ease: EASE }}
        className="pointer-events-none absolute -bottom-[8.75rem] left-1/2 z-0 -ml-[104px] hidden w-52 sm:block"
        style={{ rotate: '-2deg' }}
      >
        <div className="rounded-2xl border-2 border-brand-ink bg-brand-ink p-3.5 text-white shadow-[6px_6px_0px_rgba(10,10,10,0.25)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-sans text-sm font-bold tracking-[-0.03em]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 20 L12 4 L19.5 20" /><path d="M8.2 13.6 H15.8" /></svg>
              Aaven
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.14em]">Wallet</span>
          </div>
          <p className="mt-3 font-display text-base font-extrabold">Florian B.</p>
          <p className="text-[10px] font-semibold text-white/55">{lang === 'en' ? 'Digital business card' : 'Carte de visite digitale'}</p>
          <div className="mt-2.5 flex items-end justify-between">
            <span className="text-[9px] font-bold text-white/40">aaven.fr/flo-btt</span>
            <span className="rounded-md bg-white p-1"><QRCodeCanvas value={HERO_PROFILE_URL} size={34} level="M" /></span>
          </div>
        </div>
      </motion.div>

    </div>
  )
}

function Hero({ onStart }) {
  const c = useCopy()
  const { lang } = useI18n()
  const marqueeSpeed = useMarqueeSpeed(42, 75)
  return (
    <section className="relative overflow-hidden pb-16 pt-24 md:pt-32" data-testid="hero">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-10 h-[26rem] w-[26rem] rounded-full bg-brand-neon/40 blur-[90px]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-[24rem] w-[24rem] rounded-full bg-brand-coral/30 blur-[90px]" />
      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          {/* Texte */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="lg:col-span-7">
            <motion.div variants={fadeUp}>
              <Badge testid="hero-badge"><Sparkles size={13} strokeWidth={3} /> {c.heroBadge}</Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="mt-7 font-display text-[42px] font-extrabold leading-[0.98] tracking-[-0.04em] text-brand-ink sm:text-5xl md:text-6xl lg:text-[64px]">
              {lang === 'en' ? (
                <>Your{' '}<span className="relative inline-block -rotate-2 bg-brand-coral px-3 text-white">identity</span>,{' '}<span className="font-serif font-medium italic">beyond a business card.</span></>
              ) : (
                <>Ton{' '}<span className="relative inline-block -rotate-2 bg-brand-coral px-3 text-white">identité</span>,{' '}<span className="font-serif font-medium italic">bien plus qu’une carte de visite.</span></>
              )}
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-7 max-w-xl font-sans text-lg text-brand-muted md:text-xl">{c.heroSub}</motion.p>
            <motion.div variants={fadeUp} className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <PrimaryButton testid="hero-primary-cta" onClick={onStart}>{c.heroCta} <ArrowRight size={18} strokeWidth={3} className="transition-transform group-hover:translate-x-1" /></PrimaryButton>
              <SecondaryButton testid="hero-secondary-cta" onClick={() => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' })}>▶ {c.heroSee}</SecondaryButton>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-5 font-sans text-sm font-semibold text-brand-muted">{c.heroMicro}</motion.p>
            <motion.ul variants={fadeUp} className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              {c.heroChecks.map((f) => <li key={f} className="flex items-center gap-1.5 font-sans text-sm font-bold text-brand-ink"><Check size={16} className="text-brand-coral" strokeWidth={3} /> {f}</li>)}
            </motion.ul>
          </motion.div>

          {/* Téléphone + Wallet + QR — PAS de motion ici : animer un ancêtre du
              conteneur vidéo casse le clip arrondi sur iOS pendant l'animation
              (la vidéo déborde du cadre). L'entrée est portée par le voile interne. */}
          <div className="lg:col-span-5">
            <HeroPhone lang={lang} />
          </div>
        </div>
      </Container>

      <div className="mt-16 border-y-2 border-brand-ink bg-brand-ink py-4">
        <Marquee speed={marqueeSpeed} autoFill>
          {c.marquee.map((w, i) => <span key={i} className="mx-6 inline-flex items-center gap-6 font-display text-lg font-extrabold uppercase tracking-wide text-brand-cream">{w} <Star size={16} className={i % 2 ? 'text-brand-neon' : 'text-brand-coral'} fill="currentColor" /></span>)}
        </Marquee>
      </div>
    </section>
  )
}

/* ============================ Avant / Avec Aaven ============================ */
// L'usage avant les fonctionnalités : le visiteur se reconnaît dans le « avant ».
function CompareSection() {
  const c = useCopy()
  return (
    <section className="bg-brand-cream py-20 md:py-28" data-testid="compare-section">
      <Container>
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.6, ease: EASE }} className="rounded-[26px] border-2 border-brand-ink/15 bg-white/60 p-7">
            <p className="font-display text-xs font-extrabold uppercase tracking-[0.16em] text-brand-muted">{c.compare.beforeLabel}</p>
            <ul className="mt-5 space-y-3.5">
              {c.compare.before.map((item) => (
                <li key={item} className="flex items-start gap-2.5 font-sans text-base font-semibold text-brand-muted">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-ink/8 text-xs">❌</span> {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.6, delay: 0.15, ease: EASE }} className="rounded-[26px] border-2 border-brand-ink bg-white p-7 shadow-[7px_7px_0px_#0A0A0A]">
            <p className="font-display text-xs font-extrabold uppercase tracking-[0.16em] text-brand-coral">{c.compare.afterLabel}</p>
            <ul className="mt-5 space-y-3.5">
              {c.compare.after.map((item) => (
                <li key={item} className="flex items-start gap-2.5 font-sans text-base font-bold text-brand-ink">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-coral text-white"><Check size={13} strokeWidth={3.5} /></span> {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

/* ============================ Métiers ============================ */
// Chacun se reconnaît : 5 métiers mis en avant → landing pages dédiées (33 au total).
function MetiersSection() {
  const c = useCopy()
  const count = PROFESSIONS.length - c.metiers.cards.length
  return (
    <section className="bg-white py-20 md:py-28" data-testid="metiers-section">
      <Container>
        <Badge tone="coral">{c.metiers.badge}</Badge>
        <h2 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[0.98] tracking-[-0.04em] text-brand-ink md:text-6xl">{c.metiers.title}</h2>
        <p className="mt-5 max-w-xl font-sans text-lg text-brand-muted">{c.metiers.sub}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.metiers.cards.map((m, i) => (
            <motion.a
              key={m.slug}
              href={`/${m.slug}`}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
              className="group rounded-[22px] border-2 border-brand-ink bg-brand-cream p-6 shadow-[5px_5px_0px_#0A0A0A] transition-transform hover:-translate-y-1"
            >
              <span className="text-3xl" aria-hidden>{m.emoji}</span>
              <h3 className="mt-3 font-display text-xl font-extrabold tracking-[-0.02em]">{m.name}</h3>
              <p className="mt-1.5 font-sans text-sm text-brand-muted">{m.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 font-display text-xs font-extrabold uppercase tracking-wide text-brand-coral">
                Aaven for {m.name}s <ArrowRight size={13} strokeWidth={3} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </motion.a>
          ))}
          <motion.a
            href="#all-professions"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
            className="group grid place-items-center rounded-[22px] border-2 border-dashed border-brand-ink/30 p-6 text-center transition-colors hover:border-brand-ink"
          >
            <span>
              <span className="font-display text-3xl font-extrabold text-brand-ink">+{count}</span>
              <span className="mt-1 block font-sans text-sm font-bold text-brand-muted">{c.metiers.more}</span>
            </span>
          </motion.a>
        </div>
      </Container>
    </section>
  )
}

/* ============================ Profile Showcase ============================ */
// Exemples = les vraies briques du produit : rang Smart Socials + Smart Cards
// (YouTube, carrousel, avant/après, portfolio) au-dessus des vidéos de fond.
const SUPA = 'https://cdn.aaven.fr/templates'
const UN = (id, w = 700) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`
const PROFILE_META = [
  {
    id: 'lea-creator', name: 'Léa', handle: '@lea.creator', img: UN('1494790108377-be9c29b29330', 200),
    video: `${SUPA}/createur/56d5bd7f-9154-414f-a051-5bb904c0f8a6-2-3.1-invideo-seedance_2_0.mp4`,
    accent: '#FF4D42', icons: [Heart], wall: '1,2k',
    socials: [
      { network: 'instagram', url: '#', stat: '82k' },
      { network: 'tiktok', url: '#', stat: '210k' },
      { network: 'youtube', url: '#', stat: '54k' },
    ],
    socialsCfg: { size: 'sm', shape: 'squircle', stats: 'always', animations: true },
    smart: { kind: 'youtube', peek: false, url: '#', meta: { author: 'Léa', thumbnail: UN('1492684223066-81342ee5ff30') }, images: [] },
  },
  {
    id: 'marco-resto', name: 'Chef Marco', handle: '@trattoria.marco', img: UN('1577219491135-ce391730fb2c', 200),
    video: `${SUPA}/etablissement/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-2-2.1-invideo-seedance_2_0.mp4`,
    accent: '#F7C948', icons: [CalendarCheck, MapPin],
    socials: [
      { network: 'instagram', url: '#' },
      { network: 'facebook', url: '#' },
    ],
    socialsCfg: { size: 'sm', shape: 'squircle', stats: 'off', animations: true },
    smart: { kind: 'carousel', peek: true, url: '#', meta: {}, images: [UN('1565299624946-b28f40a0ae38'), UN('1546069901-ba9599a7e63c'), UN('1567620905732-2d1ec7ab7445')] },
  },
  {
    id: 'sofia-coach', name: 'Sofia', handle: '@sofia.fit', img: UN('1571019613454-1cb2f99b2d8b', 200),
    video: `${SUPA}/createur/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-4-4.1-invideo-seedance_2_0.mp4`,
    accent: '#D6FF00', icons: [Heart, CalendarCheck], wall: '480',
    socials: [
      { network: 'instagram', url: '#', stat: '120k' },
      { network: 'tiktok', url: '#', stat: '95k' },
      { network: 'youtube', url: '#', stat: '31k' },
    ],
    socialsCfg: { size: 'sm', shape: 'squircle', stats: 'always', animations: true },
    // Avant : en plein effort avec sa coach · Après : physique transformé.
    smart: { kind: 'beforeafter', peek: false, url: '', meta: {}, images: [UN('1571019614242-c5c5dee9f50b'), UN('1581009146145-b5ef050c2e1e')] },
  },
  {
    id: 'noah-designer', name: 'Noah', handle: '@noah.studio', img: UN('1507003211169-0a1dd7228f2d', 200),
    video: `${SUPA}/freelance/b9861429-b87f-4c9d-bc04-0edc89cd21f3-1-1.1-invideo-seedance_2_0.mp4`,
    accent: '#38BDF8', icons: [Palette, CalendarCheck],
    socials: [
      { network: 'instagram', url: '#' },
      { network: 'linkedin', url: '#' },
      { network: 'website', url: '#' },
    ],
    socialsCfg: { size: 'sm', shape: 'squircle', stats: 'off', animations: true },
    smart: { kind: 'image', peek: false, url: '#', meta: { thumbnail: '' }, images: [UN('1561070791-2526d30994b5')] },
  },
]
const PROFILE_COPY = {
  fr: {
    'lea-creator': { notif: '+530€ ce mois', role: 'Créatrice de contenu', bio: 'Vlogs, coulisses & vie de créatrice.', links: ['Me soutenir (tip)'], smartTitle: 'Mon dernier vlog 🎬', supporters: [{ name: 'Manon', msg: 'Tes vidéos sont incroyables 😍', reply: 'Merci Manon, ça me touche ! 💕' }, { name: 'Inès', msg: 'Hâte de la prochaine collab !' }] },
    'marco-resto': { notif: '+86 réservations', role: 'Restaurant', bio: 'Cuisine italienne de saison à Lyon.', links: ['Réserver une table', 'Itinéraire'], smartTitle: 'Les plats du moment' },
    'sofia-coach': { notif: '+1,2k soutiens', role: 'Coach fitness', bio: 'Programmes & coaching en ligne.', links: ['Me soutenir (tip)', 'Réserver une séance'], smartTitle: '', supporters: [{ name: 'Karim', msg: 'Programme au top, merci coach 💪', reply: 'On lâche rien Karim ! 🔥' }, { name: 'Julie', msg: '+3 kg de muscle en 2 mois !' }] },
    'noah-designer': { notif: '+12 devis', role: 'Designer freelance', bio: 'Identités de marque & sites premium.', links: ['Demander un devis', 'Réserver un call'], smartTitle: 'Portfolio 2026' },
  },
  en: {
    'lea-creator': { notif: '+€530 this month', role: 'Content creator', bio: 'Vlogs, behind the scenes & creator life.', links: ['Support me (tip)'], smartTitle: 'My latest vlog 🎬', supporters: [{ name: 'Manon', msg: 'Your videos are incredible 😍', reply: 'Thank you Manon, means a lot! 💕' }, { name: 'Inès', msg: 'Can’t wait for the next collab!' }] },
    'marco-resto': { notif: '+86 bookings', role: 'Restaurant', bio: 'Seasonal Italian cuisine in Lyon.', links: ['Book a table', 'Directions'], smartTitle: 'This week’s dishes' },
    'sofia-coach': { notif: '+1.2k supporters', role: 'Fitness coach', bio: 'Online programs & coaching.', links: ['Support me (tip)', 'Book a session'], smartTitle: '', supporters: [{ name: 'Karim', msg: 'Best program ever, thanks coach 💪', reply: 'Keep pushing Karim! 🔥' }, { name: 'Julie', msg: '+3 kg of muscle in 2 months!' }] },
    'noah-designer': { notif: '+12 quotes', role: 'Freelance designer', bio: 'Brand identities & premium sites.', links: ['Request a quote', 'Book a call'], smartTitle: 'Portfolio 2026' },
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
  const poster = /\.mp4($|\?)/.test(src || '') ? src.replace(/\.mp4(\?.*)?$/, '.jpg') : undefined
  return <video ref={ref} poster={poster} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
}

function PhoneCard({ p, copy, notif, wallLabel }) {
  const rowCls = 'border border-white/20 bg-white/10 text-white backdrop-blur-md'
  return (
    <div className="relative mx-auto w-[320px]" data-testid={`profile-card-${p.id}`}>
      <Tilt3D max={7} radius={42} depth>
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
            {/* Rang Smart Socials (vraies briques du produit, navigation neutralisée) */}
            {p.socials && (
              <div onClickCapture={(e) => e.preventDefault()} className="-mt-1">
                <SmartSocials socials={p.socials} cfg={p.socialsCfg} light onOpen={() => {}} onMulti={() => {}} />
              </div>
            )}

            {/* Smart Card (YouTube / carrousel / avant-après / portfolio) */}
            {p.smart && (
              <div className="mt-1">
                <SmartCard
                  button={{ id: `demo-${p.id}`, label: '', config: { ...p.smart, meta: { ...p.smart.meta, title: copy.smartTitle } } }}
                  light
                  index={0}
                  onOpen={() => {}}
                />
              </div>
            )}

            <div className="mt-4 space-y-3">
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
      {/* La notif flotte sur un plan au-dessus du téléphone : quand la carte
          s'incline, elle se détache visuellement (parallaxe 3D). */}
      <div className="absolute -right-4 top-24" style={{ transform: 'translateZ(48px)' }}>
        <div className="rotate-3 animate-float rounded-2xl border-2 border-brand-ink bg-white px-3 py-2 shadow-[4px_4px_0px_#0A0A0A]">
          <p className="flex items-center gap-1.5 font-display text-xs font-extrabold"><Heart size={12} className="text-brand-coral" fill="currentColor" /> {notif}</p>
        </div>
      </div>
      </Tilt3D>
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
                <PhoneCard p={p} copy={pc[p.id]} notif={pc[p.id].notif} wallLabel={c.wallLabel} />
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ============================ Bento features ============================ */
// Courbe décorative en SVG pur : recharts (~150 Ko gzip avec d3) était embarqué
// dans le bundle uniquement pour ces 8 points.
const CHART = [8, 14, 11, 22, 18, 30, 26, 38]
function Sparkline({ data, className = '' }) {
  const W = 100, H = 40, PAD = 3
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pts = data.map((v, i) => [
    PAD + (i * (W - PAD * 2)) / (data.length - 1),
    H - PAD - ((v - min) / (max - min)) * (H - PAD * 2),
  ])
  // Lissage type « monotone » : courbes de Bézier entre chaque point.
  const d = pts.map(([x, y], i) => {
    if (i === 0) return `M ${x} ${y}`
    const [px, py] = pts[i - 1]
    const cx = (px + x) / 2
    return `C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden>
      <path d={d} fill="none" stroke="#D6FF00" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
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
            <div className="mt-4 h-28"><Sparkline data={CHART} className="h-full w-full" /></div>
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
    free: ['1 page + tous les boutons', 'Tous les templates vidéo', 'Importe ta photo de fond', '3 produits digitaux', 'Tips & analytics inclus'],
    creator: ['Importe ta vidéo / GIF perso (8 s)', 'Produits illimités', 'Ton lien pro perso', 'Son d’ambiance'],
    pro: ['Tout de Creator', 'Sans branding Aaven', 'Importe ta vidéo (30 s max)', 'Support prioritaire'],
  },
  en: {
    free: ['1 page + all buttons', 'All video templates', 'Upload your background photo', '3 digital products', 'Tips & analytics included'],
    creator: ['Upload your own video / GIF (8s)', 'Unlimited products', 'Your pro custom link', 'Ambient sound'],
    pro: ['Everything in Creator', 'No Aaven branding', 'Upload your video (30s max)', 'Priority support'],
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
          {/* Maillage interne SEO : les 33 landing pages métier (Profession Engine). */}
          <div id="all-professions" className="scroll-mt-24 pb-8">
            <p className="text-center font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white/40">Aaven for</p>
            <nav className="mx-auto mt-3 flex max-w-4xl flex-wrap justify-center gap-x-4 gap-y-2 font-sans text-[13px] font-semibold text-white/50">
              {PROFESSIONS.map((p) => (
                <a key={p.slug} href={`/${p.slug}`} className="hover:text-white">{p.profession_en}s</a>
              ))}
            </nav>
          </div>
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
  // Invité → onboarding direct (guest onboarding) : il construit sa page d'abord,
  // la connexion n'est demandée qu'au moment de la mettre en ligne.
  const onStart = () => { track('cta_start', { loggedIn: !!user }); nav(user ? '/dashboard' : '/onboarding') }
  // La landing est prête : congédie l'intro de chargement (splash inline d'index.html).
  useEffect(() => { window.__aavenIntroDone?.() }, [])
  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-ink antialiased">
      <Header onStart={onStart} />
      <Hero onStart={onStart} />
      <CompareSection />
      <ProfileShowcase onStart={onStart} />
      <MetiersSection />
      <BentoFeatures />
      <Testimonials />
      <Pricing onStart={onStart} />
      <FinalCTA onStart={onStart} />
    </div>
  )
}
