// Analytics produit (PostHog) — RGPD : ne démarre QUE si la clé est définie ET que
// l'utilisateur a donné son consentement (opt-in via le bandeau cookies).
// posthog-js est chargé en import dynamique : il ne pèse rien dans le bundle
// initial et n'est téléchargé qu'au moment où le consentement est accordé.
const KEY = import.meta.env.VITE_POSTHOG_KEY
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com'
const CONSENT = 'bb_consent' // 'granted' | 'denied' | null

let started = false
let posthog = null // instance résolue après le chargement dynamique

export const analyticsAvailable = () => !!KEY
export function consentState() {
  try { return localStorage.getItem(CONSENT) } catch { return null }
}

async function initAnalytics() {
  if (started || !KEY) return
  started = true
  try {
    const mod = await import('posthog-js')
    posthog = mod.default
    posthog.init(KEY, {
      api_host: HOST,
      person_profiles: 'identified_only',
      capture_pageview: false, // on capture manuellement (SPA)
      capture_pageleave: true,
    })
    posthog.capture('$pageview')
  } catch {
    started = false // réseau KO : on retentera au prochain boot
  }
}

// Au démarrage de l'app : ne lance PostHog que si consentement déjà accordé.
export function bootAnalytics() {
  if (consentState() === 'granted') initAnalytics()
}
export function grantConsent() {
  try { localStorage.setItem(CONSENT, 'granted') } catch { /* noop */ }
  initAnalytics()
}
export function denyConsent() {
  try { localStorage.setItem(CONSENT, 'denied') } catch { /* noop */ }
}

export function capturePageview() { if (posthog) posthog.capture('$pageview') }
export function identifyUser(user) { if (posthog && user) posthog.identify(user.id, { email: user.email, plan: user.plan }) }
export function resetAnalytics() { if (posthog) posthog.reset() }
export function track(event, props) { if (posthog) posthog.capture(event, props) }
