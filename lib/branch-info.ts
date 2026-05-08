export type BranchTrack = { id: string; name: string; description: string }

export type BranchInfo = { branchPoint: string; tracks: BranchTrack[] }

export type BranchBookInput = {
  id: string
  branch?: string
  requiresChoice?: boolean
  title?: string
}

function isWeakTrackDescription(description: string, name: string): boolean {
  const d = description.trim()
  const n = name.trim()
  if (d.length < 28) return true
  if (n && d === n) return true
  if (/^[ABC]\s*트랙$/u.test(d)) return true
  if (/^[ABC] 경로/u.test(d) && d.length < 45) return true
  return false
}

function buildDescriptionFromBooks(
  id: string,
  name: string,
  books: BranchBookInput[],
  topicHint?: string
): string {
  const titles = books
    .filter((b) => b.branch === id)
    .map((b) => (b.title ?? '').trim())
    .filter(Boolean)
  const titleList = titles.slice(0, 3).join(' · ')
  const topic = (topicHint ?? '').trim()

  if (titleList && topic) {
    return `「${topic}」을(를) 위해 「${name}」(${id}) 트랙에서는 ${titleList} 등을 순서대로 읽으며 심화합니다.`
  }
  if (titleList) {
    return `「${name}」(${id}) 트랙은 ${titleList} 등으로 구성된 학습 경로입니다.`
  }
  if (topic) {
    return `「${topic}」 주제에서 「${name}」(${id}) 트랙의 목표와 흐름에 맞춰 단계적으로 읽어 나갑니다.`
  }
  return `${id} 트랙(${name})에서 제시된 도서를 순서대로 읽으며 로드맵 주제를 다룹니다.`
}

/**
 * Merges model-supplied branchInfo with branch ids present on books/nodes so that
 * every used track id has a row. Fills weak or empty descriptions using book titles
 * and optional roadmap title so the UI always has something meaningful to show.
 */
export function mergeBranchInfoFromBooks(
  branchInfo: { branchPoint?: string; tracks?: Array<{ id: string; name?: string; description?: string }> } | undefined,
  books: BranchBookInput[],
  context?: { topicHint?: string }
): BranchInfo | undefined {
  const modelTracks = branchInfo?.tracks ?? []
  const inferredIds = Array.from(new Set(books.map((b) => b.branch).filter(Boolean))) as string[]

  const orderedIds: string[] = []
  for (const t of modelTracks) {
    const id = String(t.id ?? '').trim()
    if (id && !orderedIds.includes(id)) orderedIds.push(id)
  }
  for (const id of [...inferredIds].sort()) {
    if (!orderedIds.includes(id)) orderedIds.push(id)
  }

  if (orderedIds.length === 0) return undefined

  const byId = new Map(modelTracks.map((t) => [String(t.id ?? '').trim(), t]))
  const topicHint = context?.topicHint

  const tracks: BranchTrack[] = orderedIds.map((id) => {
    const t = byId.get(id)
    const name = (t?.name ?? '').trim() || `${id} 트랙`
    let description = (t?.description ?? '').trim()

    if (isWeakTrackDescription(description, name)) {
      description = buildDescriptionFromBooks(id, name, books, topicHint)
    }

    return { id, name, description }
  })

  const branchPoint =
    String(branchInfo?.branchPoint ?? '').trim() ||
    books.find((b) => b.requiresChoice)?.id ||
    books[0]?.id ||
    ''

  return { branchPoint, tracks }
}
