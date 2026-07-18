// Brouillon invité (guest onboarding + éditeur invité) — relayé à travers le login
// via localStorage, comme `bb_profession` (les redirections OAuth externes perdent
// le state React). TTL 24 h : un brouillon oublié ne déclenche jamais de création
// fantôme plus tard.
//
// v2 : en plus des métadonnées (title/headline/bio/mode/profession/goal), le
// brouillon peut porter `page` (objet page local complet, thème et avatar en
// data-URL inclus) et `buttons` (liste locale) — les personnalisations faites
// dans l'éditeur invité, rejouées sur le serveur après la connexion.
import { professionBySlug } from './professions'
import { themeForProfession, blockToButton, SOCIAL_BUTTON_TYPES, modeForCategory } from './professionEngine'
import { PRESETS, BUTTON_TYPES } from './modes'

const KEY = 'bb_draft'
const TTL = 24 * 60 * 60 * 1000

// → true si sauvegardé, false si quota dépassé (image trop lourde) / stockage bloqué.
export function saveDraft(draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, ts: Date.now() }))
    return true
  } catch {
    return false
  }
}

export function readDraft() {
  let d = null
  try { d = JSON.parse(localStorage.getItem(KEY) || 'null') } catch { /* corrompu */ }
  if (d && d.title && Date.now() - (d.ts || 0) < TTL) return d
  if (d) clearDraft() // expiré ou invalide → on nettoie
  return null
}

export function clearDraft() {
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}

// Dérive la page + les boutons d'un brouillon, avec les MÊMES règles que le
// serveur à la création (Profession Engine) : thème du métier, boutons des
// template_blocks (réseaux sociaux exclus, 1er mis en avant) ; repli sur le
// preset du mode générique. Si le brouillon porte déjà des personnalisations
// (`page`/`buttons` de l'éditeur invité), elles priment.
export function buildDraftPage(draft, lang = 'fr') {
  if (draft.page && draft.buttons) return { page: draft.page, buttons: draft.buttons }
  const prof = draft.profession ? professionBySlug(draft.profession) : null
  const mode = prof ? modeForCategory(prof.category) : draft.mode
  const page = {
    title: (draft.title || '').trim(),
    headline: (draft.headline || '').trim(),
    bio: (draft.bio || '').trim(),
    mode,
    slug: '',
    avatarUrl: '',
    theme: prof ? themeForProfession(prof) : {},
  }
  const blocks = prof
    ? prof.template_blocks.map(blockToButton).filter((b) => !SOCIAL_BUTTON_TYPES.has(b.type)).map((b, i) => ({ ...b, featured: i === 0 }))
    : (PRESETS[mode] || []).map((p) => ({ type: p.type, label: BUTTON_TYPES[p.type].label[lang] || BUTTON_TYPES[p.type].label.fr, featured: !!p.featured }))
  const buttons = blocks.map((b, i) => ({
    id: 'g' + i,
    type: b.type,
    label: b.label,
    icon: BUTTON_TYPES[b.type]?.icon || 'Link',
    url: '',
    isActive: true,
    featured: b.featured,
    position: i,
    clicks: 0,
  }))
  return { page, buttons }
}
