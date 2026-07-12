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
    desc: '语法库浏览、分级练习与错题复习，覆盖 PRE-N3 / N3 / N2。',
    tone: 'grammar' as const,
    status: 'ready' as const,
  },
  {
    to: VOCABULARY_HOME_PATH,
    ja: '単語',
    title: '背单词',
    desc: '复合题练习（读音·释义·填空）；每级含频出与全套两套题库，进度分开保存。',
    tone: 'vocabulary' as const,
    status: 'ready' as const,
  },
]

export default function Home() {
  return (
    <div className="page learning-hub">
      <section className="hero learning-hub-hero">
        <p className="hero-label">日本語学習</p>
        <h1>选择学习板块</h1>
        <p className="hero-desc">
          文法与单词分开练习，进度分别保存在本机浏览器。
        </p>
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
