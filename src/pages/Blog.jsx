import { useEffect } from 'react'
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { track } from '../lib/analytics'
import { posts, getPost } from '../lib/blog'

function Chrome({ children, lang, onStart }) {
  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-ink antialiased">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 md:px-8">
        <Link to="/" className="font-sans text-xl font-bold tracking-[-0.04em]">Aaven</Link>
        <button onClick={onStart} className="rounded-full bg-brand-ink px-5 py-2.5 font-display text-sm font-extrabold text-white">{lang === 'en' ? 'Get started' : 'Commencer'}</button>
      </header>
      {children}
      <footer className="mt-16 border-t border-brand-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-8 md:px-8">
          <Link to="/blog" className="font-sans text-sm font-semibold text-brand-muted hover:text-brand-ink">Blog</Link>
          <p className="font-sans text-sm text-brand-muted">© 2026 Aaven</p>
        </div>
      </footer>
    </div>
  )
}

export default function Blog() {
  const { slug } = useParams()
  const { lang } = useI18n()
  const { user } = useAuth()
  const nav = useNavigate()
  const onStart = () => { track('cta_start', { source: 'blog' }); nav(user ? '/dashboard' : '/login') }
  const post = slug ? getPost(slug) : null

  useEffect(() => {
    document.title = post ? `${post.title} — Aaven` : (lang === 'en' ? 'Blog — Aaven' : 'Blog — Aaven')
  }, [post, lang])

  if (slug && !post) return <Navigate to="/blog" replace />

  // ---- Article ----
  if (post) {
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      datePublished: post.date || undefined,
      author: { '@type': 'Organization', name: 'Aaven' },
    }
    return (
      <Chrome lang={lang} onStart={onStart}>
        <main className="mx-auto max-w-3xl px-5 pb-12 md:px-8">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
          <Link to="/blog" className="inline-flex items-center gap-1 font-sans text-sm font-semibold text-brand-muted hover:text-brand-ink"><ArrowLeft size={15} /> Blog</Link>
          {post.date ? <p className="mt-6 font-sans text-sm font-semibold text-brand-muted">{new Date(post.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p> : null}
          <article
            className="mt-2 [&_a]:text-brand-coral [&_a]:underline [&_h1]:font-display [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:tracking-[-0.04em] [&_h1]:leading-[1.05] [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-extrabold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-extrabold [&_p]:mt-4 [&_p]:text-brand-muted [&_p]:leading-relaxed [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-brand-muted [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-brand-muted [&_li]:mt-1.5 [&_strong]:text-brand-ink"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
          <div className="mt-12 rounded-[24px] border-2 border-brand-ink bg-brand-ink px-6 py-10 text-center text-white">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">{lang === 'en' ? 'Create your Aaven page' : 'Crée ta page Aaven'}</h2>
            <button onClick={onStart} className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-coral px-7 py-3.5 font-display text-base font-extrabold text-white shadow-[5px_5px_0px_#D6FF00] transition-transform hover:-translate-y-0.5">
              {lang === 'en' ? 'Create my free page' : 'Créer ma page gratuite'} <ArrowRight size={18} strokeWidth={3} />
            </button>
          </div>
        </main>
      </Chrome>
    )
  }

  // ---- Index ----
  return (
    <Chrome lang={lang} onStart={onStart}>
      <main className="mx-auto max-w-3xl px-5 pb-12 md:px-8">
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Blog</h1>
        <p className="mt-3 font-sans text-lg text-brand-muted">{lang === 'en' ? 'Tips to grow and monetize your bio page.' : 'Conseils pour faire grandir et monétiser ta page bio.'}</p>
        <div className="mt-8 space-y-4">
          {posts.length === 0 ? (
            <p className="font-sans text-brand-muted">{lang === 'en' ? 'Coming soon.' : 'Bientôt.'}</p>
          ) : posts.map((p) => (
            <Link key={p.slug} to={`/blog/${p.slug}`} className="block rounded-[20px] border-2 border-brand-ink bg-white p-5 shadow-[4px_4px_0px_#0A0A0A] transition-transform hover:-translate-y-0.5">
              {p.date ? <p className="font-sans text-xs font-semibold uppercase tracking-wide text-brand-muted">{new Date(p.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p> : null}
              <h2 className="mt-1 font-display text-xl font-extrabold tracking-[-0.02em]">{p.title}</h2>
              {p.description ? <p className="mt-1.5 font-sans text-sm text-brand-muted">{p.description}</p> : null}
            </Link>
          ))}
        </div>
      </main>
    </Chrome>
  )
}
