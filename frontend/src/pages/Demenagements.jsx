import SignalPage from '../components/ui/SignalPage'
import { useT } from '../i18n/useT'

export default function Demenagements() {
  const t = useT()
  return <SignalPage signal="demenagement" color="#fb923c" icon="→" label={t('demenagement.label')} emptyMsg={t('demenagement.empty')} />
}
