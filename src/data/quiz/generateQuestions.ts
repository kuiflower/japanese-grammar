/**
 * 出题模版：与级别无关的通用题型生成逻辑。
 * 按 level 调取 `levels/` 中对应数据库，见 `index.ts`。
 */
import type { JlptLevel, QuizQuestion } from '@/types/quiz'
import type { GrammarEntry } from '@/data/types/grammar-entry'

export type { GrammarEntry as GrammarEntry }

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function isChineseDefinition(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/^[=#＝]/.test(t)) return true
  if (/^(表|虽说|因为|既然|只要|即使|明明|关于|用于|表示|用来|说明|动作|好像|像是|听说|也许|一定|应该|打算|想要|在～|用于)/u.test(t)) {
    return true
  }
  if (/[（(].*[）)]/u.test(t) && /(口语|书面|正式|随意|主观|客观)/.test(t)) {
    const withoutRuby = t
      .replace(/（[\u3040-\u30ffー]+）/g, '')
      .replace(/\([\u3040-\u30ffー]+\)/g, '')
    if (/(口语|书面|正式|随意|主观|客观)/.test(withoutRuby)) return true
  }

  const kana = (t.match(/[\u3040-\u30ff]/g) || []).length
  const han = (t.match(/[\u4e00-\u9fff]/g) || []).length

  // 日文句子：有句末标点且含动词假名
  if (/[。！？]$/.test(t) && kana >= 3 && /[したてるられるないくすまのをがはにで]/u.test(t)) {
    return false
  }
  if (/[。！？]$/.test(t) && /(です|だ|ません|である|でした|でしょう)$/.test(t)) return false
  if (/[はがをにでとへ][\u3040-\u30fa\u4e00-\u9faf]{1,}/.test(t) && kana >= 2) return false

  if (han >= 8 && han > kana * 1.5) return true
  if (han >= 4 && kana === 0) return true
  return false
}

function isJapaneseSentence(text: string): boolean {
  if (!text || isChineseDefinition(text)) return false
  const kana = (text.match(/[\u3040-\u30ff]/g) || []).length
  if (kana < 2) return false
  const t = text.trim()
  if (/[。！？]$/.test(t)) return true
  if (/[\u3040-\u30fa\u4e00-\u9faf]+(です|だ|ない|ます|れる|られる|ている|でした|でしょう)/.test(t)) {
    return true
  }
  if (/[はがをにでとへ][\u3040-\u30fa\u4e00-\u9faf]{2,}/.test(t)) return true
  return kana >= 4
}

function isMisplacedJapaneseMeaning(text: string): boolean {
  return isJapaneseSentence(text) && !isChineseDefinition(text)
}

function normalizePattern(pattern: string): string {
  return pattern.replace(/[〜～\s（）()【】]/g, '').trim()
}

function hasDuplicatePattern(
  entry: GrammarEntry,
  all: GrammarEntry[],
): boolean {
  const key = normalizePattern(entry.pattern)
  return all.some(
    (o) => o.id !== entry.id && normalizePattern(o.pattern) === key,
  )
}

/** 选项展示字数区间（中文/标点计 1 字） */
const QUIZ_OPTION_MIN_LEN = 10
const QUIZ_OPTION_MAX_LEN = 36

function optionDisplayLength(text: string): number {
  return text.replace(/\s/g, '').length
}

/** 将选项文字控制在统一展示区间：过长的智能截断 */
function formatQuizOptionText(text: string, maxLen = QUIZ_OPTION_MAX_LEN): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (optionDisplayLength(t) <= maxLen) return t
  const cut = t.slice(0, maxLen)
  const last = Math.max(cut.lastIndexOf('，'), cut.lastIndexOf('。'), cut.lastIndexOf('；'))
  return last > 8 ? cut.slice(0, last + 1) : cut + '…'
}

/**
 * 意思题选项：多义条目合并前几条释义，避免只显示「只……」等过短片段
 */
function meaningForQuiz(meaning: string): string {
  const parts = meaning
    .split(/[；;]/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length <= 1) return formatQuizOptionText(meaning)

  let combined = parts[0]!
  for (let i = 1; i < parts.length; i++) {
    if (optionDisplayLength(combined) >= QUIZ_OPTION_MIN_LEN) break
    const candidate = `${combined}；${parts[i]}`
    if (optionDisplayLength(candidate) > QUIZ_OPTION_MAX_LEN) {
      if (optionDisplayLength(combined) < QUIZ_OPTION_MIN_LEN) {
        combined = formatQuizOptionText(candidate)
      }
      break
    }
    combined = candidate
  }
  if (optionDisplayLength(combined) < QUIZ_OPTION_MIN_LEN) {
    combined = formatQuizOptionText(parts.join('；'))
  }
  return formatQuizOptionText(combined)
}

/** 同一题四个选项长度尽量接近：过长的统一截到同一上限 */
function harmonizeQuizOptionTexts(texts: string[]): string[] {
  const formatted = texts.map((t) => formatQuizOptionText(t))
  const lengths = formatted.map(optionDisplayLength)
  const maxLen = Math.max(...lengths)
  const minLen = Math.min(...lengths)
  if (maxLen <= QUIZ_OPTION_MAX_LEN && maxLen <= minLen * 1.6) return formatted

  const cap = Math.min(
    QUIZ_OPTION_MAX_LEN,
    Math.max(QUIZ_OPTION_MIN_LEN, Math.ceil((maxLen + minLen) / 2)),
  )
  return texts.map((t) => formatQuizOptionText(t, cap))
}

/** 取释义的主干（避免截断丢失多义） */
function primaryMeaning(meaning: string, max = 56): string {
  const line = meaning.split(/\n|；/)[0]?.replace(/\s+/g, ' ').trim() ?? meaning
  if (line.length <= max) return line
  const cut = line.slice(0, max)
  const last = Math.max(cut.lastIndexOf('，'), cut.lastIndexOf('。'))
  return last > 12 ? cut.slice(0, last + 1) : cut + '…'
}

function normalizeForCompare(text: string): string {
  return text
    .replace(/[（()）\s：:。、…「」『』]/g, '')
    .replace(/^[^：:]{1,12}[：:]/, '')
    .toLowerCase()
}

/** 用法说明若与释义高度重合，则不应单独出「用法题」 */
function isUsageRedundantWithMeaning(meaning: string, usageText: string): boolean {
  const m = normalizeForCompare(primaryMeaning(meaning, 80))
  const u = normalizeForCompare(usageText)
  if (!m || !u || u.length < 4) return true
  if (m === u) return true
  const shorter = m.length <= u.length ? m : u
  const longer = m.length <= u.length ? u : m
  if (longer.includes(shorter) && shorter.length / longer.length >= 0.55) return true
  return false
}

const USAGE_SIGNAL =
  /接|辞書|普通形|ます形|名词|书面|口语|不能|用于|前接|后接|接在|句末|人为|惯用|形式|场合|语气|接续|否定|命令|として|一方|た形|ない形|辞书形|接动词|接名词|接い形容词|不同于|多用于|不可用于|后项|前项|强调|偏|只表|多表|常含|常接/

function usageSegments(entry: GrammarEntry): string[] {
  if (!entry.usage) return []
  return entry.usage
    .split(/[。；]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6 || /^接/.test(s))
}

/** 从句型中提取可在用法说明里定位的日文关键词 */
function extractPatternKeywords(pattern: string): string[] {
  const keywords = new Set<string>()
  const cleaned = pattern.replace(/[（(][^）)]*[）)]/g, ' ')

  for (const m of cleaned.match(/[ぁ-んァ-ヶー一-龯々]+/g) || []) {
    if (m.length >= 2) keywords.add(m)
  }

  for (const part of cleaned.split(/[・･/／、\s]+/)) {
    const bare = part.replace(/^[〜～]+/, '').trim()
    if (bare.length >= 2 && /[ぁ-んァ-ヶ一-龯]/.test(bare)) keywords.add(bare)
  }

  return [...keywords]
}

/** 片段是否以其他语法名为开头（对比说明），而非本题语法 */
function segmentLeadsWithOtherGrammar(
  segment: string,
  entry: GrammarEntry,
  all: GrammarEntry[],
): boolean {
  const currentKeys = extractPatternKeywords(entry.pattern)
  const lead = segment.match(/^([^：:，,。；]{2,14})/)?.[1]?.trim()
  if (!lead) return false

  for (const other of all) {
    if (other.id === entry.id) continue
    for (const ok of extractPatternKeywords(other.pattern)) {
      if (ok.length < 3) continue
      const inLead = lead.includes(ok) || ok.includes(lead.replace(/^[〜～]/, ''))
      if (!inLead) continue
      const inCurrent = currentKeys.some(
        (ck) => ck.includes(ok) || ok.includes(ck) || lead.includes(ck),
      )
      if (!inCurrent) return true
    }
  }
  return false
}

function segmentAboutCurrentGrammar(
  segment: string,
  entry: GrammarEntry,
  all: GrammarEntry[],
): boolean {
  if (segmentLeadsWithOtherGrammar(segment, entry, all)) return false

  const keys = extractPatternKeywords(entry.pattern)
  if (keys.length === 0) return true

  if (keys.some((k) => segment.includes(k))) return true

  // 中文说明未写出日文形式时，只要不指向其他语法即可
  for (const other of all) {
    if (other.id === entry.id) continue
    for (const ok of extractPatternKeywords(other.pattern)) {
      if (ok.length >= 3 && segment.includes(ok)) {
        const shared = keys.some((ck) => ck.includes(ok) || ok.includes(ck))
        if (!shared) return false
      }
    }
  }
  return true
}

/** 仅当资料中有考点说明时才出用法题；优先接续/语境/限制，且须与释义有实质区分 */
function usageHook(entry: GrammarEntry, all: GrammarEntry[]): string | null {
  if (!entry.usage || entry.usage.length < 12) return null
  const segments = usageSegments(entry).filter(
    (seg) =>
      segmentAboutCurrentGrammar(seg, entry, all) &&
      !isUsageRedundantWithMeaning(entry.meaning, seg),
  )
  if (segments.length === 0) return null

  for (const seg of segments) {
    if (USAGE_SIGNAL.test(seg)) return formatQuizOptionText(seg)
  }

  return formatQuizOptionText(segments[0]!)
}

function truncate(text: string, max = 72): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const last = cut.lastIndexOf('。')
  return last > 20 ? cut.slice(0, last + 1) : cut + '…'
}

function pickOthers<T>(
  pool: T[],
  count: number,
  seed: number,
  exclude: (item: T) => boolean,
): T[] {
  const candidates = pool.filter((item) => !exclude(item))
  if (candidates.length <= count) return candidates
  const copy = [...candidates]
  let s = seed
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) | 0
    const j = Math.abs(s) % (i + 1)
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy.slice(0, count)
}

function pickUsageDistractors(
  entry: GrammarEntry,
  all: GrammarEntry[],
  correct: string,
): string[] {
  return pickOthers(
    all,
    3,
    hashSeed(entry.id + '-u'),
    (o) => {
      if (o.id === entry.id) return true
      const hook = usageHook(o, all)
      if (!hook || hook === correct) return true
      if (isUsageRedundantWithMeaning(o.meaning, hook)) return true
      return false
    },
  )
    .map((o) => usageHook(o, all)!)
    .filter(Boolean)
}

function validExamples(entry: GrammarEntry): { japanese: string; chinese?: string }[] {
  return entry.examples.filter((ex) => ex.japanese && isJapaneseSentence(ex.japanese))
}

/** 同一讲义内易混语法：选句题的干扰项不得来自这些姊妹条目的例句 */
function isConflictingSibling(
  entry: GrammarEntry,
  other: GrammarEntry,
): boolean {
  if (entry.id === other.id) return false
  const pairKeys = ['によって', 'ものだ', 'てきた', 'ていく', 'てくる', 'ということ', 'にしては', 'どころか', 'に違いない']
  for (const key of pairKeys) {
    if (entry.pattern.includes(key) && other.pattern.includes(key)) return true
  }
  return false
}

function excludedSiblingExampleSentences(
  entry: GrammarEntry,
  all: GrammarEntry[],
): Set<string> {
  const excluded = new Set<string>()
  for (const other of all) {
    if (!isConflictingSibling(entry, other)) continue
    for (const ex of validExamples(other)) excluded.add(ex.japanese)
  }
  return excluded
}

function sentencePickCategoryHint(entry: GrammarEntry): string {
  if (entry.category && (/^第\d+課$/.test(entry.category) || entry.level === 'N3')) {
    return `（${entry.category}）`
  }
  return ''
}

function isMisleadingSentenceDistractor(pattern: string, sentence: string): boolean {
  if (pattern.includes('ような') && /ようにな/.test(sentence)) return true
  return false
}

/** 第一轮解析：释义/用法 + 讲义例句（含中文） */
function buildRound1Explanation(
  entry: GrammarEntry,
  kind: 'meaning' | 'usage',
): string {
  const lines: string[] = []
  if (kind === 'meaning') {
    lines.push(`【释义】${truncate(entry.meaning, 200)}`)
    if (entry.usage) lines.push(`【用法】${truncate(entry.usage, 160)}`)
  } else {
    lines.push(`【用法】${truncate(entry.usage!, 200)}`)
    lines.push(`【释义】${truncate(entry.meaning, 120)}`)
  }
  const examples = validExamples(entry)
  if (examples.length > 0) {
    lines.push('【例句】')
    for (const ex of examples.slice(0, 3)) {
      lines.push(ex.japanese)
      if (ex.chinese) lines.push(ex.chinese)
    }
  }
  return lines.join('\n')
}

function createMeaningQuestion(
  entry: GrammarEntry,
  all: GrammarEntry[],
  level: JlptLevel,
): QuizQuestion | null {
  if (!entry.meaning || entry.meaning.length < 2 || isMisplacedJapaneseMeaning(entry.meaning)) {
    return null
  }

  const correctText = meaningForQuiz(entry.meaning)
  const distractors = pickOthers(
    all,
    3,
    hashSeed(entry.id + '-m'),
    (o) =>
      o.id === entry.id ||
      isMisplacedJapaneseMeaning(o.meaning) ||
      o.meaning.length < 2 ||
      meaningForQuiz(o.meaning) === correctText,
  ).map((o) => meaningForQuiz(o.meaning))

  if (distractors.length < 3) return null

  const optionTexts = harmonizeQuizOptionTexts([correctText, ...distractors])
  const options = [
    { id: 'a', text: optionTexts[0]! },
    { id: 'b', text: optionTexts[1]! },
    { id: 'c', text: optionTexts[2]! },
    { id: 'd', text: optionTexts[3]! },
  ]
  const shuffled = shuffleOptions(options, `${entry.id}-m`)

  return {
    id: `${entry.id}-meaning`,
    level,
    grammarId: entry.id,
    grammarPattern: entry.pattern,
    type: 'meaning',
    round: 'round1',
    typeLabel: '中文意思',
    prompt: `「${entry.pattern}」的意思是？`,
    options: shuffled.options,
    correctOptionId: shuffled.correctId,
    explanation: buildRound1Explanation(entry, 'meaning'),
  }
}

function createUsageQuestion(
  entry: GrammarEntry,
  all: GrammarEntry[],
  level: JlptLevel,
): QuizQuestion | null {
  const hook = usageHook(entry, all)
  if (!hook) return null

  const distractors = pickUsageDistractors(entry, all, hook)
  if (distractors.length < 3) return null

  const optionTexts = harmonizeQuizOptionTexts([hook, ...distractors])
  const options = [
    { id: 'a', text: optionTexts[0]! },
    { id: 'b', text: optionTexts[1]! },
    { id: 'c', text: optionTexts[2]! },
    { id: 'd', text: optionTexts[3]! },
  ]
  const shuffled = shuffleOptions(options, `${entry.id}-u`)

  return {
    id: `${entry.id}-usage`,
    level,
    grammarId: entry.id,
    grammarPattern: entry.pattern,
    type: 'usage',
    round: 'round1',
    typeLabel: '用法要点',
    prompt: `「${entry.pattern}」的用法要点是？`,
    options: shuffled.options,
    correctOptionId: shuffled.correctId,
    explanation: buildRound1Explanation(entry, 'usage'),
  }
}

function createSentencePickQuestion(
  entry: GrammarEntry,
  all: GrammarEntry[],
  level: JlptLevel,
): QuizQuestion | null {
  const examples = validExamples(entry)
  if (examples.length === 0) return null

  const correct = examples[0]!
  const samePatternIds = new Set(
    all
      .filter(
        (o) =>
          o.id !== entry.id &&
          normalizePattern(o.pattern) === normalizePattern(entry.pattern),
      )
      .map((o) => o.id),
  )

  const distractorPool = all.flatMap((o) => {
    if (o.id === entry.id || samePatternIds.has(o.id)) return []
    return validExamples(o).map((ex) => ex.japanese)
  })

  const siblingExcluded = excludedSiblingExampleSentences(entry, all)

  const distractors = pickOthers(
    distractorPool,
    3,
    hashSeed(entry.id + '-s'),
    (s) =>
      s === correct.japanese ||
      siblingExcluded.has(s) ||
      isMisleadingSentenceDistractor(entry.pattern, s),
  )
  if (distractors.length < 3) return null

  const dup = hasDuplicatePattern(entry, all)
  const lessonHint = sentencePickCategoryHint(entry)
  const categoryHint = lessonHint || (dup && entry.category ? `（${entry.category}）` : '')
  const prompt = `以下哪句是你的讲义中「${entry.pattern}」${categoryHint}的例句？`

  const options = [
    { id: 'a', text: correct.japanese },
    { id: 'b', text: distractors[0]! },
    { id: 'c', text: distractors[1]! },
    { id: 'd', text: distractors[2]! },
  ]
  const shuffled = shuffleOptions(options, `${entry.id}-s`)

  return {
    id: `${entry.id}-sentence`,
    level,
    grammarId: entry.id,
    grammarPattern: entry.pattern,
    type: 'sentence-pick',
    round: 'round2',
    typeLabel: '选正确例句',
    prompt,
    options: shuffled.options,
    correctOptionId: shuffled.correctId,
    explanation: `讲义原句：${correct.japanese}${
      correct.chinese ? `（${correct.chinese}）` : ''
    }`,
  }
}

const OPTION_IDS = ['a', 'b', 'c', 'd'] as const

function optionSlot(key: string): number {
  let h = hashSeed(key)
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d)
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b)
  h ^= h >>> 16
  return Math.abs(h) % OPTION_IDS.length
}

function shuffleOptions(
  options: { id: string; text: string }[],
  key: string,
): { options: { id: string; text: string }[]; correctId: string } {
  const correct = options[0]!
  const distractors = options.slice(1)

  let s = hashSeed(`${key}-d`)
  const shuffledDistractors = [...distractors]
  for (let i = shuffledDistractors.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) | 0
    const j = Math.abs(s) % (i + 1)
    ;[shuffledDistractors[i], shuffledDistractors[j]] = [
      shuffledDistractors[j]!,
      shuffledDistractors[i]!,
    ]
  }

  const correctIndex = optionSlot(`${key}-slot`)

  const result: { id: string; text: string }[] = []
  let d = 0
  for (let i = 0; i < OPTION_IDS.length; i++) {
    if (i === correctIndex) {
      result.push({ id: OPTION_IDS[i]!, text: correct.text })
    } else {
      result.push({ id: OPTION_IDS[i]!, text: shuffledDistractors[d++]!.text })
    }
  }

  return { options: result, correctId: OPTION_IDS[correctIndex]! }
}

const GENERIC_SPANS = new Set(['こと', 'もの', 'よう', 'ため', 'なる', 'する', 'いる', 'ある', 'ない', 'です', 'だ'])

/** 从语法条目中提取可在例句里定位的日文片段 */
function extractGrammarFragments(pattern: string): string[] {
  const fragments = new Set<string>()
  const cleaned = pattern
    .replace(/[（(][^）)]*[）)]/g, ' ')
    .replace(/[【】\[\]]/g, ' ')

  for (const m of cleaned.match(/[ぁ-んァ-ヶー一-龯々]+/g) || []) {
    if (m.length >= 2) fragments.add(m)
  }

  for (const part of cleaned.split(/[〜～]/)) {
    const t = part.replace(/^[NVANa\d＋+／/、・\s]+/gi, '').trim()
    if (t.length >= 2 && /[ぁ-んァ-ヶ一-龯]/.test(t)) fragments.add(t)
  }

  return [...fragments].sort((a, b) => b.length - a.length)
}

function isSpecificSpan(span: string): boolean {
  if (span.length < 2) return false
  if (span.length >= 3) return !GENERIC_SPANS.has(span)
  return false
}

function findBlankSpan(entry: GrammarEntry, sentence: string): string | null {
  const fragments = extractGrammarFragments(entry.pattern)
  for (const frag of fragments) {
    if (frag.length >= 3 && sentence.includes(frag)) return frag
  }
  for (const frag of fragments) {
    if (isSpecificSpan(frag) && sentence.includes(frag)) return frag
  }
  return null
}

function grammarSpanPool(all: GrammarEntry[], excludeId: string): string[] {
  const spans = new Set<string>()
  for (const e of all) {
    if (e.id === excludeId) continue
    for (const frag of extractGrammarFragments(e.pattern)) {
      if (frag.length >= 3) spans.add(frag)
    }
    for (const ex of validExamples(e)) {
      const span = findBlankSpan(e, ex.japanese)
      if (span) spans.add(span)
    }
  }
  return [...spans]
}

function createFillBlankQuestion(
  entry: GrammarEntry,
  all: GrammarEntry[],
  level: JlptLevel,
): QuizQuestion | null {
  const examples = validExamples(entry)
  if (examples.length === 0) return null

  let target: { japanese: string; chinese?: string } | null = null
  let span: string | null = null
  for (const ex of examples) {
    const found = findBlankSpan(entry, ex.japanese)
    if (found) {
      target = ex
      span = found
      break
    }
  }
  if (!target || !span) return null

  const blanked = target.japanese.replace(span, '（　　）')
  const pool = grammarSpanPool(all, entry.id)
  const distractors = pickOthers(
    pool,
    3,
    hashSeed(entry.id + '-fb'),
    (s) => s === span || s.length < 2,
  )
  if (distractors.length < 3) return null

  const options = [
    { id: 'a', text: span },
    { id: 'b', text: distractors[0]! },
    { id: 'c', text: distractors[1]! },
    { id: 'd', text: distractors[2]! },
  ]
  const shuffled = shuffleOptions(options, `${entry.id}-fb`)
  const hint = sentencePickCategoryHint(entry)

  return {
    id: `${entry.id}-fill`,
    level,
    grammarId: entry.id,
    grammarPattern: entry.pattern,
    type: 'fill-blank',
    round: 'enhanced',
    typeLabel: '语法挖空',
    prompt: `「${entry.pattern}」${hint}填空：\n${blanked}`,
    options: shuffled.options,
    correctOptionId: shuffled.correctId,
    explanation: `讲义原句：${target.japanese}${target.chinese ? `（${target.chinese}）` : ''}`,
  }
}

function createErrorDetectQuestion(
  entry: GrammarEntry,
  all: GrammarEntry[],
  level: JlptLevel,
): QuizQuestion | null {
  const examples = validExamples(entry)
  if (examples.length === 0) return null

  const ex = examples.length > 1 ? examples[1]! : examples[0]!
  const span = findBlankSpan(entry, ex.japanese)
  if (!span) return null

  const pool = grammarSpanPool(all, entry.id)
  const wrongSpans = pickOthers(
    pool,
    3,
    hashSeed(entry.id + '-ed'),
    (s) => s === span || !ex.japanese.includes(span) || s.length < 2,
  )
  if (wrongSpans.length < 3) return null

  const wrongSentences = wrongSpans
    .map((ws) => ex.japanese.replace(span, ws))
    .filter((s) => s !== ex.japanese)
  if (wrongSentences.length < 3) return null

  const options = [
    { id: 'a', text: ex.japanese },
    { id: 'b', text: wrongSentences[0]! },
    { id: 'c', text: wrongSentences[1]! },
    { id: 'd', text: wrongSentences[2]! },
  ]
  const shuffled = shuffleOptions(options, `${entry.id}-ed`)
  const hint = sentencePickCategoryHint(entry)

  return {
    id: `${entry.id}-error`,
    level,
    grammarId: entry.id,
    grammarPattern: entry.pattern,
    type: 'error-detect',
    round: 'enhanced',
    typeLabel: '改错辨析',
    prompt: `「${entry.pattern}」${hint}下列哪句是讲义中的正确写法？`,
    options: shuffled.options,
    correctOptionId: shuffled.correctId,
    explanation: `正确句：${ex.japanese}${ex.chinese ? `（${ex.chinese}）` : ''}\n易错点：应使用「${span}」`,
  }
}

export function generateQuestionsFromGrammar(
  entries: GrammarEntry[],
  level: JlptLevel,
): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  for (const entry of entries) {
    const m = createMeaningQuestion(entry, entries, level)
    if (m) questions.push(m)
    const u = createUsageQuestion(entry, entries, level)
    if (u) questions.push(u)
    const s = createSentencePickQuestion(entry, entries, level)
    if (s) questions.push(s)
    const f = createFillBlankQuestion(entry, entries, level)
    if (f) questions.push(f)
    const e = createErrorDetectQuestion(entry, entries, level)
    if (e) questions.push(e)
  }
  return questions
}
