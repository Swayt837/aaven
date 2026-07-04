import { useState } from 'react'
import { motion } from 'framer-motion'
import { Instagram, Youtube, Linkedin, Facebook, Globe } from 'lucide-react'
import { faviconUrl } from '../lib/modes'

// ============================ Smart Socials ============================
// Rang d'icônes réseaux signature Aaven — jamais un bloc, jamais opaque :
//  B. Monochrome → Aura : icônes fantômes au repos, la couleur de la marque
//     éclot au survol/tap (halo radial + micro-animation par réseau).
//  C. Alive Row : flottement lent désynchronisé + reflet lumineux qui traverse
//     le rang ~7s + entrée en cascade.
//  D. Peek Stats : le compteur glisse sous l'icône au survol (ou toujours/jamais).
// Perf : uniquement transform/opacity (60fps, zéro reflow).

const EASE = [0.22, 1, 0.36, 1]

/* ---------------- Glyphes absents de lucide (suivent currentColor) ---------------- */
const G = (path, vb = '0 0 24 24') => ({ size = 22, ...p }) => (
  <svg width={size} height={size} viewBox={vb} fill="currentColor" aria-hidden {...p}><path d={path} /></svg>
)
const TikTokIcon = G('M16.6 3c.27 2.2 1.5 3.85 3.65 4.05v2.62c-1.25.12-2.43-.26-3.62-.96v6.02c0 3.42-2.72 5.78-5.92 5.28-2.55-.4-4.33-2.62-4.18-5.2.15-2.52 2.33-4.55 4.95-4.45.4.01.78.07 1.16.17v2.74a2.3 2.3 0 0 0-1.2-.27 2.16 2.16 0 0 0-2.06 2.2 2.16 2.16 0 0 0 4.32.07V3h2.9z')
const SpotifyIcon = G('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.58 14.45c-.19.3-.58.4-.88.21-2.42-1.48-5.47-1.81-9.06-.99a.64.64 0 0 1-.77-.48.64.64 0 0 1 .48-.77c3.93-.9 7.3-.51 10.02 1.15.3.18.4.58.21.88zm1.22-2.72c-.23.38-.72.5-1.1.27-2.77-1.7-7-2.2-10.28-1.2a.8.8 0 0 1-1-.53.8.8 0 0 1 .53-1c3.75-1.14 8.4-.59 11.58 1.37.38.23.5.72.27 1.09zm.11-2.83C14.6 8.95 9.15 8.77 6 9.73a.96.96 0 0 1-1.2-.64.96.96 0 0 1 .64-1.2c3.62-1.1 9.63-.88 13.44 1.38.46.27.61.86.34 1.32-.27.45-.86.6-1.31.31z')
const XIcon = G('M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82L5 21.75H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z')
const PinterestIcon = G('M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.86 6.36 9.31-.09-.79-.17-2 .04-2.87.18-.78 1.18-4.99 1.18-4.99s-.3-.6-.3-1.49c0-1.4.81-2.44 1.82-2.44.86 0 1.27.64 1.27 1.41 0 .86-.55 2.15-.83 3.34-.24 1 .5 1.81 1.48 1.81 1.78 0 3.15-1.88 3.15-4.59 0-2.4-1.72-4.08-4.19-4.08-2.85 0-4.53 2.14-4.53 4.35 0 .86.33 1.79.75 2.29.08.1.09.19.07.29l-.28 1.13c-.04.18-.15.22-.34.13-1.25-.58-2.03-2.41-2.03-3.88 0-3.16 2.29-6.06 6.62-6.06 3.47 0 6.17 2.47 6.17 5.78 0 3.45-2.18 6.23-5.2 6.23-1.02 0-1.97-.53-2.3-1.15l-.62 2.38c-.23.87-.84 1.96-1.25 2.63.94.29 1.94.45 2.97.45 5.52 0 10-4.48 10-10S17.52 2 12 2z')
const DiscordIcon = G('M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.3 18.3 0 0 0-5.48 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.88 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06c0 .02.01.04.03.05a19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13l.37-.29a.07.07 0 0 1 .08-.01 14.2 14.2 0 0 0 12.06 0 .07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .08.04 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.68-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z')

/* ---------------- Réseaux : icône, couleur/dégradé de marque, micro-animation ---------------- */
const NETWORKS = {
  instagram: { icon: Instagram, aura: 'radial-gradient(circle at 30% 70%, #FEDA75, #F58529 30%, #DD2A7B 60%, #8134AF 90%)', anim: 'ring', label: 'Instagram' },
  tiktok: { icon: TikTokIcon, aura: 'radial-gradient(circle at 35% 35%, #25F4EE, transparent 60%), radial-gradient(circle at 65% 65%, #FE2C55, transparent 60%)', anim: 'bounce', label: 'TikTok' },
  youtube: { icon: Youtube, aura: '#FF0000', anim: 'pulse', label: 'YouTube' },
  spotify: { icon: SpotifyIcon, aura: '#1DB954', anim: 'waves', label: 'Spotify' },
  x: { icon: XIcon, aura: 'rgba(255,255,255,0.9)', anim: 'halo', label: 'X' },
  linkedin: { icon: Linkedin, aura: '#0A66C2', anim: 'halo', label: 'LinkedIn' },
  pinterest: { icon: PinterestIcon, aura: '#E60023', anim: 'pulse', label: 'Pinterest' },
  discord: { icon: DiscordIcon, aura: '#5865F2', anim: 'wobble', label: 'Discord' },
  facebook: { icon: Facebook, aura: '#1877F2', anim: 'halo', label: 'Facebook' },
  website: { icon: Globe, aura: 'rgba(255,255,255,0.85)', anim: 'orbit', label: 'Site' },
}

const SIZES = { sm: { px: 44, icon: 18, gap: 10 }, md: { px: 52, icon: 21, gap: 14 }, lg: { px: 60, icon: 24, gap: 18 } }
const SHAPES = { squircle: '32%', round: '9999px', square: '22%' }

// Favicon d'un site web (fallback globe si introuvable).
function WebIcon({ src, size }) {
  const [err, setErr] = useState(false)
  if (err) return <Globe size={size - 2} />
  return <img src={src} alt="" width={size} height={size} className="rounded-md" onError={() => setErr(true)} />
}

/* ---------------- Micro-animations au survol (transform/opacity only) ---------------- */
const iconVariants = {
  ring: {}, halo: {},
  bounce: { hover: { y: [0, -3.5, 0, -1.5, 0], transition: { duration: 0.55, ease: 'easeOut' } } },
  pulse: { hover: { scale: [1, 1.22, 1], transition: { duration: 0.45, ease: 'easeOut' } } },
  wobble: { hover: { rotate: [0, -7, 6, -3, 0], transition: { duration: 0.6, ease: 'easeInOut' } } },
  waves: {}, orbit: {},
}

// Anneau en dégradé dont SEUL le dégradé tourne : la forme (squircle/rond/carré)
// reste statique et parfaitement alignée sur les bords de la pastille.
function SpinningRing({ radius, gradient, thickness = 2.5, duration = 2.4 }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute overflow-hidden"
      // inset:0 + MÊME borderRadius que la pastille → l'anneau épouse exactement
      // ses bords (un radius en % sur une boîte agrandie donnerait une autre courbe).
      style={{
        inset: 0,
        borderRadius: radius,
        padding: thickness,
        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
      variants={{ rest: { opacity: 0 }, hover: { opacity: 1, transition: { duration: 0.25 } } }}
    >
      <motion.span
        className="absolute"
        style={{ inset: '-55%', background: gradient }}
        variants={{ rest: { rotate: 0 }, hover: { rotate: 360, transition: { duration, ease: 'linear', repeat: Infinity } } }}
      />
    </motion.span>
  )
}

// Anneau Instagram : dégradé de marque qui tourne dans la forme statique.
function InstaRing({ radius }) {
  return <SpinningRing radius={radius} gradient="conic-gradient(#FEDA75, #F58529, #DD2A7B, #8134AF, #515BD4, #FEDA75)" />
}

// Ondes Spotify : cercles qui s'étendent en s'évanouissant.
function Waves({ radius }) {
  return [0, 1].map((i) => (
    <motion.span
      key={i}
      aria-hidden
      className="pointer-events-none absolute inset-0 border border-current"
      style={{ borderRadius: radius, color: '#1DB954' }}
      variants={{
        rest: { opacity: 0, scale: 1 },
        hover: { opacity: [0.6, 0], scale: [1, 1.55], transition: { duration: 1.3, delay: i * 0.45, repeat: Infinity, ease: 'easeOut' } },
      }}
    />
  ))
}

// Site web : une lumière (comète) parcourt le bord en suivant exactement la forme.
function Orbit({ radius }) {
  return (
    <SpinningRing
      radius={radius}
      thickness={2}
      duration={1.6}
      gradient="conic-gradient(from 0deg, transparent 0 68%, rgba(255,255,255,0.95) 86%, transparent 100%)"
    />
  )
}

/* ---------------- Une icône ---------------- */
function SocialIcon({ item, cfg, light, index, onOpen, onMulti }) {
  const net = NETWORKS[item.network]
  if (!net) return null
  const S = SIZES[cfg.size] || SIZES.md
  const radius = SHAPES[cfg.shape] || SHAPES.squircle
  const IconCmp = net.icon
  const showStat = cfg.stats !== 'off' && item.stat
  const anims = cfg.animations !== false
  // Site web : favicon du site à la place du globe ; plusieurs sites → modale de liens.
  const multi = item.network === 'website' && (item.links?.length || 0) > 1
  const favicon = item.network === 'website' ? faviconUrl(item.url) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.1 + index * 0.06 }}
      className="relative flex shrink-0 flex-col items-center"
      style={{ paddingBottom: cfg.stats === 'always' && item.stat ? 0 : undefined }}
    >
      {/* Flottement ambiant désynchronisé (C) */}
      <motion.div
        animate={anims ? { y: [0, -2, 0, 1.5, 0] } : undefined}
        transition={anims ? { duration: 4.2 + index * 0.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 } : undefined}
      >
        <motion.a
          href={multi ? '#' : item.url}
          target={multi ? undefined : '_blank'}
          rel="noopener noreferrer"
          aria-label={net.label}
          onClick={(e) => {
            if (multi) { e.preventDefault(); onMulti && onMulti(item.links) }
            if (onOpen) onOpen(item)
          }}
          initial="rest"
          animate="rest"
          whileHover="hover"
          whileTap={{ scale: 0.96, transition: { duration: 0.12 } }}
          className="relative grid place-items-center"
          style={{ width: S.px, height: S.px }}
        >
          {/* Aura de marque (B) — éclot au survol, derrière le verre */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -inset-2 blur-xl"
            style={{ background: net.aura, borderRadius: '50%' }}
            variants={{ rest: { opacity: 0, scale: 0.8 }, hover: { opacity: 0.55, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } } }}
          />
          {/* Pastille verre */}
          <motion.span
            aria-hidden
            className="absolute inset-0"
            style={{
              borderRadius: radius,
              background: light ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${light ? 'rgba(255,255,255,0.25)' : 'rgba(10,10,10,0.1)'}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
            variants={{ rest: { y: 0, scale: 1 }, hover: { y: -3, scale: 1.08, boxShadow: '0 10px 26px rgba(0,0,0,0.22)', transition: { duration: 0.25, ease: 'easeOut' } } }}
          />
          {/* Animations spéciales par réseau */}
          {anims && net.anim === 'ring' && <InstaRing radius={radius} />}
          {anims && net.anim === 'waves' && <Waves radius={radius} />}
          {anims && net.anim === 'orbit' && <Orbit radius={radius} />}
          {/* Glyphe monochrome (suit la couleur du thème) — ou favicon pour un site web */}
          <motion.span
            className="relative z-10"
            style={{ color: light ? '#fff' : '#0A0A0A' }}
            variants={{ rest: { y: 0, scale: 1 }, hover: { y: -3, scale: 1.08, transition: { duration: 0.25, ease: 'easeOut' }, ...(anims ? (iconVariants[net.anim]?.hover || {}) : {}) } }}
          >
            {favicon ? <WebIcon src={favicon} size={S.icon + 2} /> : <IconCmp size={S.icon} />}
          </motion.span>

          {/* Stat en mode Peek (D) : glisse sous l'icône au survol */}
          {showStat && cfg.stats === 'peek' && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold"
              style={{ color: light ? 'rgba(255,255,255,0.75)' : 'rgba(10,10,10,0.55)' }}
              variants={{ rest: { opacity: 0, y: -4 }, hover: { opacity: 1, y: 3, transition: { duration: 0.25, ease: 'easeOut' } } }}
            >
              {item.stat}
            </motion.span>
          )}
        </motion.a>
      </motion.div>

      {/* Stat toujours visible */}
      {showStat && cfg.stats === 'always' && (
        <span className="mt-1.5 whitespace-nowrap text-[10px] font-semibold" style={{ color: light ? 'rgba(255,255,255,0.7)' : 'rgba(10,10,10,0.5)' }}>
          {item.stat}
        </span>
      )}
    </motion.div>
  )
}

/* ---------------- Le rang ---------------- */
export function SmartSocials({ socials, cfg = {}, light = true, onOpen, onMulti }) {
  const valid = (socials || []).filter((s) => s.network && s.url && NETWORKS[s.network])
  // Plusieurs sites web → une seule icône (favicon du 1er) qui ouvre la modale de liens.
  const websites = valid.filter((s) => s.network === 'website')
  const items = valid.filter((s) => s.network !== 'website')
  if (websites.length) {
    items.push({
      ...websites[0],
      stat: websites.length > 1 ? '' : websites[0].stat,
      links: websites.map((w) => ({ url: w.url, label: '' })),
    })
  }
  if (!items.length) return null
  const S = SIZES[cfg.size] || SIZES.md
  const peekPad = cfg.stats === 'peek' ? 18 : 4 // place pour le badge qui glisse

  return (
    <div className="relative mt-6 w-full">
      {/* Scroll horizontal fluide si nécessaire (mobile), centré quand tout tient */}
      <div className="no-scrollbar overflow-x-auto">
        <div
          className="relative mx-auto flex w-max items-start px-2"
          style={{ gap: S.gap, paddingBottom: peekPad, paddingTop: 10 }}
        >
          {items.map((item, i) => (
            <SocialIcon key={`${item.network}-${i}`} item={item} cfg={cfg} light={light} index={i} onOpen={onOpen} onMulti={onMulti} />
          ))}
        </div>
      </div>
    </div>
  )
}
