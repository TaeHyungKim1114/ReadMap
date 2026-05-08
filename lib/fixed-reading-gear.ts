/**
 * 독서용품 추천은 항상 이 4개로 고정(쿠팡파트너스 링크).
 * 로드맵 주제와 무관하게 동일 노출.
 */
export type FixedReadingGearItem = {
  id: string
  name: string
  reason: string
  coupangSearchUrl: string
}

export const FIXED_READING_GEAR_RECOMMENDED_ITEMS: FixedReadingGearItem[] = [
  {
    id: 'gear-reading-wood-stand',
    name: '원목 독서대',
    reason: '두 손을 비워 집중 독서에 도움이 됩니다.',
    coupangSearchUrl: 'https://link.coupang.com/a/eEZaWg',
  },
  {
    id: 'gear-reading-anti-blue-stand-lamp',
    name: '독서용 안티 블루라이트 스탠드',
    reason: '눈 피로를 줄이려는 밝기 조절이 가능한 조명입니다.',
    coupangSearchUrl: 'https://link.coupang.com/a/eEZdwW',
  },
  {
    id: 'gear-reading-magnetic-bookmark',
    name: '마그네틱 북마크',
    reason: '책이 손상되기 쉬운 접지 없이 페이지를 표시합니다.',
    coupangSearchUrl: 'https://link.coupang.com/a/eEZfqs',
  },
  {
    id: 'gear-reading-book-support',
    name: '도서 지지대',
    reason: '책이 자꾸 닫히는 것을 막아 읽기 자세를 편하게 합니다.',
    coupangSearchUrl: 'https://link.coupang.com/a/eEZg7O',
  },
]
