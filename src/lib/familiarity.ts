/** 熟悉判定阈值（毫秒）：文法单题短，単語三关更长 */
export const FAMILIAR_MS = {
  grammar: 5000,
  vocab: 12000,
} as const

export type FamiliarityKind = keyof typeof FAMILIAR_MS

export function isFamiliar(elapsedMs: number, kind: FamiliarityKind): boolean {
  return elapsedMs <= FAMILIAR_MS[kind]
}

/** 答题用轻量计时展示：4.2s / 1:05 */
export function formatElapsed(ms: number): string {
  const sec = Math.max(0, ms) / 1000
  if (sec < 60) return `${sec.toFixed(1)}s`
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
