// Brouillon invité (guest onboarding) — relayé à travers le login via localStorage,
// comme `bb_profession` (les redirections OAuth externes perdent le state React).
// TTL 24 h : un brouillon oublié ne déclenche jamais de création fantôme plus tard.
const KEY = 'bb_draft'
const TTL = 24 * 60 * 60 * 1000

export function saveDraft(draft) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...draft, ts: Date.now() })) } catch { /* private mode */ }
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
