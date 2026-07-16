/** 各级别语法数据库条目的统一字段约定（出题模版与语法库共用） */
export type GrammarLevel = 'PRE-N3' | 'N2' | 'N3'

interface GrammarExample {
  japanese: string
  chinese?: string
}

export interface GrammarEntry {
  id: string
  index?: number
  level: GrammarLevel
  pattern: string
  meaning: string
  /** 与 N3 同类标签：因果 / 时序 / 固定句式 等 */
  category: string
  /** 接续 / 语境 / 限制（用法题考点；第一轮用法题依赖此字段） */
  usage: string
  /** 与近义语法的辨析（展示用，不出题；可缺省） */
  notes?: string
  examples: GrammarExample[]
}
