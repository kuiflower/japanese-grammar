import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import QuizCard from '@/components/quiz/QuizCard'
import {
  filterQuestions,
  getQuestionsByLevel,
  shuffleQuestions,
} from '@/data/quiz'
import {
  addUnfamiliarQuestion,
  addWrongQuestion,
  clearCheckpoint,
  getCheckpoint,
  removeUnfamiliarQuestion,
  removeWrongQuestion,
  saveCheckpoint,
  saveSessionSummary,
} from '@/lib/practiceStorage'
import {
  getUnfamiliarQuestionsForRound,
  getWrongQuestionsForRound,
  resolveQuestionsByIds,
} from '@/lib/practiceQuestions'
import type { JlptLevel, QuizQuestion, QuizRound } from '@/types/quiz'
import { LEVEL_LABELS, ROUND_LABELS, levelToPath, parseLevelParam } from '@/types/quiz'

const VALID_LEVELS: JlptLevel[] = ['PRE-N3', 'N2', 'N3']
const VALID_ROUNDS: QuizRound[] = ['all', 'round1', 'round2', 'enhanced']

function parseLevel(param?: string): JlptLevel | null {
  return parseLevelParam(param)
}

function parseRound(param: string | null): QuizRound {
  if (param && VALID_ROUNDS.includes(param as QuizRound)) {
    return param as QuizRound
  }
  return 'all'
}

interface AnswerRecord {
  selectedId: string
  correct: boolean
}

function answersFromLog(
  log: Map<string, AnswerRecord>,
): Record<string, AnswerRecord> {
  return Object.fromEntries(log.entries())
}

function logFromAnswers(
  answers?: Record<string, AnswerRecord>,
): Map<string, AnswerRecord> {
  return new Map(Object.entries(answers ?? {}))
}

interface PracticeSessionProps {
  mode?: 'practice' | 'wrong' | 'unfamiliar'
}

export default function PracticeSession({ mode = 'practice' }: PracticeSessionProps) {
  const { level: levelParam } = useParams<{ level: string }>()
  const [searchParams] = useSearchParams()
  const level = parseLevel(levelParam)
  const round = parseRound(searchParams.get('round'))
  const fresh = searchParams.get('fresh') === '1'
  const resume = searchParams.get('resume') === '1'
  const retryKey = searchParams.get('retry') ?? '0'

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [ready, setReady] = useState(false)
  const lastAnswerCorrect = useRef(false)
  const lastFamiliarRef = useRef(false)
  const correctCountRef = useRef(0)
  const answerLogRef = useRef<Map<string, AnswerRecord>>(new Map())
  /** 错题复习点了「猜对」：进入下一题，但保留在错题库 */
  const keepInWrongBankRef = useRef(false)
  /** 错题复习：按访问顺序记录题目，支持答对移出后仍可回到上一题 */
  const [wrongTrail, setWrongTrail] = useState<QuizQuestion[]>([])
  const [wrongTrailPos, setWrongTrailPos] = useState(0)
  const wrongInitialCountRef = useRef(0)

  const sessionKey = `${mode}-${level}-${round}-${fresh}-${resume}-${retryKey}`

  useEffect(() => {
    if (!level) return

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
          ? getWrongQuestionsForRound(level, round)
          : getUnfamiliarQuestionsForRound(level, round)
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

    const filtered = filterQuestions(getQuestionsByLevel(level), round)
    const cp = resume && !fresh ? getCheckpoint(level, round) : null

    let sessionQuestions: QuizQuestion[]
    let startIndex = 0
    let startCorrect = 0

    if (round === 'round1') {
      // 各级统一：第一轮始终用模版生成序（意思→用法→下一词条），不洗牌
      sessionQuestions = filtered
      if (cp) {
        const currentId = cp.questionIds[cp.currentIndex]
        const found = currentId
          ? filtered.findIndex((q) => q.id === currentId)
          : -1
        startIndex = found >= 0 ? found : 0
        startCorrect = cp.correctCount
        answerLogRef.current = logFromAnswers(cp.answers)
      }
    } else if (cp) {
      const restored = resolveQuestionsByIds(cp.questionIds, level)
      if (restored.length > 0) {
        sessionQuestions = restored
        startIndex = cp.currentIndex
        startCorrect = cp.correctCount
        answerLogRef.current = logFromAnswers(cp.answers)
      } else {
        sessionQuestions = shuffleQuestions(filtered)
      }
    } else {
      sessionQuestions = shuffleQuestions(filtered)
    }

    saveCheckpoint({
      level,
      round,
      questionIds: sessionQuestions.map((q) => q.id),
      currentIndex: startIndex,
      correctCount: startCorrect,
      answers: answersFromLog(answerLogRef.current),
      updatedAt: Date.now(),
    })
    setQuestions(sessionQuestions)
    setIndex(startIndex)
    setCorrectCount(startCorrect)
    correctCountRef.current = startCorrect
    setReady(true)
  }, [sessionKey, level, mode, round, fresh, resume, retryKey])

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
  const backLink = isBankMode ? '/learn/grammar' : '/practice'
  const backLabel = isBankMode ? '← 首页' : '← 返回'

  if (!level || !VALID_LEVELS.includes(level)) {
    return (
      <div className="page empty-state">
        <h1>无效的等级</h1>
        <Link to="/learn/grammar" className="btn btn-primary">
          返回首页
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
            ? '该分类下没有需要复习的错题，继续保持！'
            : mode === 'unfamiliar'
              ? '该分类下没有需要巩固的不熟悉题。'
              : '该模式下还没有题目，请换其他模式。'}
        </p>
        <Link to={backLink} className="btn btn-primary">
          {isBankMode ? '返回首页' : '返回练习'}
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
            {LEVEL_LABELS[level]} · {ROUND_LABELS[round]}
            {mode === 'wrong' ? ' · 错题复习' : ''}
            {mode === 'unfamiliar' ? ' · 不熟悉复习' : ''}
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
              本轮真正学会了 {correctCount} 道文法题
            </p>
          )}
          {mode === 'unfamiliar' && (
            <p className="quiz-result-pct">
              本轮熟悉了 {correctCount} 道文法题
            </p>
          )}
          <div className="quiz-result-actions">
            {mode === 'practice' ? (
              <Link
                to={`/practice/${levelToPath(level)}?round=${round}&fresh=1`}
                className="btn btn-primary"
              >
                再来一轮
              </Link>
            ) : (
              <Link to="/learn/grammar" className="btn btn-primary">
                返回首页
              </Link>
            )}
            <Link to={backLink} className="btn btn-secondary">
              {isBankMode ? '回首页' : '返回练习'}
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
        <p className="session-mode-hint">答对移除 · 蒙对点「猜对」暂留</p>
      )}
      {mode === 'unfamiliar' && (
        <p className="session-mode-hint">限时内答出即熟悉并移除</p>
      )}
      <QuizCard
        key={`${current.id}@${displayIndex}`}
        question={current}
        questionIndex={displayIndex}
        total={displayTotal}
        initialSelectedId={answerLogRef.current.get(current.id)?.selectedId ?? null}
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
          saveCheckpoint({
            level,
            round,
            questionIds: questions.map((q) => q.id),
            currentIndex: prevIndex,
            correctCount: correctCountRef.current,
            answers: answersFromLog(answerLogRef.current),
            updatedAt: Date.now(),
          })
          const prevQuestion = questions[prevIndex]
          const prevRecord = prevQuestion
            ? answerLogRef.current.get(prevQuestion.id)
            : undefined
          lastAnswerCorrect.current = prevRecord?.correct ?? false
          setIndex(prevIndex)
        }}
        onAnswer={(correct, selectedId, meta) => {
          lastAnswerCorrect.current = correct
          lastFamiliarRef.current = meta.familiar
          const previous = answerLogRef.current.get(current.id)
          answerLogRef.current.set(current.id, { selectedId, correct })
          if (previous) return

          if (mode === 'practice') {
            if (correct) {
              correctCountRef.current += 1
              setCorrectCount(correctCountRef.current)
            } else {
              addWrongQuestion(current.id, level)
            }
            if (meta.familiar) {
              removeUnfamiliarQuestion(current.id)
            } else {
              addUnfamiliarQuestion(current.id, level, meta.elapsedMs)
            }
            saveCheckpoint({
              level,
              round,
              questionIds: questions.map((q) => q.id),
              currentIndex: index,
              correctCount: correctCountRef.current,
              answers: answersFromLog(answerLogRef.current),
              updatedAt: Date.now(),
            })
          } else if (mode === 'unfamiliar') {
            if (meta.familiar) {
              correctCountRef.current += 1
              setCorrectCount(correctCountRef.current)
            } else {
              addUnfamiliarQuestion(current.id, level, meta.elapsedMs)
            }
          } else if (correct) {
            correctCountRef.current += 1
            setCorrectCount(correctCountRef.current)
          }
        }}
        onGuessedCorrect={
          mode === 'practice'
            ? () => addWrongQuestion(current.id, level)
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
                removeWrongQuestion(current.id)
              } else {
                removeUnfamiliarQuestion(current.id)
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
            saveSessionSummary({
              level,
              round,
              questionIds: questions.map((q) => q.id),
              currentIndex: questions.length,
              correctCount: correctCountRef.current,
              completed: true,
              updatedAt: Date.now(),
            })
            clearCheckpoint(level, round)
            setFinished(true)
          } else {
            saveCheckpoint({
              level,
              round,
              questionIds: questions.map((q) => q.id),
              currentIndex: nextIndex,
              correctCount: correctCountRef.current,
              answers: answersFromLog(answerLogRef.current),
              updatedAt: Date.now(),
            })
            setIndex(nextIndex)
          }
        }}
      />
    </div>
  )
}
