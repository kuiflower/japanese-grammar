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
} from '@/lib/practiceStorage'
import type { JlptLevel } from '@/types/quiz'
import { LEVEL_LABELS, levelToPath } from '@/types/quiz'

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

export default function GrammarHome() {
  const { version } = useStorageVersion()
  const [, setTick] = useState(0)

  useEffect(() => {
    setTick(version)
  }, [version])

  const recordGroups = HOME_ROUND_GROUPS.map(({ round, label }) => {
    const links = LEVELS.flatMap((level) => {
      const checkpoint = getCheckpoint(level, round)
      const summary = getSessionSummary(level, round)
      if (checkpoint) {
        return [
          {
            key: `${level}-${round}-cp`,
            level,
            to: `/practice/${levelToPath(checkpoint.level)}?round=${checkpoint.round}&resume=1`,
            title: '继续做题',
            meta: `${formatProgress(checkpoint)} · ${formatRelativeTime(checkpoint.updatedAt)}`,
            done: false,
          },
        ]
      }
      if (summary) {
        return [
          {
            key: `${level}-${round}-sum`,
            level,
            to: `/practice/${levelToPath(summary.level)}?round=${summary.round}&fresh=1`,
            title: summary.completed ? '再来一轮' : '继续做题',
            meta: `${formatSessionSummary(summary)} · ${formatRelativeTime(summary.updatedAt)}`,
            done: summary.completed,
          },
        ]
      }
      return []
    })
    return { round, label, links }
  }).filter((group) => group.links.length > 0)

  const hasAnyWrong = LEVELS.some((level) =>
    HOME_ROUND_GROUPS.some(({ round }) => countWrongForRound(level, round) > 0),
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
        </div>
        <div className="memory-panel memory-panel-card">
          {recordGroups.map(({ round, label, links }) => (
            <div key={`cp-${round}`} className="memory-block">
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
        </div>
        <div className="memory-panel memory-panel-card">
          {HOME_ROUND_GROUPS.map(({ round, label }) => {
            const links = LEVELS.map((level) => ({
              level,
              count: countWrongForRound(level, round),
            })).filter((item) => item.count > 0)
            if (links.length === 0) return null
            return (
              <div key={`wrong-${round}`} className="memory-block">
                <h3 className="memory-group-title">{label}</h3>
                <div className="memory-pill-links">
                  {links.map(({ level, count }) => (
                    <Link
                      key={level}
                      to={`/wrong/${levelToPath(level)}?round=${round}`}
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
          })}
          {!hasAnyWrong && <p className="memory-empty">暂无错题</p>}
        </div>
      </section>
    </div>
  )
}
