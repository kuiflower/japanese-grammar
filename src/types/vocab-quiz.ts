import type { VocabLevel, VocabTrack } from '@/data/types/vocabulary-entry'

export type { VocabLevel, VocabTrack }

export interface VocabQuizOption {
  id: string
  text: string
}

export type VocabQuizStepType = 'reading' | 'meaning' | 'cloze'

export interface VocabQuizStep {
  type: VocabQuizStepType
  typeLabel: string
  prompt: string
  options: VocabQuizOption[]
  correctOptionId: string
}

export interface VocabCompositeQuestion {
  id: string
  track: VocabTrack
  level: VocabLevel
  vocabId: string
  word: string
  pos: string
  transitivity?: string
  pair?: string
  steps: [VocabQuizStep, VocabQuizStep, VocabQuizStep]
  explanation: string
}

export const VOCAB_LEVELS: VocabLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export const VOCAB_TRACKS: VocabTrack[] = ['exam', 'full']

export const VOCAB_LEVEL_LABELS: Record<VocabLevel, string> = {
  N5: 'N5',
  N4: 'N4',
  N3: 'N3',
  N2: 'N2',
  N1: 'N1',
}

/** 同等级两套题库：频出 / 全套 */
export const VOCAB_TRACK_LABELS: Record<VocabTrack, string> = {
  exam: '频出单词',
  full: '全套单词',
}

export const VOCAB_TRACK_SHORT_LABELS: Record<VocabTrack, string> = {
  exam: '频出单词',
  full: '全套单词',
}

export const VOCAB_TRACK_DESCS: Record<VocabTrack, string> = {
  exam: '考试高频精简词表，优先突破常考词',
  full: '该等级完整词库，系统覆盖巩固',
}

export const VOCAB_STEP_LABELS: Record<VocabQuizStepType, string> = {
  reading: '选读音',
  meaning: '选中文意思',
  cloze: '例句填空',
}

export function vocabLevelToPath(level: VocabLevel): string {
  return level.toLowerCase()
}

export function vocabTrackToPath(track: VocabTrack): string {
  return track
}

export function parseVocabLevelParam(param?: string): VocabLevel | null {
  const upper = param?.toUpperCase()
  if (upper && VOCAB_LEVELS.includes(upper as VocabLevel)) {
    return upper as VocabLevel
  }
  return null
}

export function parseVocabTrackParam(param?: string): VocabTrack | null {
  if (param === 'exam' || param === 'full') return param
  return null
}
