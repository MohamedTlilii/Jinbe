import { useUiStore } from '../store/uiStore'
import fr from './fr'
import en from './en'

const dicts = { fr, en }

export function useT() {
  const { lang } = useUiStore()
  const dict = dicts[lang] || dicts.fr
  return (key, fallback) => dict[key] ?? fallback ?? key
}
