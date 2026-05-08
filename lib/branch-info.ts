export type BranchTrack = { id: string; name: string; description: string }

export type BranchInfo = { branchPoint: string; tracks: BranchTrack[] }

/**
 * Merges model-supplied branchInfo with branch ids present on books/nodes so that
 * every used track id has a row, and empty name/description fields get sensible fallbacks.
 */
export function mergeBranchInfoFromBooks(
  branchInfo: { branchPoint?: string; tracks?: Array<{ id: string; name?: string; description?: string }> } | undefined,
  books: Array<{ id: string; branch?: string; requiresChoice?: boolean }>
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

  const tracks: BranchTrack[] = orderedIds.map((id) => {
    const t = byId.get(id)
    const name = (t?.name ?? '').trim()
    const description = (t?.description ?? '').trim()
    return {
      id,
      name: name || `${id} 트랙`,
      description:
        description ||
        name ||
        `${id} 경로에 배치된 도서를 순서대로 읽으며 이 로드맵 주제를 깊게 다룹니다.`,
    }
  })

  const branchPoint =
    String(branchInfo?.branchPoint ?? '').trim() ||
    books.find((b) => b.requiresChoice)?.id ||
    books[0]?.id ||
    ''

  return { branchPoint, tracks }
}
