import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { useI18n } from './lib/i18n'
import { bootAnalytics, capturePageview } from './lib/analytics'
// Chemins chauds chargés en dur : la landing ("/") et la page publique
// (aaven.fr/slug, ce que scannent les visiteurs) doivent s'afficher sans
// aller-retour réseau supplémentaire.
import Landing from './pages/Landing'
import PublicPage from './pages/PublicPage'
// Tout le reste est découpé en chunks chargés à la demande (React.lazy) :
// un visiteur de la landing ne télécharge plus le Dashboard, l'Éditeur, etc.
const Login = lazy(() => import('./pages/Login'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Editor = lazy(() => import('./pages/Editor'))
const Stats = lazy(() => import('./pages/Stats'))
const TipSuccess = lazy(() => import('./pages/TipSuccess'))
const BuySuccess = lazy(() => import('./pages/BuySuccess'))
const Legal = lazy(() => import('./pages/Legal'))
const SeoLanding = lazy(() => import('./pages/SeoLanding'))
const ProfessionLanding = lazy(() => import('./pages/ProfessionLanding'))
const Blog = lazy(() => import('./pages/Blog'))
import { SEO_SLUGS } from './lib/seoContent'
import { PROFESSION_SLUGS } from './lib/professions'
import { CookieBanner } from './components/CookieBanner'
import { Toasts } from './components/Toast'

function Protected({ children }) {
  const { user, loading } = useAuth()
  const { t } = useI18n()
  const loc = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center font-display text-xl">{t('common.loading')}</div>
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  return children
}

export default function App() {
  const loc = useLocation()
  useEffect(() => { bootAnalytics() }, [])
  useEffect(() => { capturePageview() }, [loc.pathname])

  // Sous-domaine vanity Pro (marie.aaven.fr) : le serveur injecte window.__AAVEN_SUB__
  // → toute l'app rend la page publique de ce slug, quel que soit le chemin.
  const forcedSub = typeof window !== 'undefined' ? window.__AAVEN_SUB__ : null
  if (forcedSub) {
    return (
      <>
        <Routes>
          <Route path="*" element={<PublicPage slug={forcedSub} />} />
        </Routes>
        <Toasts />
        <CookieBanner />
      </>
    )
  }

  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-brand-cream" aria-busy="true" />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/edit/:slug" element={<Protected><Editor /></Protected>} />
          <Route path="/stats/:slug" element={<Protected><Stats /></Protected>} />
          <Route path="/tip-success" element={<TipSuccess />} />
          <Route path="/buy-success" element={<BuySuccess />} />
          <Route path="/legal/:doc" element={<Legal />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Blog />} />
          {SEO_SLUGS.map((s) => (
            <Route key={s} path={`/${s}`} element={<SeoLanding slug={s} />} />
          ))}
          {PROFESSION_SLUGS.map((s) => (
            <Route key={s} path={`/${s}`} element={<ProfessionLanding slug={s} />} />
          ))}
          <Route path="/:slug" element={<PublicPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toasts />
      <CookieBanner />
    </>
  )
}
