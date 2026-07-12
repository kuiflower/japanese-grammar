import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import VocabDetailContent from '@/components/vocab/VocabDetailContent'
import { getAllVocabularyEntries, getVocabularyEntryById } from '@/data/levels/vocabulary-db'
import type { VocabularyEntry } from '@/data/types/vocabulary-entry'
import {
  VOCAB_LEVELS,
  VOCAB_LEVEL_LABELS,
  VOCAB_TRACK_LABELS,
  VOCAB_TRACK_SHORT_LABELS,
  VOCAB_TRACKS,
  parseVocabTrackParam,
  vocabTrackToPath,
  type VocabLevel,
} from '@/types/vocab-quiz'

function VocabRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: VocabularyEntry
  expanded: boolean
  onToggle: () => void
}) {
  const itemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [expanded])

  return (
    <div
      ref={itemRef}
      className={`grammar-item vocab-item${expanded ? ' grammar-item-expanded' : ''}`}
    >
      <button
        type="button"
        className="grammar-row"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="grammar-expand-icon" aria-hidden>
          {expanded ? '−' : '+'}
        </span>
        <span className="badge badge-level">{entry.level}</span>
        <div className="grammar-row-main">
          <h3>
            <span lang="ja">{entry.word}</span>
            <span className="grammar-ja" lang="ja">
              {entry.reading}
            </span>
          </h3>
          <p>{entry.meaning}</p>
        </div>
        <span className="grammar-category">{entry.pos.split('・')[0]}</span>
      </button>
      {expanded && (
        <div className="grammar-row-detail">
          <VocabDetailContent entry={entry} variant="inline" />
        </div>
      )}
    </div>
  )
}

export default function VocabularyList() {
  const { track: trackParam, id: routeId } = useParams<{ track?: string; id?: string }>()
  const track = parseVocabTrackParam(trackParam)
  const navigate = useNavigate()
  const [selectedLevel, setSelectedLevel] = useState<VocabLevel | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(routeId ?? null)

  useEffect(() => {
    if (!track || !routeId) {
      setExpandedId(null)
      return
    }
    const entry = getVocabularyEntryById(routeId, track)
    if (entry) {
      setExpandedId(routeId)
      setSelectedLevel((prev) => (prev === 'all' || prev === entry.level ? prev : 'all'))
    } else {
      setExpandedId(null)
    }
  }, [routeId, track])

  if (!track) {
    return <Navigate to="/vocabulary/exam" replace />
  }

  const trackPath = vocabTrackToPath(track)
  const allEntries = getAllVocabularyEntries(track)
  const filtered =
    selectedLevel === 'all'
      ? allEntries
      : allEntries.filter((entry) => entry.level === selectedLevel)

  const toggleRow = (id: string) => {
    const next = expandedId === id ? null : id
    setExpandedId(next)
    navigate(next ? `/vocabulary/${trackPath}/${next}` : `/vocabulary/${trackPath}`, {
      replace: true,
    })
  }

  return (
    <div className="page vocabulary-list">
      <div className="page-header">
        <h1>单词库</h1>
        <p>
          {VOCAB_TRACK_LABELS[track]} · 共 {filtered.length} 个单词 · 点击条目展开详情
        </p>
      </div>

      <div className="filter-bar">
        {VOCAB_TRACKS.map((t) => (
          <button
            key={t}
            type="button"
            className={track === t ? 'filter-btn active' : 'filter-btn'}
            onClick={() => navigate(`/vocabulary/${vocabTrackToPath(t)}`)}
          >
            {VOCAB_TRACK_SHORT_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <button
          type="button"
          className={selectedLevel === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setSelectedLevel('all')}
        >
          全部等级
        </button>
        {VOCAB_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={selectedLevel === level ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setSelectedLevel(level)}
          >
            {VOCAB_LEVEL_LABELS[level]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="placeholder-section">
          <p>该题库词表筹备中，敬请期待。</p>
        </div>
      ) : (
        <div className="grammar-table">
          {filtered.map((entry) => (
            <VocabRow
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => toggleRow(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
