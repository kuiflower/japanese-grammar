/**
 * 数据层聚合入口（兼容旧 import）
 * - 语法请优先：@/data/levels/grammar-db
 * - 单词请优先：@/data/levels/vocabulary-db
 * 便于路由拆包时文法与单词互不拖累。
 */
export {
  LEVEL_GRAMMAR_DB,
  GRAMMAR_LEVELS,
  getGrammarEntries,
  getAllGrammarEntries,
  getGrammarEntryById,
} from './grammar-db'

export {
  LEVEL_VOCABULARY_EXAM_DB,
  LEVEL_VOCABULARY_FULL_DB,
  LEVEL_VOCABULARY_DB,
  VOCABULARY_LEVELS,
  getVocabularyEntries,
  getAllVocabularyEntries,
  getVocabularyEntryById,
  getVocabularyCount,
} from './vocabulary-db'
