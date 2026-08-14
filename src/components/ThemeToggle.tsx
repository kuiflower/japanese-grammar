import { useEffect, useState } from 'react'
import {
  applyTheme,
  getPreferredTheme,
  getStoredTheme,
  persistTheme,
  type Theme,
} from '@/lib/theme'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'light'
    const current = document.documentElement.getAttribute('data-theme')
    if (current === 'light' || current === 'dark') return current
    return getPreferredTheme()
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (getStoredTheme()) return
      const next = media.matches ? 'dark' : 'light'
      setTheme(next)
      applyTheme(next)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const isDark = theme === 'dark'
  const nextLabel = isDark ? '切换到日间模式' : '切换到夜间模式'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => {
        const next = isDark ? 'light' : 'dark'
        setTheme(next)
        persistTheme(next)
      }}
      title={nextLabel}
      aria-label={nextLabel}
      aria-pressed={isDark}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.4 5.4l1.3 1.3M17.3 17.3l1.3 1.3M18.6 5.4l-1.3 1.3M6.7 17.3l-1.3 1.3" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16.5 4.2A8.2 8.2 0 1 0 19.8 15.5 6.6 6.6 0 0 1 16.5 4.2Z" />
        </svg>
      )}
    </button>
  )
}
