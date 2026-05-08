import { create } from 'zustand'

const savedTheme = localStorage.getItem('theme') || 'dark'

if (savedTheme === 'light') document.body.classList.add('light')

export const useUiStore = create((set, get) => ({
  lang:  'fr',
  theme: savedTheme,

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    document.body.classList.toggle('light', next === 'light')
    localStorage.setItem('theme', next)
    set({ theme: next })
  },
}))
