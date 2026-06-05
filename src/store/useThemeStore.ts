import { create } from 'zustand'

type Theme = 'dark' | 'light'
export type ThemePreference = Theme | 'system'

type ThemeStore = {
  theme: Theme
  themePreference: ThemePreference
  setThemePreference: (themePreference: ThemePreference) => void
  toggleTheme: () => void
  syncSystemTheme: () => void
}

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark'

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'dark' || value === 'light' || value === 'system'

const getStoredThemePreference = (): ThemePreference => {
  if (typeof window === 'undefined') return 'system'

  const storedTheme = window.localStorage.getItem('theme-store')

  if (!storedTheme) return 'system'

  try {
    const parsedTheme = JSON.parse(storedTheme) as {
      state?: {
        theme?: unknown
        themePreference?: unknown
      }
    }

    if (isThemePreference(parsedTheme.state?.themePreference)) {
      return parsedTheme.state.themePreference
    }

    if (isThemePreference(parsedTheme.state?.theme)) {
      return parsedTheme.state.theme
    }
  } catch {
    return 'system'
  }

  return 'system'
}

const saveThemePreference = (themePreference: ThemePreference) => {
  window.localStorage.setItem(
    'theme-store',
    JSON.stringify({
      state: { themePreference },
      version: 1,
    }),
  )
}

const resolveTheme = (themePreference: ThemePreference): Theme =>
  themePreference === 'system' ? getSystemTheme() : themePreference

const initialThemePreference = getStoredThemePreference()

export const useThemeStore = create<ThemeStore>((set, get) => ({
  themePreference: initialThemePreference,
  theme: resolveTheme(initialThemePreference),
  setThemePreference: (themePreference) => {
    saveThemePreference(themePreference)

    set({
      themePreference,
      theme: resolveTheme(themePreference),
    })
  },
  toggleTheme: () => {
    const theme = get().theme === 'dark' ? 'light' : 'dark'

    saveThemePreference(theme)

    set({
      themePreference: theme,
      theme,
    })
  },
  syncSystemTheme: () => {
    if (get().themePreference === 'system') {
      set({ theme: getSystemTheme() })
    }
  },
}))
