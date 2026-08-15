import type { GrammarBank, JlptLevel, QuizRound } from '@/types/quiz'
import { parseGrammarBankParam } from '@/types/quiz'

const CHECKPOINTS_KEY = 'jg-v1-checkpoints'
const HISTORY_KEY = 'jg-v1-session-history'
const WRONG_KEY = 'jg-v1-wrong'
const UNFAMILIAR_KEY = 'jg-v1-unfamiliar'

export interface PracticeCheckpoint {
  bank: GrammarBank
  level: JlptLevel
  round: QuizRound
  questionIds: string[]
  /** 下一题在 questionIds 中的下标 */
  currentIndex: number
  correctCount: number
  /** 已答记录：续做时恢复，避免返回重答重复计分 */
  answers?: Record<string, { selectedId: string; correct: boolean }>
  updatedAt: number
}

/** 各等级×模式最近一次练习（含已完成），用于首页展示 */
export interface PracticeSessionSummary {
  bank: GrammarBank
  level: JlptLevel
  round: QuizRound
  questionIds: string[]
  currentIndex: number
  correctCount: number
  completed: boolean
  updatedAt: number
}

export interface WrongQuestionRecord {
  questionId: string
  bank: GrammarBank
  level: JlptLevel
  addedAt: number
  wrongCount: number
}

export interface UnfamiliarQuestionRecord {
  questionId: string
  bank: GrammarBank
  level: JlptLevel
  addedAt: number
  /** 最近一次答题耗时（毫秒） */
  elapsedMs: number
  unfamiliarCount: number
}

export const HOME_ROUND_GROUPS: { round: QuizRound; label: string }[] = [
  { round: 'all', label: '全部题型' },
  { round: 'round1', label: '第一轮 · 意思与用法' },
  { round: 'round2', label: '第二轮 · 例句运用' },
  { round: 'enhanced', label: '第二轮 · 增强' },
]

/** 错题/不熟悉首页分组：不含「全部题型」，避免与分轮条目重复展示 */
export const HOME_REVIEW_ROUND_GROUPS = HOME_ROUND_GROUPS.filter((g) => g.round !== 'all')

function checkpointKey(bank: GrammarBank, level: JlptLevel, round: QuizRound) {
  return `${bank}:${level}:${round}`
}

/** 旧版 PRE-N3 进度/错题并入 N3 */
function normalizeLevel(level: string): JlptLevel {
  return level === 'PRE-N3' ? 'N3' : (level as JlptLevel)
}

function normalizeBank(bank?: string): GrammarBank {
  return parseGrammarBankParam(bank) ?? 'basic'
}

function migrateCheckpoints(
  raw: Record<string, PracticeCheckpoint & { bank?: GrammarBank }>,
): Record<string, PracticeCheckpoint> {
  const out: Record<string, PracticeCheckpoint> = {}
  for (const cp of Object.values(raw)) {
    const level = normalizeLevel(cp.level as string)
    const bank = normalizeBank(cp.bank)
    const key = checkpointKey(bank, level, cp.round)
    const migrated = { ...cp, level, bank }
    const existing = out[key]
    if (!existing || existing.updatedAt < migrated.updatedAt) {
      out[key] = migrated
    }
  }
  return out
}

function migrateHistory(
  raw: Record<string, PracticeSessionSummary & { bank?: GrammarBank }>,
): Record<string, PracticeSessionSummary> {
  const out: Record<string, PracticeSessionSummary> = {}
  for (const summary of Object.values(raw)) {
    const level = normalizeLevel(summary.level as string)
    const bank = normalizeBank(summary.bank)
    const key = checkpointKey(bank, level, summary.round)
    const migrated = { ...summary, level, bank }
    const existing = out[key]
    if (!existing || existing.updatedAt < migrated.updatedAt) {
      out[key] = migrated
    }
  }
  return out
}

function readCheckpoints(): Record<string, PracticeCheckpoint> {
  try {
    const raw = localStorage.getItem(CHECKPOINTS_KEY)
    const parsed = raw
      ? (JSON.parse(raw) as Record<string, PracticeCheckpoint & { bank?: GrammarBank }>)
      : {}
    return migrateCheckpoints(parsed)
  } catch {
    return {}
  }
}

function writeCheckpoints(data: Record<string, PracticeCheckpoint>) {
  localStorage.setItem(CHECKPOINTS_KEY, JSON.stringify(data))
  notifyStorageUpdate()
}

function readHistory(): Record<string, PracticeSessionSummary> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const parsed = raw
      ? (JSON.parse(raw) as Record<string, PracticeSessionSummary & { bank?: GrammarBank }>)
      : {}
    return migrateHistory(parsed)
  } catch {
    return {}
  }
}

function writeHistory(data: Record<string, PracticeSessionSummary>) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(data))
  notifyStorageUpdate()
}

function notifyStorageUpdate() {
  window.dispatchEvent(new Event('jg-storage-update'))
}

export function readWrongRecords(): WrongQuestionRecord[] {
  try {
    const raw = localStorage.getItem(WRONG_KEY)
    const records = raw
      ? (JSON.parse(raw) as Array<WrongQuestionRecord & { bank?: GrammarBank }>)
      : []
    return records.map((r) => ({
      ...r,
      level: normalizeLevel(r.level as string),
      bank: normalizeBank(r.bank),
    }))
  } catch {
    return []
  }
}

function writeWrong(records: WrongQuestionRecord[]) {
  localStorage.setItem(WRONG_KEY, JSON.stringify(records))
  notifyStorageUpdate()
}

export function getSessionSummary(
  level: JlptLevel,
  round: QuizRound,
  bank: GrammarBank = 'basic',
): PracticeSessionSummary | null {
  return readHistory()[checkpointKey(bank, level, round)] ?? null
}

export function saveSessionSummary(summary: PracticeSessionSummary) {
  const all = readHistory()
  const bank = normalizeBank(summary.bank)
  all[checkpointKey(bank, summary.level, summary.round)] = {
    ...summary,
    bank,
    updatedAt: Date.now(),
  }
  writeHistory(all)
}

export function getCheckpoint(
  level: JlptLevel,
  round: QuizRound,
  bank: GrammarBank = 'basic',
): PracticeCheckpoint | null {
  const cp = readCheckpoints()[checkpointKey(bank, level, round)]
  if (!cp || cp.currentIndex >= cp.questionIds.length) return null
  return cp
}

export function saveCheckpoint(checkpoint: PracticeCheckpoint) {
  const updatedAt = Date.now()
  const bank = normalizeBank(checkpoint.bank)
  const all = readCheckpoints()
  all[checkpointKey(bank, checkpoint.level, checkpoint.round)] = {
    ...checkpoint,
    bank,
    updatedAt,
  }
  writeCheckpoints(all)
  saveSessionSummary({
    bank,
    level: checkpoint.level,
    round: checkpoint.round,
    questionIds: checkpoint.questionIds,
    currentIndex: checkpoint.currentIndex,
    correctCount: checkpoint.correctCount,
    completed: false,
    updatedAt,
  })
}

export function clearCheckpoint(
  level: JlptLevel,
  round: QuizRound,
  bank: GrammarBank = 'basic',
) {
  const all = readCheckpoints()
  delete all[checkpointKey(bank, level, round)]
  writeCheckpoints(all)
}

/** 清空全部答题记录（未完成 checkpoint + 历史摘要） */
export function clearAllSessionRecords() {
  writeCheckpoints({})
  writeHistory({})
}

/** 清空全部错题记录 */
export function clearAllWrongQuestions() {
  writeWrong([])
}

function readUnfamiliarRecords(): UnfamiliarQuestionRecord[] {
  try {
    const raw = localStorage.getItem(UNFAMILIAR_KEY)
    const records = raw
      ? (JSON.parse(raw) as Array<UnfamiliarQuestionRecord & { bank?: GrammarBank }>)
      : []
    return records.map((r) => ({
      ...r,
      level: normalizeLevel(r.level as string),
      bank: normalizeBank(r.bank),
    }))
  } catch {
    return []
  }
}

function writeUnfamiliar(records: UnfamiliarQuestionRecord[]) {
  localStorage.setItem(UNFAMILIAR_KEY, JSON.stringify(records))
  notifyStorageUpdate()
}

export function listUnfamiliarRecords(): UnfamiliarQuestionRecord[] {
  return readUnfamiliarRecords()
}

export function addUnfamiliarQuestion(
  questionId: string,
  level: JlptLevel,
  elapsedMs: number,
  bank: GrammarBank = 'basic',
) {
  const records = readUnfamiliarRecords()
  const existing = records.find(
    (r) => r.questionId === questionId && r.bank === bank && r.level === level,
  )
  if (existing) {
    existing.unfamiliarCount += 1
    existing.elapsedMs = elapsedMs
    existing.addedAt = Date.now()
  } else {
    records.push({
      questionId,
      bank,
      level,
      addedAt: Date.now(),
      elapsedMs,
      unfamiliarCount: 1,
    })
  }
  writeUnfamiliar(records)
}

export function removeUnfamiliarQuestion(
  questionId: string,
  bank: GrammarBank = 'basic',
) {
  writeUnfamiliar(
    readUnfamiliarRecords().filter(
      (r) => !(r.questionId === questionId && r.bank === bank),
    ),
  )
}

/** 清空全部不熟悉记录 */
export function clearAllUnfamiliarQuestions() {
  writeUnfamiliar([])
}

/** 只读 localStorage 计数，不触发出题、不加载题库 */
export function countUnfamiliarForRound(
  level: JlptLevel,
  round: QuizRound,
  bank: GrammarBank = 'basic',
): number {
  const records = readUnfamiliarRecords().filter(
    (r) => r.level === level && r.bank === bank,
  )
  if (round === 'all') return records.length
  return records.filter((r) => roundFromQuestionId(r.questionId) === round).length
}

export function addWrongQuestion(
  questionId: string,
  level: JlptLevel,
  bank: GrammarBank = 'basic',
) {
  const records = readWrongRecords()
  const existing = records.find(
    (r) => r.questionId === questionId && r.bank === bank && r.level === level,
  )
  if (existing) {
    existing.wrongCount += 1
    existing.addedAt = Date.now()
  } else {
    records.push({
      questionId,
      bank,
      level,
      addedAt: Date.now(),
      wrongCount: 1,
    })
  }
  writeWrong(records)
}

export function removeWrongQuestion(questionId: string, bank: GrammarBank = 'basic') {
  writeWrong(
    readWrongRecords().filter((r) => !(r.questionId === questionId && r.bank === bank)),
  )
}

/** 题号后缀编码轮次，首页计数无需生成题库 */
function roundFromQuestionId(questionId: string): QuizRound | null {
  if (questionId.endsWith('-meaning') || questionId.endsWith('-usage')) return 'round1'
  if (questionId.endsWith('-sentence')) return 'round2'
  if (questionId.endsWith('-fill') || questionId.endsWith('-error')) return 'enhanced'
  return null
}

/** 只读 localStorage 计数，不触发出题、不加载题库 */
export function countWrongForRound(
  level: JlptLevel,
  round: QuizRound,
  bank: GrammarBank = 'basic',
): number {
  const records = readWrongRecords().filter((r) => r.level === level && r.bank === bank)
  if (round === 'all') return records.length
  return records.filter((r) => roundFromQuestionId(r.questionId) === round).length
}

export function formatProgress(
  cp: Pick<PracticeCheckpoint, 'currentIndex' | 'questionIds'>,
): string {
  const done = cp.currentIndex
  const total = cp.questionIds.length
  return `${done} / ${total}`
}

export function formatSessionSummary(summary: PracticeSessionSummary): string {
  const total = summary.questionIds.length
  if (summary.completed) {
    return `已完成 ${summary.correctCount} / ${total}`
  }
  return formatProgress(summary)
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  return `${day} 天前`
}
