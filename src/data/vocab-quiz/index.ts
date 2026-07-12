import type { VocabLevel, VocabTrack } from '@/data/types/vocabulary-entry'
import type { VocabCompositeQuestion } from '@/types/vocab-quiz'
import { getVocabularyCount, getVocabularyEntries } from '@/data/levels/vocabulary-db'
import { generateQuestionsFromVocabulary } from './generateQuestions'

const questionBank: Partial<
  Record<VocabTrack, Partial<Record<VocabLevel, VocabCompositeQuestion[]>>>
> = {}

function loadQuestions(level: VocabLevel, track: VocabTrack): VocabCompositeQuestion[] {
  if (!questionBank[track]) questionBank[track] = {}
  const byLevel = questionBank[track]!
  if (!byLevel[level]) {
    byLevel[level] = generateQuestionsFromVocabulary(
      getVocabularyEntries(level, track),
      track,
    )
  }
  return byLevel[level]!
}

export function getVocabQuestionsByLevel(
  level: VocabLevel,
  track: VocabTrack = 'exam',
): VocabCompositeQuestion[] {
  return loadQuestions(level, track)
}

/** 练习中心轻量统计：词条数=题数，不触发出题 */
export function getVocabQuizStats(level: VocabLevel, track: VocabTrack = 'exam') {
  const wordCount = getVocabularyCount(level, track)
  return {
    wordCount,
    total: wordCount,
  }
}

export function resolveVocabQuestionsByIds(
  ids: string[],
  level: VocabLevel,
  track: VocabTrack = 'exam',
): VocabCompositeQuestion[] {
  const map = new Map(getVocabQuestionsByLevel(level, track).map((q) => [q.id, q]))
  return ids.map((id) => map.get(id)).filter((q): q is VocabCompositeQuestion => !!q)
}

export { generateQuestionsFromVocabulary } from './generateQuestions'
