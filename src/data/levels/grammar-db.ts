import type { GrammarBank, GrammarEntry, GrammarLevel } from '@/data/types/grammar-entry'
import n5Grammar from './n5/grammar.json'
import n4Grammar from './n4/grammar.json'
import n3Grammar from './n3/grammar.json'
import n2Grammar from './n2/grammar.json'
import n5GrammarReading from './n5/grammar-reading.json'
import n4GrammarReading from './n4/grammar-reading.json'
import n3GrammarReading from './n3/grammar-reading.json'
import n2GrammarReading from './n2/grammar-reading.json'
import n5GrammarListening from './n5/grammar-listening.json'
import n4GrammarListening from './n4/grammar-listening.json'
import n3GrammarListening from './n3/grammar-listening.json'
import n2GrammarListening from './n2/grammar-listening.json'

/** 基础语法：每级别唯一 grammar.json */
const LEVEL_GRAMMAR_DB: Record<GrammarLevel, GrammarEntry[]> = {
  N5: n5Grammar as GrammarEntry[],
  N4: n4Grammar as GrammarEntry[],
  N3: n3Grammar as GrammarEntry[],
  N2: n2Grammar as GrammarEntry[],
}

/** 阅读专项：空数组表示筹备中 */
const LEVEL_GRAMMAR_READING_DB: Record<GrammarLevel, GrammarEntry[]> = {
  N5: n5GrammarReading as GrammarEntry[],
  N4: n4GrammarReading as GrammarEntry[],
  N3: n3GrammarReading as GrammarEntry[],
  N2: n2GrammarReading as GrammarEntry[],
}

/** 听力专项：空数组表示筹备中 */
const LEVEL_GRAMMAR_LISTENING_DB: Record<GrammarLevel, GrammarEntry[]> = {
  N5: n5GrammarListening as GrammarEntry[],
  N4: n4GrammarListening as GrammarEntry[],
  N3: n3GrammarListening as GrammarEntry[],
  N2: n2GrammarListening as GrammarEntry[],
}

const GRAMMAR_BANK_DB: Record<GrammarBank, Record<GrammarLevel, GrammarEntry[]>> = {
  basic: LEVEL_GRAMMAR_DB,
  reading: LEVEL_GRAMMAR_READING_DB,
  listening: LEVEL_GRAMMAR_LISTENING_DB,
}

const GRAMMAR_LEVELS: GrammarLevel[] = ['N5', 'N4', 'N3', 'N2']

export function getGrammarEntries(
  level: GrammarLevel,
  bank: GrammarBank = 'basic',
): GrammarEntry[] {
  return GRAMMAR_BANK_DB[bank][level]
}

export function getAllGrammarEntries(bank: GrammarBank = 'basic'): GrammarEntry[] {
  return GRAMMAR_LEVELS.flatMap((level) => GRAMMAR_BANK_DB[bank][level])
}

export function getGrammarEntryById(
  id: string,
  bank: GrammarBank = 'basic',
): GrammarEntry | undefined {
  return getAllGrammarEntries(bank).find((e) => e.id === id)
}

export function getGrammarCount(
  level: GrammarLevel,
  bank: GrammarBank = 'basic',
): number {
  return GRAMMAR_BANK_DB[bank][level].length
}
