import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Volume2, VolumeX } from 'lucide-react'
import { BioImmersive } from '../components/PhoneMockup'
import { TipModal } from '../components/TipModal'
import { ContactModal } from '../components/ContactModal'
import { ServicesModal } from '../components/ServicesModal'
import { ReservationModal } from '../components/ReservationModal'
import { QuoteModal } from '../components/QuoteModal'
import { LinksModal } from '../components/LinksModal'
import { EmbedModal } from '../components/EmbedModal'
import { NewsletterModal } from '../components/NewsletterModal'
import { ShareStory } from '../components/ShareStory'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'
import { connectorOf, embedUrl } from '../lib/connectors'
import { getTheme } from '../lib/themes'
import { toast } from '../components/Toast'

export default function PublicPage({ slug: slugProp }) {
  const params = useParams()
  const slug = slugProp || params.slug
  const { t } = useI18n()
  const nav = useNavigate()
  const [data, setData] = useState(undefined) // undefined=loading, null=404
  const [tip, setTip] = useState(false)
  const [contact, setContact] = useState(null) // bouton ayant déclenché le formulaire
  const [services, setServices] = useState(null) // bouton services ouvert
  const [reserve, setReserve] = useState(null) // bouton réservation (formulaire) ouvert
  const [quote, setQuote] = useState(null) // bouton devis express (formulaire) ouvert
  const [links, setLinks] = useState(null) // bouton multi-liens ouvert
  const [embed, setEmbed] = useState(null) // widget connecteur intégré ouvert
  const [newsletter, setNewsletter] = useState(null) // formulaire newsletter ouvert
  const [live, setLive] = useState(null) // { twitch: true, … } — badges LIVE des Smart Socials
  const [supporters, setSupporters] = useState(null)
  const [products, setProducts] = useState([])
  const [soundOn, setSoundOn] = useState(false)
  const audioRef = useRef(null)

  function toggleSound() {
    const a = audioRef.current
    if (!a) return
    if (a.paused) { a.play().then(() => setSoundOn(true)).catch(() => {}) }
    else { a.pause(); setSoundOn(false) }
  }

  useEffect(() => {
    api.publicPage(slug).then(setData).catch(() => setData(null))
    api.supporters(slug).then(setSupporters).catch(() => {})
    api.publicProducts(slug).then((r) => setProducts(r.products || [])).catch(() => {})
    api.liveStatus(slug).then((r) => setLive(r.live && Object.keys(r.live).length ? r.live : null)).catch(() => {})
  }, [slug])

  if (data === undefined) return <div className="grid min-h-screen place-items-center font-display text-xl">{t('common.loading')}</div>
  if (data === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-4 text-center">
        <div>
          <div className="text-6xl">🤷</div>
          <h1 className="font-display mt-3 text-3xl">404</h1>
          <button onClick={() => nav('/')} className="mt-4 font-bold underline">Aaven →</button>
        </div>
      </div>
    )
  }

  const { page, buttons } = data
  const theme = getTheme(page)

  async function handleClick(b) {
    // tracking (fire-and-forget) puis ouverture de la cible
    api.trackClick(slug, b.id).catch(() => {})
    if (!b.url) return
    // Connecteur embarquable (Calendly, ZenChef, Planity…) → widget intégré
    // au lieu d'une redirection : le visiteur réserve sans quitter la page.
    const conn = connectorOf(b.url)
    if (conn?.embed) {
      setEmbed({ url: embedUrl(conn, b.url), openUrl: b.url, title: b.label, brand: conn.name })
      return
    }
    window.open(b.url, '_blank', 'noopener')
  }

  async function handleBuy(pr) {
    try {
      const r = await api.buyProduct(slug, pr.id)
      if (r.url) window.location.href = r.url
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <BioImmersive
        page={page}
        buttons={buttons}
        supporters={supporters}
        products={products}
        onBuy={handleBuy}
        branding={data.branding !== false}
        sound
        onButtonClick={handleClick}
        onTip={(b) => { api.trackClick(slug, b.id).catch(() => {}); setTip(true) }}
        onContact={(b) => { api.trackClick(slug, b.id).catch(() => {}); setContact(b) }}
        onServices={(b) => { api.trackClick(slug, b.id).catch(() => {}); setServices(b) }}
        onReserve={(b) => { api.trackClick(slug, b.id).catch(() => {}); setReserve(b) }}
        onQuote={(b) => { api.trackClick(slug, b.id).catch(() => {}); setQuote(b) }}
        onLinks={(b) => { api.trackClick(slug, b.id).catch(() => {}); setLinks(b) }}
        onNewsletter={(b) => { api.trackClick(slug, b.id).catch(() => {}); setNewsletter(b) }}
        live={live}
      />
      <ShareStory page={page} slug={slug} />
      {tip && <TipModal slug={slug} amounts={theme.tipAmounts} onClose={() => setTip(false)} />}
      {contact && <ContactModal slug={slug} subject={contact.label} onClose={() => setContact(null)} />}
      {services && <ServicesModal title={services.label} items={services.config?.items} accent={theme.accent} onClose={() => setServices(null)} />}
      {reserve && <ReservationModal slug={slug} title={reserve.label} accent={theme.accent} onClose={() => setReserve(null)} />}
      {quote && <QuoteModal slug={slug} title={quote.label} accent={theme.accent} onClose={() => setQuote(null)} />}
      {links && <LinksModal title={links.label} links={links.config?.links} accent={theme.accent} onClose={() => setLinks(null)} />}
      {embed && <EmbedModal url={embed.url} openUrl={embed.openUrl} title={embed.title} brand={embed.brand} accent={theme.accent} onClose={() => setEmbed(null)} />}
      {newsletter && <NewsletterModal slug={slug} title={newsletter.label} accent={theme.accent} onClose={() => setNewsletter(null)} />}

      {/* Son d'ambiance (premium, opt-in) */}
      {theme.ambientAudio && (
        <>
          <audio ref={audioRef} src={theme.ambientAudio} loop preload="none" />
          <button
            onClick={toggleSound}
            aria-label="Son d'ambiance"
            className="press fixed bottom-4 right-4 z-30 grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-white shadow-hard"
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </>
      )}

      {/* Le bouton « Ajouter au Wallet » est réservé au propriétaire (éditeur + onboarding) —
          jamais affiché aux visiteurs de la page publique. */}
    </div>
  )
}
