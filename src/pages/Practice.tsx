import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getQuizHubStats } from '@/data/quiz'
import type { JlptLevel, QuizRound } from '@/types/quiz'
import { LEVEL_LABELS, ROUND_LABELS, grammarLevelTitle, levelToPath } from '@/types/quiz'

const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2']

const rounds: { round: QuizRound; desc: string; recommended?: boolean }[] = [
  { round: 'round1', desc: '意思 + 用法', recommended: true },
  { round: 'round2', desc: '选例句' },
  { round: 'enhanced', desc: '挖空 + 改错' },
  { round: 'all', desc: '意思 · 用法 · 例句 · 挖空改错' },
]

export default function Practice() {
  const [openLevel, setOpenLevel] = useState<JlptLevel | null>('N5')

  return (
    <div className="page practice-hub">
      <header className="page-header">
        <h1>文法练习</h1>
      </header>

      {levels.map((level) => {
        const stats = getQuizHubStats(level)
        const open = openLevel === level
        return (
          <section
            key={level}
            className={`practice-level-section ${open ? 'is-open' : ''}`}
          >
            <button
              type="button"
              className="practice-level-toggle"
              aria-expanded={open}
              onClick={() => setOpenLevel(open ? null : level)}
            >
              <div className="practice-level-toggle-main">
                <span className="badge badge-level">{LEVEL_LABELS[level]}</span>
                <div>
                  <h2>{grammarLevelTitle(level)}</h2>
                  <p className="practice-level-meta">{stats.grammarCount} 条文法</p>
                </div>
              </div>
              <span className="practice-level-chevron" aria-hidden>
                {open ? '▾' : '▸'}
              </span>
            </button>

            {open && (
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
                  </Link>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
