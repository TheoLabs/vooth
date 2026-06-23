import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * 다크/라이트 테마 전환(vooth-tool 한정).
 * 기본값은 다크(Final Cut 레퍼런스). 선택값은 localStorage 에 저장해 재실행 시 유지.
 * data-theme 속성을 <html> 에 부여하면 base.css 의 토큰 세트가 전환된다.
 */
export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'vooth-tool.theme'

interface ThemeContextValue {
  theme: ThemeMode
  toggleTheme: () => void
  setTheme: (t: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialTheme(): ThemeMode {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  return saved === 'light' || saved === 'dark' ? saved : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [theme, setThemeState] = useState<ThemeMode>(() => readInitialTheme())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (t: ThemeMode): void => setThemeState(t)
  const toggleTheme = (): void => setThemeState((p) => (p === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
