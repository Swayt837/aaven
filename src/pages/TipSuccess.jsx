import { Link, useSearchParams } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { Confetti } from '../components/Confetti'
import { useI18n } from '../lib/i18n'

export default function TipSuccess() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const slug = params.get('slug')

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-cream px-4">
      <Confetti />
      <Card className="bb-pop relative z-10 max-w-md p-8 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="font-display mt-4 text-3xl">{t('success.title')}</h1>
        <p className="mt-2 font-medium text-ink/70">{t('success.sub')}</p>
        <Button as={Link} to={slug ? `/${slug}` : '/'} className="mt-6">
          {t('success.back')}
        </Button>
      </Card>
    </div>
  )
}
