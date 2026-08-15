import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getVocabularyCount } from '@/data/levels/vocabulary-db'
import {
  VOCAB_BANKS,
  VOCAB_BANK_LABELS,
  VOCAB_LEVELS,
  VOCAB_LEVEL_LABELS,
  VOCAB_TRACK_DESCS,
  VOCAB_TRACK_LABELS,
  VOCAB_TRACKS_BY_BANK,
  vocabLevelToPath,
  vocabTrackToPath,
  type VocabBank,
  type VocabLevel,
} from '@/types/vocab-quiz'

export default function VocabularyPractice() {
  const [bank, setBank] = useState<VocabBank>('basic')
  const [openLevel, setOpenLevel] = useState<VocabLevel | null>('N5')

  const tracks = VOCAB_TRACKS_BY_BANK[bank]

  return (
    <div className="page practice-hub">
      <header className="page-header">
        <h1>単語练习</h1>
        <p className="page-header-note">
          {bank === 'basic'
            ? '频出：考试高频词先突击 · 全套：整级词表系统过'
            : bank === 'reading'
              ? '阅读专项：读解里最核心的高频词'
              : '听力专项：听解场面里最核心的高频词'}
        </p>
      </header>

      <div className="filter-bar practice-bank-bar">
        {VOCAB_BANKS.map((item) => (
          <button
            key={item}
            type="button"
            className={bank === item ? 'filter-btn active' : 'filter-btn'}
            onClick={() => {
              setBank(item)
              const firstReady = VOCAB_LEVELS.find((level) =>
                VOCAB_TRACKS_BY_BANK[item].some(
                  (track) => getVocabularyCount(level, track) > 0,
                ),
              )
              setOpenLevel(firstReady ?? 'N5')
            }}
          >
            {VOCAB_BANK_LABELS[item]}
          </button>
        ))}
      </div>

      {VOCAB_LEVELS.map((level) => {
        const open = openLevel === level
        const total = tracks.reduce(
          (sum, track) => sum + getVocabularyCount(level, track),
          0,
        )

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
                {tracks.map((track, index) => {
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
