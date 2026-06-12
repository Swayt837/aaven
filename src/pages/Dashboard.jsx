import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Header } from '../components/Header'
import { Button, Card } from '../components/ui'
import { Avatar } from '../components/PhoneMockup'
import { ShareLink } from '../components/ShareLink'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { modeOf } from '../lib/modes'
import { track } from '../lib/analytics'

const FEE_LABEL = { free: '5%', creator: '1%', pro: '0%' }

export default function Dashboard() {
  const { t, lang } = useI18n()
  const { user, refresh } = useAuth()
  const nav = useNavigate()
  const [pages, setPages] = useState(null)
  const [connect, setConnect] = useState(null)
  const [connecting, setConnecting] = useState(false)

  async function load() {
    const { pages } = await api.myPages()
    setPages(pages)
  }
  useEffect(() => {
    load()
    refresh() // récupère le plan à jour (retour de Checkout)
    api.connectStatus().then(setConnect).catch(() => {})
  }, [refresh])

  const plan = user?.plan || 'free'
  async function upgrade(p) {
    track('upgrade_clicked', { plan: p, source: 'dashboard' })
    try {
      const r = await api.billingCheckout(p)
      if (r.url) { track('checkout_started', { plan: p }); window.location.href = r.url }
      else await refresh()
    } catch (e) {
      alert(e.message)
    }
  }
  async function manage() {
    try {
      const r = await api.billingPortal()
      if (r.url) window.location.href = r.url
      else { await api.billingDowngrade(); await refresh() } // démo : repasse en Free
    } catch (e) {
      alert(e.message)
    }
  }

  async function startConnect() {
    setConnecting(true)
    try {
      const r = await api.connectStart()
      if (r.url) window.location.href = r.url
      else setConnect({ demo: true, connected: true, payoutsEnabled: true })
    } catch (e) {
      alert(e.message)
    } finally {
      setConnecting(false)
    }
  }

  async function remove(slug) {
    if (!confirm(t('dash.delete.confirm'))) return
    await api.deletePage(slug)
    load()
  }

  return (
    <div className="min-h-screen bg-cream" style={{ background: 'radial-gradient(110% 60% at 85% -5%, #FFF1EC 0%, transparent 55%), radial-gradient(90% 50% at 0% 0%, #FBFCEB 0%, transparent 50%), #F7F7F5' }}>
      <Header variant="dashboard" />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm font-extrabold uppercase tracking-widest text-coral">{t('dash.eyebrow')}</p>
            <h1 className="font-display mt-1 text-4xl">{t('dash.title')}</h1>
          </div>
          <Button onClick={() => nav('/onboarding')}>{t('dash.new')}</Button>
        </div>

        {/* Plan / abonnement */}
        <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5" style={plan !== 'free' ? { background: '#F7C948' } : undefined}>
          <div>
            <h2 className="font-display text-lg font-extrabold">{t('plan.title')}</h2>
            <p className="mt-0.5 text-sm font-medium text-ink/60">
              {t('plan.current')} : <b className="uppercase">{plan}</b> · {t('plan.fee')} {FEE_LABEL[plan]}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan === 'free' && <Button size="sm" onClick={() => upgrade('creator')}>{t('plan.upgradeCreator')}</Button>}
            {plan !== 'pro' && <Button size="sm" variant={plan === 'free' ? 'secondary' : 'primary'} onClick={() => upgrade('pro')}>{t('plan.upgradePro')}</Button>}
            {plan !== 'free' && <Button size="sm" variant="secondary" onClick={manage}>{t('plan.manage')}</Button>}
          </div>
        </Card>

        {/* Paiements (Stripe Connect) */}
        {connect && (
          <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5" style={connect.payoutsEnabled ? { background: '#D7F5E3' } : undefined}>
            <div>
              <h2 className="font-display text-lg font-extrabold">{t('connect.title')}</h2>
              <p className="mt-0.5 text-sm font-medium text-ink/60">
                {connect.demo ? t('connect.demo') : connect.payoutsEnabled ? t('connect.connected') : t('connect.desc')}
              </p>
            </div>
            {!connect.demo && !connect.payoutsEnabled && (
              <Button onClick={startConnect} disabled={connecting}>
                {connecting ? t('common.loading') : connect.connected ? t('connect.finish') : t('connect.cta')}
              </Button>
            )}
          </Card>
        )}

        {pages === null ? (
          <p className="mt-10 font-display text-xl text-ink/50">{t('common.loading')}</p>
        ) : pages.length === 0 ? (
          <Card className="mt-10 p-10 text-center">
            <div className="text-5xl">📭</div>
            <h2 className="font-display mt-3 text-2xl">{t('dash.empty.title')}</h2>
            <p className="mt-1 font-medium text-ink/60">{t('dash.empty.sub')}</p>
            <Button className="mt-5" onClick={() => nav('/onboarding')}>{t('dash.new')}</Button>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {pages.map((p) => {
              const m = modeOf(p.mode)
              return (
                <Card key={p.id} className="relative p-5">
                  <span
                    className="absolute right-3 top-3 rounded-full border-2 border-ink px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wide"
                    style={{ background: m.badgeBg }}
                  >
                    {m.label[lang] || m.label.fr}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="overflow-hidden rounded-brutal border-2 border-ink" style={{ background: '#FCE7EF' }}>
                      <div className="grid h-14 w-14 place-items-center text-2xl">
                        {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="h-14 w-14 object-cover" /> : (p.emoji || '👤')}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display truncate text-lg font-extrabold">{p.title}</h3>
                      <p className="truncate text-sm font-medium text-ink/60">/{p.slug} · {p.views} {t('dash.views')}</p>
                    </div>
                  </div>

                  <ShareLink url={`${window.location.origin}/${p.slug}`} className="mt-4" />

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <Button as={Link} to={`/edit/${p.slug}`} variant="secondary" size="sm">{t('dash.edit')}</Button>
                    <Button as={Link} to={`/stats/${p.slug}`} variant="secondary" size="sm">{t('dash.stats')}</Button>
                    <Button as="a" href={`/${p.slug}`} target="_blank" rel="noreferrer" variant="dark" size="sm">{t('dash.see')}</Button>
                    <Button variant="danger" size="sm" onClick={() => remove(p.slug)} aria-label={t('common.delete')}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
