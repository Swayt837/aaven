// Thèmes & personnalisation des pages publiques.
// Un "theme" est un objet stocké sur la page :
//   { layout, bgType, bgColor, gradFrom, gradTo, gradAngle, bgImage, overlay, text, accent, preset }
import { modeOf } from './modes'

// ---------- Layouts (disposition de l'en-tête) ----------
// Dispositions = présentations premium de la photo de couverture.
export const LAYOUTS = [
  { key: 'cover', label: { fr: 'Cover', en: 'Cover' }, emoji: '🖼️' },
  { key: 'magazine', label: { fr: 'Magazine', en: 'Magazine' }, emoji: '📰' },
  { key: 'fullbleed', label: { fr: 'Immersif', en: 'Immersive' }, emoji: '🌅' },
  { key: 'frame', label: { fr: 'Polaroïd', en: 'Polaroid' }, emoji: '🪟' },
  { key: 'spotlight', label: { fr: 'Épuré', en: 'Spotlight' }, emoji: '⬤' },
]

// ---------- Presets couleur (solide) ----------
export const SOLID_THEMES = [
  { key: 'cream', name: { fr: 'Crème', en: 'Cream' }, bgColor: '#FAF6EE', text: 'dark', accent: '#EF5A4C' },
  { key: 'sun', name: { fr: 'Soleil', en: 'Sun' }, bgColor: '#F7C948', text: 'dark', accent: '#EF5A4C' },
  { key: 'rose', name: { fr: 'Rose', en: 'Rose' }, bgColor: '#FCE7EF', text: 'dark', accent: '#F0426B' },
  { key: 'lavender', name: { fr: 'Lavande', en: 'Lavender' }, bgColor: '#E8EDFC', text: 'dark', accent: '#2547D0' },
  { key: 'mint', name: { fr: 'Menthe', en: 'Mint' }, bgColor: '#D7F5E3', text: 'dark', accent: '#10B981' },
  { key: 'midnight', name: { fr: 'Minuit', en: 'Midnight' }, bgColor: '#111111', text: 'light', accent: '#F7C948' },
]

// ---------- Presets dégradé ----------
export const GRADIENT_THEMES = [
  { key: 'sunset', name: { fr: 'Sunset', en: 'Sunset' }, gradFrom: '#FF6B6B', gradTo: '#F7C948', gradAngle: 135, text: 'dark', accent: '#F0426B' },
  { key: 'ocean', name: { fr: 'Océan', en: 'Ocean' }, gradFrom: '#2547D0', gradTo: '#5EE7DF', gradAngle: 135, text: 'light', accent: '#F7C948' },
  { key: 'grape', name: { fr: 'Raisin', en: 'Grape' }, gradFrom: '#7C3AED', gradTo: '#F472B6', gradAngle: 135, text: 'light', accent: '#F7C948' },
  { key: 'flamingo', name: { fr: 'Flamant', en: 'Flamingo' }, gradFrom: '#F0426B', gradTo: '#FF8A5B', gradAngle: 135, text: 'light', accent: '#111111' },
  { key: 'forest', name: { fr: 'Forêt', en: 'Forest' }, gradFrom: '#065F46', gradTo: '#34D399', gradAngle: 135, text: 'light', accent: '#F7C948' },
  { key: 'noir', name: { fr: 'Noir', en: 'Dark' }, gradFrom: '#1f2937', gradTo: '#111111', gradAngle: 135, text: 'light', accent: '#EF5A4C' },
]

// ---------- Galerie d'images curées ----------
// kind: 'generated' (SVG local) | 'photo' (Unsplash). suggest = modes pour lesquels c'est joli.
const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`
export const IMAGE_THEMES = [
  { key: 'mesh-coral', src: '/themes/mesh-coral.svg', kind: 'generated', text: 'light', accent: '#fff', overlay: 0.05, suggest: ['creator'] },
  { key: 'mesh-ocean', src: '/themes/mesh-ocean.svg', kind: 'generated', text: 'light', accent: '#F7C948', overlay: 0.05, suggest: ['freelance'] },
  { key: 'mesh-grape', src: '/themes/mesh-grape.svg', kind: 'generated', text: 'light', accent: '#F7C948', overlay: 0.05, suggest: ['creator'] },
  { key: 'blob-mint', src: '/themes/blob-mint.svg', kind: 'generated', text: 'light', accent: '#111', overlay: 0.05, suggest: ['bar'] },
  { key: 'dots-sun', src: '/themes/dots-sun.svg', kind: 'generated', text: 'dark', accent: '#EF5A4C', overlay: 0, suggest: ['creator', 'bar'] },
  { key: 'confetti', src: '/themes/confetti.svg', kind: 'generated', text: 'dark', accent: '#F0426B', overlay: 0, suggest: ['creator'] },
  // Photos Unsplash (vérifiées) — ambiances par métier
  { key: 'cocktails', src: U('1551024601-bec78aea704b'), kind: 'photo', text: 'light', accent: '#F7C948', overlay: 0.45, suggest: ['bar'] },
  { key: 'bar-night', src: U('1514933651103-005eec06c04b'), kind: 'photo', text: 'light', accent: '#F7C948', overlay: 0.5, suggest: ['bar'] },
  { key: 'desk', src: U('1497366216548-37526070297c'), kind: 'photo', text: 'light', accent: '#F7C948', overlay: 0.45, suggest: ['freelance'] },
  { key: 'workspace', src: U('1497032628192-86f99bcd76bc'), kind: 'photo', text: 'light', accent: '#F7C948', overlay: 0.45, suggest: ['freelance'] },
  { key: 'neon', src: U('1492684223066-81342ee5ff30'), kind: 'photo', text: 'light', accent: '#F7C948', overlay: 0.4, suggest: ['creator'] },
  { key: 'mountains', src: U('1470225620780-dba8ba36b745'), kind: 'photo', text: 'light', accent: '#F7C948', overlay: 0.4, suggest: ['creator'] },
  { key: 'gradient-room', src: U('1557804506-669a67965ba0'), kind: 'photo', text: 'light', accent: '#111', overlay: 0.3, suggest: ['creator', 'freelance'] },
  { key: 'plants', src: U('1486312338219-ce68d2c6f44d'), kind: 'photo', text: 'dark', accent: '#10B981', overlay: 0.2, suggest: ['freelance'] },
]

// ---------- Thème par défaut selon le mode ----------
export function defaultTheme(mode) {
  const m = modeOf(mode)
  return {
    preset: 'mode',
    template: '',
    style: 'brutalist',
    font: 'grotesque',
    btnStyle: 'hard',
    layout: 'spotlight',
    bgType: 'solid',
    bgColor: m.cardBg,
    gradFrom: '#FF6B6B',
    gradTo: '#F7C948',
    gradAngle: 135,
    bgImage: '',
    overlay: 0.35,
    // Cadrage de l'image de fond et de la photo de profil (position % + zoom)
    bgPosX: 50,
    bgPosY: 50,
    bgZoom: 1,
    avPosX: 50,
    avPosY: 50,
    avZoom: 1,
    text: 'dark',
    accent: m.accent,
    showSupporters: false,
    tipAmounts: [3, 5, 10, 20],
    // Premium (Creator/Pro) : ambiance vivante
    animation: 'none', // none | breathe | pulse | shimmer (ambiance discrète)
    introVideo: '', // clip cinématique joué 1 fois puis figé sur l'image
    bgVideo: '',
    bgVideoOwn: false, // true = vidéo importée par l'utilisateur (recadrable), false = vidéo de template
    ambientAudio: '',
  }
}

// Fusionne le thème stocké (potentiellement partiel/null) avec le défaut du mode.
export function getTheme(page) {
  if (!page) return defaultTheme('creator')
  return { ...defaultTheme(page.mode), ...(page.theme || {}) }
}

// ---------- Helpers de rendu ----------
function esc(url) {
  return String(url || '').replace(/["\\]/g, '')
}

// Style CSS du fond plein écran de la page.
export function backgroundStyle(theme) {
  if (theme.bgType === 'image' && theme.bgImage) {
    return {
      backgroundImage: `url("${esc(theme.bgImage)}")`,
      backgroundSize: 'cover',
      backgroundPosition: `${theme.bgPosX ?? 50}% ${theme.bgPosY ?? 50}%`,
      backgroundRepeat: 'no-repeat',
    }
  }
  if (theme.bgType === 'gradient') {
    return { backgroundImage: `linear-gradient(${theme.gradAngle || 135}deg, ${theme.gradFrom}, ${theme.gradTo})` }
  }
  return { background: theme.bgColor }
}

// Style d'une mini-vignette (galerie / aperçu).
export function thumbStyle(theme) {
  return backgroundStyle(theme)
}

export const isLight = (theme) => theme.text === 'light'
export const textColor = (theme) => (theme.text === 'light' ? '#FFFFFF' : '#111111')
