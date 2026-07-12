import type { JlptLevel, QuizQuestion, QuizRound } from '@/types/quiz'
import type { GrammarLevel } from '@/data/types/grammar-entry'
import { getGrammarEntries } from '@/data/levels/grammar-db'
import { generateQuestionsFromGrammar } from './generateQuestions'

const questionBank: Partial<Record<GrammarLevel, QuizQuestion[]>> = {}

/** 按级别从对应数据库生成题目（模版通用，数据按 level 隔离） */
function loadQuestions(level: GrammarLevel): QuizQuestion[] {
  if (!questionBank[level]) {
    questionBank[level] = generateQuestionsFromGrammar(getGrammarEntries(level), level)
  }
  return questionBank[level]!
}

export function getQuestionsByLevel(level: JlptLevel): QuizQuestion[] {
  return loadQuestions(level)
}

export function filterQuestions(
  questions: QuizQuestion[],
  round: QuizRound,
): QuizQuestion[] {
  if (round === 'all') return questions
  return questions.filter((q) => q.round === round)
}

export function shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const copy = [...questions]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** 练习中心轻量统计：只读词条数，不触发出题 */
export function getQuizHubStats(level: JlptLevel) {
  return {
    grammarCount: getGrammarEntries(level).length,
  }
}

/** 需要精确题数时再生成（会话内使用） */
export function getQuizStats(level: JlptLevel) {
  const all = getQuestionsByLevel(level)
  const grammarIds = new Set(all.map((q) => q.grammarId))
  return {
    total: all.length,
    grammarCount: grammarIds.size,
    round1: all.filter((q) => q.round === 'round1').length,
    round2: all.filter((q) => q.round === 'round2').length,
    enhanced: all.filter((q) => q.round === 'enhanced').length,
  }
}

export { generateQuestionsFromGrammar } from './generateQuestions'
