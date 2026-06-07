import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Volume2, VolumeX } from 'lucide-react'
import { BioImmersive } from '../components/PhoneMockup'
import { TipModal } from '../components/TipModal'
import { ContactModal } from '../components/ContactModal'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'
import { getTheme } from '../lib/themes'

export default function PublicPage() {
  const { slug } = useParams()
  const { t } = useI18n()
  const nav = useNavigate()
  const [data, setData] = useState(undefined) // undefined=loading, null=404
  const [tip, setTip] = useState(false)
  const [contact, setContact] = useState(null) // bouton ayant déclenché le formulaire
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
          <button onClick={() => nav('/')} className="mt-4 font-bold underline">BioBoost →</button>
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
        onButtonClick={handleClick}
        onTip={(b) => { api.trackClick(slug, b.id).catch(() => {}); setTip(true) }}
        onContact={(b) => { api.trackClick(slug, b.id).catch(() => {}); setContact(b) }}
      />
      {tip && <TipModal slug={slug} amounts={theme.tipAmounts} onClose={() => setTip(false)} />}
      {contact && <ContactModal slug={slug} subject={contact.label} onClose={() => setContact(null)} />}

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
    </div>
  )
}
