import fr from './fr'

export function useT() {
  return (key, fallback) => fr[key] ?? fallback ?? key
}
