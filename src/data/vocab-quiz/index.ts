import type { VocabLevel, VocabTrack } from '@/data/types/vocabulary-entry'
import type { VocabCompositeQuestion } from '@/types/vocab-quiz'
import { getVocabularyEntries } from '@/data/levels/vocabulary-db'
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

/** 新开一轮时打乱词序，避免全套词表按词性成块导致前半段全是名词 */
export function shuffleVocabQuestions(
  questions: VocabCompositeQuestion[],
): VocabCompositeQuestion[] {
  const copy = [...questions]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

export function resolveVocabQuestionsByIds(
  ids: string[],
  level: VocabLevel,
  track: VocabTrack = 'exam',
): VocabCompositeQuestion[] {
  const map = new Map(getVocabQuestionsByLevel(level, track).map((q) => [q.id, q]))
  return ids.map((id) => map.get(id)).filter((q): q is VocabCompositeQuestion => !!q)
}
