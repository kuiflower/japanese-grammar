import type { VocabularyEntry } from '@/data/types/vocabulary-entry'

interface VocabDetailContentProps {
  entry: VocabularyEntry
  variant?: 'inline' | 'card'
}

export default function VocabDetailContent({
  entry,
  variant = 'inline',
}: VocabDetailContentProps) {
  const className =
    variant === 'card' ? 'vocab-detail vocab-detail-card' : 'vocab-detail vocab-detail-inline'

  return (
    <div className={className}>
      <dl className="vocab-detail-grid">
        <div>
          <dt>读音</dt>
          <dd lang="ja">{entry.reading}</dd>
        </div>
        <div>
          <dt>词性</dt>
          <dd>{entry.pos}</dd>
        </div>
        {entry.transitivity && (
          <div>
            <dt>自他</dt>
            <dd>
              {entry.transitivity}
              {entry.pair ? `（↔ ${entry.pair}）` : ''}
            </dd>
          </div>
        )}
        <div>
          <dt>释义</dt>
          <dd>{entry.meaning}</dd>
        </div>
        {entry.notes && (
          <div>
            <dt>备注</dt>
            <dd>{entry.notes}</dd>
          </div>
        )}
      </dl>
      <div className="vocab-detail-example">
        <p className="vocab-detail-example-label">例句</p>
        <p className="vocab-detail-example-ja" lang="ja">
          {entry.example.japanese}
        </p>
        {entry.example.chinese && (
          <p className="vocab-detail-example-zh">{entry.example.chinese}</p>
        )}
      </div>
    </div>
  )
}
