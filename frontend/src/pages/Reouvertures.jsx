import SignalPage from '../components/ui/SignalPage'
import { useT } from '../i18n/useT'

export default function Reouvertures() {
  const t = useT()
  return <SignalPage signal="reouverture" color="#2dd4bf" icon="↺" label={t('reouverture.label')} emptyMsg={t('reouverture.empty')} />
}
