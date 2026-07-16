/** 各级别单词数据库条目的统一字段约定（出题模版与单词库共用） */
export type VocabLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

/** 题库：频出 / 全套 */
export type VocabTrack = 'exam' | 'full'

interface VocabularyExample {
  japanese: string
  chinese?: string
}

export interface VocabularyEntry {
  id: string
  index?: number
  level: VocabLevel
  word: string
  reading: string
  pos: string
  meaning: string
  notes?: string
  transitivity?: string
  pair?: string
  example: VocabularyExample
}
