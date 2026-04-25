import SignalPage from '../components/ui/SignalPage'
import { useT } from '../i18n/useT'

export default function Nouvelles() {
  const t = useT()
  return <SignalPage signal="nouvelle" color="#4ade80" icon="✦" label={t('nouvelle.label')} emptyMsg={t('nouvelle.empty')} />
}
