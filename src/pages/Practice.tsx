import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getQuizHubStats } from '@/data/quiz'
import type { GrammarBank, JlptLevel, QuizRound } from '@/types/quiz'
import {
  GRAMMAR_BANKS,
  GRAMMAR_BANK_LABELS,
  LEVEL_LABELS,
  ROUND_LABELS,
  grammarLevelTitle,
  grammarPracticePath,
} from '@/types/quiz'

const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2']

const rounds: { round: QuizRound; desc: string; recommended?: boolean }[] = [
  { round: 'round1', desc: '意思 + 用法', recommended: true },
  { round: 'round2', desc: '选例句' },
  { round: 'enhanced', desc: '挖空 + 改错' },
  { round: 'all', desc: '意思 · 用法 · 例句 · 挖空改错' },
]

export default function Practice() {
  const [bank, setBank] = useState<GrammarBank>('basic')
  const [openLevel, setOpenLevel] = useState<JlptLevel | null>('N5')

  useEffect(() => {
    const firstReady = levels.find((level) => getQuizHubStats(level, bank).grammarCount > 0)
    setOpenLevel(firstReady ?? 'N5')
  }, [bank])

  return (
    <div className="page practice-hub">
      <header className="page-header">
        <h1>文法练习</h1>
      </header>

      <div className="filter-bar practice-bank-bar">
        {GRAMMAR_BANKS.map((item) => (
          <button
            key={item}
            type="button"
            className={bank === item ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setBank(item)}
          >
            {GRAMMAR_BANK_LABELS[item]}
          </button>
        ))}
      </div>

      {levels.map((level) => {
        const stats = getQuizHubStats(level, bank)
        const open = openLevel === level
        const ready = stats.grammarCount > 0
        return (
          <section
            key={`${bank}-${level}`}
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
                  <p className="practice-level-meta">
                    {ready ? `${stats.grammarCount} 条文法` : '筹备中'}
                  </p>
                </div>
              </div>
              <span className="practice-level-chevron" aria-hidden>
                {open ? '▾' : '▸'}
              </span>
            </button>

            {open && (
              <div className="practice-mode-grid">
                {ready ? (
                  rounds.map(({ round, desc: roundDesc, recommended }) => (
                    <Link
                      key={round}
                      to={grammarPracticePath(level, round, bank, 'fresh')}
                      className={`practice-mode-card ${recommended ? 'recommended' : ''}`}
                    >
                      {recommended && <span className="practice-recommend">推荐</span>}
                      <h3>{ROUND_LABELS[round]}</h3>
                      <p>{roundDesc}</p>
                    </Link>
                  ))
                ) : (
                  <div className="practice-mode-card practice-mode-card-disabled">
                    <h3>{GRAMMAR_BANK_LABELS[bank]}</h3>
                    <p>该等级题目筹备中</p>
                    <span className="practice-mode-count">筹备中</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
