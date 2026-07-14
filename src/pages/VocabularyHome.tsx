import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HOME_TRACK_GROUPS,
  countVocabWrong,
  formatRelativeTime,
  formatVocabProgress,
  formatVocabSessionSummary,
  getVocabCheckpoint,
  getVocabSessionSummary,
} from '@/lib/vocabPracticeStorage'
import {
  VOCAB_LEVELS,
  VOCAB_LEVEL_LABELS,
  vocabLevelToPath,
  vocabTrackToPath,
} from '@/types/vocab-quiz'

function useStorageVersion() {
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('jv-v1-')) refresh()
    }
    const onLocalUpdate = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener('jv-storage-update', onLocalUpdate)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('jv-storage-update', onLocalUpdate)
    }
  }, [refresh])

  return { version }
}

export default function VocabularyHome() {
  const { version } = useStorageVersion()
  const [, setTick] = useState(0)

  useEffect(() => {
    setTick(version)
  }, [version])

  const recordGroups = HOME_TRACK_GROUPS.map(({ track, label }) => {
    const trackPath = vocabTrackToPath(track)
    const links = VOCAB_LEVELS.flatMap((level) => {
      const checkpoint = getVocabCheckpoint(level, track)
      const summary = getVocabSessionSummary(level, track)
      if (checkpoint) {
        return [
          {
            key: `${track}-${level}-cp`,
            level,
            to: `/vocab-practice/${trackPath}/${vocabLevelToPath(level)}?resume=1`,
            title: '继续做题',
            meta: `${formatVocabProgress(checkpoint)} · ${formatRelativeTime(checkpoint.updatedAt)}`,
            done: false,
          },
        ]
      }
      if (summary) {
        return [
          {
            key: `${track}-${level}-sum`,
            level,
            to: `/vocab-practice/${trackPath}/${vocabLevelToPath(level)}?fresh=1`,
            title: summary.completed ? '再来一轮' : '继续做题',
            meta: `${formatVocabSessionSummary(summary)} · ${formatRelativeTime(summary.updatedAt)}`,
            done: summary.completed,
          },
        ]
      }
      return []
    })
    return { track, label, links }
  }).filter((group) => group.links.length > 0)

  const hasAnyWrong = VOCAB_LEVELS.some((level) =>
    HOME_TRACK_GROUPS.some(({ track }) => countVocabWrong(level, track) > 0),
  )

  return (
    <div className="page home">
      <section className="hero hero-compact">
        <p className="hero-label">日本語単語</p>
        <h1>単語练习</h1>
        <div className="hero-actions">
          <Link to="/vocab-practice" className="btn btn-primary">
            开始新练习
          </Link>
          <Link to="/vocabulary/exam" className="btn btn-secondary">
            単語库
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>上次答题记录</h2>
        </div>
        <div className="memory-panel memory-panel-card">
          {recordGroups.map(({ track, label, links }) => (
            <div key={`cp-${track}`} className="memory-block">
              <h3 className="memory-group-title">{label}</h3>
              <div className="memory-pill-links">
                {links.map((link) => (
                  <Link
                    key={link.key}
                    to={link.to}
                    className={`memory-pill-link ${link.done ? 'memory-pill-done' : 'memory-pill-continue'}`}
                  >
                    <span className="badge badge-level">{VOCAB_LEVEL_LABELS[link.level]}</span>
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
          {HOME_TRACK_GROUPS.map(({ track, label }) => {
            const links = VOCAB_LEVELS.map((level) => ({
              level,
              count: countVocabWrong(level, track),
            })).filter((item) => item.count > 0)
            if (links.length === 0) return null
            const trackPath = vocabTrackToPath(track)
            return (
              <div key={`wrong-${track}`} className="memory-block">
                <h3 className="memory-group-title">{label}</h3>
                <div className="memory-pill-links">
                  {links.map(({ level, count }) => (
                    <Link
                      key={level}
                      to={`/vocab-wrong/${trackPath}/${vocabLevelToPath(level)}`}
                      className="memory-pill-link memory-pill-wrong"
                    >
                      <span className="badge badge-level">{VOCAB_LEVEL_LABELS[level]}</span>
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
