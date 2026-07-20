import type { JlptLevel, QuizRound } from '@/types/quiz'

const CHECKPOINTS_KEY = 'jg-v1-checkpoints'
const HISTORY_KEY = 'jg-v1-session-history'
const WRONG_KEY = 'jg-v1-wrong'
const UNFAMILIAR_KEY = 'jg-v1-unfamiliar'

export interface PracticeCheckpoint {
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
  level: JlptLevel
  addedAt: number
  wrongCount: number
}

export interface UnfamiliarQuestionRecord {
  questionId: string
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

function checkpointKey(level: JlptLevel, round: QuizRound) {
  return `${level}:${round}`
}

/** 旧版 PRE-N3 进度/错题并入 N3 */
function normalizeLevel(level: string): JlptLevel {
  return level === 'PRE-N3' ? 'N3' : (level as JlptLevel)
}

function migrateCheckpoints(
  raw: Record<string, PracticeCheckpoint>,
): Record<string, PracticeCheckpoint> {
  const out: Record<string, PracticeCheckpoint> = {}
  for (const cp of Object.values(raw)) {
    const level = normalizeLevel(cp.level as string)
    const key = checkpointKey(level, cp.round)
    const migrated = { ...cp, level }
    const existing = out[key]
    if (!existing || existing.updatedAt < migrated.updatedAt) {
      out[key] = migrated
    }
  }
  return out
}

function migrateHistory(
  raw: Record<string, PracticeSessionSummary>,
): Record<string, PracticeSessionSummary> {
  const out: Record<string, PracticeSessionSummary> = {}
  for (const summary of Object.values(raw)) {
    const level = normalizeLevel(summary.level as string)
    const key = checkpointKey(level, summary.round)
    const migrated = { ...summary, level }
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
    const parsed = raw ? (JSON.parse(raw) as Record<string, PracticeCheckpoint>) : {}
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
    const parsed = raw ? (JSON.parse(raw) as Record<string, PracticeSessionSummary>) : {}
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
    const records = raw ? (JSON.parse(raw) as WrongQuestionRecord[]) : []
    return records.map((r) => ({ ...r, level: normalizeLevel(r.level as string) }))
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
): PracticeSessionSummary | null {
  return readHistory()[checkpointKey(level, round)] ?? null
}

export function saveSessionSummary(summary: PracticeSessionSummary) {
  const all = readHistory()
  all[checkpointKey(summary.level, summary.round)] = {
    ...summary,
    updatedAt: Date.now(),
  }
  writeHistory(all)
}

export function getCheckpoint(
  level: JlptLevel,
  round: QuizRound,
): PracticeCheckpoint | null {
  const cp = readCheckpoints()[checkpointKey(level, round)]
  if (!cp || cp.currentIndex >= cp.questionIds.length) return null
  return cp
}

export function saveCheckpoint(checkpoint: PracticeCheckpoint) {
  const updatedAt = Date.now()
  const all = readCheckpoints()
  all[checkpointKey(checkpoint.level, checkpoint.round)] = {
    ...checkpoint,
    updatedAt,
  }
  writeCheckpoints(all)
  saveSessionSummary({
    level: checkpoint.level,
    round: checkpoint.round,
    questionIds: checkpoint.questionIds,
    currentIndex: checkpoint.currentIndex,
    correctCount: checkpoint.correctCount,
    completed: false,
    updatedAt,
  })
}

export function clearCheckpoint(level: JlptLevel, round: QuizRound) {
  const all = readCheckpoints()
  delete all[checkpointKey(level, round)]
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
    const records = raw ? (JSON.parse(raw) as UnfamiliarQuestionRecord[]) : []
    return records.map((r) => ({ ...r, level: normalizeLevel(r.level as string) }))
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
) {
  const records = readUnfamiliarRecords()
  const existing = records.find((r) => r.questionId === questionId)
  if (existing) {
    existing.unfamiliarCount += 1
    existing.elapsedMs = elapsedMs
    existing.addedAt = Date.now()
  } else {
    records.push({
      questionId,
      level,
      addedAt: Date.now(),
      elapsedMs,
      unfamiliarCount: 1,
    })
  }
  writeUnfamiliar(records)
}

export function removeUnfamiliarQuestion(questionId: string) {
  writeUnfamiliar(readUnfamiliarRecords().filter((r) => r.questionId !== questionId))
}

/** 清空全部不熟悉记录 */
export function clearAllUnfamiliarQuestions() {
  writeUnfamiliar([])
}

/** 只读 localStorage 计数，不触发出题、不加载题库 */
export function countUnfamiliarForRound(level: JlptLevel, round: QuizRound): number {
  const records = readUnfamiliarRecords().filter((r) => r.level === level)
  if (round === 'all') return records.length
  return records.filter((r) => roundFromQuestionId(r.questionId) === round).length
}

export function addWrongQuestion(questionId: string, level: JlptLevel) {
  const records = readWrongRecords()
  const existing = records.find((r) => r.questionId === questionId)
  if (existing) {
    existing.wrongCount += 1
    existing.addedAt = Date.now()
  } else {
    records.push({
      questionId,
      level,
      addedAt: Date.now(),
      wrongCount: 1,
    })
  }
  writeWrong(records)
}

export function removeWrongQuestion(questionId: string) {
  writeWrong(readWrongRecords().filter((r) => r.questionId !== questionId))
}

/** 题号后缀编码轮次，首页计数无需生成题库 */
function roundFromQuestionId(questionId: string): QuizRound | null {
  if (questionId.endsWith('-meaning') || questionId.endsWith('-usage')) return 'round1'
  if (questionId.endsWith('-sentence')) return 'round2'
  if (questionId.endsWith('-fill') || questionId.endsWith('-error')) return 'enhanced'
  return null
}

/** 只读 localStorage 计数，不触发出题、不加载题库 */
export function countWrongForRound(level: JlptLevel, round: QuizRound): number {
  const records = readWrongRecords().filter((r) => r.level === level)
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
