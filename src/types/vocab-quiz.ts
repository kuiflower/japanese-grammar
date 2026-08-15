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

export const VOCAB_TRACKS: VocabTrack[] = ['exam', 'full', 'reading', 'listening']

/** 単語库只展示频出 / 全套 */
export const VOCAB_LIBRARY_TRACKS: VocabTrack[] = ['exam', 'full']

export type VocabBank = 'basic' | 'reading' | 'listening'

export const VOCAB_BANKS: VocabBank[] = ['basic', 'reading', 'listening']

export const VOCAB_BANK_LABELS: Record<VocabBank, string> = {
  basic: '基础单词',
  reading: '阅读专项',
  listening: '听力专项',
}

export const VOCAB_TRACKS_BY_BANK: Record<VocabBank, VocabTrack[]> = {
  basic: ['exam', 'full'],
  reading: ['reading'],
  listening: ['listening'],
}

export const VOCAB_LEVEL_LABELS: Record<VocabLevel, string> = {
  N5: 'N5',
  N4: 'N4',
  N3: 'N3',
  N2: 'N2',
  N1: 'N1',
}

/** 同等级题库 */
export const VOCAB_TRACK_LABELS: Record<VocabTrack, string> = {
  exam: '频出単語',
  full: '全套単語',
  reading: '阅读高频词汇',
  listening: '听力高频词汇',
}

export const VOCAB_TRACK_SHORT_LABELS: Record<VocabTrack, string> = {
  exam: '频出単語',
  full: '全套単語',
  reading: '阅读高频',
  listening: '听力高频',
}

export const VOCAB_TRACK_DESCS: Record<VocabTrack, string> = {
  exam: '考试里反复出现的高频词，先背这些提分更快',
  full: '该等级完整词表，适合系统扫一遍、查漏补缺',
  reading: '读解里反复出现的核心词，先认这些更快读懂',
  listening: '听解场面里反复出现的核心词，先听这些更稳',
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
  if (param === 'exam' || param === 'full' || param === 'reading' || param === 'listening') {
    return param
  }
  return null
}
