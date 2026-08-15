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
import n5VocabularyReading from './n5/vocabulary-reading.json'
import n4VocabularyReading from './n4/vocabulary-reading.json'
import n3VocabularyReading from './n3/vocabulary-reading.json'
import n2VocabularyReading from './n2/vocabulary-reading.json'
import n1VocabularyReading from './n1/vocabulary-reading.json'
import n5VocabularyListening from './n5/vocabulary-listening.json'
import n4VocabularyListening from './n4/vocabulary-listening.json'
import n3VocabularyListening from './n3/vocabulary-listening.json'
import n2VocabularyListening from './n2/vocabulary-listening.json'
import n1VocabularyListening from './n1/vocabulary-listening.json'

/**
 * 单词库：每级频出 / 全套；阅读、听力专项另文件（空数组 = 筹备中）
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

const LEVEL_VOCABULARY_READING_DB: Record<VocabLevel, VocabularyEntry[]> = {
  N5: n5VocabularyReading as VocabularyEntry[],
  N4: n4VocabularyReading as VocabularyEntry[],
  N3: n3VocabularyReading as VocabularyEntry[],
  N2: n2VocabularyReading as VocabularyEntry[],
  N1: n1VocabularyReading as VocabularyEntry[],
}

const LEVEL_VOCABULARY_LISTENING_DB: Record<VocabLevel, VocabularyEntry[]> = {
  N5: n5VocabularyListening as VocabularyEntry[],
  N4: n4VocabularyListening as VocabularyEntry[],
  N3: n3VocabularyListening as VocabularyEntry[],
  N2: n2VocabularyListening as VocabularyEntry[],
  N1: n1VocabularyListening as VocabularyEntry[],
}

const LEVEL_VOCABULARY_DB: Record<
  VocabTrack,
  Record<VocabLevel, VocabularyEntry[]>
> = {
  exam: LEVEL_VOCABULARY_EXAM_DB,
  full: LEVEL_VOCABULARY_FULL_DB,
  reading: LEVEL_VOCABULARY_READING_DB,
  listening: LEVEL_VOCABULARY_LISTENING_DB,
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
