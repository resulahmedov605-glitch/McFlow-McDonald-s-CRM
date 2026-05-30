export const languageOptions = [
  { code: 'az', label: 'Azərbaycanca', shortLabel: 'AZ', flag: '🇦🇿' },
  { code: 'tr', label: 'Türkçe', shortLabel: 'TR', flag: '🇹🇷' },
  { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', shortLabel: 'DE', flag: '🇩🇪' },
  { code: 'ru', label: 'Русский', shortLabel: 'RU', flag: '🇷🇺' },
  { code: 'fr', label: 'Français', shortLabel: 'FR', flag: '🇫🇷' },
  { code: 'es', label: 'Español', shortLabel: 'ES', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', shortLabel: 'IT', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', shortLabel: 'PT', flag: '🇵🇹' },
  { code: 'nl', label: 'Nederlands', shortLabel: 'NL', flag: '🇳🇱' },
] as const

export type LanguageCode = (typeof languageOptions)[number]['code']

export const isLanguageCode = (value: string | null): value is LanguageCode =>
  languageOptions.some((language) => language.code === value)
