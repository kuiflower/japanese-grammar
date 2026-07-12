/** 各级别语法数据库条目的统一字段约定（出题模版与语法库共用） */
export type GrammarLevel = 'PRE-N3' | 'N2' | 'N3'

export interface GrammarExample {
  japanese: string
  chinese?: string
}

export interface GrammarEntry {
  id: string
  index?: number
  level: GrammarLevel
  pattern: string
  meaning: string
  category?: string
  /** 接续 / 语境 / 限制（用法题考点） */
  usage?: string
  /** 与近义语法的辨析（展示用，不出题） */
  notes?: string
  examples: GrammarExample[]
}
