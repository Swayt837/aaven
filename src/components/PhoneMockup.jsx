import { ArrowRight, Heart } from 'lucide-react'
import { Icon } from './Icon'
import { modeOf, BUTTON_TYPES } from '../lib/modes'
import { useI18n } from '../lib/i18n'
import { getTheme, backgroundStyle, isLight, textColor } from '../lib/themes'
import { STYLES, surfaceTokens, buttonTokens, iconBoxTokens, fontCss, readableOn, frameScale } from '../lib/templates'

// Cadre téléphone néo-brutaliste (device). `screenStyle` applique le fond du thème.
// `bare` : écran sans padding ni poignée (pour le rendu immersif plein écran).
export function PhoneFrame({ children, bg = '#FCE7EF', screenStyle, bare = false, className = '' }) {
  return (
    <div
      className={`mx-auto w-full max-w-[340px] rounded-[34px] border-[3px] border-ink p-3 shadow-hard-lg ${className}`}
      style={{ background: bg }}
    >
      {bare ? (
        <div className="relative h-[600px] overflow-hidden rounded-[26px] border-2 border-ink">{children}</div>
      ) : (
        <div
          className="relative overflow-hidden rounded-[26px] border-2 border-ink p-4"
          style={screenStyle || { background: 'rgba(255,255,255,0.4)' }}
        >
          <div className="relative z-10 mx-auto mb-3 h-1.5 w-16 rounded-full bg-ink/30" />
          {children}
        </div>
      )}
    </div>
  )
}

// En-tête immersif : compose le contenu sur la photo selon la disposition choisie.
function ImmersiveHeader({ page, theme, headFont }) {
  const layout = theme.layout || 'spotlight'
  const hasAvatar = !!page.avatarUrl
  const av = { posX: theme.avPosX ?? 50, posY: theme.avPosY ?? 50, zoom: theme.avZoom ?? 1 }
  const leftAlign = layout === 'magazine'
  const showAvatar = hasAvatar // affichée si renseignée, quelle que soit la disposition
  const avSize = layout === 'spotlight' ? 116 : layout === 'cover' ? 92 : layout === 'frame' ? 100 : 84
  const bigName = layout === 'fullbleed' || layout === 'magazine'
  return (
    <div className={`relative z-10 flex flex-col bb-textsh ${leftAlign ? 'items-start text-left' : 'items-center text-center'}`}>
      {showAvatar &&
        (layout === 'frame' ? (
          <div className="rotate-[-2deg] rounded-2xl bg-white p-2 pb-5 bb-float" style={{ boxShadow: '0 18px 40px rgba(0,0,0,0.45)' }}>
            <Avatar avatarUrl={page.avatarUrl} size={avSize} radius="14px" border="none" {...av} />
          </div>
        ) : (
          <Avatar avatarUrl={page.avatarUrl} size={avSize} border="3px solid rgba(255,255,255,0.85)" className="bb-float" {...av} />
        ))}
      <h1 className={`font-extrabold leading-tight tracking-tight text-white ${showAvatar ? 'mt-4' : ''} ${bigName ? 'text-4xl' : 'text-3xl'}`} style={{ fontFamily: headFont }}>{page.title}</h1>
      {page.headline ? (
        <span className="mt-3 inline-block rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md" style={{ fontFamily: headFont }}>
          {page.headline}
        </span>
      ) : null}
      {page.bio ? <p className={`mt-3 text-sm font-medium leading-relaxed text-white/75 ${leftAlign ? '' : 'max-w-xs'}`}>{page.bio}</p> : null}
    </div>
  )
}

// Image recadrable (position % + zoom) dans un cadre à overflow caché.
export function FramedImage({ src, posX = 50, posY = 50, zoom = 1, className = '', style }) {
  return (
    <div className={`overflow-hidden ${className}`} style={style}>
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, transform: `scale(${frameScale(zoom)})`, display: 'block' }}
      />
    </div>
  )
}

// Avatar : image (recadrable) si dispo, sinon emoji. `radius`/`border` = formes & skins.
export function Avatar({ avatarUrl, emoji, size = 80, radius = '9999px', border = '2px solid #111111', posX = 50, posY = 50, zoom = 1, className = '', style }) {
  const box = { width: size, height: size, borderRadius: radius, border, ...style }
  if (avatarUrl) {
    return (
      <div className={`overflow-hidden bg-white shadow-hard-sm ${className}`} style={box}>
        <img
          src={avatarUrl}
          alt=""
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, transform: `scale(${frameScale(zoom)})`, display: 'block' }}
        />
      </div>
    )
  }
  return (
    <div className={`flex items-center justify-center bg-white shadow-hard-sm ${className}`} style={{ ...box, fontSize: size * 0.5 }}>
      {emoji || '👤'}
    </div>
  )
}

// Bordure des blocs (image hero/banner, avatar) selon le style.
function lineFor(style, light) {
  if (style === 'brutalist') return { w: 2, c: '#111111' }
  if (style === 'minimal') return { w: 0, c: 'transparent' }
  return { w: 1, c: light ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.12)' }
}

// Fond de l'en-tête image (hero/banner). Fallback : dégradé d'accent.
function headerStyle(theme, accent) {
  if (theme.bgType === 'image' && theme.bgImage) {
    return { backgroundImage: `url("${String(theme.bgImage).replace(/["\\]/g, '')}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  return { backgroundImage: `linear-gradient(135deg, ${accent}, ${theme.gradTo || '#F7C948'})` }
}

// Pastille "accroche" (l'identité : ce que tu fais).
function Headline({ text, accent, headFont, style }) {
  if (!text) return null
  const brut = style === 'brutalist'
  return (
    <span
      className="mt-3 inline-block max-w-full truncate rounded-full px-3.5 py-1.5 text-xs font-extrabold"
      style={{
        background: accent,
        color: readableOn(accent),
        fontFamily: headFont,
        border: brut ? '2px solid #111' : 'none',
        boxShadow: brut ? '2px 3px 0 0 #111' : '0 3px 10px rgba(0,0,0,.15)',
      }}
    >
      {text}
    </span>
  )
}

// En-tête : présentation premium de l'image uploadée selon la disposition.
// Dispositions : cover · magazine · fullbleed · frame · spotlight. (Pas d'avatar séparé.)
function ProfileHeader({ page, theme, accent, txt, headFont, style, radius }) {
  const layout = theme.layout || 'spotlight'
  const light = isLight(theme)
  const title = page.title
  const headline = page.headline
  const bio = page.bio
  const ln = lineFor(style, light)
  const blockBorder = ln.w ? `${ln.w}px solid ${ln.c}` : 'none'
  const brut = style === 'brutalist'
  const bleed = '-mx-7 -mt-7 sm:-mx-9 sm:-mt-9'

  // Cadrage (position % + zoom) du fond et de l'avatar.
  const coverImg = theme.bgType === 'image' && theme.bgImage ? theme.bgImage : null
  const bgFrame = { posX: theme.bgPosX ?? 50, posY: theme.bgPosY ?? 50, zoom: theme.bgZoom ?? 1 }
  const avFrame = { posX: theme.avPosX ?? 50, posY: theme.avPosY ?? 50, zoom: theme.avZoom ?? 1 }
  const gradient = `linear-gradient(135deg, ${accent}, ${theme.gradTo || '#F7C948'})`
  const CoverBox = ({ className, style }) =>
    coverImg ? (
      <FramedImage src={coverImg} {...bgFrame} className={className} style={style} />
    ) : (
      <div className={className} style={{ ...style, backgroundImage: gradient }} />
    )

  // Photo de profil OPTIONNELLE : affichée seulement si renseignée.
  const hasAvatar = !!page.avatarUrl
  const avBorder = brut ? '2px solid #111' : `3px solid ${light ? 'rgba(255,255,255,.92)' : '#ffffff'}`
  const profile = (size, cls = '') => (hasAvatar ? <Avatar avatarUrl={page.avatarUrl} size={size} border={avBorder} className={cls} {...avFrame} /> : null)

  const H1 = (cls) => <h1 className={`text-2xl font-extrabold leading-tight tracking-tight ${cls || ''}`} style={{ color: txt, fontFamily: headFont }}>{title}</h1>
  const Bio = bio ? <p className="mt-2.5 max-w-xs text-[15px] font-medium leading-relaxed" style={{ color: txt, opacity: 0.78 }}>{bio}</p> : null
  const hl = <Headline text={headline} accent={accent} headFont={headFont} style={style} />
  const BioWide = bio ? <p className="mt-4 text-[15px] font-medium leading-relaxed" style={{ color: txt, opacity: 0.78 }}>{bio}</p> : null

  // COVER — grande photo arrondie en tête ; avatar superposé seulement si présent.
  if (layout === 'cover') {
    return (
      <div className="relative z-10">
        <CoverBox className="h-48 w-full" style={{ border: blockBorder, borderRadius: radius }} />
        <div className={`flex flex-col items-center text-center ${hasAvatar ? '-mt-12' : 'mt-5'}`}>
          {profile(84)}
          {H1(hasAvatar ? 'mt-3' : '')}
          {hl}
          {Bio}
        </div>
      </div>
    )
  }

  // MAGAZINE — photo plein cadre, nom & accroche posés DESSUS (éditorial).
  if (layout === 'magazine') {
    return (
      <div className="relative z-10">
        <div className={`relative ${bleed} h-72 overflow-hidden`}>
          <CoverBox className="absolute inset-0" />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,.82) 6%, rgba(0,0,0,.04) 60%)' }} />
          {hasAvatar && <div className="absolute left-4 top-4">{profile(46)}</div>}
          <div className="absolute inset-x-0 bottom-0 p-5 text-left">
            <h1 className="text-3xl font-extrabold leading-none tracking-tight text-white" style={{ fontFamily: headFont }}>{title}</h1>
            {headline ? <p className="mt-2 text-sm font-bold text-white/85" style={{ fontFamily: headFont }}>{headline}</p> : null}
          </div>
        </div>
        {BioWide}
      </div>
    )
  }

  // FULLBLEED — grand poster immersif, contenu centré en bas sur dégradé.
  if (layout === 'fullbleed') {
    return (
      <div className="relative z-10">
        <div className={`relative ${bleed} h-80 overflow-hidden`}>
          <CoverBox className="absolute inset-0" />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,.85) 4%, rgba(0,0,0,0) 56%)' }} />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center p-5 text-center">
            {profile(72, 'mb-3')}
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white" style={{ fontFamily: headFont }}>{title}</h1>
            {headline ? <p className="mt-2 text-sm font-bold text-white/85" style={{ fontFamily: headFont }}>{headline}</p> : null}
          </div>
        </div>
        {BioWide}
      </div>
    )
  }

  // FRAME — l'image en cadre polaroïd, légèrement inclinée.
  if (layout === 'frame') {
    return (
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative">
          <div
            className="rotate-[-2deg] rounded-2xl bg-white p-2.5 pb-7"
            style={{ border: brut ? '2px solid #111' : 'none', boxShadow: brut ? '5px 6px 0 0 #111' : '0 16px 38px rgba(0,0,0,.35)' }}
          >
            <CoverBox className="aspect-[4/5] w-44 rounded-xl" />
          </div>
          {hasAvatar && <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">{profile(52)}</div>}
        </div>
        {H1(hasAvatar ? 'mt-8' : 'mt-5')}
        {hl}
        {Bio}
      </div>
    )
  }

  // SPOTLIGHT — épuré : avatar si présent, sinon l'image en cercle (ou dégradé).
  return (
    <div className="relative z-10 flex flex-col items-center text-center">
      {hasAvatar ? (
        <Avatar avatarUrl={page.avatarUrl} size={112} border={avBorder} {...avFrame} />
      ) : (
        <CoverBox
          className="h-28 w-28 rounded-full"
          style={{ border: brut ? '2px solid #111' : `3px solid ${light ? 'rgba(255,255,255,.92)' : '#ffffff'}`, boxShadow: brut ? '4px 5px 0 0 #111' : '0 10px 26px rgba(0,0,0,.22)' }}
        />
      )}
      {H1('mt-5')}
      {hl}
      {Bio}
    </div>
  )
}

// Mur de supporters (preuve sociale) : compteur + soutiens récents + réponses.
function SupportersWall({ data, txt, accent, headFont, light, t }) {
  const list = (data?.supporters || []).slice(0, 3)
  const chip = light ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)'
  return (
    <div className="relative z-10 mt-7">
      <div className="mb-3 flex items-center justify-center gap-2" style={{ color: txt }}>
        <Heart size={16} fill={accent} stroke={accent} />
        <span className="text-sm font-extrabold" style={{ fontFamily: headFont }}>
          {data.count} {t('card.supporters')}
        </span>
      </div>
      {list.length > 0 && (
        <div className="flex flex-col gap-2">
          {list.map((s) => (
            <div key={s.id} className="rounded-2xl px-3.5 py-2.5" style={{ background: chip }}>
              <p className="text-sm" style={{ color: txt }}>
                <span className="font-extrabold" style={{ fontFamily: headFont }}>{s.name || t('card.anon')}</span>
                {s.message ? <span style={{ opacity: 0.85 }}> · {s.message}</span> : null}
              </p>
              {s.reply ? (
                <p className="mt-1 text-xs font-semibold" style={{ color: accent }}>↳ {s.reply}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Section produits digitaux (preuve de valeur + vente).
function ProductsSection({ products, txt, accent, headFont, light, t, onBuy }) {
  const card = light ? 'rgba(255,255,255,0.12)' : '#ffffff'
  const border = light ? 'rgba(255,255,255,0.35)' : '#111111'
  return (
    <div className="relative z-10 mt-7">
      <p className="mb-2 text-center text-xs font-extrabold uppercase tracking-[0.12em]" style={{ color: txt, opacity: 0.7, fontFamily: headFont }}>
        {t('card.shop')}
      </p>
      <div className="flex flex-col gap-3">
        {products.map((pr) => (
          <button
            key={pr.id}
            onClick={() => onBuy && onBuy(pr)}
            className="bb-hover flex items-center gap-3 rounded-brutal border-2 p-2.5 text-left"
            style={{ background: card, borderColor: border }}
          >
            {pr.coverImage ? (
              <img src={pr.coverImage} alt="" className="h-12 w-12 shrink-0 rounded-lg border-2 border-ink object-cover" />
            ) : (
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border-2 border-ink bg-cream text-xl">📦</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold" style={{ color: txt, fontFamily: headFont }}>{pr.title}</p>
              <p className="text-sm font-extrabold" style={{ color: accent }}>{(pr.priceCents / 100).toFixed(2)}€</p>
            </div>
            <span className="shrink-0 rounded-full px-3 py-1.5 text-sm font-extrabold" style={{ background: accent, color: readableOn(accent) }}>
              {t('card.buy')}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Rendu d'une page bio (en-tête + supporters + boutons + produits). Themable + skinnable.
export function BioRender({ page, buttons, onButtonClick, onTip, onContact, supporters, products, onBuy, branding = true, immersive = false }) {
  const { t } = useI18n()
  const theme = getTheme(page)
  const mode = modeOf(page.mode)
  const accent = theme.accent || mode.accent
  const txt = immersive ? '#FFFFFF' : textColor(theme)
  const style = STYLES[theme.style] ? theme.style : 'brutalist'
  const btn = theme.btnStyle || STYLES[style].btn
  const headFont = fontCss(theme.font || STYLES[style].font)
  const radius = STYLES[style].radius
  const light = immersive ? true : isLight(theme)

  const active = (buttons || []).filter((b) => b.isActive)
  // L'objectif principal = le bouton EN HAUT de la liste. Réordonner change le principal.
  const primaryId = active[0]?.id
  const objective = t('objective.' + page.mode)
  const hoverClass = !immersive && style === 'brutalist' ? 'press' : 'bb-hover'
  const isBubble = !immersive && btn === 'bubble'

  return (
    <div className="relative z-10 flex flex-col">
      {immersive ? (
        <ImmersiveHeader page={page} theme={theme} headFont={headFont} />
      ) : (
        <ProfileHeader page={page} theme={theme} accent={accent} txt={txt} headFont={headFont} style={style} radius={radius} />
      )}

      {theme.showSupporters && supporters && (
        <SupportersWall data={supporters} txt={txt} accent={accent} headFont={headFont} light={light} t={t} />
      )}

      <div className={`mt-9 flex w-full flex-col ${isBubble ? 'gap-5' : 'gap-4'}`}>
        {active.map((b, i) => {
          const isPrimary = b.id === primaryId
          const act = BUTTON_TYPES[b.type]?.action
          const handle = () => {
            if (act === 'tip' && onTip) return onTip(b)
            if (act === 'contact' && onContact) return onContact(b)
            if (onButtonClick) return onButtonClick(b)
          }
          const bt = buttonTokens(btn, light, accent, isPrimary, radius)
          const ib = iconBoxTokens(btn, light, isPrimary)
          const btnEl = (
            <button
              onClick={handle}
              className={`${hoverClass} flex w-full items-center gap-3 text-left font-extrabold ${isPrimary ? 'px-5 py-5 text-lg' : 'px-5 py-4'}`}
              style={{ ...bt, fontFamily: headFont }}
            >
              <span className={`flex shrink-0 items-center justify-center rounded-lg ${isPrimary ? 'h-9 w-9' : 'h-8 w-8'}`} style={ib}>
                <Icon name={b.icon} size={isPrimary ? 20 : 18} />
              </span>
              <span className="flex-1 leading-tight">{b.label}</span>
              {isPrimary && <ArrowRight size={18} strokeWidth={3} className="shrink-0" />}
            </button>
          )
          const wrapCls = isBubble ? 'bb-bubble' : undefined
          const wrapStyle = isBubble ? { animationDelay: `${i * 0.25}s` } : undefined
          if (isPrimary) {
            return (
              <div key={b.id} className={wrapCls} style={wrapStyle}>
                <p className="mb-2 text-center text-xs font-extrabold uppercase tracking-[0.12em]" style={{ color: txt, opacity: 0.8, fontFamily: headFont }}>
                  {objective}
                </p>
                {btnEl}
              </div>
            )
          }
          return <div key={b.id} className={wrapCls} style={wrapStyle}>{btnEl}</div>
        })}
        {active.length === 0 && <p className="py-6 text-center text-sm" style={{ color: txt, opacity: 0.4 }}>{t('common.loading')}</p>}
      </div>

      {products && products.length > 0 && (
        <ProductsSection products={products} txt={txt} accent={accent} headFont={headFont} light={light} t={t} onBuy={onBuy} />
      )}

      {branding && (
        <p className="mt-8 text-center text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: txt, opacity: 0.45, fontFamily: headFont }}>
          {t('common.madeWith')}
        </p>
      )}
    </div>
  )
}

// Surface (carte) qui héberge le rendu — partagée éditeur + page publique.
// Voile (scrim) pour lisibilité + bordure/ombre selon le style.
function scrimStyle(theme) {
  const glass = { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }
  if (theme.bgType === 'image') return { backgroundColor: `rgba(17,17,17,${theme.overlay ?? 0.35})`, ...glass }
  if (theme.bgType === 'gradient') return { backgroundColor: isLight(theme) ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.4)', ...glass }
  return { backgroundColor: isLight(theme) ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)' }
}

// Ambiance vivante (premium) : pulsations / lumière qui balaie / respiration.
export function Ambiance({ animation, accent }) {
  if (!animation || animation === 'none') return null
  if (animation === 'pulse') {
    return (
      <div className="bb-amb" aria-hidden>
        <span className="bb-pulse" style={{ background: `radial-gradient(circle at 28% 18%, ${accent}, transparent 60%)` }} />
        <span className="bb-pulse bb-pulse-2" style={{ background: 'radial-gradient(circle at 78% 82%, rgba(255,255,255,0.6), transparent 55%)' }} />
      </div>
    )
  }
  if (animation === 'shimmer') {
    return (
      <div className="bb-amb" aria-hidden>
        <span className="bb-shimmer" />
      </div>
    )
  }
  return (
    <div className="bb-amb" aria-hidden>
      <span className="bb-breathe" style={{ background: `radial-gradient(circle at 50% 35%, ${accent}, transparent 60%)` }} />
    </div>
  )
}

export function BioSurface({ page, buttons, onButtonClick, onTip, onContact, supporters, products, onBuy, branding = true, animate = false }) {
  const theme = getTheme(page)
  const style = STYLES[theme.style] ? theme.style : 'brutalist'
  const tok = surfaceTokens(style, isLight(theme))
  return (
    <div
      className={`relative overflow-hidden p-7 sm:p-9 ${animate ? 'bb-rise' : ''}`}
      style={{ ...scrimStyle(theme), borderStyle: 'solid', borderWidth: tok.borderWidth, borderColor: tok.borderColor, boxShadow: tok.boxShadow, borderRadius: tok.borderRadius }}
    >
      <Ambiance animation={theme.animation} accent={theme.accent} />
      <BioRender page={page} buttons={buttons} onButtonClick={onButtonClick} onTip={onTip} onContact={onContact} supporters={supporters} products={products} onBuy={onBuy} branding={branding} />
    </div>
  )
}

// Scène immersive plein écran (cinématique, sans carte) : fond + overlays + contenu flottant.
// Se place dans un parent `relative` qui a une hauteur (viewport ou écran du mockup).
export function BioImmersive({ page, buttons, onButtonClick, onTip, onContact, supporters, products, onBuy, branding = true, kenBurns = true }) {
  const theme = getTheme(page)
  const accent = theme.accent || modeOf(page.mode).accent
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Fond plein écran (par priorité) :
          1) vidéo d'intro = joue 1 fois puis se fige sur sa dernière frame (no loop)
          2) vidéo de fond en boucle
          3) image (léger zoom cinématique) */}
      {theme.introVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={theme.bgImage || undefined}
          src={theme.introVideo}
        />
      ) : theme.bgVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={theme.bgImage || undefined}
          src={theme.bgVideo}
          style={{ objectPosition: `${theme.bgPosX ?? 50}% ${theme.bgPosY ?? 50}%`, transform: `scale(${frameScale(theme.bgZoom ?? 1)})` }}
        />
      ) : theme.bgType === 'image' && theme.bgImage ? (
        <FramedImage src={theme.bgImage} posX={theme.bgPosX ?? 50} posY={theme.bgPosY ?? 50} zoom={theme.bgZoom ?? 1} className="absolute inset-0" />
      ) : (
        <div className="absolute inset-0" style={backgroundStyle(theme)} />
      )}
      {/* Assombrissement dynamique (lisibilité) */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.12) 32%, rgba(0,0,0,0.64) 100%)' }} aria-hidden />
      {/* Glow chaud derrière le contenu */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(58% 48% at 50% 42%, ${accent}33, transparent 72%)` }} aria-hidden />
      {/* Vignette douce */}
      <div className="bb-vignette absolute inset-0" aria-hidden />
      {/* Ambiance discrète (premium) */}
      <Ambiance animation={theme.animation} accent={accent} />
      {/* Contenu flottant, défilable — position selon la disposition */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className={`mx-auto flex min-h-full max-w-md flex-col px-6 py-16 ${['cover', 'magazine', 'fullbleed'].includes(theme.layout) ? 'justify-end' : 'justify-center'}`}>
          <BioRender immersive page={page} buttons={buttons} onButtonClick={onButtonClick} onTip={onTip} onContact={onContact} supporters={supporters} products={products} onBuy={onBuy} branding={branding} />
        </div>
      </div>
    </div>
  )
}

export { backgroundStyle }
