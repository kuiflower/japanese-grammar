export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'jg-v1-theme'

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    /* private mode / blocked storage */
  }
  return null
}

export function getSystemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function getPreferredTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function persistTheme(theme: Theme) {
  applyTheme(theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}
