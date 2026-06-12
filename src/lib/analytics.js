import posthog from 'posthog-js'

// Analytics produit (PostHog) — RGPD : ne démarre QUE si la clé est définie ET que
// l'utilisateur a donné son consentement (opt-in via le bandeau cookies).
const KEY = import.meta.env.VITE_POSTHOG_KEY
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com'
const CONSENT = 'bb_consent' // 'granted' | 'denied' | null

let started = false

export const analyticsAvailable = () => !!KEY
export function consentState() {
  try { return localStorage.getItem(CONSENT) } catch { return null }
}

function initAnalytics() {
  if (started || !KEY) return
  started = true
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // on capture manuellement (SPA)
    capture_pageleave: true,
  })
  posthog.capture('$pageview')
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

export function capturePageview() { if (started) posthog.capture('$pageview') }
export function identifyUser(user) { if (started && user) posthog.identify(user.id, { email: user.email, plan: user.plan }) }
export function resetAnalytics() { if (started) posthog.reset() }
export function track(event, props) { if (started) posthog.capture(event, props) }
