export type JlptLevel = 'PRE-N3' | 'N2' | 'N3'

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
  'PRE-N3': 'PRE-N3',
  N2: 'N2',
  N3: 'N3',
}

/** 练习列表等标题（徽章仍用 LEVEL_LABELS，不含「文法」） */
export function grammarLevelTitle(level: JlptLevel): string {
  return level === 'PRE-N3' ? 'PRE-N3文法' : `${LEVEL_LABELS[level]} 文法`
}

export const ROUND_LABELS: Record<QuizRound, string> = {
  round1: '第一轮 · 意思与用法',
  round2: '第二轮 · 例句运用',
  enhanced: '第二轮 · 增强',
  all: '全部题型',
}

export function levelToPath(level: JlptLevel): string {
  return level === 'PRE-N3' ? 'pre-n3' : level
}

export function parseLevelParam(param?: string): JlptLevel | null {
  if (param === 'pre-n3' || param === 'PRE-N3') return 'PRE-N3'
  if (param === 'N2' || param === 'n2') return 'N2'
  if (param === 'N3' || param === 'n3') return 'N3'
  return null
}
