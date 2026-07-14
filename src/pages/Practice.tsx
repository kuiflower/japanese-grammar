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
    round: 'all',
    desc: '第一轮（意思+用法）+ 第二轮（例句）+ 增强题，推荐完整练习',
    recommended: true,
  },
  {
    round: 'round1',
    desc: '每条语法：中文意思 + 用法判断',
  },
  {
    round: 'round2',
    desc: '选正确例句（核心题型，优先巩固运用）',
  },
  {
    round: 'enhanced',
    desc: '语法挖空 + 改错辨析',
  },
]

export default function Practice() {
  return (
    <div className="page practice-hub">
      <header className="page-header">
        <h1>语法练习</h1>
        <p>选好等级和模式后开练；选完立刻看对错与解析。</p>
      </header>

      <div className="practice-flow-hint">
        <div className="flow-step">
          <span className="flow-num">1</span>
          <div>
            <strong>看语法 → 懂意思和用途</strong>
            <p>第一轮：中文意思 + 用法判断</p>
          </div>
        </div>
        <div className="flow-arrow" aria-hidden>
          →
        </div>
        <div className="flow-step">
          <span className="flow-num">2</span>
          <div>
            <strong>用例句 → 巩固会用</strong>
            <p>第二轮：选正确例句（优先）+ 挖空/改错</p>
          </div>
        </div>
      </div>

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
