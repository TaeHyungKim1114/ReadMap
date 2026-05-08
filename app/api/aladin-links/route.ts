import { NextResponse } from 'next/server'
import { findBookViaAladin } from '@/lib/aladin-book-search'

type LinkResolveRequest = {
  books?: Array<{
    roadmapId: string
    bookId: string
    title: string
    author?: string
  }>
}

export async function POST(request: Request) {
  try {
    const ttbKey = process.env.ALADIN_TTB_KEY?.trim()
    if (!ttbKey) {
      return NextResponse.json({ error: 'ALADIN_TTB_KEY is not configured' }, { status: 503 })
    }

    const body = (await request.json()) as LinkResolveRequest
    const books = Array.isArray(body.books) ? body.books : []
    if (books.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const uniqueBooks = books.filter((book, index, arr) => {
      const key = `${book.roadmapId}\t${book.bookId}`
      return arr.findIndex((other) => `${other.roadmapId}\t${other.bookId}` === key) === index
    })

    const results: Array<{
      roadmapId: string
      bookId: string
      aladinItemUrl: string
      isbn?: string
      title?: string
      author?: string
      coverUrl?: string
      price?: number
      rating?: number
    }> = []

    // Rate-limit friendly: resolve sequentially.
    for (const book of uniqueBooks) {
      const title = (book.title || '').trim()
      if (!title) continue
      const hit = await findBookViaAladin(title, book.author, ttbKey)
      if (!hit?.itemUrl) continue
      results.push({
        roadmapId: book.roadmapId,
        bookId: book.bookId,
        aladinItemUrl: hit.itemUrl,
        isbn: hit.isbn,
        title: hit.title,
        author: hit.author,
        coverUrl: hit.coverUrl,
        price: hit.priceSales,
        rating:
          typeof hit.customerReviewRank10 === 'number'
            ? Math.max(0, Math.min(5, hit.customerReviewRank10 / 2))
            : undefined,
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('[api/aladin-links] failed', error)
    return NextResponse.json({ error: 'Failed to resolve Aladin item links' }, { status: 500 })
  }
}

