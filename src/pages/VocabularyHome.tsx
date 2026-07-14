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
  type VocabPracticeCheckpoint,
  type VocabPracticeSessionSummary,
} from '@/lib/vocabPracticeStorage'
import {
  VOCAB_LEVELS,
  VOCAB_LEVEL_LABELS,
  vocabLevelToPath,
  vocabTrackToPath,
  type VocabLevel,
  type VocabTrack,
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

function ProgressRow({
  track,
  level,
  checkpoint,
  summary,
}: {
  track: VocabTrack
  level: VocabLevel
  checkpoint: VocabPracticeCheckpoint | null
  summary: VocabPracticeSessionSummary | null
}) {
  const trackPath = vocabTrackToPath(track)
  return (
    <div className="memory-row">
      <div className="memory-row-main">
        <span className="badge badge-level">{VOCAB_LEVEL_LABELS[level]}</span>
      </div>
      <div className="memory-row-actions">
        {checkpoint ? (
          <Link
            to={`/vocab-practice/${trackPath}/${vocabLevelToPath(level)}?resume=1`}
            className="memory-chip memory-chip-continue"
          >
            <span className="memory-chip-title">继续做题</span>
            <span className="memory-chip-meta">
              {formatVocabProgress(checkpoint)} · {formatRelativeTime(checkpoint.updatedAt)}
            </span>
          </Link>
        ) : summary ? (
          <Link
            to={`/vocab-practice/${trackPath}/${vocabLevelToPath(level)}?fresh=1`}
            className={`memory-chip ${summary.completed ? 'memory-chip-done' : 'memory-chip-continue'}`}
          >
            <span className="memory-chip-title">
              {summary.completed ? '再来一轮' : '继续做题'}
            </span>
            <span className="memory-chip-meta">
              {formatVocabSessionSummary(summary)} · {formatRelativeTime(summary.updatedAt)}
            </span>
          </Link>
        ) : (
          <span className="memory-chip memory-chip-empty">暂无记录</span>
        )}
      </div>
    </div>
  )
}

export default function VocabularyHome() {
  const { version } = useStorageVersion()
  const [, setTick] = useState(0)

  useEffect(() => {
    setTick(version)
  }, [version])

  const hasAnyWrong = VOCAB_LEVELS.some((level) =>
    HOME_TRACK_GROUPS.some(({ track }) => countVocabWrong(level, track) > 0),
  )

  return (
    <div className="page home">
      <section className="hero hero-compact">
        <p className="hero-label">日本語単語</p>
        <h1>单词练习中心</h1>
        <div className="hero-actions">
          <Link to="/vocab-practice" className="btn btn-primary">
            开始新练习
          </Link>
          <Link to="/vocabulary/exam" className="btn btn-secondary">
            单词库
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>上次答题记录</h2>
        </div>
        <div className="memory-panel">
          {HOME_TRACK_GROUPS.map(({ track, label }) => (
            <div key={`cp-${track}`} className="memory-group">
              <h3 className="memory-group-title">{label}</h3>
              {VOCAB_LEVELS.map((level) => (
                <ProgressRow
                  key={`${track}-${level}`}
                  track={track}
                  level={level}
                  checkpoint={getVocabCheckpoint(level, track)}
                  summary={getVocabSessionSummary(level, track)}
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
          {HOME_TRACK_GROUPS.map(({ track, label }) => {
            const links = VOCAB_LEVELS.map((level) => ({
              level,
              count: countVocabWrong(level, track),
            })).filter((item) => item.count > 0)
            if (links.length === 0) return null
            const trackPath = vocabTrackToPath(track)
            return (
              <div key={`wrong-${track}`} className="memory-wrong-block">
                <h3 className="memory-group-title">{label}</h3>
                <div className="memory-wrong-links">
                  {links.map(({ level, count }) => (
                    <Link
                      key={level}
                      to={`/vocab-wrong/${trackPath}/${vocabLevelToPath(level)}`}
                      className="memory-wrong-link"
                    >
                      <span className="badge badge-level">{VOCAB_LEVEL_LABELS[level]}</span>
                      <span>{count} 题待复习</span>
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
