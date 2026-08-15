import { categoryLabels } from '@/data/grammar'
import type { GrammarPoint } from '@/types/grammar'

/** 去掉句型里的假名注音括号，便于用汉字或假名都能搜到 */
function withoutFurigana(text: string): string {
  return text.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '')
}

/** 把「漢字（かな）」换成假名，便于搜读音 */
function withFuriganaReading(text: string): string {
  return text
    .replace(/([\u4e00-\u9faf]+)（([^）]+)）/g, '$2')
    .replace(/([\u4e00-\u9faf]+)\(([^)]+)\)/g, '$2')
}

function normalize(text: string): string {
  return withoutFurigana(text)
    .toLowerCase()
    .replace(/[〜～・／/\s、。，．.「」『』【】[\]（）()＋+]/g, '')
}

function haystackOf(point: GrammarPoint): string {
  const chunks = [
    point.pattern,
    withoutFurigana(point.pattern),
    withFuriganaReading(point.pattern),
    point.title,
    point.titleJa,
    point.meaning,
    point.summary,
    point.usage ?? '',
    point.notes ?? '',
    categoryLabels[point.category],
    point.level,
  ]
  return normalize(chunks.join('\n'))
}

/** 关键词全部作为子串命中（忽略空格、〜、假名注音）；多词空格分隔为且关系 */
export function matchesGrammarQuery(point: GrammarPoint, query: string): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((token) => normalize(token))
    .filter(Boolean)

  if (tokens.length === 0) return true

  const haystack = haystackOf(point)
  return tokens.every((token) => haystack.includes(token))
}

export function filterGrammarPoints(
  points: GrammarPoint[],
  query: string,
): GrammarPoint[] {
  if (!query.trim()) return points
  return points.filter((point) => matchesGrammarQuery(point, query))
}
