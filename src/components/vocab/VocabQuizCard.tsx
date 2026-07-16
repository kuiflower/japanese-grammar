import { useEffect, useMemo, useRef, useState } from 'react'
import type { VocabCompositeQuestion, VocabQuizOption } from '@/types/vocab-quiz'
import { FAMILIAR_MS, formatElapsed, isFamiliar } from '@/lib/familiarity'

export interface VocabStepAnswer {
  stepIndex: number
  selectedId: string
  correct: boolean
}

interface VocabQuizCardProps {
  question: VocabCompositeQuestion
  questionIndex: number
  total: number
  initialAnswers?: VocabStepAnswer[] | null
  onAnswer: (
    correct: boolean,
    answers: VocabStepAnswer[],
    meta: { elapsedMs: number; familiar: boolean },
  ) => void
  onNext: () => void
  onPrevious?: () => void
  canGoPrevious?: boolean
  onGuessedCorrect?: () => void
  isLast: boolean
}

function posHeaderLabel(question: VocabCompositeQuestion): string {
  if (question.transitivity) {
    return `${question.pos} · ${question.transitivity}`
  }
  return question.pos
}

function StepOptions({
  options,
  correctOptionId,
  selectedId,
  locked,
  onSelect,
}: {
  options: VocabQuizOption[]
  correctOptionId: string
  selectedId: string | null
  locked: boolean
  onSelect: (option: VocabQuizOption) => void
}) {
  return (
    <ul className="quiz-options vocab-step-options" role="listbox">
      {options.map((option) => {
        let stateClass = ''
        if (locked && selectedId) {
          if (option.id === correctOptionId) stateClass = 'correct'
          else if (option.id === selectedId) stateClass = 'wrong'
          else stateClass = 'dimmed'
        }

        return (
          <li key={option.id}>
            <button
              type="button"
              className={`quiz-option ${stateClass}`}
              onClick={() => onSelect(option)}
              disabled={locked}
            >
              <span className="quiz-option-id">{option.id.toUpperCase()}</span>
              <span className="quiz-option-text">{option.text}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default function VocabQuizCard({
  question,
  questionIndex,
  total,
  initialAnswers = null,
  onAnswer,
  onNext,
  onPrevious,
  canGoPrevious = false,
  onGuessedCorrect,
  isLast,
}: VocabQuizCardProps) {
  const [answers, setAnswers] = useState<VocabStepAnswer[]>(initialAnswers ?? [])
  const [activeStep, setActiveStep] = useState(
    initialAnswers?.length ? Math.min(initialAnswers.length, 2) : 0,
  )
  const [finished, setFinished] = useState(
    (initialAnswers?.length ?? 0) >= question.steps.length,
  )
  const [elapsedMs, setElapsedMs] = useState(0)
  const [answerMeta, setAnswerMeta] = useState<{
    elapsedMs: number
    familiar: boolean
  } | null>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const step3Ref = useRef<HTMLElement>(null)
  const shouldScrollToStep3 = useRef(false)
  const shouldScrollToFeedback = useRef(false)
  const startedAtRef = useRef(0)

  useEffect(() => {
    const init = initialAnswers ?? []
    setAnswers(init)
    setActiveStep(init.length >= question.steps.length ? 2 : init.length)
    setFinished(init.length >= question.steps.length)
    setAnswerMeta(null)
    startedAtRef.current = performance.now()
    setElapsedMs(0)
  }, [question.id, questionIndex, initialAnswers, question.steps.length])

  useEffect(() => {
    if (finished || (initialAnswers?.length ?? 0) >= question.steps.length) return
    const id = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAtRef.current)
    }, 200)
    return () => window.clearInterval(id)
  }, [finished, initialAnswers, question.id, questionIndex, question.steps.length])

  useEffect(() => {
    if (activeStep !== 2 || !shouldScrollToStep3.current) return
    shouldScrollToStep3.current = false
    const id = window.requestAnimationFrame(() => {
      step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [activeStep, question.id])

  useEffect(() => {
    if (!finished || !shouldScrollToFeedback.current) return
    shouldScrollToFeedback.current = false
    const id = window.requestAnimationFrame(() => {
      const el = feedbackRef.current
      if (!el) return
      // 与文法题一致：留出底部余量，避免按钮被手机浏览器底栏挡住
      const bottomGap = 112
      const absoluteBottom = el.getBoundingClientRect().bottom + window.scrollY
      const top = Math.max(0, absoluteBottom - window.innerHeight + bottomGap)
      window.scrollTo({ top, behavior: 'smooth' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [finished, question.id])

  const allCorrect = useMemo(
    () => answers.length === question.steps.length && answers.every((a) => a.correct),
    [answers, question.steps.length],
  )

  function handleStepSelect(stepIndex: number, option: VocabQuizOption) {
    if (finished || stepIndex !== activeStep) return
    const step = question.steps[stepIndex]!
    const correct = option.id === step.correctOptionId
    const record: VocabStepAnswer = {
      stepIndex,
      selectedId: option.id,
      correct,
    }
    const nextAnswers = [...answers.filter((a) => a.stepIndex !== stepIndex), record].sort(
      (a, b) => a.stepIndex - b.stepIndex,
    )
    setAnswers(nextAnswers)

    if (stepIndex < question.steps.length - 1) {
      const nextStep = stepIndex + 1
      if (nextStep === question.steps.length - 1) {
        shouldScrollToStep3.current = true
      }
      setActiveStep(nextStep)
      return
    }

    shouldScrollToFeedback.current = true
    setFinished(true)
    const overall = nextAnswers.every((a) => a.correct)
    const ms = Math.round(performance.now() - startedAtRef.current)
    const familiar = isFamiliar(ms, 'vocab')
    const meta = { elapsedMs: ms, familiar }
    setElapsedMs(ms)
    setAnswerMeta(meta)
    onAnswer(overall, nextAnswers, meta)
  }

  function getStepAnswer(stepIndex: number) {
    return answers.find((a) => a.stepIndex === stepIndex) ?? null
  }

  const progress = ((questionIndex + (finished ? 1 : answers.length / question.steps.length)) / total) * 100
  const displayMs = answerMeta?.elapsedMs ?? elapsedMs
  const showFamiliarHint = answerMeta != null
  const withinFamiliar =
    answerMeta != null ? answerMeta.familiar : elapsedMs <= FAMILIAR_MS.vocab
  const resumeView = (initialAnswers?.length ?? 0) >= question.steps.length
  const showTimer = !resumeView

  return (
    <article className="quiz-card vocab-quiz-card">
      <div className="quiz-status">
        <div className="quiz-progress">
          <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="quiz-counter">
          {questionIndex + 1} / {total}
        </p>
        {showTimer ? (
          <p
            className={`quiz-elapsed${
              withinFamiliar ? ' quiz-elapsed-ok' : ' quiz-elapsed-over'
            }`}
            aria-hidden="true"
          >
            {formatElapsed(displayMs)}
            {showFamiliarHint ? (answerMeta.familiar ? ' · 熟' : ' · 生') : ''}
          </p>
        ) : (
          <span className="quiz-elapsed-spacer" aria-hidden="true" />
        )}
      </div>

      <header className="quiz-card-header">
        <div className="quiz-meta">
          <span className="badge badge-level">{question.level}</span>
          <span className="quiz-type-badge">复合题</span>
        </div>
        {canGoPrevious && onPrevious && (
          <button type="button" className="quiz-prev-btn" onClick={onPrevious}>
            ← 上一题
          </button>
        )}
      </header>

      <div className="vocab-quiz-head">
        <p className="vocab-quiz-word" lang="ja">
          {question.word}
        </p>
        <p className="vocab-quiz-pos">{posHeaderLabel(question)}</p>
        {question.pair && !question.transitivity && (
          <p className="vocab-quiz-pair">↔ {question.pair}</p>
        )}
      </div>

      <div className="vocab-quiz-steps">
        {question.steps.map((step, stepIndex) => {
          const stepAnswer = getStepAnswer(stepIndex)
          const locked = finished || stepAnswer !== null
          const unlocked = stepIndex <= activeStep || stepAnswer !== null
          const correctText = step.options.find((o) => o.id === step.correctOptionId)?.text

          return (
            <section
              key={step.type}
              ref={stepIndex === 2 ? step3Ref : undefined}
              className={`vocab-quiz-step${unlocked ? '' : ' vocab-quiz-step-locked'}${
                stepAnswer ? (stepAnswer.correct ? ' vocab-quiz-step-ok' : ' vocab-quiz-step-ng') : ''
              }`}
            >
              <h3 className="vocab-quiz-step-title">
                <span className="vocab-quiz-step-num">{stepIndex + 1}</span>
                <span className="vocab-quiz-step-label">{step.typeLabel}</span>
                {stepAnswer && !stepAnswer.correct && locked && (
                  <span className="vocab-quiz-step-answer">
                    正确 {step.correctOptionId.toUpperCase()} {correctText}
                  </span>
                )}
              </h3>
              {step.prompt ? <p className="vocab-quiz-step-prompt">{step.prompt}</p> : null}
              {unlocked ? (
                <StepOptions
                  options={step.options}
                  correctOptionId={step.correctOptionId}
                  selectedId={stepAnswer?.selectedId ?? null}
                  locked={locked}
                  onSelect={(option) => handleStepSelect(stepIndex, option)}
                />
              ) : (
                <p className="vocab-quiz-step-hint">请先完成上一步</p>
              )}
            </section>
          )
        })}
      </div>

      {finished && (
        <div
          ref={feedbackRef}
          className={`quiz-feedback ${allCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-wrong'}`}
          role="status"
        >
          <p className="quiz-feedback-title">
            {allCorrect ? '✓ 三步全部正确' : '✗ 有错误，已收录到错题库'}
          </p>
          <div className="quiz-explanation">
            <p className="quiz-explanation-label">解析</p>
            <pre className="vocab-quiz-explanation">{question.explanation}</pre>
          </div>
          <div className="quiz-action-buttons">
            {allCorrect && onGuessedCorrect && (
              <button
                type="button"
                className="btn btn-secondary quiz-guessed-btn"
                onClick={() => {
                  onGuessedCorrect()
                  onNext()
                }}
              >
                猜对
              </button>
            )}
            <button type="button" className="btn btn-primary quiz-next-btn" onClick={onNext}>
              {isLast ? '查看成绩' : '下一题'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
