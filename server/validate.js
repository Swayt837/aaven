// Validation / assainissement des entrées utilisateur.
// Objectif principal : empêcher les schémas d'URL dangereux (javascript:, data:,
// vbscript:) de finir dans les liens des pages publiques → faille XSS.

const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const ALLOWED_IMG_PROTOCOLS = new Set(['http:', 'https:'])

function hasScheme(s) {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s) || s.startsWith('//')
}

// Lien de bouton : http(s), mailto, tel. Schéma implicite → https. Sinon → ''.
export function sanitizeUrl(raw) {
  if (!raw || typeof raw !== 'string') return ''
  let s = raw.trim()
  if (!s) return ''
  if (!hasScheme(s)) s = 'https://' + s
  try {
    const u = new URL(s)
    if (!ALLOWED_LINK_PROTOCOLS.has(u.protocol)) return ''
    return u.href.slice(0, 2000)
  } catch {
    return ''
  }
}

// URL d'image (avatar / fond) : http(s) uniquement.
export function sanitizeImageUrl(raw) {
  if (!raw || typeof raw !== 'string') return ''
  let s = raw.trim()
  if (!s) return ''
  if (!hasScheme(s)) s = 'https://' + s
  try {
    const u = new URL(s)
    if (!ALLOWED_IMG_PROTOCOLS.has(u.protocol)) return ''
    return u.href.slice(0, 2000)
  } catch {
    return ''
  }
}

// Tronque proprement une chaîne (et garantit le type string).
export function clampStr(s, max) {
  if (s == null) return ''
  return String(s).slice(0, max)
}

// ---------- Thème de page ----------
const LAYOUTS = ['cover', 'magazine', 'fullbleed', 'frame', 'spotlight']
const BG_TYPES = ['solid', 'gradient', 'image']
const TEXT_MODES = ['dark', 'light']
const STYLES = ['brutalist', 'clean', 'minimal', 'premium']
const ANIMATIONS = ['none', 'breathe', 'pulse', 'shimmer']
const FONTS = ['grotesque', 'modern', 'neutral', 'elegant', 'rounded']
const BTN_STYLES = ['hard', 'solid', 'outline', 'pill', 'bubble', 'glass']
const hex = (c) => (typeof c === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : null)
const num = (v, def, min, max) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def
}

// Chemin d'image (fond ou avatar) : assets locaux (/uploads, /themes) ou URL http(s) assainie.
export function sanitizeAsset(v) {
  if (typeof v !== 'string') return ''
  if (/^\/(uploads|themes)\/[\w.\-]+$/.test(v)) return v.slice(0, 300)
  return sanitizeImageUrl(v)
}
const sanitizeBgImage = sanitizeAsset

export function sanitizeTheme(input) {
  const th = input && typeof input === 'object' ? input : {}
  return {
    preset: clampStr(th.preset, 40),
    template: clampStr(th.template, 40),
    style: STYLES.includes(th.style) ? th.style : 'brutalist',
    font: FONTS.includes(th.font) ? th.font : 'grotesque',
    btnStyle: BTN_STYLES.includes(th.btnStyle) ? th.btnStyle : 'hard',
    layout: LAYOUTS.includes(th.layout) ? th.layout : 'spotlight',
    bgType: BG_TYPES.includes(th.bgType) ? th.bgType : 'solid',
    bgColor: hex(th.bgColor) || '#FAF6EE',
    gradFrom: hex(th.gradFrom) || '#FF6B6B',
    gradTo: hex(th.gradTo) || '#F7C948',
    gradAngle: num(th.gradAngle, 135, 0, 360),
    bgImage: sanitizeBgImage(th.bgImage),
    overlay: num(th.overlay, 0.35, 0, 0.8),
    bgPosX: num(th.bgPosX, 50, 0, 100),
    bgPosY: num(th.bgPosY, 50, 0, 100),
    bgZoom: num(th.bgZoom, 1, 1, 4),
    avPosX: num(th.avPosX, 50, 0, 100),
    avPosY: num(th.avPosY, 50, 0, 100),
    avZoom: num(th.avZoom, 1, 1, 4),
    text: TEXT_MODES.includes(th.text) ? th.text : 'dark',
    accent: hex(th.accent) || '#EF5A4C',
    showSupporters: th.showSupporters === true,
    tipAmounts: sanitizeAmounts(th.tipAmounts),
    animation: ANIMATIONS.includes(th.animation) ? th.animation : 'none',
    introVideo: sanitizeAsset(th.introVideo),
    bgVideo: sanitizeAsset(th.bgVideo),
    bgVideoOwn: th.bgVideoOwn === true,
    ambientAudio: sanitizeAsset(th.ambientAudio),
  }
}

// Montants de tip suggérés : 1 à 4 entiers (1–100000).
function sanitizeAmounts(v) {
  const def = [3, 5, 10, 20]
  if (!Array.isArray(v)) return def
  const out = v
    .map((n) => Math.round(Number(n)))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 100000)
    .slice(0, 4)
  return out.length ? out : def
}
