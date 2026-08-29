import { Link } from 'react-router-dom'

interface PracticeResumePromptProps {
  title: string
  subtitle?: string
  progress: string
  updatedAt: string
  onResume: () => void
  onFresh: () => void
  backLink: string
  backLabel?: string
}

export default function PracticeResumePrompt({
  title,
  subtitle,
  progress,
  updatedAt,
  onResume,
  onFresh,
  backLink,
  backLabel = '← 返回',
}: PracticeResumePromptProps) {
  return (
    <div className="page practice-resume-prompt">
      <div className="practice-resume-card">
        <p className="practice-resume-label">{title}</p>
        {subtitle && <p className="practice-resume-subtitle">{subtitle}</p>}
        <h1>发现未完成的练习</h1>
        <p className="practice-resume-meta">
          进度 {progress} · {updatedAt}
        </p>
        <p className="practice-resume-hint">可从上次节点继续，或重新开始一轮。</p>
        <div className="practice-resume-actions">
          <button type="button" className="btn btn-primary" onClick={onResume}>
            继续上次进度
          </button>
          <button type="button" className="btn btn-secondary" onClick={onFresh}>
            重新开始
          </button>
          <Link to={backLink} className="btn btn-secondary">
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
