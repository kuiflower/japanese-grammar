import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HOME_REVIEW_ROUND_GROUPS,
  HOME_ROUND_GROUPS,
  clearAllSessionRecords,
  clearAllUnfamiliarQuestions,
  clearAllWrongQuestions,
  countUnfamiliarForRound,
  countWrongForRound,
  formatProgress,
  formatRelativeTime,
  formatSessionSummary,
  getCheckpoint,
  getSessionSummary,
} from '@/lib/practiceStorage'
import type { JlptLevel } from '@/types/quiz'
import {
  GRAMMAR_BANKS,
  GRAMMAR_BANK_LABELS,
  LEVEL_LABELS,
  grammarPracticePath,
  grammarUnfamiliarPath,
  grammarWrongPath,
} from '@/types/quiz'

const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2']

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

export default function GrammarHome() {
  const { version } = useStorageVersion()
  const [, setTick] = useState(0)

  useEffect(() => {
    setTick(version)
  }, [version])

  const recordGroups = GRAMMAR_BANKS.flatMap((bank) =>
    HOME_ROUND_GROUPS.map(({ round, label }) => {
      const links = LEVELS.flatMap((level) => {
        const checkpoint = getCheckpoint(level, round, bank)
        const summary = getSessionSummary(level, round, bank)
        if (checkpoint) {
          return [
            {
              key: `${bank}-${level}-${round}-cp`,
              level,
              bank,
              to: grammarPracticePath(level, round, bank, 'resume'),
              title: '继续做题',
              meta: `${formatProgress(checkpoint)} · ${formatRelativeTime(checkpoint.updatedAt)}`,
              done: false,
            },
          ]
        }
        if (summary) {
          return [
            {
              key: `${bank}-${level}-${round}-sum`,
              level,
              bank,
              to: grammarPracticePath(level, round, bank, 'fresh'),
              title: summary.completed ? '再来一轮' : '继续做题',
              meta: `${formatSessionSummary(summary)} · ${formatRelativeTime(summary.updatedAt)}`,
              done: summary.completed,
            },
          ]
        }
        return []
      })
      return {
        key: `${bank}-${round}`,
        label: bank === 'basic' ? label : `${GRAMMAR_BANK_LABELS[bank]} · ${label}`,
        links,
      }
    }),
  ).filter((group) => group.links.length > 0)

  const hasAnyWrong = LEVELS.some((level) =>
    GRAMMAR_BANKS.some((bank) =>
      HOME_REVIEW_ROUND_GROUPS.some(({ round }) => countWrongForRound(level, round, bank) > 0),
    ),
  )

  const hasAnyUnfamiliar = LEVELS.some((level) =>
    GRAMMAR_BANKS.some((bank) =>
      HOME_REVIEW_ROUND_GROUPS.some(
        ({ round }) => countUnfamiliarForRound(level, round, bank) > 0,
      ),
    ),
  )

  return (
    <div className="page home">
      <section className="hero hero-compact">
        <p className="hero-label">日本語文法</p>
        <h1>文法练习</h1>
        <div className="hero-actions">
          <Link to="/practice" className="btn btn-primary">
            开始新练习
          </Link>
          <Link to="/grammar" className="btn btn-secondary">
            文法库
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>上次答题记录</h2>
          {recordGroups.length > 0 && (
            <button
              type="button"
              className="memory-clear-btn"
              onClick={() => {
                if (window.confirm('确定清空全部答题记录？此操作不可恢复。')) {
                  clearAllSessionRecords()
                }
              }}
            >
              一键清除
            </button>
          )}
        </div>
        <div className="memory-panel memory-panel-card">
          {recordGroups.map(({ key, label, links }) => (
            <div key={key} className="memory-block">
              <h3 className="memory-group-title">{label}</h3>
              <div className="memory-pill-links">
                {links.map((link) => (
                  <Link
                    key={link.key}
                    to={link.to}
                    className={`memory-pill-link ${link.done ? 'memory-pill-done' : 'memory-pill-continue'}`}
                  >
                    <span className="badge badge-level">{LEVEL_LABELS[link.level]}</span>
                    <span className="memory-pill-body">
                      <span className="memory-pill-title">{link.title}</span>
                      <span className="memory-pill-meta">{link.meta}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {recordGroups.length === 0 && <p className="memory-empty">暂无记录</p>}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>错题记录</h2>
          {hasAnyWrong && (
            <button
              type="button"
              className="memory-clear-btn"
              onClick={() => {
                if (window.confirm('确定清空全部错题记录？此操作不可恢复。')) {
                  clearAllWrongQuestions()
                }
              }}
            >
              一键清除
            </button>
          )}
        </div>
        <div className="memory-panel memory-panel-card">
          {GRAMMAR_BANKS.flatMap((bank) =>
            HOME_REVIEW_ROUND_GROUPS.map(({ round, label }) => {
              const links = LEVELS.map((level) => ({
                level,
                count: countWrongForRound(level, round, bank),
              })).filter((item) => item.count > 0)
              if (links.length === 0) return null
              return (
                <div key={`wrong-${bank}-${round}`} className="memory-block">
                  <h3 className="memory-group-title">
                    {bank === 'basic' ? label : `${GRAMMAR_BANK_LABELS[bank]} · ${label}`}
                  </h3>
                  <div className="memory-pill-links">
                    {links.map(({ level, count }) => (
                      <Link
                        key={`${bank}-${level}`}
                        to={grammarWrongPath(level, round, bank)}
                        className="memory-pill-link memory-pill-wrong"
                      >
                        <span className="badge badge-level">{LEVEL_LABELS[level]}</span>
                        <span className="memory-pill-body">
                          <span className="memory-pill-title">{count} 题</span>
                          <span className="memory-pill-meta">待复习</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            }),
          )}
          {!hasAnyWrong && <p className="memory-empty">暂无错题</p>}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>不熟悉记录</h2>
          {hasAnyUnfamiliar && (
            <button
              type="button"
              className="memory-clear-btn"
              onClick={() => {
                if (window.confirm('确定清空全部不熟悉记录？此操作不可恢复。')) {
                  clearAllUnfamiliarQuestions()
                }
              }}
            >
              一键清除
            </button>
          )}
        </div>
        <div className="memory-panel memory-panel-card">
          {GRAMMAR_BANKS.flatMap((bank) =>
            HOME_REVIEW_ROUND_GROUPS.map(({ round, label }) => {
              const links = LEVELS.map((level) => ({
                level,
                count: countUnfamiliarForRound(level, round, bank),
              })).filter((item) => item.count > 0)
              if (links.length === 0) return null
              return (
                <div key={`unfamiliar-${bank}-${round}`} className="memory-block">
                  <h3 className="memory-group-title">
                    {bank === 'basic' ? label : `${GRAMMAR_BANK_LABELS[bank]} · ${label}`}
                  </h3>
                  <div className="memory-pill-links">
                    {links.map(({ level, count }) => (
                      <Link
                        key={`${bank}-${level}`}
                        to={grammarUnfamiliarPath(level, round, bank)}
                        className="memory-pill-link memory-pill-unfamiliar"
                      >
                        <span className="badge badge-level">{LEVEL_LABELS[level]}</span>
                        <span className="memory-pill-body">
                          <span className="memory-pill-title">{count} 题</span>
                          <span className="memory-pill-meta">待巩固</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            }),
          )}
          {!hasAnyUnfamiliar && <p className="memory-empty">暂无不熟悉题</p>}
        </div>
      </section>
    </div>
  )
}
