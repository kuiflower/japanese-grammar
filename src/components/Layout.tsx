import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  getAppSection,
  GRAMMAR_HOME_PATH,
  VOCABULARY_HOME_PATH,
} from '@/lib/appSections'
import {
  LEVEL_LABELS,
  ROUND_LABELS,
  parseLevelParam,
  type QuizRound,
} from '@/types/quiz'
import {
  VOCAB_LEVEL_LABELS,
  VOCAB_TRACK_LABELS,
  parseVocabLevelParam,
  parseVocabTrackParam,
} from '@/types/vocab-quiz'

interface LayoutProps {
  children: ReactNode
}

const VALID_ROUNDS: QuizRound[] = ['all', 'round1', 'round2', 'enhanced']

const grammarNavItems = [
  { path: GRAMMAR_HOME_PATH, label: '首页' },
  { path: '/practice', label: '练习' },
  { path: '/grammar', label: '文法库' },
]

const vocabularyNavItems = [
  { path: VOCABULARY_HOME_PATH, label: '首页' },
  { path: '/vocab-practice', label: '练习' },
  { path: '/vocabulary/exam', label: '単語库' },
]

function detectVocabTrack(pathname: string) {
  const fromPractice = pathname.match(/^\/vocab-practice\/(exam|full)\//)
  if (fromPractice) return parseVocabTrackParam(fromPractice[1])
  const fromWrong = pathname.match(/^\/vocab-wrong\/(exam|full)\//)
  if (fromWrong) return parseVocabTrackParam(fromWrong[1])
  const fromList = pathname.match(/^\/vocabulary\/(exam|full)/)
  if (fromList) return parseVocabTrackParam(fromList[1])
  return null
}

function isNavActive(pathname: string, path: string): boolean {
  if (path === GRAMMAR_HOME_PATH) {
    return pathname === GRAMMAR_HOME_PATH
  }
  if (path === VOCABULARY_HOME_PATH) {
    return pathname === VOCABULARY_HOME_PATH
  }
  if (path === '/practice') {
    return pathname.startsWith('/practice') || pathname.startsWith('/wrong')
  }
  if (path === '/vocab-practice') {
    return pathname.startsWith('/vocab-practice') || pathname.startsWith('/vocab-wrong')
  }
  if (path.startsWith('/vocabulary/')) {
    return pathname.startsWith('/vocabulary/')
  }
  if (path !== '/') {
    return pathname === path || pathname.startsWith(`${path}/`)
  }
  return pathname === path
}

function getFooterText(pathname: string, search: string): string {
  const section = getAppSection(pathname)

  if (section === 'hub') {
    return '东东日语 · 学习入口'
  }

  if (section === 'vocabulary') {
    const track = detectVocabTrack(pathname)
    const practice = pathname.match(/^\/vocab-practice\/(exam|full)\/([^/]+)/)
    const wrong = pathname.match(/^\/vocab-wrong\/(exam|full)\/([^/]+)/)
    const level = parseVocabLevelParam(practice?.[2] ?? wrong?.[2])
    const trackLabel = track ? VOCAB_TRACK_LABELS[track] : null

    if (level && trackLabel) {
      return wrong
        ? `东东単語 · ${trackLabel} · ${VOCAB_LEVEL_LABELS[level]} · 错题复习`
        : `东东単語 · ${trackLabel} · ${VOCAB_LEVEL_LABELS[level]} · 単語练习`
    }
    if (pathname.startsWith('/vocabulary/') && trackLabel) {
      return `东东単語 · ${trackLabel} · 単語库`
    }
    if (pathname === '/vocab-practice') return '东东単語 · 単語练习'
    if (pathname === VOCABULARY_HOME_PATH) return '东东単語 · 単語练习'
    return '东东単語 · 背単語'
  }

  const roundParam = new URLSearchParams(search).get('round')
  const round =
    roundParam && VALID_ROUNDS.includes(roundParam as QuizRound)
      ? (roundParam as QuizRound)
      : null

  const practiceMatch = pathname.match(/^\/practice\/([^/]+)/)
  const wrongMatch = pathname.match(/^\/wrong\/([^/]+)/)
  const level = parseLevelParam(practiceMatch?.[1] ?? wrongMatch?.[1])

  if (level) {
    const activeRound = round ?? 'all'
    const title = `${LEVEL_LABELS[level]} · ${ROUND_LABELS[activeRound]}`
    return wrongMatch ? `东东文法 · ${title} · 错题复习` : `东东文法 · ${title}`
  }

  if (pathname.startsWith('/grammar')) return '东东文法 · 文法库'
  if (pathname === '/practice') return '东东文法 · 文法练习'
  if (pathname === GRAMMAR_HOME_PATH) return '东东文法 · 文法练习'
  return `东东文法 · ${LEVEL_LABELS['PRE-N3']} / ${LEVEL_LABELS.N2} / ${LEVEL_LABELS.N3} 选择题练习`
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const section = getAppSection(location.pathname)
  const footerText = getFooterText(location.pathname, location.search)

  const logoHref =
    section === 'vocabulary'
      ? VOCABULARY_HOME_PATH
      : section === 'grammar'
        ? GRAMMAR_HOME_PATH
        : '/'
  const logoJa =
    section === 'hub' ? '东东日语' : section === 'vocabulary' ? '东东単語' : '东东文法'
  const logoText =
    section === 'hub'
      ? '学习平台'
      : section === 'vocabulary'
        ? '背単語'
        : '学文法'
  /** Logo 回本板块练习页；右上角回总入口再换板块 */
  const logoTitle =
    section === 'hub' ? '学习入口' : section === 'vocabulary' ? '単語练习' : '文法练习'
  const switchLabel = section === 'vocabulary' ? '换文法' : '换単語'
  const switchTitle =
    section === 'vocabulary' ? '回主页，可切换到文法' : '回主页，可切换到単語'

  const navItems =
    section === 'vocabulary'
      ? vocabularyNavItems
      : section === 'grammar'
        ? grammarNavItems
        : []

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <Link to={logoHref} className="logo" title={logoTitle}>
            <span className="logo-ja">{logoJa}</span>
            <span className="logo-text">{logoText}</span>
          </Link>
          <nav className="nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={
                  isNavActive(location.pathname, item.path) ? 'nav-link active' : 'nav-link'
                }
              >
                {item.label}
              </Link>
            ))}
            {section !== 'hub' && (
              <Link to="/" className="nav-link nav-link-switch" title={switchTitle}>
                {switchLabel}
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        <p>{footerText}</p>
      </footer>
    </div>
  )
}
