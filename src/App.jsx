import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { useI18n } from './lib/i18n'
import { bootAnalytics, capturePageview } from './lib/analytics'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import PublicPage from './pages/PublicPage'
import Stats from './pages/Stats'
import TipSuccess from './pages/TipSuccess'
import BuySuccess from './pages/BuySuccess'
import Legal from './pages/Legal'
import SeoLanding from './pages/SeoLanding'
import Blog from './pages/Blog'
import { SEO_SLUGS } from './lib/seoContent'
import { CookieBanner } from './components/CookieBanner'

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
        <CookieBanner />
      </>
    )
  }

  return (
    <>
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
        <Route path="/:slug" element={<PublicPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
    </>
  )
}
