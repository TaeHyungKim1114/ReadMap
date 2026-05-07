import { NextResponse } from 'next/server'

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
  const queries = [
    `${title} ${author ?? ''}`.trim(),
    title.trim(),
  ]

  for (const query of queries) {
    if (!query) continue
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`)
    if (!res.ok) continue

    const data = (await res.json()) as OpenLibrarySearchResponse
    const best = data.docs?.find((doc) => doc.title && doc.author_name?.[0])
    if (!best?.title || !best.author_name?.[0]) continue

    return {
      title: best.title,
      author: best.author_name[0],
    }
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

  const nodeIds = new Set(spreadNodes.map((node) => node.id))
  const sanitizedEdges = roadmap.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  )
  const inferredTrackIds = Array.from(
    new Set(spreadNodes.map((node) => node.branch).filter(Boolean))
  ) as string[]
  const normalizedBranchInfo =
    roadmap.branchInfo?.tracks?.length
      ? roadmap.branchInfo
      : inferredTrackIds.length > 0
      ? {
          branchPoint: spreadNodes.find((node) => node.requiresChoice)?.id ?? spreadNodes[0]?.id ?? 'step-1',
          tracks: inferredTrackIds.map((id) => ({
            id,
            name: `${id} 트랙`,
            description: `${id} 경로`,
          })),
        }
      : undefined

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
    nodes: spreadNodes,
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
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: [
                'You generate reading roadmap graph data for Korean users.',
                'Use ONLY real, published books that are verifiable in public book catalogs.',
                'Also recommend practical learning gear/electronics/stationery that can be purchased on Coupang.',
                'All book titles should be Korean titles whenever possible. Prefer Korean originals or officially translated Korean editions.',
                'If a Korean edition exists, output the Korean edition title/author notation.',
                'Do not invent titles, authors, or series names.',
                'Prefer well-known, educationally useful books over obscure ones.',
                'Return 6 to 10 nodes depending on topic complexity.',
                'Each node MUST include non-empty id, title, author, coupangSearchUrl and position.',
                'Build a branch-based skill tree: early common trunk, then 1 to 3 selectable tracks.',
                'Set roadmap.hasBranches=true and include roadmap.branchInfo with branchPoint/tracks.',
                'tracks must be an array of objects: {id, name, description}; use ids like A, B, C.',
                'Mark the branch point node with requiresChoice=true and set branch field on track nodes.',
                'If uncertain, choose famous beginner/intermediate classics rather than niche books.',
                'If multiple tracks are used, recommend 2-3 books per track after branching.',
                'roadmap must include recommendedItems: [{id,name,reason,coupangSearchUrl}] for essential equipment.',
                'Use Coupang search URLs in this format: https://link.coupang.com/a/custom-url?q={query}',
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
                '주제 난이도에 따라 6~10권으로 단계형 독서 로드맵을 만들어줘.',
                '한국 독자가 실제로 구할 수 있는 실존 도서만 포함해줘.',
                '한국어 원서 또는 한국어 번역본만 사용하고, 제목은 한국어 표기로 써줘.',
                '초급 -> 중급 -> 심화 순서가 되도록 구성해줘.',
                '초반 공통 트랙 뒤에 1~3개 분기 트랙(A/B/C)이 있는 스킬트리 구조로 구성해줘.',
                '분기 시작 노드에는 requiresChoice=true를 넣고, 분기 노드에는 branch: "A" | "B" | "C" 중 적절한 값을 넣어줘.',
                'roadmap.hasBranches=true, roadmap.branchInfo.branchPoint/tracks를 반드시 채워줘.',
                'tracks는 [{id,name,description}] 형태로 작성하고, 트랙이 늘어나면 그에 맞춰 추천 책도 충분히 늘려줘.',
                '각 노드는 반드시 id, title, author, coupangSearchUrl, position(x,y)을 포함해줘.',
                '로드맵 하단에 보여줄 필수 장비/교구/전자제품 추천도 2~5개 포함하고 recommendedItems에 넣어줘.',
                '추천 상품은 반드시 쿠팡에서 검색 가능한 실존 상품으로 작성하고 coupangSearchUrl 필드를 채워줘.',
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

    // Use OPENAI_API_KEY from environment
    const apiKey = process.env.OPENAI_API_KEY || 'YOUR_KEY_HERE'
    
    if (!apiKey || apiKey === 'YOUR_KEY_HERE') {
      return NextResponse.json(
        {
          error: 'OPENAI_API_KEY is not configured',
          guide:
            'Set OPENAI_API_KEY in .env.local file.',
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
