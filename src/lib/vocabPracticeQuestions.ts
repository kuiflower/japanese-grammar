import type { VocabLevel, VocabTrack } from '@/types/vocab-quiz'
import {
  getVocabQuestionsByLevel,
  resolveVocabQuestionsByIds,
} from '@/data/vocab-quiz'
import { readVocabWrongRecords } from '@/lib/vocabPracticeStorage'

/** 仅练习/错题会话使用：会加载并生成题库 */
export function resolveVocabQuestions(
  ids: string[],
  level: VocabLevel,
  track: VocabTrack = 'exam',
) {
  return resolveVocabQuestionsByIds(ids, level, track)
}

export function getVocabWrongQuestions(level: VocabLevel, track: VocabTrack = 'exam') {
  const ids = new Set(
    readVocabWrongRecords()
      .filter((r) => r.level === level && r.track === track)
      .map((r) => r.questionId),
  )
  return getVocabQuestionsByLevel(level, track).filter((q) => ids.has(q.id))
}
