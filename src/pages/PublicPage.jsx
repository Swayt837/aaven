import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Volume2, VolumeX, Wallet } from 'lucide-react'
import { BioImmersive } from '../components/PhoneMockup'
import { TipModal } from '../components/TipModal'
import { ContactModal } from '../components/ContactModal'
import { ServicesModal } from '../components/ServicesModal'
import { ReservationModal } from '../components/ReservationModal'
import { QuoteModal } from '../components/QuoteModal'
import { LinksModal } from '../components/LinksModal'
import { ShareStory } from '../components/ShareStory'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'
import { getTheme } from '../lib/themes'

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
    if (b.url) window.open(b.url, '_blank', 'noopener')
  }

  async function handleBuy(pr) {
    try {
      const r = await api.buyProduct(slug, pr.id)
      if (r.url) window.location.href = r.url
    } catch (e) {
      alert(e.message)
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
      />
      <ShareStory page={page} slug={slug} />
      {tip && <TipModal slug={slug} amounts={theme.tipAmounts} onClose={() => setTip(false)} />}
      {contact && <ContactModal slug={slug} subject={contact.label} onClose={() => setContact(null)} />}
      {services && <ServicesModal title={services.label} items={services.config?.items} accent={theme.accent} onClose={() => setServices(null)} />}
      {reserve && <ReservationModal slug={slug} title={reserve.label} accent={theme.accent} onClose={() => setReserve(null)} />}
      {quote && <QuoteModal slug={slug} title={quote.label} accent={theme.accent} onClose={() => setQuote(null)} />}
      {links && <LinksModal title={links.label} links={links.config?.links} accent={theme.accent} onClose={() => setLinks(null)} />}

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

      {/* Ajouter la carte au Wallet (affiché seulement si configuré côté serveur) */}
      {(data.wallet?.apple || data.wallet?.google) && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex flex-wrap items-center justify-center gap-2 px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {data.wallet.apple && (
            <a href={`/api/wallet/apple/${slug}`} className="press inline-flex items-center gap-2 rounded-full bg-black/85 px-4 py-2.5 text-sm font-bold text-white shadow-hard backdrop-blur">
              <Wallet size={16} /> {t('wallet.apple')}
            </a>
          )}
          {data.wallet.google && (
            <a href={`/api/wallet/google/${slug}`} className="press inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-hard">
              <Wallet size={16} /> {t('wallet.google')}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
