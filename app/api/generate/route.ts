import { NextResponse } from 'next/server'
import { mergeBranchInfoFromBooks } from '@/lib/branch-info'

type GenerateRequestBody = {
  prompt?: string
}

type APINode = {
  id: string
  title: string
  author?: string
  coupangSearchUrl?: string
  position: { x: number; y: number }
  branch?: string
  requiresChoice?: boolean
}

type APIEdge = {
  source: string
  target: string
}

type RoadmapResponse = {
  roadmap: {
    title: string
    description: string
    nodes: APINode[]
    edges: APIEdge[]
    hasBranches?: boolean
    recommendedItems?: Array<{
      id: string
      name: string
      reason: string
      coupangSearchUrl?: string
    }>
    branchInfo?: {
      branchPoint: string
      tracks: Array<{ id: string; name: string; description: string }>
    }
  }
}

function createCoupangSearchUrl(query: string): string {
  return `https://link.coupang.com/a/custom-url?q=${encodeURIComponent(query)}`
}

type OpenLibrarySearchResponse = {
  docs?: Array<{
    key?: string
    title?: string
    author_name?: string[]
  }>
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

function extractJsonObject(text: string): string {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) return fencedMatch[1].trim()
  return text.trim()
}

async function findRealBook(title: string, author?: string): Promise<{ title: string; author: string } | null> {
  const t = title.trim()
  const a = (author ?? '').trim()
  if (!t) return null

  const urls: string[] = []
  const push = (u: string) => {
    if (!urls.includes(u)) urls.push(u)
  }

  // General search (works for Korean + Latin mixed queries)
  if (a) push(`https://openlibrary.org/search.json?q=${encodeURIComponent(`${t} ${a}`)}&limit=15`)
  push(`https://openlibrary.org/search.json?q=${encodeURIComponent(t)}&limit=15`)
  if (a) push(`https://openlibrary.org/search.json?q=${encodeURIComponent(`${a} ${t}`)}&limit=15`)
  // Structured params often match translated editions better
  if (a) {
    push(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(t)}&author=${encodeURIComponent(a)}&limit=15`
    )
  } else {
    push(`https://openlibrary.org/search.json?title=${encodeURIComponent(t)}&limit=15`)
  }

  const pickBest = (docs: OpenLibrarySearchResponse['docs'] | undefined) => {
    if (!docs?.length) return null
    const normalizedTitle = t.toLowerCase()
    const normalizedAuthor = a.toLowerCase()
    const scored = docs
      .map((doc) => {
        const docTitle = (doc.title || '').toLowerCase()
        const docAuthor = (doc.author_name?.[0] || '').toLowerCase()
        let score = 0
        if (doc.title && doc.author_name?.[0]) score += 2
        if (a && docAuthor.includes(normalizedAuthor)) score += 2
        if (docTitle.includes(normalizedTitle) || normalizedTitle.includes(docTitle)) score += 1
        return { doc, score }
      })
      .filter((row) => row.doc.title && row.doc.author_name?.[0])
      .sort((x, y) => y.score - x.score)

    const best = scored[0]?.doc
    if (!best?.title || !best.author_name?.[0]) return null
    return { title: best.title, author: best.author_name[0] }
  }

  for (const url of urls) {
    const res = await fetch(url)
    if (!res.ok) continue
    const data = (await res.json()) as OpenLibrarySearchResponse
    const match = pickBest(data.docs)
    if (match) return match
  }

  return null
}

async function verifyRoadmapBooks(roadmap: RoadmapResponse['roadmap']) {
  const verifiedNodes: APINode[] = []
  for (const node of roadmap.nodes) {
    const realBook = await findRealBook(node.title, node.author)
    if (!realBook) continue
    verifiedNodes.push({
      ...node,
      title: realBook.title,
      author: realBook.author,
      coupangSearchUrl: node.coupangSearchUrl || createCoupangSearchUrl(realBook.title),
    })
  }
  const verifiedNodeIds = new Set(verifiedNodes.map(node => node.id))
  const verifiedEdges = roadmap.edges.filter(
    (edge) => verifiedNodeIds.has(edge.source) && verifiedNodeIds.has(edge.target)
  )

  return {
    ...roadmap,
    nodes: verifiedNodes,
    edges: verifiedEdges,
  }
}

function sanitizeRoadmap(roadmap: RoadmapResponse['roadmap']): RoadmapResponse['roadmap'] {
  const toNumber = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback
  const usedIds = new Set<string>()

  const sanitizedNodes = roadmap.nodes
    .map((node, index) => {
      const baseId = (node.id || `step-${index + 1}`).trim() || `step-${index + 1}`
      let id = baseId
      let suffix = 1
      while (usedIds.has(id)) {
        id = `${baseId}-${suffix}`
        suffix += 1
      }
      usedIds.add(id)

      return {
      id,
      title: (node.title || '').trim() || `도서 ${index + 1}`,
      author: (node.author || '').trim() || '저자 미상',
      coupangSearchUrl:
        (node.coupangSearchUrl || '').trim() || createCoupangSearchUrl((node.title || '').trim() || `도서 ${index + 1}`),
      branch: node.branch,
      requiresChoice: Boolean(node.requiresChoice),
      position: {
        x: toNumber(node.position?.x, 40 + index * 180),
        y: toNumber(node.position?.y, 90),
      },
    }})
    .filter((node) => Boolean(node.id))

  // If many nodes share near-identical coordinates, spread them horizontally.
  const minGap = 70
  const spreadNodes = sanitizedNodes.map((node, index, arr) => {
    const hasCollision = arr.some((other, otherIndex) => {
      if (otherIndex === index) return false
      return (
        Math.abs(other.position.x - node.position.x) < minGap &&
        Math.abs(other.position.y - node.position.y) < minGap
      )
    })

    if (!hasCollision) return node
    return {
      ...node,
      position: {
        x: 40 + index * 170,
        y: 90 + (index % 2) * 70,
      },
    }
  })

  const MAX_ROADMAP_NODES = 9
  let cappedNodes = spreadNodes
  let cappedEdges = roadmap.edges.filter((edge) =>
    spreadNodes.some((n) => n.id === edge.source) && spreadNodes.some((n) => n.id === edge.target)
  )
  if (cappedNodes.length > MAX_ROADMAP_NODES) {
    const keep = new Set(cappedNodes.map((n) => n.id))
    while (keep.size > MAX_ROADMAP_NODES) {
      const leaf = [...keep].find(
        (k) => ![...keep].some((v) => cappedEdges.some((e) => e.source === k && e.target === v))
      )
      if (leaf) {
        keep.delete(leaf)
        continue
      }
      const arbitrary = [...keep][0]
      if (!arbitrary) break
      keep.delete(arbitrary)
    }
    cappedNodes = cappedNodes.filter((n) => keep.has(n.id))
    cappedEdges = cappedEdges.filter((e) => keep.has(e.source) && keep.has(e.target))
    console.warn('[api/generate] Capped roadmap nodes to', cappedNodes.length, '(max', MAX_ROADMAP_NODES, ')')
  }

  const nodeIds = new Set(cappedNodes.map((node) => node.id))
  const sanitizedEdges = cappedEdges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  )
  const inferredTrackIds = Array.from(
    new Set(cappedNodes.map((node) => node.branch).filter(Boolean))
  ) as string[]
  const normalizedBranchInfo = mergeBranchInfoFromBooks(roadmap.branchInfo, cappedNodes)

  const normalizedRecommendedItems = Array.isArray(roadmap.recommendedItems)
    ? roadmap.recommendedItems
        .map((item, index) => {
          const name = (item.name || '').trim()
          if (!name) return null
          return {
            id: (item.id || `gear-${index + 1}`).trim() || `gear-${index + 1}`,
            name,
            reason: (item.reason || '').trim() || '학습 효율 향상을 위한 추천 장비입니다.',
            coupangSearchUrl: (item.coupangSearchUrl || '').trim() || createCoupangSearchUrl(name),
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : []

  return {
    ...roadmap,
    nodes: cappedNodes,
    edges: sanitizedEdges,
    hasBranches: roadmap.hasBranches ?? inferredTrackIds.length > 0,
    recommendedItems: normalizedRecommendedItems,
    branchInfo: normalizedBranchInfo,
  }
}

function ensureMinimumNodes(
  roadmap: RoadmapResponse['roadmap'],
  prompt: string,
  minCount: number = 3
): RoadmapResponse['roadmap'] {
  if (roadmap.nodes.length >= minCount) return roadmap

  const supplemented = buildFallbackRoadmap(prompt).roadmap
  const existingIds = new Set(roadmap.nodes.map((node) => node.id))
  const nextNodes = [...roadmap.nodes]

  for (const node of supplemented.nodes) {
    if (nextNodes.length >= minCount) break
    let candidateId = node.id
    let suffix = 1
    while (existingIds.has(candidateId)) {
      candidateId = `${node.id}-${suffix}`
      suffix += 1
    }
    existingIds.add(candidateId)
    nextNodes.push({ ...node, id: candidateId })
  }

  const nodeIds = new Set(nextNodes.map((node) => node.id))
  const originalEdges = roadmap.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  )

  const complementedEdges = nextNodes
    .slice(1)
    .map((node, index) => ({ source: nextNodes[index].id, target: node.id }))

  return {
    ...roadmap,
    nodes: nextNodes,
    edges: originalEdges.length > 0 ? originalEdges : complementedEdges,
    hasBranches: roadmap.hasBranches,
    branchInfo: roadmap.branchInfo,
  }
}

function buildFallbackRoadmap(prompt: string): RoadmapResponse {
  return {
    roadmap: {
      title: `${prompt} 로드맵`,
      description: `${prompt} 주제 학습을 위한 기본 로드맵`,
      nodes: [
        { id: 'step-1', title: `${prompt} 입문`, author: '추천 저자', position: { x: 40, y: 90 } },
        { id: 'step-2', title: `${prompt} 핵심 개념`, author: '추천 저자', position: { x: 220, y: 90 } },
        { id: 'step-3', title: `${prompt} 실전 적용`, author: '추천 저자', position: { x: 400, y: 90 } },
      ].map((node) => ({ ...node, coupangSearchUrl: createCoupangSearchUrl(node.title) })),
      edges: [
        { source: 'step-1', target: 'step-2' },
        { source: 'step-2', target: 'step-3' },
      ],
      recommendedItems: [
        {
          id: 'gear-1',
          name: `${prompt} 입문서 세트`,
          reason: '핵심 개념을 빠르게 훑고 학습 계획을 세우는 데 도움이 됩니다.',
          coupangSearchUrl: createCoupangSearchUrl(`${prompt} 입문서`),
        },
        {
          id: 'gear-2',
          name: '노트북 거치대',
          reason: '장시간 학습 시 자세를 안정적으로 유지해 학습 피로를 줄여줍니다.',
          coupangSearchUrl: createCoupangSearchUrl('노트북 거치대'),
        },
      ],
    },
  }
}

async function requestRoadmapCandidate(apiKey: string, prompt: string, isRetry: boolean) {
  const retryHint = isRetry
    ? '\n중요: 이전 결과 품질이 낮았습니다. 반드시 더 유명하고 검증 가능한 실존 도서를 선택하세요.'
    : ''

  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: [
                'You are an expert curriculum architect for Korean learners.',
                'Generate a hierarchical reading roadmap using ONLY real books that are sold in major Korean bookstores (Kyobo, Aladin, Yes24).',
                'Never invent book titles, authors, editions, or ISBN-like data.',
                'Prefer books with high public availability and stable reputation; when uncertain, choose mainstream classics over niche books.',
                'Use Korean originals or officially translated Korean editions only.',
                'If a Korean edition exists, output Korean title/author notation.',
                'The learning order must strictly follow: foundation -> principles -> application -> advanced.',
                'Each next step must depend on prior knowledge from previous steps; model this dependency in edges.',
                'Avoid difficulty cliffs. Difficulty in each track must rise gradually; insert bridge books when needed.',
                'Return exactly between 6 and 9 nodes inclusive (never fewer than 6, never more than 9).',
                'Build a branch-based skill tree with an early common trunk and then 1 to 3 tracks (A/B/C).',
                'Set roadmap.hasBranches=true and include roadmap.branchInfo.branchPoint + tracks.',
                'tracks must be [{id,name,description}] with ids A/B/C (subset if fewer tracks).',
                'Each track MUST have a unique Korean name (short label) and a Korean description of at least 40 characters explaining learning goals on that track for THIS roadmap topic; descriptions must differ across tracks and align with the books you assign to that track id.',
                'Every post-branch node with branch set must use branch id exactly matching one of branchInfo.tracks[].id.',
                'Set requiresChoice=true on branch point node. Set branch field on each branch node.',
                'After the branch point, use at most 2 books per track so total nodes stay within 6-9.',
                'Pick books that are very likely to appear in OpenLibrary search (world-famous works, widely translated classics, major bestsellers).',
                'When a famous Korean edition maps to a well-known international edition, prefer spelling that OpenLibrary indexes well for author/title.',
                'Each node MUST include non-empty id, title, author, coupangSearchUrl, and position.',
                'Also include roadmap.recommendedItems (2-5 items) for essential learning gear/electronics/stationery.',
                'Every coupangSearchUrl MUST use: https://link.coupang.com/a/custom-url?q={query}',
                'Before finalizing, self-check: real books only, Korean edition preference, smooth difficulty progression, valid prerequisite edges, complete Coupang URLs.',
                'Return ONLY valid JSON with this shape: {"roadmap":{"title":string,"description":string,"hasBranches":boolean,"branchInfo":{"branchPoint":string,"tracks":[{"id":string,"name":string,"description":string}]},"nodes":[{"id":string,"title":string,"author":string,"coupangSearchUrl":string,"branch":string,"requiresChoice":boolean,"position":{"x":number,"y":number}}],"edges":[{"source":string,"target":string}],"recommendedItems":[{"id":string,"name":string,"reason":string,"coupangSearchUrl":string}]}}',
              ].join(' '),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                `주제: ${prompt}`,
                '노드(도서) 개수는 반드시 6개 이상 9개 이하여야 한다. 10개 이상 절대 금지.',
                '한국 독자가 실제로 구할 수 있는 실존 도서만 포함해줘. (교보문고/알라딘/예스24 기준)',
                '한국어 원서 또는 한국어 번역본만 사용하고, 제목은 한국어 표기로 써줘.',
                'OpenLibrary 같은 글로벌 카탈로그에서 검색될 가능성이 높은 초유명/대표 베스트셀러 위주로 골라줘.',
                '난이도 흐름은 반드시 기초 -> 원리 -> 응용 -> 심화 순서로 구성하고, 이전 단계가 다음 단계의 선수학습이 되게 해줘.',
                '트랙 안에서 난이도가 급상승하지 않도록 가교 도서를 배치해줘.',
                '초반 공통 트랙 뒤에 1~3개 분기 트랙(A/B/C)이 있는 스킬트리 구조로 구성해줘.',
                '분기 시작 노드에는 requiresChoice=true를 넣고, 분기 노드에는 branch: "A" | "B" | "C" 중 적절한 값을 넣어줘.',
                'roadmap.hasBranches=true, roadmap.branchInfo.branchPoint/tracks를 반드시 채워줘.',
                'tracks는 반드시 [{id,name,description}] 형태로 채워줘. name은 짧은 한국어 트랙 제목, description은 이 로드맵 주제에 맞춰 그 트랙(A/B/C)에 배치한 도서들의 학습 방향·기대효과를 40~120자 한국어로 구체적으로 작성해줘.',
                'description은 빈 문자열·"A 경로" 같은 형식적 한 줄 금지. 트랙마다 문장이 겹치면 안 돼.',
                '분기 이후 각 도서 노드의 branch 값은 branchInfo.tracks[].id와 정확히 일치해야 해.',
                '트랙 수와 트랙당 권수를 조절해 전체 노드는 6~9개로 맞추고, 분기 이후 각 트랙에는 최대 2권만 배치해줘.',
                '각 노드는 반드시 id, title, author, coupangSearchUrl, position(x,y)을 포함해줘.',
                '로드맵 하단에 보여줄 필수 장비/교구/전자제품 추천도 2~5개 포함하고 recommendedItems에 넣어줘.',
                '추천 상품은 반드시 쿠팡에서 검색 가능한 실존 상품으로 작성하고 coupangSearchUrl 필드를 채워줘.',
                '불확실한 책은 제외하고, 더 유명하고 검증된 대체 도서를 선택해줘.',
                retryHint,
              ].join('\n'),
            },
          ],
        },
      ],
    }),
  })

  if (!openAIResponse.ok) {
    const errorText = await openAIResponse.text()
    throw new Error(`OpenAI request failed: ${errorText}`)
  }

  const result = (await openAIResponse.json()) as ChatCompletionResponse
  const outputText = result.choices?.[0]?.message?.content?.trim()
  if (!outputText) return null

  const parsed = JSON.parse(extractJsonObject(outputText)) as Partial<RoadmapResponse>
  if (!parsed.roadmap || !Array.isArray(parsed.roadmap.nodes) || !Array.isArray(parsed.roadmap.edges)) {
    return null
  }

  return parsed.roadmap
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequestBody
    const prompt = body?.prompt?.trim()
    console.log('[api/generate] request received', { hasPrompt: Boolean(prompt), promptLength: prompt?.length ?? 0 })

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    // Prefer .env.local: OPENAI_API_KEY=...
    // If env loading fails in your local setup, you can temporarily replace
    // this with your key directly: const apiKey = "YOUR_KEY_HERE"
    const apiKey = process.env.OPENAI_API_KEY ?? 'YOUR_KEY_HERE'
    if (!apiKey || apiKey === 'YOUR_KEY_HERE') {
      return NextResponse.json(
        {
          error: 'OPENAI_API_KEY is not configured',
          guide:
            'Set OPENAI_API_KEY in .env.local, or temporarily replace apiKey in app/api/generate/route.ts with "YOUR_KEY_HERE".',
        },
        { status: 500 }
      )
    }

    const attemptErrors: string[] = []
    for (const isRetry of [false, true]) {
      try {
        const candidate = await requestRoadmapCandidate(apiKey, prompt, isRetry)
        if (!candidate) {
          console.warn('[api/generate] Invalid model output shape', { isRetry })
          attemptErrors.push(`attempt ${isRetry ? 2 : 1}: invalid model output shape`)
          continue
        }

        const verifiedRoadmap = sanitizeRoadmap(await verifyRoadmapBooks(candidate))
        if (verifiedRoadmap.nodes.length >= 3) {
          console.log('[api/generate] Parsed roadmap from model output', {
            isRetry,
            title: verifiedRoadmap.title,
            nodes: verifiedRoadmap.nodes.length,
            edges: verifiedRoadmap.edges.length,
          })
          return NextResponse.json({ roadmap: verifiedRoadmap })
        }

        const sanitizedCandidate = sanitizeRoadmap(candidate)
        if (sanitizedCandidate.nodes.length >= 3) {
          console.warn('[api/generate] Verification too strict, using unverified candidate', {
            isRetry,
            verifiedNodes: verifiedRoadmap.nodes.length,
            candidateNodes: sanitizedCandidate.nodes.length,
          })
          return NextResponse.json({ roadmap: sanitizedCandidate })
        }

        const supplementedCandidate = ensureMinimumNodes(sanitizedCandidate, prompt, 3)
        if (supplementedCandidate.nodes.length >= 3) {
          console.warn('[api/generate] Candidate supplemented to minimum nodes', {
            isRetry,
            verifiedNodes: verifiedRoadmap.nodes.length,
            candidateNodes: sanitizedCandidate.nodes.length,
            supplementedNodes: supplementedCandidate.nodes.length,
          })
          return NextResponse.json({ roadmap: supplementedCandidate })
        }

        console.warn('[api/generate] Too few verified/candidate books', {
          isRetry,
          verifiedNodes: verifiedRoadmap.nodes.length,
          candidateNodes: sanitizedCandidate.nodes.length,
        })
        attemptErrors.push(
          `attempt ${isRetry ? 2 : 1}: too few verified/candidate books (verified=${verifiedRoadmap.nodes.length}, candidate=${sanitizedCandidate.nodes.length})`
        )
      } catch (error) {
        console.error('[api/generate] generation attempt failed', { isRetry, error })
        attemptErrors.push(
          `attempt ${isRetry ? 2 : 1}: ${
            error instanceof Error ? error.message : 'unknown generation error'
          }`
        )
      }
    }

    console.error('[api/generate] All attempts failed', { attemptErrors })
    return NextResponse.json(
      {
        error: 'Roadmap generation failed',
        detail: 'OpenAI request/verification failed. Check server logs and API key/quota.',
        attempts: attemptErrors,
        fallback: buildFallbackRoadmap(prompt),
      },
      { status: 502 }
    )
  } catch (error) {
    console.error('[api/generate] Unexpected server error', error)
    return NextResponse.json(
      {
        error: 'Unexpected server error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
