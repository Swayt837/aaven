import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Calendar, ChevronRight, ShoppingBag, Music2, Instagram } from 'lucide-react'

// ============================ Smart Content ============================
// Cartes de contenu qui flottent au-dessus du fond (image/vidéo) sans le masquer :
// compactes, glassmorphism, très arrondies, aérées. Mode « Peek » signature :
// repliée en bande ~68px, la carte se déploie au survol (desktop) ou au tap (mobile).
// Extensible : ajouter un kind = un renderer dans KIND_RENDERERS, rien d'autre.

const EASE = [0.22, 1, 0.36, 1]

// Verre adapté au mode texte du thème (clair sur fond sombre et inversement).
function glass(light) {
  return light
    ? { background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff' }
    : { background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(10,10,10,0.1)', color: '#0A0A0A' }
}
const BLUR = { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }

/* ---------------- Sous-composants média ---------------- */

function Thumb({ src, playBadge, alt = '' }) {
  if (!src) return null
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
      <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      {playBadge && (
        <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white shadow-sm" style={BLUR}>
          <Play size={18} fill="currentColor" className="ml-0.5" />
        </span>
      )}
    </div>
  )
}

// Avant / Après : slider interactif (pointeur ou tactile).
function BeforeAfter({ before, after }) {
  const [pos, setPos] = useState(50)
  const ref = useRef(null)
  const move = (clientX) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setPos(Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100)))
  }
  return (
    <div
      ref={ref}
      className="relative w-full touch-none select-none overflow-hidden"
      style={{ aspectRatio: '16/10' }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX) }}
      onPointerMove={(e) => e.buttons > 0 && move(e.clientX)}
    >
      <img src={after} alt="Après" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      <img src={before} alt="Avant" loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      {/* Poignée */}
      <div className="absolute inset-y-0 w-0.5 bg-white/90" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[10px] font-extrabold text-black shadow-md">⇄</span>
      </div>
      <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white" style={BLUR}>Avant</span>
      <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white" style={BLUR}>Après</span>
    </div>
  )
}

// Carrousel : images swipeables (scroll-snap natif, max 10).
function Carousel({ images }) {
  const [idx, setIdx] = useState(0)
  const onScroll = (e) => {
    const el = e.currentTarget
    setIdx(Math.round(el.scrollLeft / el.clientWidth))
  }
  return (
    <div className="relative">
      <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth" style={{ scrollbarWidth: 'none' }} onScroll={onScroll}>
        {images.map((src, i) => (
          <img key={i} src={src} alt="" loading="lazy" className="w-full flex-none snap-center object-cover" style={{ aspectRatio: '16/10' }} />
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// Grille Instagram : 3 / 6 / 9 images, très discrète.
function InstaGrid({ images }) {
  const shown = images.slice(0, images.length >= 9 ? 9 : images.length >= 6 ? 6 : 3)
  return (
    <div className="grid grid-cols-3 gap-1 p-1">
      {shown.map((src, i) => (
        <img key={i} src={src} alt="" loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
      ))}
    </div>
  )
}

/* ---------------- Rangée d'infos (titre + auteur + CTA) ---------------- */
function InfoRow({ title, author, cta, light, headFont }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        {title && <p className="truncate text-sm font-extrabold leading-tight" style={{ fontFamily: headFont }}>{title}</p>}
        {author && <p className="truncate text-xs opacity-60">{author}</p>}
      </div>
      {cta && (
        <span className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold ${light ? 'bg-white text-black' : 'bg-black text-white'}`}>
          {cta} <ChevronRight size={13} strokeWidth={3} />
        </span>
      )}
    </div>
  )
}

/* ---------------- Renderers par kind (extensible) ---------------- */
// Chaque renderer : ({ cfg, label, light, headFont, t }) → { media, info, row }
//  - media : contenu visuel plein cadre (optionnel)
//  - row   : carte-rangée compacte (spotify, booking…) — pas de peek
const KIND_RENDERERS = {
  youtube: ({ cfg }) => ({ media: <Thumb src={cfg.meta?.thumbnail} playBadge />, info: { cta: 'YouTube' } }),
  tiktok: ({ cfg }) => ({ media: <Thumb src={cfg.meta?.thumbnail} playBadge />, info: { cta: 'TikTok' } }),
  blog: ({ cfg }) => ({ media: <Thumb src={cfg.meta?.thumbnail} />, info: { cta: 'Lire' } }),
  generic: ({ cfg }) => ({ media: cfg.meta?.thumbnail ? <Thumb src={cfg.meta.thumbnail} /> : null, info: { cta: 'Ouvrir' } }),
  image: ({ cfg }) => ({ media: cfg.images?.[0] ? <Thumb src={cfg.images[0]} /> : null, info: { cta: 'Voir' } }),
  product: ({ cfg }) => ({
    media: <Thumb src={cfg.images?.[0] || cfg.meta?.thumbnail} />,
    info: { cta: cfg.meta?.price ? `${cfg.meta.price} · Acheter` : 'Acheter' },
  }),
  carousel: ({ cfg }) => ({ media: cfg.images?.length ? <Carousel images={cfg.images} /> : null, info: {} }),
  beforeafter: ({ cfg }) => ({
    media: cfg.images?.length >= 2 ? <BeforeAfter before={cfg.images[0]} after={cfg.images[1]} /> : null,
    info: {},
    noPeek: true, // le slider EST l'interaction
  }),
  instagram: ({ cfg }) =>
    cfg.images?.length >= 3
      ? { media: <InstaGrid images={cfg.images} />, info: { cta: 'Instagram' } }
      : { row: { icon: <Instagram size={18} />, cta: 'Instagram' } },
  spotify: ({ cfg }) => ({ row: { cover: cfg.meta?.thumbnail, icon: <Music2 size={18} />, cta: 'Écouter' } }),
  music: ({ cfg }) => ({ row: { cover: cfg.meta?.thumbnail, icon: <Music2 size={18} />, cta: 'Écouter' } }),
  booking: ({ cfg }) => ({ row: { icon: <Calendar size={18} />, cta: 'Réserver' } }),
}

/* ---------------- La carte ---------------- */
export function SmartCard({ button, light, headFont, onOpen, index = 0 }) {
  const cfg = button.config || {}
  const renderer = KIND_RENDERERS[cfg.kind] || KIND_RENDERERS.generic
  const r = renderer({ cfg })
  const title = cfg.meta?.title || button.label
  const author = cfg.meta?.author
  const open = () => onOpen && onOpen(button)

  // Peek : replié par défaut (bande compacte), déployé au survol/tap.
  const peekable = cfg.peek !== false && !!r.media && !r.noPeek
  const [expanded, setExpanded] = useState(false)

  const G = glass(light)

  /* --- Carte-rangée (spotify, booking, insta simple) : déjà compacte --- */
  if (r.row) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE, delay: index * 0.07 }}
        className="mx-auto w-[92%] sm:w-[85%]"
      >
        <button onClick={open} className="flex w-full items-center gap-3 rounded-[22px] px-4 py-3 text-left shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:-translate-y-0.5" style={{ ...G, ...BLUR }}>
          {r.row.cover ? (
            <img src={r.row.cover} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
          ) : (
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${light ? 'bg-white/15' : 'bg-black/8'}`}>{r.row.icon}</span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold leading-tight" style={{ fontFamily: headFont }}>{title}</span>
            {author && <span className="block truncate text-xs opacity-60">{author}</span>}
          </span>
          <span className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold ${light ? 'bg-white text-black' : 'bg-black text-white'}`}>
            {r.row.cta} <ChevronRight size={13} strokeWidth={3} />
          </span>
        </button>
      </motion.div>
    )
  }

  /* --- Carte média (peek ou pleine) --- */
  const body = (
    <>
      {r.media}
      <div style={{ ...G, background: 'transparent', border: 'none' }}>
        <InfoRow title={title} author={author} cta={r.info?.cta} light={light} headFont={headFont} />
      </div>
    </>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE, delay: index * 0.07 }}
      className="mx-auto w-[92%] sm:w-[85%]"
    >
      <div
        className="group overflow-hidden rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-0.5"
        style={{ ...G, ...BLUR }}
        onMouseEnter={() => peekable && setExpanded(true)}
        onMouseLeave={() => peekable && setExpanded(false)}
      >
        {peekable && !expanded ? (
          /* --- Mode Peek : bande ~68px, miniature en fond + titre --- */
          <button onClick={() => setExpanded(true)} className="relative block h-[68px] w-full overflow-hidden text-left">
            {cfg.meta?.thumbnail || cfg.images?.[0] ? (
              <img src={cfg.meta?.thumbnail || cfg.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            <span className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <span className="absolute inset-0 flex items-center gap-2.5 px-4">
              {r.info?.cta === 'YouTube' || r.info?.cta === 'TikTok' ? (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/25 text-white" style={BLUR}><Play size={13} fill="currentColor" className="ml-0.5" /></span>
              ) : cfg.kind === 'product' ? (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/25 text-white" style={BLUR}><ShoppingBag size={14} /></span>
              ) : null}
              <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-white" style={{ fontFamily: headFont }}>{title}</span>
              <ChevronRight size={16} className="shrink-0 text-white/80 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </button>
        ) : (
          /* --- Déployée : média + infos, clic = ouvre le lien --- */
          <motion.div
            key="full"
            initial={peekable ? { opacity: 0.4 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={cfg.kind === 'carousel' || cfg.kind === 'beforeafter' ? undefined : open}
            className={cfg.kind === 'carousel' || cfg.kind === 'beforeafter' ? undefined : 'cursor-pointer'}
          >
            {body}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
