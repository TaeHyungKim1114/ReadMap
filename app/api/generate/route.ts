import { NextResponse } from 'next/server'
import { findBookViaAladin } from '@/lib/aladin-book-search'
import { mergeBranchInfoFromBooks } from '@/lib/branch-info'
import { FIXED_READING_GEAR_RECOMMENDED_ITEMS } from '@/lib/fixed-reading-gear'

type GenerateRequestBody = {
  prompt?: string
}

type APINode = {
  id: string
  title: string
  author?: string
  isbn?: string
  coupangSearchUrl?: string
  aladinItemUrl?: string
  coverUrl?: string
  price?: number
  rating?: number
  reviewCount?: number
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

async function verifyRoadmapBooks(
  roadmap: RoadmapResponse['roadmap'],
  ttbKey: string
): Promise<RoadmapResponse['roadmap']> {
  const verifiedNodes: APINode[] = []
  for (const node of roadmap.nodes) {
    const hit = await findBookViaAladin(node.title, node.author, ttbKey)
    if (!hit) continue

    verifiedNodes.push({
      ...node,
      title: hit.title,
      author: hit.author,
      isbn: hit.isbn ?? (node as { isbn?: string }).isbn,
      aladinItemUrl: hit.itemUrl,
      coverUrl: (hit.coverUrl ?? (node as { coverUrl?: string }).coverUrl ?? '').trim() || undefined,
      price: hit.priceSales ?? hit.priceStandard ?? (node as { price?: number }).price ?? 0,
      rating:
        hit.customerReviewRank10 != null
          ? Math.max(0, Math.min(5, Number(hit.customerReviewRank10) / 2))
          : (node as { rating?: number }).rating ?? 0,
      reviewCount: (node as { reviewCount?: number }).reviewCount ?? 0,
      coupangSearchUrl:
        (node.coupangSearchUrl || '').trim() || createCoupangSearchUrl(hit.title),
    })
  }

  const verifiedNodeIds = new Set(verifiedNodes.map((node) => node.id))
  let verifiedEdges = roadmap.edges.filter(
    (edge) => verifiedNodeIds.has(edge.source) && verifiedNodeIds.has(edge.target)
  )

  if (verifiedEdges.length === 0 && verifiedNodes.length > 1) {
    for (let i = 1; i < verifiedNodes.length; i++) {
      verifiedEdges.push({ source: verifiedNodes[i - 1].id, target: verifiedNodes[i].id })
    }
    console.warn('[api/generate] No valid edges after Aladin verification; chained nodes in API order')
  }

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
        isbn: (node.isbn || '').trim() || undefined,
        coupangSearchUrl:
          (node.coupangSearchUrl || '').trim() ||
          createCoupangSearchUrl((node.title || '').trim() || `도서 ${index + 1}`),
        aladinItemUrl: (node.aladinItemUrl || '').trim() || undefined,
        coverUrl: (node.coverUrl || '').trim() || undefined,
        price: toNumber((node as { price?: unknown }).price, 0),
        rating: toNumber((node as { rating?: unknown }).rating, 0),
        reviewCount: toNumber((node as { reviewCount?: unknown }).reviewCount, 0),
        branch: node.branch,
        requiresChoice: Boolean(node.requiresChoice),
        position: {
          x: toNumber(node.position?.x, 40 + index * 180),
          y: toNumber(node.position?.y, 90),
        },
      }
    })
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
  let sanitizedEdges = cappedEdges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))

  const dedupe = new Set<string>()
  sanitizedEdges = sanitizedEdges.filter((e) => {
    const k = `${e.source}\t${e.target}`
    if (dedupe.has(k)) return false
    dedupe.add(k)
    return true
  })

  if (sanitizedEdges.length === 0 && cappedNodes.length > 1) {
    for (let i = 1; i < cappedNodes.length; i++) {
      sanitizedEdges.push({ source: cappedNodes[i - 1].id, target: cappedNodes[i].id })
    }
  }
  const inferredTrackIds = Array.from(
    new Set(cappedNodes.map((node) => node.branch).filter(Boolean))
  ) as string[]
  const normalizedBranchInfo = mergeBranchInfoFromBooks(roadmap.branchInfo, cappedNodes, {
    topicHint: (roadmap.title || '').trim() || undefined,
  })

  return {
    ...roadmap,
    nodes: cappedNodes,
    edges: sanitizedEdges,
    hasBranches: roadmap.hasBranches ?? inferredTrackIds.length > 0,
    recommendedItems: FIXED_READING_GEAR_RECOMMENDED_ITEMS,
    branchInfo: normalizedBranchInfo,
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
      recommendedItems: FIXED_READING_GEAR_RECOMMENDED_ITEMS,
    },
  }
}

async function requestRoadmapCandidate(apiKey: string, prompt: string, isRetry: boolean) {
  const retryHint = isRetry
    ? '\n중요: 이전에 알라딘 검색으로 일부 책이 누락되었습니다. 각 노드 도서마다 알라딘(aladin.co.kr) 검색 결과 1순위에 나올 정도로 **정확한 한글 도서명·저자명**으로만 다시 작성하세요. 초베스트셀러·스테디셀러만 선택하세요.'
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
                'Generate a hierarchical reading roadmap using ONLY real trade books that ordinary readers buy at major Korean bookstores and online shops (Kyobo, Aladin, Yes24, Coupang Books).',
                'Every node must be a commercial single-volume book (단행본) or boxed set sold to the general public — NOT PhD dissertations, thesis volumes, university press monographs aimed only at researchers, journal special issues, conference proceedings, preprint-only titles, or internal reports.',
                'Never invent book titles, authors, editions, or ISBN-like data.',
                'Prefer nationally recognizable bestsellers, steady sellers, and mainstream translated classics that always appear in store charts; when uncertain, choose a famous alternative over an academic-only title.',
                'Use Korean originals or officially translated Korean editions only.',
                'If a Korean edition exists, output Korean title/author notation.',
                'The learning order must strictly follow: foundation -> principles -> application -> advanced.',
                'Each next step must depend on prior knowledge from previous steps; model this dependency in edges.',
                'Avoid difficulty cliffs. Difficulty in each track must rise gradually; insert bridge books when needed.',
                'Return exactly between 6 and 9 nodes inclusive (never fewer than 6, never more than 9).',
                'Build a branch-based skill tree with an early common trunk and then 1 to 3 tracks (A/B/C).',
                'Set roadmap.hasBranches=true and include roadmap.branchInfo.branchPoint + tracks.',
                'tracks must be [{id,name,description}] with ids A/B/C (subset if fewer tracks).',
                'Each track MUST have a unique Korean name (short label) and a Korean description of at least 40 characters explaining learning goals on that track for THIS roadmap topic; descriptions must differ across tracks and explicitly mention the kinds of trade books on that track.',
                'branchInfo.tracks[].description must never be empty, never a duplicate of name only, and never a generic placeholder like "A path".',
                'Every post-branch node with branch set must use branch id exactly matching one of branchInfo.tracks[].id.',
                'Set requiresChoice=true on branch point node. Set branch field on each branch node.',
                'After the branch point, use at most 2 books per track so total nodes stay within 6-9.',
                'The server validates EVERY book ONLY via Aladin Open API ItemSearch — books not found there are REMOVED. Choose only famous titles whose Korean listing on aladin.co.kr matches your title and author strings.',
                'Output title and author exactly as shoppers would search on Aladin Korea (표기 통일·띄어쓰기·부제 정도는 현실적인 범위 안에서 검색 매칭이 잘 되게).',
                'Pick nationally recognizable bestsellers and steady sellers that always return in Aladin Keyword/Title search.',
                'Each node MUST include non-empty id, title, author, coupangSearchUrl, and position.',
                'Do NOT include roadmap.recommendedItems; the server injects fixed reading-gear affiliate links separately.',
                'Every node coupangSearchUrl MUST use: https://link.coupang.com/a/custom-url?q={query}',
                'Before finalizing, self-check: real books only, Korean edition preference, smooth difficulty progression, valid prerequisite edges, complete Coupang URLs, EVERY book realistically findable via Aladin search.',
                'Return ONLY valid JSON with this shape: {"roadmap":{"title":string,"description":string,"hasBranches":boolean,"branchInfo":{"branchPoint":string,"tracks":[{"id":string,"name":string,"description":string}]},"nodes":[{"id":string,"title":string,"author":string,"coupangSearchUrl":string,"branch":string,"requiresChoice":boolean,"position":{"x":number,"y":number}}],"edges":[{"source":string,"target":string}]}}',
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
                '한국 독자가 교보문고·알라딘·예스24·쿠팡북스 등에서 바로 검색해 살 수 있는 일반 독자용 단행본만 넣어줘.',
                '논문집, 학위논문, 학술지 특집호, 학회 프로시딩, 연구소 보고서, 대학교 출판부의 연구자 전용 단행본처럼 서점 일반 매대에 잘 안 올라오는 것은 절대 넣지 마.',
                '서버는 알라딘 Open API로만 책 검증한다. 검색 매칭이 안 된 도서 노드는 제거된다. 반드시 **알라딘에 실제 등록되어 검색되는** 초유명·대표 단행본만 넣어라.',
                '도서명·저자명은 알라딘 사이트에서 검색했을 때 상위 결과와 맞먹도록 한국 표기를 사용해라. 지어낸 제목 금지.',
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
                'recommendedItems는 넣지 말 것(독서용품 링크는 서버에서 고정 삽입).',
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

    const aladinKey = process.env.ALADIN_TTB_KEY?.trim()
    if (!aladinKey) {
      return NextResponse.json(
        {
          error: 'ALADIN_TTB_KEY is not configured',
          guide:
            'AI 로드맵은 알라딘 Open API로만 책을 검증합니다. Vercel·.env.local에 ALADIN_TTB_KEY를 설정하고 재배포하세요.',
        },
        { status: 503 }
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

        const verifiedRoadmap = sanitizeRoadmap(await verifyRoadmapBooks(candidate, aladinKey))
        if (verifiedRoadmap.nodes.length >= 3) {
          console.log('[api/generate] Aladin-verified roadmap', {
            isRetry,
            title: verifiedRoadmap.title,
            nodes: verifiedRoadmap.nodes.length,
            edges: verifiedRoadmap.edges.length,
          })
          return NextResponse.json({ roadmap: verifiedRoadmap })
        }

        const dropped = candidate.nodes.length - verifiedRoadmap.nodes.length
        console.warn('[api/generate] Too few Aladin-verified books', {
          isRetry,
          verifiedNodes: verifiedRoadmap.nodes.length,
          candidateNodes: candidate.nodes.length,
          dropped,
        })
        attemptErrors.push(
          `attempt ${isRetry ? 2 : 1}: too few Aladin-verified nodes (verified=${verifiedRoadmap.nodes.length}, candidate=${candidate.nodes.length})`
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
        detail:
          'OpenAI 또는 알라딘 검증 실패였을 수 있습니다. 알라딘 키·호출 허용 URL·쿼터를 확인하고, 주제를 조금 바꿔 다시 시도해 보세요.',
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
