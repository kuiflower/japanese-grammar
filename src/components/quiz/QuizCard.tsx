import { useEffect, useMemo, useRef, useState } from 'react'
import type { QuizOption, QuizQuestion } from '@/types/quiz'
import { QUESTION_TYPE_LABELS } from '@/types/quiz'

function isJapaneseLine(text: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9faf]/.test(text) && !/^【/.test(text)
}

function Round1Explanation({ text }: { text: string }) {
  const sections = useMemo(() => {
    const result: { label: string; lines: string[] }[] = []
    let current: { label: string; lines: string[] } | null = null
    for (const line of text.split('\n')) {
      const m = line.match(/^【(.+?)】(.*)$/)
      if (m) {
        if (current) result.push(current)
        const rest = m[2].trim()
        current = { label: m[1], lines: rest ? [rest] : [] }
      } else if (current && line.trim()) {
        current.lines.push(line.trim())
      }
    }
    if (current) result.push(current)
    return result
  }, [text])

  return (
    <div className="quiz-explanation-round1">
      {sections.map((section) => (
        <div key={section.label} className="quiz-explanation-section">
          <p className="quiz-explanation-section-label">{section.label}</p>
          {section.label === '例句' ? (
            <ul className="quiz-explanation-examples">
              {section.lines.map((line, i) =>
                isJapaneseLine(line) ? (
                  <li key={i} className="quiz-ex-example-ja">
                    {line}
                  </li>
                ) : (
                  <li key={i} className="quiz-ex-example-zh">
                    {line}
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="quiz-explanation-section-text">{section.lines.join('')}</p>
          )}
        </div>
      ))}
    </div>
  )
}

interface QuizCardProps {
  question: QuizQuestion
  questionIndex: number
  total: number
  initialSelectedId?: string | null
  onAnswer: (correct: boolean, selectedId: string) => void
  onNext: () => void
  onPrevious?: () => void
  canGoPrevious?: boolean
  /** 答对时显示「猜对」 */
  onGuessedCorrect?: () => void
  isLast: boolean
}

export default function QuizCard({
  question,
  questionIndex,
  total,
  initialSelectedId = null,
  onAnswer,
  onNext,
  onPrevious,
  canGoPrevious = false,
  onGuessedCorrect,
  isLast,
}: QuizCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const shouldScrollToFeedback = useRef(false)

  useEffect(() => {
    setSelectedId(initialSelectedId ?? null)
  }, [question.id, questionIndex, initialSelectedId])

  const answered = selectedId !== null
  const isCorrect = selectedId === question.correctOptionId

  useEffect(() => {
    if (!answered || !shouldScrollToFeedback.current) return
    shouldScrollToFeedback.current = false
    const id = window.requestAnimationFrame(() => {
      const el = feedbackRef.current
      if (!el) return
      // 文法解析较长；留出底部余量，避免「下一题」被手机浏览器底栏挡住
      const bottomGap = 112
      const absoluteBottom = el.getBoundingClientRect().bottom + window.scrollY
      const top = Math.max(0, absoluteBottom - window.innerHeight + bottomGap)
      window.scrollTo({ top, behavior: 'smooth' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [answered, question.id])

  const correctOption = useMemo(
    () => question.options.find((o) => o.id === question.correctOptionId),
    [question],
  )

  function handleSelect(option: QuizOption) {
    if (answered) return
    shouldScrollToFeedback.current = true
    setSelectedId(option.id)
    onAnswer(option.id === question.correctOptionId, option.id)
  }

  function handleNext() {
    setSelectedId(null)
    onNext()
  }

  function handleGuessedCorrect() {
    onGuessedCorrect?.()
    handleNext()
  }

  const progress = ((questionIndex + (answered ? 1 : 0)) / total) * 100

  return (
    <article className="quiz-card">
      <div className="quiz-progress">
        <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <header className="quiz-card-header">
        <div className="quiz-meta">
          <span className="badge badge-level">{question.level}</span>
          <span className="quiz-grammar-tag">{question.grammarPattern}</span>
          <span className="quiz-type-badge">{question.typeLabel}</span>
        </div>
        <div className="quiz-header-actions">
          {canGoPrevious && onPrevious && (
            <button
              type="button"
              className="quiz-prev-btn"
              onClick={onPrevious}
            >
              上一题
            </button>
          )}
          <p className="quiz-counter">
            {questionIndex + 1} / {total}
          </p>
        </div>
      </header>

      <h2 className="quiz-prompt">{question.prompt}</h2>

      <ul className="quiz-options" role="listbox" aria-label="选项">
        {question.options.map((option) => {
          let stateClass = ''
          if (answered) {
            if (option.id === question.correctOptionId) {
              stateClass = 'correct'
            } else if (option.id === selectedId) {
              stateClass = 'wrong'
            } else {
              stateClass = 'dimmed'
            }
          } else if (option.id === selectedId) {
            stateClass = 'selected'
          }

          return (
            <li key={option.id}>
              <button
                type="button"
                className={`quiz-option ${stateClass}`}
                onClick={() => handleSelect(option)}
                disabled={answered}
                aria-pressed={selectedId === option.id}
              >
                <span className="quiz-option-id">{option.id.toUpperCase()}</span>
                <span className="quiz-option-text">{option.text}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {answered && (
        <div
          ref={feedbackRef}
          className={`quiz-feedback ${isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-wrong'}`}
          role="status"
        >
          <p className="quiz-feedback-title">
            {isCorrect ? '✓ 回答正确' : '✗ 回答错误'}
          </p>
          {!isCorrect && correctOption && (
            <p className="quiz-feedback-answer">
              正确答案：<strong>{correctOption.id.toUpperCase()}</strong>{' '}
              {correctOption.text}
            </p>
          )}
          <div className="quiz-explanation">
            <p className="quiz-explanation-label">解析</p>
            {question.round === 'round1' ? (
              <Round1Explanation text={question.explanation} />
            ) : (
              <p className="quiz-explanation-text">{question.explanation}</p>
            )}
          </div>
          <div className="quiz-action-buttons">
            {isCorrect && onGuessedCorrect && (
              <button
                type="button"
                className="btn btn-secondary quiz-guessed-btn"
                onClick={handleGuessedCorrect}
              >
                猜对
              </button>
            )}
            <button type="button" className="btn btn-primary quiz-next-btn" onClick={handleNext}>
              {isLast ? '查看成绩' : '下一题'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export function QuizTypeLegend() {
  return (
    <ul className="quiz-legend">
      {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
        <li key={key}>{label}</li>
      ))}
    </ul>
  )
}
