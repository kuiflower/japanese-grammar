import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import VocabDetailContent from '@/components/vocab/VocabDetailContent'
import { getAllVocabularyEntries, getVocabularyEntryById } from '@/data/levels/vocabulary-db'
import type { VocabularyEntry } from '@/data/types/vocabulary-entry'
import {
  VOCAB_LEVELS,
  VOCAB_LEVEL_LABELS,
  VOCAB_TRACK_DESCS,
  VOCAB_TRACK_LABELS,
  VOCAB_TRACK_SHORT_LABELS,
  VOCAB_TRACKS,
  parseVocabTrackParam,
  vocabTrackToPath,
  type VocabLevel,
} from '@/types/vocab-quiz'

/** 列表右侧短词性：保留括号配对，避免「动词（一段」缺右括号 */
function shortPosLabel(pos: string): string {
  const withParen = pos.match(/^(.+?[（(])([^・）)]+)/)
  if (withParen) {
    const open = withParen[1]
    const close = open.includes('（') ? '）' : ')'
    return `${open}${withParen[2]}${close}`
  }
  return pos.split('・')[0] ?? pos
}

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
        <span className="grammar-row-lead">
          <span className="grammar-expand-icon" aria-hidden>
            {expanded ? '−' : '+'}
          </span>
          <span className="badge badge-level">{entry.level}</span>
        </span>
        <div className="grammar-row-main">
          <div className="grammar-row-topline">
            <h3>
              <span lang="ja">{entry.word}</span>
              <span className="grammar-ja" lang="ja">
                {entry.reading}
              </span>
            </h3>
            <span className="grammar-category">{shortPosLabel(entry.pos)}</span>
          </div>
          <p>{entry.meaning}</p>
        </div>
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
        <h1>単語库</h1>
        <p>
          {VOCAB_TRACK_LABELS[track]} · {filtered.length} 词
        </p>
        <p className="page-header-note">{VOCAB_TRACK_DESCS[track]}</p>
      </div>

      <div className="filter-bar track-filter-bar">
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
