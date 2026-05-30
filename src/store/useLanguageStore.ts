import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isLanguageCode, type LanguageCode } from '../locales/languages'

type LanguageStore = {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
}

const legacyLanguage =
  typeof window !== 'undefined' ? window.localStorage.getItem('mcflowLng') : null

const initialLanguage = isLanguageCode(legacyLanguage) ? legacyLanguage : 'az'

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: initialLanguage,
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-store',
    },
  ),
)
