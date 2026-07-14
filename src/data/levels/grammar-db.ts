import type { GrammarEntry, GrammarLevel } from '@/data/types/grammar-entry'
import preN3Grammar from './pre-n3/grammar.json'
import n2Grammar from './n2/grammar.json'
import n3Grammar from './n3/grammar.json'

/** 语法库：每级别唯一 grammar.json */
export const LEVEL_GRAMMAR_DB: Record<GrammarLevel, GrammarEntry[]> = {
  'PRE-N3': preN3Grammar as GrammarEntry[],
  N2: n2Grammar as GrammarEntry[],
  N3: n3Grammar as GrammarEntry[],
}

export const GRAMMAR_LEVELS: GrammarLevel[] = ['PRE-N3', 'N2', 'N3']

export function getGrammarEntries(level: GrammarLevel): GrammarEntry[] {
  return LEVEL_GRAMMAR_DB[level]
}

export function getAllGrammarEntries(): GrammarEntry[] {
  return GRAMMAR_LEVELS.flatMap((level) => LEVEL_GRAMMAR_DB[level])
}

export function getGrammarEntryById(id: string): GrammarEntry | undefined {
  return getAllGrammarEntries().find((e) => e.id === id)
  
}
