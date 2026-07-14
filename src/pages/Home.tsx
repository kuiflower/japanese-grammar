import { Link } from 'react-router-dom'
import { GRAMMAR_HOME_PATH, VOCABULARY_HOME_PATH } from '@/lib/appSections'

const entries: {
  to: string
  ja: string
  title: string
  desc: string
  tone: 'grammar' | 'vocabulary'
  status: 'ready' | 'coming'
}[] = [
  {
    to: GRAMMAR_HOME_PATH,
    ja: '文法',
    title: '学文法',
    desc: '理清接续与近义辨析，做题时更快认出考点。现含 PRE-N3 / N3 / N2。',
    tone: 'grammar' as const,
    status: 'ready' as const,
  },
  {
    to: VOCABULARY_HOME_PATH,
    ja: '単語',
    title: '背単語',
    desc: '读音、意思、填空连过三关，适合考前突击或系统刷词。覆盖 N5～N1。',
    tone: 'vocabulary' as const,
    status: 'ready' as const,
  },
]

export default function Home() {
  return (
    <div className="page learning-hub">
      <section className="hero learning-hub-hero">
        <h1 className="hero-label">日本語JLPT备考训练</h1>
      </section>

      <div className="learning-hub-grid">
        {entries.map((entry) => (
          <Link
            key={entry.to}
            to={entry.to}
            className={`learning-hub-card learning-hub-card-${entry.tone}`}
          >
            <div className="learning-hub-card-top">
              <span className="learning-hub-ja" lang="ja">
                {entry.ja}
              </span>
              {entry.status === 'coming' ? (
                <span className="learning-hub-badge">筹备中</span>
              ) : null}
            </div>
            <h2>{entry.title}</h2>
            <p>{entry.desc}</p>
            <span className="learning-hub-enter">
              {entry.status === 'ready' ? '进入' : '先看看'}
              <span aria-hidden> →</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
