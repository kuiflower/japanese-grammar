import { categoryLabels } from '@/data/grammar'
import type { GrammarPoint } from '@/types/grammar'

interface GrammarDetailContentProps {
  point: GrammarPoint
  /** full：独立详情页；inline：列表内展开，不重复标题 */
  variant?: 'full' | 'inline'
}

export default function GrammarDetailContent({
  point,
  variant = 'full',
}: GrammarDetailContentProps) {
  return (
    <>
      {variant === 'full' && (
        <div className="detail-header">
          <div className="detail-meta">
            <span className="badge badge-level">{point.level}</span>
            <span className="badge">{categoryLabels[point.category]}</span>
          </div>
          <h1>
            {point.title}
            <span className="detail-ja">{point.titleJa}</span>
          </h1>
          <p className="detail-summary">{point.summary}</p>
        </div>
      )}

      <div className="detail-blocks">
        <section className="detail-block">
          <h2>句型</h2>
          <p className="pattern">{point.pattern}</p>
        </section>

        <section className="detail-block">
          <h2>含义</h2>
          <p>{point.meaning}</p>
        </section>

        {point.usage && (
          <section className="detail-block">
            <h2>用法</h2>
            <p>{point.usage}</p>
          </section>
        )}

        <section className="detail-block">
          <h2>例句</h2>
          <ul className="example-list">
            {point.examples.map((example, index) => (
              <li key={index} className="example-item">
                <p className="example-ja">{example.japanese}</p>
                {example.reading && (
                  <p className="example-reading">{example.reading}</p>
                )}
                {example.chinese && (
                  <p className="example-zh">{example.chinese}</p>
                )}
              </li>
            ))}
          </ul>
        </section>

        {point.notes && (
          <section className="detail-block">
            <h2>辨析</h2>
            <p>{point.notes}</p>
          </section>
        )}
      </div>
    </>
  )
}
