// Système Template / Style / Skin pour les PAGES PUBLIQUES uniquement.
// (Le site BioBoost — landing, dashboard, éditeur — reste néo-brutaliste.)
//
// - STYLE  : look du conteneur public (bordure, ombre, radius) + police + bouton par défaut.
// - FONT   : famille typographique (encadrée).
// - BTN    : forme/remplissage des boutons d'action.
// - TEMPLATE : preset curé par persona = un bundle { style, layout, fond, accent, font, btn }.

// ---------- Couleur de texte lisible au-dessus d'une couleur ----------
export function readableOn(hexColor) {
  const c = String(hexColor || '').replace('#', '')
  if (c.length < 6) return '#111111'
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#111111' : '#FFFFFF'
}

// Sur-cadrage de base : marge sur les DEUX axes pour pouvoir repositionner
// horizontalement ET verticalement même à zoom 1 (sinon `cover` ne laisse de
// marge que sur un seul axe selon l'orientation de l'image).
export const FRAME_BASE = 1.25
export const frameScale = (zoom = 1) => FRAME_BASE * (zoom || 1)

// ---------- Polices (encadrées) ----------
export const FONTS = {
  grotesque: { name: { fr: 'Grotesque', en: 'Grotesque' }, css: "'Bricolage Grotesque', system-ui, sans-serif" },
  modern: { name: { fr: 'Moderne', en: 'Modern' }, css: "'Plus Jakarta Sans', system-ui, sans-serif" },
  neutral: { name: { fr: 'Neutre', en: 'Neutral' }, css: "'Inter', system-ui, sans-serif" },
  elegant: { name: { fr: 'Élégant', en: 'Elegant' }, css: "'Fraunces', Georgia, serif" },
  rounded: { name: { fr: 'Rond', en: 'Rounded' }, css: "'Baloo 2', system-ui, sans-serif" },
}
export const fontCss = (k) => (FONTS[k] || FONTS.grotesque).css

// ---------- Styles (skins du conteneur) ----------
export const STYLES = {
  brutalist: { name: { fr: 'Brutalist', en: 'Brutalist' }, font: 'grotesque', btn: 'hard', radius: 16 },
  clean: { name: { fr: 'Clean', en: 'Clean' }, font: 'modern', btn: 'solid', radius: 20 },
  minimal: { name: { fr: 'Minimal', en: 'Minimal' }, font: 'neutral', btn: 'outline', radius: 14 },
  premium: { name: { fr: 'Premium', en: 'Premium' }, font: 'elegant', btn: 'solid', radius: 24 },
}

// ---------- Styles de bouton ----------
export const BUTTON_STYLES = {
  hard: { name: { fr: 'Dur', en: 'Hard' } },
  solid: { name: { fr: 'Plein', en: 'Solid' } },
  outline: { name: { fr: 'Contour', en: 'Outline' } },
  pill: { name: { fr: 'Pilule', en: 'Pill' } },
  bubble: { name: { fr: 'Bulle', en: 'Bubble' } },
  glass: { name: { fr: 'Verre', en: 'Glass' } },
}

// ---------- Tokens de rendu ----------
// Conteneur (carte) : bordure / ombre / radius selon le style.
export function surfaceTokens(style, light) {
  switch (style) {
    case 'clean':
      return { borderWidth: '1px', borderColor: light ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.10)', boxShadow: '0 12px 34px rgba(0,0,0,.12)', borderRadius: '20px' }
    case 'minimal':
      return { borderWidth: '0px', borderColor: 'transparent', boxShadow: 'none', borderRadius: '14px' }
    case 'premium':
      return { borderWidth: '1px', borderColor: light ? 'rgba(255,255,255,.20)' : 'rgba(0,0,0,.12)', boxShadow: '0 18px 44px rgba(0,0,0,.30)', borderRadius: '24px' }
    default: // brutalist
      return { borderWidth: '2px', borderColor: light ? 'rgba(255,255,255,.35)' : '#111', boxShadow: '6px 6px 0 0 #111', borderRadius: '16px' }
  }
}

// Bouton d'action selon le style de bouton + primaire/secondaire.
export function buttonTokens(btn, light, accent, isPrimary, radius) {
  const r = `${radius}px`
  const secBg = light ? 'rgba(255,255,255,.12)' : '#ffffff'
  const secText = light ? '#ffffff' : '#111111'
  const pAccent = { background: accent, color: readableOn(accent) }

  switch (btn) {
    case 'solid':
      return {
        ...(isPrimary ? pAccent : { background: secBg, color: secText }),
        border: 'none',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 6px 18px rgba(0,0,0,.16)',
        borderRadius: r,
      }
    case 'outline':
      return {
        background: isPrimary ? accent : 'transparent',
        color: isPrimary ? readableOn(accent) : secText,
        border: `2px solid ${isPrimary ? accent : light ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.25)'}`,
        boxShadow: 'none',
        borderRadius: r,
      }
    case 'pill':
      return {
        ...(isPrimary ? pAccent : { background: secBg, color: secText }),
        border: 'none',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 6px 18px rgba(0,0,0,.16)',
        borderRadius: '999px',
      }
    case 'bubble':
      return {
        ...(isPrimary ? pAccent : { background: light ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.72)', color: light ? '#ffffff' : '#111111' }),
        border: !isPrimary && light ? '1px solid rgba(255,255,255,.35)' : 'none',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.30), 0 12px 28px rgba(0,0,0,.22)',
        borderRadius: '999px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }
    case 'glass':
      if (isPrimary) {
        return { background: accent, color: readableOn(accent), border: 'none', borderRadius: r, boxShadow: `0 14px 36px ${accent}59, 0 6px 16px rgba(0,0,0,.35)` }
      }
      return {
        background: light ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.6)',
        color: light ? '#ffffff' : '#111111',
        border: light ? '1px solid rgba(255,255,255,.22)' : '1px solid rgba(0,0,0,.1)',
        borderRadius: r,
        boxShadow: '0 10px 28px rgba(0,0,0,.30)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }
    default: // hard (brutalist)
      return {
        ...(isPrimary ? pAccent : { background: '#ffffff', color: '#111111' }),
        border: '2px solid #111111',
        boxShadow: '4px 5px 0 0 #111111',
        borderRadius: r,
      }
  }
}

// Boîte d'icône d'un bouton (s'accorde au style).
export function iconBoxTokens(btn, light, isPrimary) {
  if (btn === 'hard') {
    return { border: '2px solid #111111', background: isPrimary ? 'rgba(255,255,255,.25)' : '#FAF6EE' }
  }
  return {
    border: 'none',
    background: isPrimary ? 'rgba(255,255,255,.22)' : light ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.06)',
  }
}

// ---------- Galerie de templates curés (6–9) ----------
const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=72`
const P = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=70` // vignette

// Chaque template applique un bundle de thème complet + une vraie photo premium en vignette.
export const TEMPLATES = [
  // 🎥 Creator
  {
    key: 'creator-bold', persona: 'creator', name: 'Creator Bold', desc: { fr: 'Brutaliste, gros CTA, très TikTok', en: 'Brutalist, big CTA, very TikTok' },
    preview: P('1514525253161-7a46d19cd819'),
    apply: { template: 'creator-bold', style: 'brutalist', layout: 'magazine', font: 'grotesque', btnStyle: 'hard', bgType: 'image', bgImage: U('1514525253161-7a46d19cd819'), overlay: 0.4, text: 'light', accent: '#F0426B' },
  },
  {
    key: 'minimal-creator', persona: 'creator', name: 'Minimal Creator', desc: { fr: 'Blanc/noir, premium, lifestyle', en: 'Black & white, premium, lifestyle' },
    preview: P('1483985988355-763728e1935b'),
    apply: { template: 'minimal-creator', style: 'minimal', layout: 'frame', font: 'neutral', btnStyle: 'outline', bgType: 'image', bgImage: U('1483985988355-763728e1935b'), overlay: 0.45, text: 'light', accent: '#FFFFFF' },
  },
  {
    key: 'fan-hub', persona: 'creator', name: 'Fan Hub', desc: { fr: 'Émotionnel, communauté, tips en avant', en: 'Emotional, community, tips first' },
    preview: P('1459749411175-04bf5292ceea'),
    apply: { template: 'fan-hub', style: 'clean', layout: 'fullbleed', font: 'modern', btnStyle: 'solid', bgType: 'image', bgImage: U('1459749411175-04bf5292ceea'), overlay: 0.45, text: 'light', accent: '#F7C948' },
  },
  // 🍸 Hospitality
  {
    key: 'cocktail-dark', persona: 'bar', name: 'Cocktail Dark', desc: { fr: 'Noir, premium, nightlife', en: 'Dark, premium, nightlife' },
    preview: P('1514362545857-3bc16c4c7d1b'),
    apply: { template: 'cocktail-dark', style: 'premium', layout: 'magazine', font: 'elegant', btnStyle: 'solid', bgType: 'image', bgImage: U('1514362545857-3bc16c4c7d1b'), overlay: 0.55, text: 'light', accent: '#F7C948' },
  },
  {
    key: 'sunny-cafe', persona: 'bar', name: 'Sunny Café', desc: { fr: 'Clair, chaleureux, brunch', en: 'Bright, warm, brunch' },
    preview: P('1559925393-8be0ec4767c8'),
    apply: { template: 'sunny-cafe', style: 'clean', layout: 'cover', font: 'modern', btnStyle: 'solid', bgType: 'image', bgImage: U('1559925393-8be0ec4767c8'), overlay: 0.35, text: 'light', accent: '#EF5A4C' },
  },
  {
    key: 'event-mode', persona: 'bar', name: 'Event Mode', desc: { fr: 'DJ / events, agenda + réservation', en: 'DJ / events, agenda + booking' },
    preview: P('1492684223066-81342ee5ff30'),
    apply: { template: 'event-mode', style: 'brutalist', layout: 'fullbleed', font: 'grotesque', btnStyle: 'hard', bgType: 'image', bgImage: U('1492684223066-81342ee5ff30'), overlay: 0.45, text: 'light', accent: '#F0426B' },
  },
  // 💼 Freelance
  {
    key: 'clean-pro', persona: 'freelance', name: 'Clean Pro', desc: { fr: 'Ultra clean, Apple-like, premium', en: 'Ultra clean, Apple-like, premium' },
    preview: P('1517048676732-d65bc937f952'),
    apply: { template: 'clean-pro', style: 'minimal', layout: 'cover', font: 'neutral', btnStyle: 'outline', bgType: 'image', bgImage: U('1517048676732-d65bc937f952'), overlay: 0.4, text: 'light', accent: '#FFFFFF' },
  },
  {
    key: 'creative-studio', persona: 'freelance', name: 'Creative Studio', desc: { fr: 'Designer/dev, artistique', en: 'Designer/dev, artistic' },
    preview: P('1558655146-9f40138edfeb'),
    apply: { template: 'creative-studio', style: 'clean', layout: 'magazine', font: 'modern', btnStyle: 'solid', bgType: 'image', bgImage: U('1558655146-9f40138edfeb'), overlay: 0.4, text: 'light', accent: '#F7C948' },
  },
  {
    key: 'consultant', persona: 'freelance', name: 'Consultant', desc: { fr: 'Corporate, conversion, RDV', en: 'Corporate, conversion, booking' },
    preview: P('1497215728101-856f4ea42174'),
    apply: { template: 'consultant', style: 'premium', layout: 'cover', font: 'elegant', btnStyle: 'solid', bgType: 'image', bgImage: U('1497215728101-856f4ea42174'), overlay: 0.5, text: 'light', accent: '#38BDF8' },
  },

  // ✨ PREMIUM (Creator/Pro) — ambiances vivantes · 3 par catégorie
  // 🎥 Creator
  {
    key: 'fanhub-live', persona: 'creator', premium: true, name: 'Fan Hub Live', desc: { fr: 'Concert vivant · pulsations lumineuses', en: 'Live concert · light pulses' },
    preview: P('1514525253161-7a46d19cd819'),
    apply: { template: 'fanhub-live', style: 'clean', layout: 'fullbleed', font: 'modern', btnStyle: 'bubble', bgType: 'image', bgImage: U('1514525253161-7a46d19cd819'), overlay: 0.5, text: 'light', accent: '#F0426B', animation: 'none', bgVideo: 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium/Premium%20Createur/fd226439-0e1f-4889-a6f7-cecba77e771a-1-1.1-invideo-kling_25.mp4' },
  },
  {
    key: 'aura-live', persona: 'creator', premium: true, name: 'Aura Live', desc: { fr: 'Dégradé abstrait qui respire', en: 'Breathing abstract gradient' },
    preview: P('1550684376-efcbd6e3f031'),
    apply: { template: 'aura-live', style: 'clean', layout: 'spotlight', font: 'modern', btnStyle: 'bubble', bgType: 'gradient', gradFrom: '#7C3AED', gradTo: '#22D3EE', gradAngle: 135, text: 'light', accent: '#F472B6', animation: 'none', bgVideo: 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium/Premium%20Createur/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-4-4.1-invideo-seedance_2_0.mp4' },
  },
  {
    key: 'neon-creator', persona: 'creator', premium: true, name: 'Neon Studio', desc: { fr: 'Néon · lumière qui balaie', en: 'Neon · sweeping light' },
    preview: P('1492684223066-81342ee5ff30'),
    apply: { template: 'neon-creator', style: 'premium', layout: 'magazine', font: 'modern', btnStyle: 'bubble', bgType: 'image', bgImage: U('1492684223066-81342ee5ff30'), overlay: 0.5, text: 'light', accent: '#22D3EE', animation: 'none', bgVideo: 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium/Premium%20Createur/56d5bd7f-9154-414f-a051-5bb904c0f8a6-2-3.1-invideo-seedance_2_0.mp4' },
  },
  // 🍽️ Établissement
  {
    key: 'cocktail-live', persona: 'bar', premium: true, name: 'Cocktail Live', desc: { fr: 'Bar premium · lumière qui bouge', en: 'Premium bar · moving light' },
    preview: P('1514362545857-3bc16c4c7d1b'),
    apply: { template: 'cocktail-live', style: 'premium', layout: 'magazine', font: 'elegant', btnStyle: 'solid', bgType: 'image', bgImage: U('1514362545857-3bc16c4c7d1b'), overlay: 0.55, text: 'light', accent: '#F7C948', animation: 'none', bgVideo: 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium/Premium%20Etablissement/fd226439-0e1f-4889-a6f7-cecba77e771a-2-2.1-invideo-kling_v3_video.mp4' },
  },
  {
    key: 'nightclub-live', persona: 'bar', premium: true, name: 'Nightclub', desc: { fr: 'Nightlife · pulsations', en: 'Nightlife · pulses' },
    preview: P('1514933651103-005eec06c04b'),
    apply: { template: 'nightclub-live', style: 'clean', layout: 'fullbleed', font: 'grotesque', btnStyle: 'bubble', bgType: 'image', bgImage: U('1514933651103-005eec06c04b'), overlay: 0.5, text: 'light', accent: '#F0426B', animation: 'none', bgVideo: 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium/Premium%20Etablissement/4fd81e08-facb-4b26-84a9-c82c8b532be2-2-1.2-invideo-seedance_2_0.mp4' },
  },
  {
    key: 'lounge-live', persona: 'bar', premium: true, name: 'Restaurant', desc: { fr: 'Ambiance restaurant premium', en: 'Premium restaurant ambiance' },
    preview: P('1551024601-bec78aea704b'),
    apply: { template: 'lounge-live', style: 'premium', layout: 'cover', font: 'elegant', btnStyle: 'solid', bgType: 'image', bgImage: U('1551024601-bec78aea704b'), overlay: 0.5, text: 'light', accent: '#F59E0B', animation: 'none', bgVideo: 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium/Premium%20Etablissement/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-2-2.1-invideo-seedance_2_0.mp4' },
  },
  // 💼 Freelance
  {
    key: 'studio-live', persona: 'freelance', premium: true, name: 'Studio Live', desc: { fr: 'Créatif · respiration douce', en: 'Creative · soft breathing' },
    preview: P('1558655146-9f40138edfeb'),
    apply: { template: 'studio-live', style: 'clean', layout: 'magazine', font: 'modern', btnStyle: 'bubble', bgType: 'image', bgImage: U('1558655146-9f40138edfeb'), overlay: 0.45, text: 'light', accent: '#F472B6', animation: 'none', bgVideo: 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium/Premium%20Freelance/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-1-1.1-invideo-seedance_2_0.mp4' },
  },
  {
    key: 'office-live', persona: 'freelance', premium: true, name: 'Office Live', desc: { fr: 'Corporate · lumière qui balaie', en: 'Corporate · sweeping light' },
    preview: P('1497215728101-856f4ea42174'),
    apply: { template: 'office-live', style: 'premium', layout: 'cover', font: 'elegant', btnStyle: 'solid', bgType: 'image', bgImage: U('1497215728101-856f4ea42174'), overlay: 0.5, text: 'light', accent: '#38BDF8', animation: 'none', bgVideo: 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium/Premium%20Freelance/b9861429-b87f-4c9d-bc04-0edc89cd21f3-1-1.1-invideo-seedance_2_0.mp4' },
  },
  {
    key: 'focus-live', persona: 'freelance', premium: true, name: 'Artist', desc: { fr: 'Immersif, créatif', en: 'Immersive, creative' },
    preview: P('1497032628192-86f99bcd76bc'),
    apply: { template: 'focus-live', style: 'clean', layout: 'fullbleed', font: 'modern', btnStyle: 'bubble', bgType: 'image', bgImage: U('1497032628192-86f99bcd76bc'), overlay: 0.5, text: 'light', accent: '#2547D0', animation: 'none', bgVideo: 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium/Premium%20Freelance/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-3-3.1-invideo-seedance_2_0.mp4' },
  },
]

export const PERSONAS = [
  { key: 'creator', label: { fr: '🎥 Créateur', en: '🎥 Creator' } },
  { key: 'bar', label: { fr: '🍽️ Établissement', en: '🍽️ Venue' } },
  { key: 'freelance', label: { fr: '💼 Freelance', en: '💼 Freelance' } },
]
