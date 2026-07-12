export type JlptLevel = 'PRE-N3' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export type GrammarCategory =
  | 'particles'      // 助词
  | 'verbs'          // 动词
  | 'adjectives'     // 形容词
  | 'conjunctions'   // 接续
  | 'expressions'    // 表达
  | 'other'

export interface GrammarPoint {
  id: string
  title: string
  titleJa: string
  level: JlptLevel
  category: GrammarCategory
  summary: string
  pattern: string
  meaning: string
  usage?: string
  examples: GrammarExample[]
  notes?: string
}

export interface GrammarExample {
  japanese: string
  reading: string
  chinese: string
}
