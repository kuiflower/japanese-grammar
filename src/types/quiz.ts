import type { GrammarBank } from '@/data/types/grammar-entry'

export type { GrammarBank }
export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2'

export const GRAMMAR_BANKS: GrammarBank[] = ['basic', 'reading', 'listening']

export const GRAMMAR_BANK_LABELS: Record<GrammarBank, string> = {
  basic: '基础语法',
  reading: '阅读专项',
  listening: '听力专项',
}

type QuizQuestionType =
  | 'meaning'
  | 'usage'
  | 'sentence-pick'
  | 'fill-blank'
  | 'error-detect'

export type QuizRound = 'round1' | 'round2' | 'enhanced' | 'all'

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  level: JlptLevel
  grammarId: string
  grammarPattern: string
  type: QuizQuestionType
  round: QuizRound
  typeLabel: string
  prompt: string
  options: QuizOption[]
  correctOptionId: string
  explanation: string
}

export const LEVEL_LABELS: Record<JlptLevel, string> = {
  N5: 'N5',
  N4: 'N4',
  N3: 'N3',
  N2: 'N2',
}

/** 练习列表等标题（徽章仍用 LEVEL_LABELS，不含「文法」） */
export function grammarLevelTitle(level: JlptLevel): string {
  return `${LEVEL_LABELS[level]} 文法`
}

export const ROUND_LABELS: Record<QuizRound, string> = {
  round1: '第一轮 · 意思与用法',
  round2: '第二轮 · 例句运用',
  enhanced: '第二轮 · 增强',
  all: '全部题型',
}

export function levelToPath(level: JlptLevel): string {
  return level
}

export function parseLevelParam(param?: string): JlptLevel | null {
  if (param === 'pre-n3' || param === 'PRE-N3') return 'N3'
  if (param === 'N5' || param === 'n5') return 'N5'
  if (param === 'N4' || param === 'n4') return 'N4'
  if (param === 'N3' || param === 'n3') return 'N3'
  if (param === 'N2' || param === 'n2') return 'N2'
  return null
}

export function parseGrammarBankParam(param?: string): GrammarBank | null {
  if (param === 'basic' || param === 'reading' || param === 'listening') return param
  return null
}

export function grammarPracticePath(
  level: JlptLevel,
  round: QuizRound,
  bank: GrammarBank = 'basic',
  extra: 'fresh' | 'resume' = 'fresh',
): string {
  const base =
    bank === 'basic'
      ? `/practice/${levelToPath(level)}`
      : `/practice/${bank}/${levelToPath(level)}`
  return `${base}?round=${round}&${extra}=1`
}

export function grammarWrongPath(
  level: JlptLevel,
  round: QuizRound,
  bank: GrammarBank = 'basic',
): string {
  const base =
    bank === 'basic' ? `/wrong/${levelToPath(level)}` : `/wrong/${bank}/${levelToPath(level)}`
  return `${base}?round=${round}`
}

export function grammarUnfamiliarPath(
  level: JlptLevel,
  round: QuizRound,
  bank: GrammarBank = 'basic',
): string {
  const base =
    bank === 'basic'
      ? `/unfamiliar/${levelToPath(level)}`
      : `/unfamiliar/${bank}/${levelToPath(level)}`
  return `${base}?round=${round}`
}
