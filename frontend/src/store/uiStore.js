import { create } from 'zustand'

const savedLang  = localStorage.getItem('lang')  || 'fr'
const savedTheme = localStorage.getItem('theme') || 'dark'

if (savedTheme === 'light') document.body.classList.add('light')

export const useUiStore = create((set, get) => ({
  lang:  savedLang,
  theme: savedTheme,

  toggleLang: () => {
    const next = get().lang === 'fr' ? 'en' : 'fr'
    localStorage.setItem('lang', next)
    set({ lang: next })
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    document.body.classList.toggle('light', next === 'light')
    localStorage.setItem('theme', next)
    set({ theme: next })
  },
}))
