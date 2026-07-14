import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HOME_ROUND_GROUPS,
  countWrongForRound,
  formatProgress,
  formatRelativeTime,
  formatSessionSummary,
  getCheckpoint,
  getSessionSummary,
  type PracticeCheckpoint,
  type PracticeSessionSummary,
} from '@/lib/practiceStorage'
import type { JlptLevel } from '@/types/quiz'
import { LEVEL_LABELS, ROUND_LABELS, levelToPath } from '@/types/quiz'

const LEVELS: JlptLevel[] = ['PRE-N3', 'N2', 'N3']

function useStorageVersion() {
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('jg-v1-')) refresh()
    }
    const onLocalUpdate = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener('jg-storage-update', onLocalUpdate)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('jg-storage-update', onLocalUpdate)
    }
  }, [refresh])

  return { version, refresh }
}

function ProgressRow({
  level,
  checkpoint,
  summary,
}: {
  level: JlptLevel
  checkpoint: PracticeCheckpoint | null
  summary: PracticeSessionSummary | null
}) {
  const round = checkpoint?.round ?? summary?.round

  return (
    <div className="memory-row">
      <div className="memory-row-main">
        <span className="badge badge-level">{LEVEL_LABELS[level]}</span>
      </div>
      <div className="memory-row-actions">
        {checkpoint ? (
          <Link
            to={`/practice/${levelToPath(checkpoint.level)}?round=${checkpoint.round}&resume=1`}
            className="memory-chip memory-chip-continue"
          >
            <span className="memory-chip-title">继续做题</span>
            <span className="memory-chip-meta">
              {formatProgress(checkpoint)} · {formatRelativeTime(checkpoint.updatedAt)}
            </span>
          </Link>
        ) : summary && round ? (
          <Link
            to={`/practice/${levelToPath(summary.level)}?round=${summary.round}&fresh=1`}
            className={`memory-chip ${summary.completed ? 'memory-chip-done' : 'memory-chip-continue'}`}
          >
            <span className="memory-chip-title">
              {summary.completed ? '再来一轮' : '继续做题'}
            </span>
            <span className="memory-chip-meta">
              {formatSessionSummary(summary)} · {formatRelativeTime(summary.updatedAt)}
            </span>
          </Link>
        ) : (
          <span className="memory-chip memory-chip-empty">暂无记录</span>
        )}
      </div>
    </div>
  )
}

export default function GrammarHome() {
  const { version } = useStorageVersion()
  const [, setTick] = useState(0)

  useEffect(() => {
    setTick(version)
  }, [version])

  const hasAnyWrong = LEVELS.some((level) =>
    HOME_ROUND_GROUPS.some(({ round }) => countWrongForRound(level, round) > 0),
  )

  return (
    <div className="page home">
      <section className="hero hero-compact">
        <p className="hero-label">日本語文法</p>
        <h1>语法练习</h1>
        <div className="hero-actions">
          <Link to="/practice" className="btn btn-primary">
            开始新练习
          </Link>
          <Link to="/grammar" className="btn btn-secondary">
            语法库
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>上次答题记录</h2>
        </div>
        <div className="memory-panel">
          {HOME_ROUND_GROUPS.map(({ round }) => (
            <div key={`cp-${round}`} className="memory-group">
              <h3 className="memory-group-title">{ROUND_LABELS[round]}</h3>
              {LEVELS.map((level) => (
                <ProgressRow
                  key={`${level}-${round}`}
                  level={level}
                  checkpoint={getCheckpoint(level, round)}
                  summary={getSessionSummary(level, round)}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>错题记录</h2>
        </div>
        <div className="memory-panel memory-panel-wrong">
          {HOME_ROUND_GROUPS.map(({ round, label }) => {
            const links = LEVELS.map((level) => ({
              level,
              count: countWrongForRound(level, round),
            })).filter((item) => item.count > 0)
            if (links.length === 0) return null
            return (
              <div key={`wrong-${round}`} className="memory-wrong-block">
                <h3 className="memory-group-title">{label}</h3>
                <div className="memory-wrong-links">
                  {links.map(({ level, count }) => (
                    <Link
                      key={level}
                      to={`/wrong/${levelToPath(level)}?round=${round}`}
                      className="memory-wrong-link"
                    >
                      <span className="badge badge-level">{LEVEL_LABELS[level]}</span>
                      <span>{count} 题待复习</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
          {!hasAnyWrong && (
            <p className="memory-empty">暂无错题</p>
          )}
        </div>
      </section>
    </div>
  )
}
