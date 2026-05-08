/**
 * Aladin TTB ItemSearch — https://www.aladin.co.kr/ttb/wblog_manage.aspx (키 발급·호출 URL 등록)
 * 응답은 output=js 일 때 JSONP( callback({...}) ) 형태인 경우가 많아 파싱을 둘 다 시도합니다.
 */

type AladinItem = {
  title?: string
  author?: string
  link?: string
}

type AladinSearchPayload = {
  item?: AladinItem | AladinItem[]
  errorCode?: number
  errorMessage?: string
}

function unwrapJsonp(text: string): string {
  const t = text.trim()
  const paren = t.indexOf('(')
  if (paren === -1) return t
  const last = t.lastIndexOf(')')
  if (last <= paren) return t
  return t.slice(paren + 1, last).trim()
}

function parseAladinPayload(text: string): AladinSearchPayload | null {
  const raw = text.trim()
  if (!raw) return null
  try {
    return JSON.parse(raw) as AladinSearchPayload
  } catch {
    try {
      return JSON.parse(unwrapJsonp(raw)) as AladinSearchPayload
    } catch {
      return null
    }
  }
}

function itemsList(item: AladinItem | AladinItem[] | undefined): AladinItem[] {
  if (!item) return []
  return Array.isArray(item) ? item : [item]
}

function stripHtmlTitle(title: string): string {
  return title.replace(/<[^>]+>/g, '').trim()
}

function normalizeAladinItemUrl(link: unknown): string | undefined {
  if (typeof link !== 'string' || !link.trim()) return undefined
  try {
    const u = new URL(link.trim())
    if (u.hostname.endsWith('aladin.co.kr')) return u.toString()
  } catch {
    return undefined
  }
  return undefined
}

function scoreItem(item: AladinItem, wantTitle: string, wantAuthor: string): number {
  const title = stripHtmlTitle((item.title ?? '').trim())
  const author = (item.author ?? '').trim()
  const wt = wantTitle.toLowerCase()
  const wa = wantAuthor.toLowerCase()
  let s = 0
  if (!title || !author) return -1
  const tl = title.toLowerCase()
  const al = author.toLowerCase()
  if (tl.includes(wt) || wt.includes(tl)) s += 3
  if (wa && (al.includes(wa) || wa.split(/\s+/).some((p) => p.length > 1 && al.includes(p)))) s += 2
  if (title && author) s += 1
  return s
}

/**
 * 알라딘에서 도서 1건을 찾으면 표준 제목·저자·상품 페이지 URL( API `link` )을 반환합니다.
 */
export async function findBookViaAladin(
  title: string,
  author: string | undefined,
  ttbKey: string
): Promise<{ title: string; author: string; itemUrl: string } | null> {
  const t = title.trim()
  const a = (author ?? '').trim()
  if (!t || !ttbKey.trim()) return null

  const attempts: { query: string; queryType: string }[] = [
    { query: a ? `${t} ${a}` : t, queryType: 'Keyword' },
    { query: t, queryType: 'Title' },
    { query: t, queryType: 'Keyword' },
  ]
  const seen = new Set<string>()

  for (const { query: q, queryType } of attempts) {
    const key = `${queryType}:${q.trim()}`
    if (!q.trim() || seen.has(key)) continue
    seen.add(key)

    const url = new URL('https://www.aladin.co.kr/ttb/api/ItemSearch.aspx')
    url.searchParams.set('ttbkey', ttbKey.trim())
    url.searchParams.set('Query', q.trim())
    url.searchParams.set('QueryType', queryType)
    url.searchParams.set('MaxResults', '10')
    url.searchParams.set('start', '1')
    url.searchParams.set('SearchTarget', 'Book')
    url.searchParams.set('output', 'js')
    url.searchParams.set('Version', '20131101')

    const res = await fetch(url.toString(), { next: { revalidate: 0 } })
    if (!res.ok) continue

    const payload = parseAladinPayload(await res.text())
    if (!payload || payload.errorCode) continue

    const items = itemsList(payload.item).filter((it) => it.title && it.author)
    if (!items.length) continue

    const ranked = items
      .map((it) => ({ it, score: scoreItem(it, t, a) }))
      .filter((x) => x.score >= 0)
      .sort((x, y) => y.score - x.score)

    const candidates = (ranked.length ? ranked.map((r) => r.it) : items).filter(Boolean)
    for (const best of candidates) {
      const outTitle = stripHtmlTitle((best.title ?? '').trim())
      const outAuthor = (best.author ?? '').trim()
      const itemUrl = normalizeAladinItemUrl(best.link)
      if (!outTitle || !outAuthor || !itemUrl) continue
      return { title: outTitle, author: outAuthor, itemUrl }
    }
  }

  return null
}
