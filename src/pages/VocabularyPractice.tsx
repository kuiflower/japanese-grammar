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
} from '@/types/vocab-quiz'

export default function VocabularyPractice() {
  return (
    <div className="page practice-hub">
      <header className="page-header">
        <h1>单词练习</h1>
        <p className="page-header-note">
          频出：考试高频词先突击 · 全套：整级词表系统过
        </p>
      </header>

      {VOCAB_LEVELS.map((level) => (
        <section key={level} className="practice-level-section">
          <div className="practice-level-header">
            <div>
              <span className="badge badge-level">{VOCAB_LEVEL_LABELS[level]}</span>
              <h2>{VOCAB_LEVEL_LABELS[level]} 单词练习</h2>
            </div>
          </div>

          <div className="practice-mode-grid">
            {VOCAB_TRACKS.map((track, index) => {
              const wordCount = getVocabularyCount(level, track)
              const ready = wordCount > 0
              const recommended = index === 0 && ready

              if (!ready) {
                return (
                  <div key={track} className="practice-mode-card practice-mode-card-disabled">
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
        </section>
      ))}
    </div>
  )
}
