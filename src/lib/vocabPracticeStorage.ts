import type { VocabLevel, VocabTrack } from '@/types/vocab-quiz'
import { VOCAB_TRACK_LABELS, VOCAB_TRACKS } from '@/types/vocab-quiz'

/** 首页进度/错题分组：频出 → 全套 */
export const HOME_TRACK_GROUPS = VOCAB_TRACKS.map((track) => ({
  track,
  label: VOCAB_TRACK_LABELS[track],
}))

const CHECKPOINTS_KEY = 'jv-v1-checkpoints'
const HISTORY_KEY = 'jv-v1-session-history'
const WRONG_KEY = 'jv-v1-wrong'
const UNFAMILIAR_KEY = 'jv-v1-unfamiliar'

export interface VocabPracticeCheckpoint {
  track: VocabTrack
  level: VocabLevel
  questionIds: string[]
  currentIndex: number
  correctCount: number
  updatedAt: number
}

export interface VocabPracticeSessionSummary {
  track: VocabTrack
  level: VocabLevel
  questionIds: string[]
  currentIndex: number
  correctCount: number
  completed: boolean
  updatedAt: number
}

export interface VocabWrongQuestionRecord {
  questionId: string
  track: VocabTrack
  level: VocabLevel
  addedAt: number
  wrongCount: number
}

export interface VocabUnfamiliarQuestionRecord {
  questionId: string
  track: VocabTrack
  level: VocabLevel
  addedAt: number
  elapsedMs: number
  unfamiliarCount: number
}

function checkpointKey(track: VocabTrack, level: VocabLevel) {
  return `${track}:${level}`
}

/** 兼容旧版仅按 level 存的 key（视为 exam） */
function migrateKey(key: string): string {
  if (key.includes(':')) return key
  return `exam:${key}`
}

function readCheckpoints(): Record<string, VocabPracticeCheckpoint> {
  try {
    const raw = localStorage.getItem(CHECKPOINTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, VocabPracticeCheckpoint & { track?: VocabTrack }>
    const migrated: Record<string, VocabPracticeCheckpoint> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const track = value.track ?? 'exam'
      const nextKey = migrateKey(key)
      migrated[nextKey] = { ...value, track }
    }
    return migrated
  } catch {
    return {}
  }
}

function writeCheckpoints(data: Record<string, VocabPracticeCheckpoint>) {
  localStorage.setItem(CHECKPOINTS_KEY, JSON.stringify(data))
  notifyStorageUpdate()
}

function readHistory(): Record<string, VocabPracticeSessionSummary> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, VocabPracticeSessionSummary & { track?: VocabTrack }>
    const migrated: Record<string, VocabPracticeSessionSummary> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const track = value.track ?? 'exam'
      migrated[migrateKey(key)] = { ...value, track }
    }
    return migrated
  } catch {
    return {}
  }
}

function writeHistory(data: Record<string, VocabPracticeSessionSummary>) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(data))
  notifyStorageUpdate()
}

function notifyStorageUpdate() {
  window.dispatchEvent(new Event('jv-storage-update'))
}

export function readVocabWrongRecords(): VocabWrongQuestionRecord[] {
  try {
    const raw = localStorage.getItem(WRONG_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<VocabWrongQuestionRecord & { track?: VocabTrack }>
    return parsed.map((r) => ({ ...r, track: r.track ?? 'exam' }))
  } catch {
    return []
  }
}

function writeWrong(records: VocabWrongQuestionRecord[]) {
  localStorage.setItem(WRONG_KEY, JSON.stringify(records))
  notifyStorageUpdate()
}

export function getVocabSessionSummary(
  level: VocabLevel,
  track: VocabTrack = 'exam',
): VocabPracticeSessionSummary | null {
  return readHistory()[checkpointKey(track, level)] ?? null
}

export function saveVocabSessionSummary(summary: VocabPracticeSessionSummary) {
  const all = readHistory()
  all[checkpointKey(summary.track, summary.level)] = {
    ...summary,
    updatedAt: Date.now(),
  }
  writeHistory(all)
}

export function getVocabCheckpoint(
  level: VocabLevel,
  track: VocabTrack = 'exam',
): VocabPracticeCheckpoint | null {
  const cp = readCheckpoints()[checkpointKey(track, level)]
  if (!cp || cp.currentIndex >= cp.questionIds.length) return null
  return cp
}

export function saveVocabCheckpoint(checkpoint: VocabPracticeCheckpoint) {
  const updatedAt = Date.now()
  const all = readCheckpoints()
  all[checkpointKey(checkpoint.track, checkpoint.level)] = {
    ...checkpoint,
    updatedAt,
  }
  writeCheckpoints(all)
  saveVocabSessionSummary({
    track: checkpoint.track,
    level: checkpoint.level,
    questionIds: checkpoint.questionIds,
    currentIndex: checkpoint.currentIndex,
    correctCount: checkpoint.correctCount,
    completed: false,
    updatedAt,
  })
}

export function clearVocabCheckpoint(level: VocabLevel, track: VocabTrack = 'exam') {
  const all = readCheckpoints()
  delete all[checkpointKey(track, level)]
  writeCheckpoints(all)
}

/** 清空全部単語答题记录（未完成 checkpoint + 历史摘要） */
export function clearAllVocabSessionRecords() {
  writeCheckpoints({})
  writeHistory({})
}

/** 清空全部単語错题记录 */
export function clearAllVocabWrongQuestions() {
  writeWrong([])
}

function readUnfamiliarRecords(): VocabUnfamiliarQuestionRecord[] {
  try {
    const raw = localStorage.getItem(UNFAMILIAR_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<VocabUnfamiliarQuestionRecord & { track?: VocabTrack }>
    return parsed.map((r) => ({ ...r, track: r.track ?? 'exam' }))
  } catch {
    return []
  }
}

function writeUnfamiliar(records: VocabUnfamiliarQuestionRecord[]) {
  localStorage.setItem(UNFAMILIAR_KEY, JSON.stringify(records))
  notifyStorageUpdate()
}

export function addVocabUnfamiliarQuestion(
  questionId: string,
  level: VocabLevel,
  track: VocabTrack,
  elapsedMs: number,
) {
  const records = readUnfamiliarRecords()
  const existing = records.find(
    (r) => r.questionId === questionId && r.track === track && r.level === level,
  )
  if (existing) {
    existing.unfamiliarCount += 1
    existing.elapsedMs = elapsedMs
    existing.addedAt = Date.now()
  } else {
    records.push({
      questionId,
      track,
      level,
      addedAt: Date.now(),
      elapsedMs,
      unfamiliarCount: 1,
    })
  }
  writeUnfamiliar(records)
}

export function removeVocabUnfamiliarQuestion(
  questionId: string,
  track: VocabTrack = 'exam',
) {
  writeUnfamiliar(
    readUnfamiliarRecords().filter(
      (r) => !(r.questionId === questionId && r.track === track),
    ),
  )
}

export function clearAllVocabUnfamiliarQuestions() {
  writeUnfamiliar([])
}

export function listVocabUnfamiliarRecords(): VocabUnfamiliarQuestionRecord[] {
  return readUnfamiliarRecords()
}

export function countVocabUnfamiliar(level: VocabLevel, track: VocabTrack = 'exam'): number {
  return readUnfamiliarRecords().filter((r) => r.level === level && r.track === track)
    .length
}

export function addVocabWrongQuestion(
  questionId: string,
  level: VocabLevel,
  track: VocabTrack = 'exam',
) {
  const records = readVocabWrongRecords()
  const existing = records.find(
    (r) => r.questionId === questionId && r.track === track && r.level === level,
  )
  if (existing) {
    existing.wrongCount += 1
    existing.addedAt = Date.now()
  } else {
    records.push({
      questionId,
      track,
      level,
      addedAt: Date.now(),
      wrongCount: 1,
    })
  }
  writeWrong(records)
}

export function removeVocabWrongQuestion(
  questionId: string,
  track: VocabTrack = 'exam',
) {
  writeWrong(
    readVocabWrongRecords().filter(
      (r) => !(r.questionId === questionId && r.track === track),
    ),
  )
}

/** 只读 localStorage 计数，不触发出题、不加载词库 */
export function countVocabWrong(level: VocabLevel, track: VocabTrack = 'exam'): number {
  return readVocabWrongRecords().filter(
    (r) => r.level === level && r.track === track,
  ).length
}

export function formatVocabProgress(
  cp: Pick<VocabPracticeCheckpoint, 'currentIndex' | 'questionIds'>,
): string {
  return `${cp.currentIndex} / ${cp.questionIds.length}`
}

export function formatVocabSessionSummary(summary: VocabPracticeSessionSummary): string {
  const total = summary.questionIds.length
  if (summary.completed) {
    return `已完成 ${summary.correctCount} / ${total}`
  }
  return formatVocabProgress(summary)
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
