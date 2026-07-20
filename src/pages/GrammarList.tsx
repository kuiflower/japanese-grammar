import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import GrammarDetailContent from '@/components/grammar/GrammarDetailContent'
import { grammarPoints, categoryLabels, getGrammarById } from '@/data/grammar'
import type { GrammarPoint, JlptLevel } from '@/types/grammar'
import { LEVEL_LABELS } from '@/types/quiz'

const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

function GrammarRow({
  point,
  expanded,
  onToggle,
}: {
  point: GrammarPoint
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
      className={`grammar-item${expanded ? ' grammar-item-expanded' : ''}`}
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
          <span className="badge badge-level">{point.level}</span>
        </span>
        <div className="grammar-row-main">
          <div className="grammar-row-topline">
            <h3>
              {point.title}
              {point.titleJa && point.titleJa !== point.title ? (
                <span className="grammar-ja">{point.titleJa}</span>
              ) : null}
            </h3>
            <span className="grammar-category">{categoryLabels[point.category]}</span>
          </div>
          <p>{point.summary}</p>
        </div>
      </button>
      {expanded && (
        <div className="grammar-row-detail">
          <GrammarDetailContent point={point} variant="inline" />
        </div>
      )}
    </div>
  )
}

export default function GrammarList() {
  const { id: routeId } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(routeId ?? null)

  useEffect(() => {
    if (!routeId) {
      setExpandedId(null)
      return
    }
    const point = getGrammarById(routeId)
    if (point) {
      setExpandedId(routeId)
      setSelectedLevel((prev) =>
        prev === 'all' || prev === point.level ? prev : 'all',
      )
    } else {
      setExpandedId(null)
    }
  }, [routeId])

  const filtered =
    selectedLevel === 'all'
      ? grammarPoints
      : grammarPoints.filter((point) => point.level === selectedLevel)

  const toggleRow = (id: string) => {
    const next = expandedId === id ? null : id
    setExpandedId(next)
    navigate(next ? `/grammar/${next}` : '/grammar', { replace: true })
  }

  return (
    <div className="page grammar-list">
      <div className="page-header">
        <h1>文法库</h1>
        <p>共 {filtered.length} 条</p>
      </div>

      <div className="filter-bar">
        <button
          className={selectedLevel === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setSelectedLevel('all')}
        >
          全部
        </button>
        {levels.map((level) => (
          <button
            key={level}
            className={selectedLevel === level ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setSelectedLevel(level)}
          >
            {LEVEL_LABELS[level as keyof typeof LEVEL_LABELS] ?? level}
          </button>
        ))}
      </div>

      <div className="grammar-table">
        {filtered.map((point) => (
          <GrammarRow
            key={point.id}
            point={point}
            expanded={expandedId === point.id}
            onToggle={() => toggleRow(point.id)}
          />
        ))}
      </div>
    </div>
  )
}
