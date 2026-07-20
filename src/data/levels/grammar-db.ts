import type { GrammarEntry, GrammarLevel } from '@/data/types/grammar-entry'
import n5Grammar from './n5/grammar.json'
import n4Grammar from './n4/grammar.json'
import n2Grammar from './n2/grammar.json'
import n3Grammar from './n3/grammar.json'

/** 语法库：每级别唯一 grammar.json */
const LEVEL_GRAMMAR_DB: Record<GrammarLevel, GrammarEntry[]> = {
  N5: n5Grammar as GrammarEntry[],
  N4: n4Grammar as GrammarEntry[],
  N3: n3Grammar as GrammarEntry[],
  N2: n2Grammar as GrammarEntry[],
}

const GRAMMAR_LEVELS: GrammarLevel[] = ['N5', 'N4', 'N3', 'N2']

export function getGrammarEntries(level: GrammarLevel): GrammarEntry[] {
  return LEVEL_GRAMMAR_DB[level]
}

export function getAllGrammarEntries(): GrammarEntry[] {
  return GRAMMAR_LEVELS.flatMap((level) => LEVEL_GRAMMAR_DB[level])
}

export function getGrammarEntryById(id: string): GrammarEntry | undefined {
  return getAllGrammarEntries().find((e) => e.id === id)
}
