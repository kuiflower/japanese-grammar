import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getVocabularyCount } from '@/data/levels/vocabulary-db'
import {
  VOCAB_LEVELS,
  VOCAB_LEVEL_LABELS,
  VOCAB_TRACK_DESCS,
  VOCAB_TRACK_LABELS,
  VOCAB_TRACKS,
  vocabLevelToPath,
  vocabTrackToPath,
  type VocabLevel,
} from '@/types/vocab-quiz'

export default function VocabularyPractice() {
  const [openLevel, setOpenLevel] = useState<VocabLevel | null>('N5')

  return (
    <div className="page practice-hub">
      <header className="page-header">
        <h1>単語练习</h1>
        <p className="page-header-note">
          频出：考试高频词先突击 · 全套：整级词表系统过
        </p>
      </header>

      {VOCAB_LEVELS.map((level) => {
        const open = openLevel === level
        const examCount = getVocabularyCount(level, 'exam')
        const fullCount = getVocabularyCount(level, 'full')
        const total = examCount + fullCount

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
                <span className="badge badge-level">{VOCAB_LEVEL_LABELS[level]}</span>
                <div>
                  <h2>{VOCAB_LEVEL_LABELS[level]} 単語</h2>
                  <p className="practice-level-meta">
                    {total > 0 ? `${total} 词` : '筹备中'}
                  </p>
                </div>
              </div>
              <span className="practice-level-chevron" aria-hidden>
                {open ? '▾' : '▸'}
              </span>
            </button>

            {open && (
              <div className="practice-mode-grid">
                {VOCAB_TRACKS.map((track, index) => {
                  const wordCount = getVocabularyCount(level, track)
                  const ready = wordCount > 0
                  const recommended = index === 0 && ready

                  if (!ready) {
                    return (
                      <div
                        key={track}
                        className="practice-mode-card practice-mode-card-disabled"
                      >
                        <h3>{VOCAB_TRACK_LABELS[track]}</h3>
                        <p>{VOCAB_TRACK_DESCS[track]}</p>
                        <span className="practice-mode-count">筹备中</span>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={track}
                      to={`/vocab-practice/${vocabTrackToPath(track)}/${vocabLevelToPath(level)}?fresh=1`}
                      className={`practice-mode-card ${recommended ? 'recommended' : ''}`}
                    >
                      {recommended && <span className="practice-recommend">推荐</span>}
                      <h3>{VOCAB_TRACK_LABELS[track]}</h3>
                      <p>{VOCAB_TRACK_DESCS[track]}</p>
                      <span className="practice-mode-count">{wordCount} 词</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
