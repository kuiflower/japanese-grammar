import { Link } from 'react-router-dom'
import { getQuizHubStats } from '@/data/quiz'
import type { JlptLevel, QuizRound } from '@/types/quiz'
import { LEVEL_LABELS, ROUND_LABELS, levelToPath } from '@/types/quiz'

const levels: { level: JlptLevel; title: string }[] = [
  {
    level: 'PRE-N3',
    title: '步入N3前',
  },
  {
    level: 'N3',
    title: 'N3 语法练习',
  },
  {
    level: 'N2',
    title: 'N2 语法练习',
  },
]

const rounds: { round: QuizRound; desc: string; recommended?: boolean }[] = [
  {
    round: 'round1',
    desc: '意思 + 用法',
    recommended: true,
  },
  {
    round: 'round2',
    desc: '选例句',
  },
  {
    round: 'enhanced',
    desc: '挖空 + 改错',
  },
  {
    round: 'all',
    desc: '意思 · 用法 · 例句 · 挖空改错',
  },
]

export default function Practice() {
  return (
    <div className="page practice-hub">
      <header className="page-header">
        <h1>语法练习</h1>
      </header>

      {levels.map(({ level, title }) => {
        const stats = getQuizHubStats(level)
        return (
          <section key={level} className="practice-level-section">
            <div className="practice-level-header">
              <div>
                <span className="badge badge-level">{LEVEL_LABELS[level]}</span>
                <h2>{title}</h2>
              </div>
              <div className="practice-stats">
                <span>{stats.grammarCount} 条语法</span>
              </div>
            </div>

            <div className="practice-mode-grid">
              {rounds.map(({ round, desc: roundDesc, recommended }) => (
                <Link
                  key={round}
                  to={`/practice/${levelToPath(level)}?round=${round}&fresh=1`}
                  className={`practice-mode-card ${recommended ? 'recommended' : ''}`}
                >
                  {recommended && <span className="practice-recommend">推荐</span>}
                  <h3>{ROUND_LABELS[round]}</h3>
                  <p>{roundDesc}</p>
                  <span className="practice-mode-count">进入后出题</span>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
