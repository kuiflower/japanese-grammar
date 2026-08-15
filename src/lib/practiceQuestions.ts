import type { GrammarBank } from '@/data/types/grammar-entry'
import type { JlptLevel, QuizQuestion, QuizRound } from '@/types/quiz'
import { filterQuestions, getQuestionsByLevel } from '@/data/quiz'
import { listUnfamiliarRecords, readWrongRecords } from '@/lib/practiceStorage'

/** 仅练习/错题会话使用：会加载并生成题库 */
export function resolveQuestionsByIds(
  ids: string[],
  level: JlptLevel,
  bank: GrammarBank = 'basic',
): QuizQuestion[] {
  const map = new Map(getQuestionsByLevel(level, bank).map((q) => [q.id, q]))
  return ids.map((id) => map.get(id)).filter((q): q is QuizQuestion => !!q)
}

export function getWrongQuestionsForRound(
  level: JlptLevel,
  round: QuizRound,
  bank: GrammarBank = 'basic',
): QuizQuestion[] {
  const ids = new Set(
    readWrongRecords()
      .filter((r) => r.level === level && r.bank === bank)
      .map((r) => r.questionId),
  )
  const questions = getQuestionsByLevel(level, bank).filter((q) => ids.has(q.id))
  return filterQuestions(questions, round)
}

export function getUnfamiliarQuestionsForRound(
  level: JlptLevel,
  round: QuizRound,
  bank: GrammarBank = 'basic',
): QuizQuestion[] {
  const ids = new Set(
    listUnfamiliarRecords()
      .filter((r) => r.level === level && r.bank === bank)
      .map((r) => r.questionId),
  )
  const questions = getQuestionsByLevel(level, bank).filter((q) => ids.has(q.id))
  return filterQuestions(questions, round)
}
