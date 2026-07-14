import {
  getAllGrammarEntries,
  getGrammarEntryById,
  getGrammarEntries,
  GRAMMAR_LEVELS,
} from '@/data/levels/grammar-db'
import type { GrammarEntry, GrammarLevel } from '@/data/types/grammar-entry'
import type { GrammarPoint, GrammarCategory, JlptLevel } from '@/types/grammar'

const categoryMap: Record<string, GrammarCategory> = {
  因果: 'conjunctions',
  假设: 'conjunctions',
  转折: 'conjunctions',
  递进: 'conjunctions',
  意志: 'expressions',
  推测: 'expressions',
  被动使役: 'verbs',
  状态: 'verbs',
  固定句式: 'expressions',
  时序: 'conjunctions',
  表达: 'expressions',
}

function toGrammarPoint(entry: GrammarEntry): GrammarPoint {
  const cat = entry.category ? categoryMap[entry.category] ?? 'other' : 'other'
  return {
    id: entry.id,
    title: entry.pattern,
    titleJa: entry.pattern,
    level: entry.level as JlptLevel,
    category: cat,
    summary: entry.meaning.length > 80 ? entry.meaning.slice(0, 80) + '…' : entry.meaning,
    pattern: entry.pattern,
    meaning: entry.meaning,
    usage: entry.usage,
    examples: entry.examples.map((ex) => ({
      japanese: ex.japanese,
      reading: '',
      chinese: ex.chinese ?? '',
    })),
    notes: entry.notes,
  }
}

export const grammarPoints: GrammarPoint[] = getAllGrammarEntries().map(toGrammarPoint)

export function getGrammarById(id: string): GrammarPoint | undefined {
  const entry = getGrammarEntryById(id)
  return entry ? toGrammarPoint(entry) : undefined
}

export function getGrammarByLevel(level: GrammarPoint['level']): GrammarPoint[] {
  if (!GRAMMAR_LEVELS.includes(level as GrammarLevel)) return []
  return getGrammarEntries(level as GrammarLevel).map(toGrammarPoint)
}

export const categoryLabels: Record<GrammarPoint['category'], string> = {
  particles: '助词',
  verbs: '动词',
  adjectives: '形容词',
  conjunctions: '接续',
  expressions: '表达',
  other: '其他',
}

export const grammarStats = {
  preN3: getGrammarEntries('PRE-N3').length,
  n2: getGrammarEntries('N2').length,
  n3: getGrammarEntries('N3').length,
  total: getAllGrammarEntries().length,
}
