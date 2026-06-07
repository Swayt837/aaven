import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { Confetti } from '../components/Confetti'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'

export default function BuySuccess() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [st, setSt] = useState(null)

  useEffect(() => {
    if (!token) return
    let tries = 0
    let stop = false
    const poll = () => {
      api.purchaseStatus(token).then((r) => {
        if (stop) return
        setSt(r)
        if (r.status !== 'paid' && tries++ < 12) setTimeout(poll, 1500)
      }).catch(() => {})
    }
    poll()
    return () => { stop = true }
  }, [token])

  const paid = st?.status === 'paid'

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-cream px-4">
      {paid && <Confetti />}
      <Card className="bb-pop relative z-10 max-w-md p-8 text-center">
        <div className="text-6xl">{paid ? '🎉' : '⏳'}</div>
        <h1 className="font-display mt-4 text-3xl">{t('buy.title')}</h1>
        {paid ? (
          <>
            <p className="mt-2 font-medium text-ink/70">{t('buy.ready')}</p>
            <Button as="a" href={st.url} className="mt-6">{t('buy.download')}</Button>
            <p className="mt-3 text-xs font-semibold text-ink/50">{t('buy.emailNote')}</p>
          </>
        ) : (
          <p className="mt-2 font-medium text-ink/70">{t('buy.pending')}</p>
        )}
      </Card>
    </div>
  )
}
