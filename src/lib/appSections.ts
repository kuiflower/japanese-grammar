export type AppSection = 'hub' | 'grammar' | 'vocabulary'

export const GRAMMAR_HOME_PATH = '/learn/grammar'
export const VOCABULARY_HOME_PATH = '/learn/vocabulary'

export function getAppSection(pathname: string): AppSection {
  if (pathname === '/') return 'hub'
  if (
    pathname === VOCABULARY_HOME_PATH ||
    pathname.startsWith(`${VOCABULARY_HOME_PATH}/`) ||
    pathname.startsWith('/vocabulary') ||
    pathname.startsWith('/vocab-practice') ||
    pathname.startsWith('/vocab-wrong') ||
    pathname.startsWith('/vocab-unfamiliar')
  ) {
    return 'vocabulary'
  }
  return 'grammar'
}
