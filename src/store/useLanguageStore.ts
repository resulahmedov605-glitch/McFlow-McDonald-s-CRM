import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isLanguageCode, type LanguageCode } from '../locales/languages'

type LanguageStore = {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
}

const legacyLanguage =
  typeof window !== 'undefined' ? window.localStorage.getItem('mcflowLng') : null

const getSystemLanguage = (): LanguageCode => {
  if (typeof window === 'undefined') return 'az'

  const browserLanguages = window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language]

  const language = browserLanguages
    .map((language) => language.split('-')[0])
    .find(isLanguageCode)

  return language ?? 'az'
}

const initialLanguage = isLanguageCode(legacyLanguage)
  ? legacyLanguage
  : getSystemLanguage()

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
