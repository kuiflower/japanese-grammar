import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import VocabQuizCard, { type VocabStepAnswer } from '@/components/vocab/VocabQuizCard'
import { getVocabQuestionsByLevel } from '@/data/vocab-quiz'
import {
  addVocabUnfamiliarQuestion,
  addVocabWrongQuestion,
  clearVocabCheckpoint,
  getVocabCheckpoint,
  removeVocabUnfamiliarQuestion,
  removeVocabWrongQuestion,
  saveVocabCheckpoint,
  saveVocabSessionSummary,
} from '@/lib/vocabPracticeStorage'
import {
  getVocabUnfamiliarQuestions,
  getVocabWrongQuestions,
  resolveVocabQuestions,
} from '@/lib/vocabPracticeQuestions'
import type { VocabCompositeQuestion } from '@/types/vocab-quiz'
import {
  VOCAB_LEVEL_LABELS,
  VOCAB_LEVELS,
  VOCAB_TRACK_LABELS,
  parseVocabLevelParam,
  parseVocabTrackParam,
  vocabLevelToPath,
  vocabTrackToPath,
} from '@/types/vocab-quiz'

interface VocabAnswerRecord {
  answers: VocabStepAnswer[]
  correct: boolean
}

interface VocabularyPracticeSessionProps {
  mode?: 'practice' | 'wrong' | 'unfamiliar'
}

export default function VocabularyPracticeSession({
  mode = 'practice',
}: VocabularyPracticeSessionProps) {
  const { track: trackParam, level: levelParam } = useParams<{
    track: string
    level: string
  }>()
  const [searchParams] = useSearchParams()
  const track = parseVocabTrackParam(trackParam)
  const level = parseVocabLevelParam(levelParam)
  const fresh = searchParams.get('fresh') === '1'
  const resume = searchParams.get('resume') === '1'
  const retryKey = searchParams.get('retry') ?? '0'

  const [questions, setQuestions] = useState<VocabCompositeQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [ready, setReady] = useState(false)
  const lastAnswerCorrect = useRef(false)
  const lastFamiliarRef = useRef(false)
  const correctCountRef = useRef(0)
  const answerLogRef = useRef<Map<string, VocabAnswerRecord>>(new Map())
  const keepInWrongBankRef = useRef(false)
  const [wrongTrail, setWrongTrail] = useState<VocabCompositeQuestion[]>([])
  const [wrongTrailPos, setWrongTrailPos] = useState(0)
  const wrongInitialCountRef = useRef(0)

  const sessionKey = `${mode}-${track}-${level}-${fresh}-${resume}-${retryKey}`

  useEffect(() => {
    if (!level || !track) return

    setReady(false)
    setFinished(false)
    lastAnswerCorrect.current = false
    lastFamiliarRef.current = false
    answerLogRef.current = new Map()
    keepInWrongBankRef.current = false
    setWrongTrail([])
    setWrongTrailPos(0)
    wrongInitialCountRef.current = 0

    if (mode === 'wrong' || mode === 'unfamiliar') {
      const bankQs =
        mode === 'wrong'
          ? getVocabWrongQuestions(level, track)
          : getVocabUnfamiliarQuestions(level, track)
      wrongInitialCountRef.current = bankQs.length
      setWrongTrail(bankQs.length > 0 ? [bankQs[0]!] : [])
      setWrongTrailPos(0)
      setQuestions(bankQs)
      setIndex(0)
      setCorrectCount(0)
      correctCountRef.current = 0
      setReady(true)
      return
    }

    const ordered = getVocabQuestionsByLevel(level, track)

    if (resume && !fresh) {
      const cp = getVocabCheckpoint(level, track)
      if (cp) {
        const restored = resolveVocabQuestions(cp.questionIds, level, track)
        if (restored.length > 0) {
          setQuestions(restored)
          setIndex(cp.currentIndex)
          setCorrectCount(cp.correctCount)
          correctCountRef.current = cp.correctCount
          setReady(true)
          return
        }
      }
    }

    saveVocabCheckpoint({
      track,
      level,
      questionIds: ordered.map((q) => q.id),
      currentIndex: 0,
      correctCount: 0,
      updatedAt: Date.now(),
    })
    setQuestions(ordered)
    setIndex(0)
    setCorrectCount(0)
    correctCountRef.current = 0
    setReady(true)
  }, [sessionKey, level, track, mode, fresh, resume, retryKey])

  if (!track) {
    return <Navigate to="/learn/vocabulary" replace />
  }

  const trackPath = vocabTrackToPath(track)
  const isBankMode = mode === 'wrong' || mode === 'unfamiliar'
  const current = isBankMode ? wrongTrail[wrongTrailPos] : questions[index]
  const displayIndex = isBankMode ? wrongTrailPos : index
  const displayTotal = isBankMode ? wrongInitialCountRef.current : questions.length
  const canGoPrevious = isBankMode ? wrongTrailPos > 0 : index > 0
  const poolIndex =
    isBankMode && current ? questions.findIndex((q) => q.id === current.id) : -1
  const isLastWrong =
    isBankMode &&
    wrongTrailPos >= wrongTrail.length - 1 &&
    poolIndex >= questions.length - 1
  const backLink = isBankMode ? '/learn/vocabulary' : '/vocab-practice'
  const backLabel = isBankMode ? '← 首页' : '← 返回'

  if (!level || !VOCAB_LEVELS.includes(level)) {
    return (
      <div className="page empty-state">
        <h1>无效的等级</h1>
        <Link to="/vocab-practice" className="btn btn-primary">
          返回练习
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="page empty-state">
        <p>加载题目中…</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="page empty-state">
        <h1>
          {mode === 'wrong'
            ? '暂无错题'
            : mode === 'unfamiliar'
              ? '暂无不熟悉题'
              : '暂无题目'}
        </h1>
        <p>
          {mode === 'wrong'
            ? '该等级没有需要复习的错题。'
            : mode === 'unfamiliar'
              ? '该等级没有需要巩固的不熟悉题。'
              : '该等级词库筹备中，请先导入単語数据。'}
        </p>
        <Link to={backLink} className="btn btn-primary">
          {backLabel}
        </Link>
      </div>
    )
  }

  if (finished) {
    const pct =
      mode === 'practice'
        ? Math.round((correctCount / Math.max(questions.length, 1)) * 100)
        : 0

    return (
      <div className="page quiz-result">
        <div className="quiz-result-card">
          <p className="quiz-result-label">
            {VOCAB_TRACK_LABELS[track]} · {VOCAB_LEVEL_LABELS[level]}
            {mode === 'wrong'
              ? ' · 错题复习'
              : mode === 'unfamiliar'
                ? ' · 不熟悉复习'
                : ' · 単語练习'}
          </p>
          <h1>
            {mode === 'wrong'
              ? '错题复习完成'
              : mode === 'unfamiliar'
                ? '不熟悉复习完成'
                : '练习完成'}
          </h1>
          {mode === 'practice' && (
            <>
              <p className="quiz-result-score">
                {correctCount} <span>/ {questions.length}</span>
              </p>
              <p className="quiz-result-pct">正确率 {pct}%</p>
            </>
          )}
          {mode === 'wrong' && (
            <p className="quiz-result-pct">
              本轮真正记住了 {correctCount} 个単語
            </p>
          )}
          {mode === 'unfamiliar' && (
            <p className="quiz-result-pct">本轮熟悉了 {correctCount} 个単語</p>
          )}
          <div className="quiz-result-actions">
            {mode === 'practice' ? (
              <Link
                to={`/vocab-practice/${trackPath}/${vocabLevelToPath(level)}?fresh=1`}
                className="btn btn-primary"
              >
                再来一轮
              </Link>
            ) : (
              <Link to="/learn/vocabulary" className="btn btn-primary">
                返回首页
              </Link>
            )}
            <Link to={backLink} className="btn btn-secondary">
              {isBankMode ? '回首页' : '换题库'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="page empty-state">
        <h1>题目加载异常</h1>
        <Link to={backLink} className="btn btn-primary">
          返回
        </Link>
      </div>
    )
  }

  return (
    <div className="page quiz-session">
      <Link to={backLink} className="back-link">
        {backLabel}
      </Link>
      {mode === 'wrong' && (
        <p className="session-mode-hint">三关全对才移除 · 蒙对点「猜对」暂留</p>
      )}
      {mode === 'unfamiliar' && (
        <p className="session-mode-hint">限时内答完三关即熟悉并移除</p>
      )}
      <VocabQuizCard
        key={`${current.id}@${displayIndex}`}
        question={current}
        questionIndex={displayIndex}
        total={displayTotal}
        initialAnswers={answerLogRef.current.get(current.id)?.answers ?? null}
        isLast={
          isBankMode
            ? isLastWrong
            : questions.length <= 1 || index >= questions.length - 1
        }
        canGoPrevious={canGoPrevious}
        onPrevious={() => {
          if (isBankMode) {
            const prevPos = wrongTrailPos - 1
            const prev = wrongTrail[prevPos]
            const prevRecord = prev ? answerLogRef.current.get(prev.id) : undefined
            lastAnswerCorrect.current = prevRecord?.correct ?? false
            setWrongTrailPos(prevPos)
            return
          }

          const prevIndex = index - 1
          saveVocabCheckpoint({
            track,
            level,
            questionIds: questions.map((q) => q.id),
            currentIndex: prevIndex,
            correctCount: correctCountRef.current,
            updatedAt: Date.now(),
          })
          const prevQuestion = questions[prevIndex]
          const prevRecord = prevQuestion
            ? answerLogRef.current.get(prevQuestion.id)
            : undefined
          lastAnswerCorrect.current = prevRecord?.correct ?? false
          setIndex(prevIndex)
        }}
        onAnswer={(correct, answers, meta) => {
          lastAnswerCorrect.current = correct
          lastFamiliarRef.current = meta.familiar
          answerLogRef.current.set(current.id, { answers, correct })
          if (mode === 'practice') {
            if (correct) {
              correctCountRef.current += 1
              setCorrectCount(correctCountRef.current)
            } else {
              addVocabWrongQuestion(current.id, level, track)
            }
            if (meta.familiar) {
              removeVocabUnfamiliarQuestion(current.id, track)
            } else {
              addVocabUnfamiliarQuestion(current.id, level, track, meta.elapsedMs)
            }
          } else if (mode === 'unfamiliar') {
            if (meta.familiar) {
              correctCountRef.current += 1
              setCorrectCount(correctCountRef.current)
            } else {
              addVocabUnfamiliarQuestion(current.id, level, track, meta.elapsedMs)
            }
          } else if (correct) {
            correctCountRef.current += 1
            setCorrectCount(correctCountRef.current)
          }
        }}
        onGuessedCorrect={
          mode === 'practice'
            ? () => addVocabWrongQuestion(current.id, level, track)
            : mode === 'wrong'
              ? () => {
                  keepInWrongBankRef.current = true
                }
              : undefined
        }
        onNext={() => {
          if (isBankMode) {
            const keepInBank = keepInWrongBankRef.current
            keepInWrongBankRef.current = false
            const shouldRemove =
              mode === 'wrong'
                ? lastAnswerCorrect.current && !keepInBank
                : lastFamiliarRef.current

            if (shouldRemove) {
              if (mode === 'wrong') {
                removeVocabWrongQuestion(current.id, track)
              } else {
                removeVocabUnfamiliarQuestion(current.id, track)
              }
              answerLogRef.current.delete(current.id)
              const remaining = questions.filter((q) => q.id !== current.id)
              setQuestions(remaining)

              if (remaining.length === 0) {
                setFinished(true)
                return
              }

              if (wrongTrailPos < wrongTrail.length - 1) {
                setWrongTrailPos((p) => p + 1)
              } else {
                const pi = questions.findIndex((q) => q.id === current.id)
                const next = remaining[pi] ?? remaining[0]
                if (!next) {
                  setFinished(true)
                  return
                }
                setWrongTrail((trail) => [...trail, next])
                setWrongTrailPos((p) => p + 1)
              }
              return
            }

            if (wrongTrailPos < wrongTrail.length - 1) {
              setWrongTrailPos((p) => p + 1)
              return
            }

            const pi = questions.findIndex((q) => q.id === current.id)
            const next = questions[pi + 1]
            if (!next) {
              setFinished(true)
              return
            }
            setWrongTrail((trail) => [...trail, next])
            setWrongTrailPos((p) => p + 1)
            return
          }

          const nextIndex = index + 1
          if (nextIndex >= questions.length) {
            saveVocabSessionSummary({
              track,
              level,
              questionIds: questions.map((q) => q.id),
              currentIndex: questions.length,
              correctCount: correctCountRef.current,
              completed: true,
              updatedAt: Date.now(),
            })
            clearVocabCheckpoint(level, track)
            setFinished(true)
          } else {
            saveVocabCheckpoint({
              track,
              level,
              questionIds: questions.map((q) => q.id),
              currentIndex: nextIndex,
              correctCount: correctCountRef.current,
              updatedAt: Date.now(),
            })
            setIndex(nextIndex)
          }
        }}
      />
    </div>
  )
}
