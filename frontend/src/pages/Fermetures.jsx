import SignalPage from '../components/ui/SignalPage'
import { useT } from '../i18n/useT'

export default function Fermetures() {
  const t = useT()
  return <SignalPage signal="fermeture" color="#f87171" icon="✕" label={t('fermeture.label')} emptyMsg={t('fermeture.empty')} />
}
