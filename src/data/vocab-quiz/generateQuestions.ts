/**
 * 背单词复合题出题模版：一词一题，含读音 → 释义 → 例句填空三步。
 */
import type { VocabularyEntry, VocabTrack } from '@/data/types/vocabulary-entry'
import type {
  VocabCompositeQuestion,
  VocabQuizOption,
  VocabQuizStep,
  VocabQuizStepType,
} from '@/types/vocab-quiz'
import { VOCAB_STEP_LABELS } from '@/types/vocab-quiz'

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Fisher-Yates 洗牌（32 位无符号 LCG，避免有符号取模恒为 0） */
function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy = [...items]
  let s = seed >>> 0
  for (let i = copy.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

function pickOthers<T>(
  pool: T[],
  count: number,
  seed: number,
  exclude: (item: T) => boolean,
): T[] {
  const candidates = pool.filter((item) => !exclude(item))
  if (candidates.length <= count) return shuffleWithSeed(candidates, seed)
  return shuffleWithSeed(candidates, seed).slice(0, count)
}

function primaryMeaning(meaning: string): string {
  return meaning.split(/[；;，,]/)[0]?.trim() ?? meaning
}

function buildOptions(
  correctText: string,
  distractorTexts: string[],
  seed: string,
): VocabQuizOption[] {
  const unique = [correctText, ...distractorTexts].filter(
    (t, i, arr) => t && arr.indexOf(t) === i,
  )
  let distractors = unique.slice(1)
  if (distractors.length < 3) {
    const fillers = ['（无）', '（无）', '（无）']
    distractors = [...distractors, ...fillers].slice(0, 3)
  }
  const texts = [correctText, ...distractors.slice(0, 3)]
  const ordered = shuffleWithSeed(texts, hashSeed(seed) >>> 0)
  const ids = ['a', 'b', 'c', 'd']
  const options: VocabQuizOption[] = ordered.map((text, i) => ({
    id: ids[i]!,
    text,
  }))
  const correctOption = options.find((o) => o.text === correctText)
  if (!correctOption) {
    options[0] = { id: 'a', text: correctText }
  }
  return options
}

function findCorrectId(options: VocabQuizOption[], correctText: string): string {
  return options.find((o) => o.text === correctText)?.id ?? 'a'
}

function readingDistractors(entry: VocabularyEntry, all: VocabularyEntry[]): string[] {
  return pickOthers(
    all,
    3,
    hashSeed(entry.id + '-r') >>> 0,
    (o) => o.id === entry.id || o.reading === entry.reading,
  ).map((o) => o.reading)
}

function meaningDistractors(entry: VocabularyEntry, all: VocabularyEntry[]): string[] {
  const correct = primaryMeaning(entry.meaning)
  return pickOthers(
    all,
    3,
    hashSeed(entry.id + '-m') >>> 0,
    (o) => o.id === entry.id || primaryMeaning(o.meaning) === correct,
  ).map((o) => primaryMeaning(o.meaning))
}

function clozeDistractors(entry: VocabularyEntry, all: VocabularyEntry[]): string[] {
  return pickOthers(
    all,
    3,
    hashSeed(entry.id + '-c') >>> 0,
    (o) => o.id === entry.id || o.word === entry.word,
  ).map((o) => o.word)
}

function clozeSentence(entry: VocabularyEntry): string | null {
  const ja = entry.example?.japanese?.trim()
  if (!ja || !ja.includes(entry.word)) return null
  return ja.replace(entry.word, '（　）')
}

function buildStep(
  type: VocabQuizStepType,
  entry: VocabularyEntry,
  all: VocabularyEntry[],
): VocabQuizStep | null {
  if (type === 'reading') {
    const correct = entry.reading
    const options = buildOptions(correct, readingDistractors(entry, all), entry.id + '-rd')
    return {
      type,
      typeLabel: VOCAB_STEP_LABELS[type],
      prompt: '',
      options,
      correctOptionId: findCorrectId(options, correct),
    }
  }

  if (type === 'meaning') {
    const correct = primaryMeaning(entry.meaning)
    const options = buildOptions(correct, meaningDistractors(entry, all), entry.id + '-md')
    return {
      type,
      typeLabel: VOCAB_STEP_LABELS[type],
      prompt: '',
      options,
      correctOptionId: findCorrectId(options, correct),
    }
  }

  const cloze = clozeSentence(entry)
  if (!cloze) return null
  const correct = entry.word
  const options = buildOptions(correct, clozeDistractors(entry, all), entry.id + '-cd')
  const zh = entry.example.chinese?.trim()
  return {
    type,
    typeLabel: VOCAB_STEP_LABELS[type],
    prompt: zh ? `${cloze}\n（${zh}）` : cloze,
    options,
    correctOptionId: findCorrectId(options, correct),
  }
}

function buildExplanation(entry: VocabularyEntry): string {
  const lines = [
    `【读音】${entry.reading}`,
    `【释义】${entry.meaning}`,
    `【词性】${entry.pos}`,
  ]
  if (entry.transitivity) {
    lines.push(`【自他】${entry.transitivity}${entry.pair ? `（↔ ${entry.pair}）` : ''}`)
  }
  lines.push(`【例句】${entry.example.japanese}`)
  if (entry.example.chinese) {
    lines.push(entry.example.chinese)
  }
  return lines.join('\n')
}

function generateVocabQuestion(
  entry: VocabularyEntry,
  all: VocabularyEntry[],
  track: VocabTrack = 'exam',
): VocabCompositeQuestion | null {
  if (!entry.word || !entry.reading || !entry.meaning || !entry.example?.japanese) {
    return null
  }
  if (!entry.example.japanese.includes(entry.word)) return null

  const reading = buildStep('reading', entry, all)
  const meaning = buildStep('meaning', entry, all)
  const cloze = buildStep('cloze', entry, all)
  if (!reading || !meaning || !cloze) return null

  return {
    id: `${entry.id}-bundle`,
    track,
    level: entry.level,
    vocabId: entry.id,
    word: entry.word,
    pos: entry.pos,
    transitivity: entry.transitivity,
    pair: entry.pair,
    steps: [reading, meaning, cloze],
    explanation: buildExplanation(entry),
  }
}

export function generateQuestionsFromVocabulary(
  entries: VocabularyEntry[],
  track: VocabTrack = 'exam',
): VocabCompositeQuestion[] {
  const sorted = [...entries].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  return sorted
    .map((entry) => generateVocabQuestion(entry, sorted, track))
    .filter((q): q is VocabCompositeQuestion => !!q)
}
