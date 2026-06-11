import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Eye, MousePointerClick, Percent, MessageSquare, Heart, ShoppingBag } from 'lucide-react'
import { Header } from '../components/Header'
import { Button, Card } from '../components/ui'
import { Icon } from '../components/Icon'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'

export default function Stats() {
  const { slug } = useParams()
  const { t } = useI18n()
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [tips, setTips] = useState([])
  const [replies, setReplies] = useState({})

  useEffect(() => {
    api.stats(slug).then(setData).catch(() => nav('/dashboard'))
    api.messages(slug).then((r) => setMsgs(r.messages || [])).catch(() => {})
    api.tips(slug).then((r) => setTips(r.tips || [])).catch(() => {})
  }, [slug, nav])

  async function sendReply(id) {
    const reply = (replies[id] || '').trim()
    if (!reply) return
    try {
      const { tip } = await api.replyTip(slug, id, reply)
      setTips((ts) => ts.map((x) => (x.id === id ? { ...x, reply: tip.reply } : x)))
      setReplies((r) => ({ ...r, [id]: '' }))
    } catch (e) {
      alert(e.message)
    }
  }

  if (!data) return <div className="grid min-h-screen place-items-center font-display text-xl">{t('common.loading')}</div>

  const { views, totalClicks, buttons } = data
  const ctr = views > 0 ? Math.round((totalClicks / views) * 100) : 0
  const max = Math.max(1, ...buttons.map((b) => b.clicks))
  const eur = (n) => (Number.isInteger(n) ? n : Number(n).toFixed(2))

  return (
    <div className="min-h-screen bg-cream">
      <Header variant="dashboard" />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-sm font-extrabold uppercase tracking-widest text-coral">{t('stats.eyebrow')}</p>
            <h1 className="font-display mt-1 text-4xl">{t('stats.title')}</h1>
            <p className="mt-1 font-medium text-ink/60">/{slug}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => nav(`/edit/${slug}`)}>{t('edit.dashboard')}</Button>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Kpi icon={<Eye size={22} className="text-blue-600" />} label={t('stats.views')} value={views} />
          <Kpi icon={<MousePointerClick size={22} className="text-pink" />} label={t('stats.clicks')} value={totalClicks} />
          <Kpi icon={<Percent size={22} className="text-coral" />} label={t('stats.ctr')} value={`${ctr}%`} />
          <Kpi icon={<MessageSquare size={22} className="text-green-600" />} label={t('stats.messages')} value={data.messages ?? msgs.length} />
        </div>

        {/* Recettes : tips + ventes de produits digitaux */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Kpi icon={<Heart size={22} className="text-coral" fill="#EF5A4C" />} label={t('stats.tipsRevenue')} value={`${eur(data.tipsRevenue ?? 0)}€`} sub={`${data.tipsCount ?? 0} ${t('stats.tipsUnit')}`} />
          <Kpi icon={<ShoppingBag size={22} className="text-ink" />} label={t('stats.productsRevenue')} value={`${eur(data.productsRevenue ?? 0)}€`} sub={`${data.productsCount ?? 0} ${t('stats.salesUnit')}`} />
        </div>

        <Card className="mt-6 p-6">
          <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">{t('stats.perButton')}</h2>
          {totalClicks === 0 ? (
            <p className="mt-4 font-medium text-ink/50">{t('stats.noData')}</p>
          ) : (
            <div className="mt-5 space-y-4">
              {buttons.map((b) => (
                <div key={b.id}>
                  <div className="mb-1 flex items-center justify-between text-sm font-bold">
                    <span className="flex items-center gap-2"><Icon name={b.icon} size={15} /> {b.label}</span>
                    <span>{b.clicks}</span>
                  </div>
                  <div className="h-7 w-full overflow-hidden rounded-lg border-2 border-ink bg-white">
                    <div
                      className="h-full rounded-r-md"
                      style={{ width: `${(b.clicks / max) * 100}%`, background: '#EF5A4C', minWidth: b.clicks ? '6px' : 0 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Boîte de réception : messages du formulaire de contact */}
        <Card className="mt-6 p-6">
          <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">{t('stats.inbox')}</h2>
          {msgs.length === 0 ? (
            <p className="mt-4 font-medium text-ink/50">{t('stats.noMsg')}</p>
          ) : (
            <div className="mt-5 space-y-3">
              {msgs.map((m) => (
                <div key={m.id} className="rounded-brutal border-2 border-ink bg-white p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="font-display text-sm font-extrabold">
                      {m.name || t('stats.anon')}
                      {m.email ? <a href={`mailto:${m.email}`} className="ml-2 font-semibold text-coral underline">{m.email}</a> : null}
                    </span>
                    <span className="text-xs font-semibold text-ink/50">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  {m.subject ? <p className="mt-1 text-xs font-bold uppercase tracking-wide text-ink/50">{m.subject}</p> : null}
                  <p className="mt-1.5 whitespace-pre-wrap text-sm font-medium text-ink/80">{m.body}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Soutiens reçus + réponse du créateur */}
        <Card className="mt-6 p-6">
          <h2 className="font-display flex items-center gap-2 text-lg font-extrabold uppercase tracking-wide">
            <Heart size={18} className="text-coral" fill="#EF5A4C" /> {t('stats.tips')}
          </h2>
          {tips.length === 0 ? (
            <p className="mt-4 font-medium text-ink/50">{t('stats.noTips')}</p>
          ) : (
            <div className="mt-5 space-y-3">
              {tips.map((tp) => (
                <div key={tp.id} className="rounded-brutal border-2 border-ink bg-white p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="font-display text-sm font-extrabold">
                      {tp.name || t('stats.anon')} · <span className="text-coral">{tp.amount}€</span>
                    </span>
                    <span className="text-xs font-semibold text-ink/50">{new Date(tp.createdAt).toLocaleDateString()}</span>
                  </div>
                  {tp.message ? <p className="mt-1.5 whitespace-pre-wrap text-sm font-medium text-ink/80">{tp.message}</p> : null}
                  {tp.reply ? (
                    <p className="mt-2 rounded-lg bg-cream px-3 py-2 text-sm font-semibold text-ink/70">↳ {tp.reply} <span className="text-green-700">{t('stats.replied')}</span></p>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={replies[tp.id] || ''}
                        onChange={(e) => setReplies((r) => ({ ...r, [tp.id]: e.target.value }))}
                        placeholder={t('stats.replyPh')}
                        maxLength={280}
                        className="min-w-0 flex-1 rounded-lg border-2 border-ink px-3 py-1.5 text-sm"
                      />
                      <Button size="sm" onClick={() => sendReply(tp.id)} disabled={!(replies[tp.id] || '').trim()}>{t('stats.send')}</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

function Kpi({ icon, label, value, sub }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-lg border-2 border-ink bg-white">{icon}</span>
        <span className="font-display text-xs font-extrabold uppercase tracking-wide text-ink/60">{label}</span>
      </div>
      <p className="font-display mt-3 text-4xl font-extrabold">{value}</p>
      {sub ? <p className="mt-1 text-xs font-semibold text-ink/50">{sub}</p> : null}
    </Card>
  )
}
