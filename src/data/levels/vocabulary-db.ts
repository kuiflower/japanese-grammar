import type {
  VocabLevel,
  VocabTrack,
  VocabularyEntry,
} from '@/data/types/vocabulary-entry'
import n5VocabularyExam from './n5/vocabulary.json'
import n4VocabularyExam from './n4/vocabulary.json'
import n3VocabularyExam from './n3/vocabulary.json'
import n2VocabularyExam from './n2/vocabulary.json'
import n1VocabularyExam from './n1/vocabulary.json'
import n5VocabularyFull from './n5/vocabulary-full.json'
import n4VocabularyFull from './n4/vocabulary-full.json'
import n3VocabularyFull from './n3/vocabulary-full.json'
import n2VocabularyFull from './n2/vocabulary-full.json'
import n1VocabularyFull from './n1/vocabulary-full.json'

/**
 * 单词库：每级两套题库
 * - 频出：vocabulary.json
 * - 全套：vocabulary-full.json
 */
const LEVEL_VOCABULARY_EXAM_DB: Record<VocabLevel, VocabularyEntry[]> = {
  N5: n5VocabularyExam as VocabularyEntry[],
  N4: n4VocabularyExam as VocabularyEntry[],
  N3: n3VocabularyExam as VocabularyEntry[],
  N2: n2VocabularyExam as VocabularyEntry[],
  N1: n1VocabularyExam as VocabularyEntry[],
}

const LEVEL_VOCABULARY_FULL_DB: Record<VocabLevel, VocabularyEntry[]> = {
  N5: n5VocabularyFull as VocabularyEntry[],
  N4: n4VocabularyFull as VocabularyEntry[],
  N3: n3VocabularyFull as VocabularyEntry[],
  N2: n2VocabularyFull as VocabularyEntry[],
  N1: n1VocabularyFull as VocabularyEntry[],
}

const LEVEL_VOCABULARY_DB: Record<
  VocabTrack,
  Record<VocabLevel, VocabularyEntry[]>
> = {
  exam: LEVEL_VOCABULARY_EXAM_DB,
  full: LEVEL_VOCABULARY_FULL_DB,
}

const VOCABULARY_LEVELS: VocabLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export function getVocabularyEntries(
  level: VocabLevel,
  track: VocabTrack = 'exam',
): VocabularyEntry[] {
  return LEVEL_VOCABULARY_DB[track][level]
}

export function getAllVocabularyEntries(track: VocabTrack = 'exam'): VocabularyEntry[] {
  return VOCABULARY_LEVELS.flatMap((level) => LEVEL_VOCABULARY_DB[track][level])
}

export function getVocabularyEntryById(
  id: string,
  track: VocabTrack = 'exam',
): VocabularyEntry | undefined {
  return getAllVocabularyEntries(track).find((e) => e.id === id)
}

export function getVocabularyCount(
  level: VocabLevel,
  track: VocabTrack = 'exam',
): number {
  return LEVEL_VOCABULARY_DB[track][level].length
}
