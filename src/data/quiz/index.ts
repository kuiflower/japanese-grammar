import type { GrammarBank, GrammarLevel } from '@/data/types/grammar-entry'
import type { JlptLevel, QuizQuestion, QuizRound } from '@/types/quiz'
import { getGrammarEntries } from '@/data/levels/grammar-db'
import { generateQuestionsFromGrammar } from './generateQuestions'

const questionBank: Partial<
  Record<GrammarBank, Partial<Record<GrammarLevel, QuizQuestion[]>>>
> = {}

/** 按级别、题库从对应数据库生成题目（模版通用） */
function loadQuestions(level: GrammarLevel, bank: GrammarBank): QuizQuestion[] {
  if (!questionBank[bank]) questionBank[bank] = {}
  const byLevel = questionBank[bank]!
  if (!byLevel[level]) {
    byLevel[level] = generateQuestionsFromGrammar(getGrammarEntries(level, bank), level)
  }
  return byLevel[level]!
}

export function getQuestionsByLevel(
  level: JlptLevel,
  bank: GrammarBank = 'basic',
): QuizQuestion[] {
  return loadQuestions(level, bank)
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
export function getQuizHubStats(level: JlptLevel, bank: GrammarBank = 'basic') {
  return {
    grammarCount: getGrammarEntries(level, bank).length,
  }
}
