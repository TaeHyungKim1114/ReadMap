export type BookStatus = 'completed' | 'in-progress' | 'locked'
export type Difficulty = '쉬움' | '보통' | '어려움'

export interface Review {
  id: string
  bookId: string
  bookTitle: string
  userId: string
  userName: string
  userAvatar: string
  rating: number
  content: string
  createdAt: Date
  roadmapId: string
  roadmapTitle: string
}

export interface Book {
  id: string
  title: string
  author: string
  coverUrl: string
  status: BookStatus
  difficulty: Difficulty
  keyTakeaways: string[]
  position: { x: number; y: number }
  // Aladin-style fields
  price: number
  usedPrice: number
  rating: number
  reviewCount: number
  coupangSearchUrl?: string
  aladinUrl?: string
  isbn: string
  // Review requirement
  hasReview?: boolean
  // 분기 시스템
  branch?: string // 어느 분기에 속하는지 (예: A, B, C)
  requiresChoice?: boolean // 이 책 이후 분기 선택이 필요한지
  prerequisiteIds?: string[] // 이 책을 읽기 위해 필요한 선행 책들
  // 편집 가능 필드
  whyRead?: string // 이 책을 왜 읽어야 하는지 설명
}

export interface Roadmap {
  id: string
  title: string
  description: string
  category: string
  icon?: string
  books: Book[]
  completionPercentage: number
  totalBooks?: number
  estimatedDays?: number
  hasBranches?: boolean
  recommendedItems?: Array<{
    id: string
    name: string
    reason: string
    coupangSearchUrl: string
  }>
  branchInfo?: {
    branchPoint: string // 분기가 시작되는 책 ID
    tracks: Array<{ id: string; name: string; description: string }>
  }
}

export const createCoupangSearchUrl = (query: string): string =>
  `https://link.coupang.com/a/custom-url?q=${encodeURIComponent(query)}`

// 여러 로드맵 데이터 (분기 포함)
export const roadmaps: Roadmap[] = [
  {
    id: 'tech-investment-mastery',
    title: '테크 투자 마스터',
    description: '부의 축적과 테크 투자의 기본기를 익히고, 더 현명한 투자자가 되어보세요.',
    category: '투자',
    icon: '📈',
    completionPercentage: 33,
    hasBranches: true,
    branchInfo: {
      branchPoint: 'zero-to-one',
      tracks: [
        { id: 'A', name: '기술 심화', description: 'AI와 기술 트렌드에 집중' },
        { id: 'B', name: '투자 심리', description: '행동경제학과 투자 심리 탐구' },
      ],
    },
    books: [
      {
        id: 'intelligent-investor',
        title: '현명한 투자자',
        author: '벤저민 그레이엄',
        coverUrl: '/books/intelligent-investor.jpg',
        status: 'completed',
        difficulty: '보통',
        hasReview: true,
        keyTakeaways: [
          '투기보다 가치 투자에 집중하라',
          '모든 투자에서 안전마진을 유지하라',
          '미스터 마켓은 감정적이다 - 이를 활용하라',
          '투자와 투기를 구분하라',
          '방어적 vs 공격적 투자자 전략'
        ],
        position: { x: 30, y: 100 },
        price: 28000,
        usedPrice: 15000,
        rating: 4.8,
        reviewCount: 12847,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=316469458',
        isbn: '9788936438289'
      },
      {
        id: 'zero-to-one',
        title: '제로 투 원',
        author: '피터 틸',
        coverUrl: '/books/zero-to-one.jpg',
        status: 'in-progress',
        difficulty: '쉬움',
        hasReview: false,
        requiresChoice: true,
        keyTakeaways: [
          '복제(1에서 n)가 아닌 창조(0에서 1)를 하라',
          '독점이 혁신과 이익을 만든다',
          '작게 시작하고 틈새시장을 장악하라',
          '독점 기술의 중요성',
          '영업과 유통은 제품만큼 중요하다'
        ],
        position: { x: 150, y: 100 },
        price: 22000,
        usedPrice: 12000,
        rating: 4.6,
        reviewCount: 8932,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=44370180',
        isbn: '9788947536349',
        prerequisiteIds: ['intelligent-investor']
      },
      // 분기 A: 기술 심화
      {
        id: 'ai-superpowers',
        title: 'AI 슈퍼파워',
        author: '리카이푸',
        coverUrl: '/books/ai-superpowers.jpg',
        status: 'locked',
        difficulty: '어려움',
        hasReview: false,
        branch: 'A',
        keyTakeaways: [
          '중국 vs 미국 AI 개발 전략',
          'AI 구현의 네 가지 물결',
          'AI가 미래 고용에 미치는 영향',
          '데이터는 AI 기업의 새로운 석유',
          '인간-AI 공존 청사진'
        ],
        position: { x: 300, y: 30 },
        price: 25000,
        usedPrice: 14000,
        rating: 4.5,
        reviewCount: 5621,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=165173203',
        isbn: '9791160506563',
        prerequisiteIds: ['zero-to-one']
      },
      {
        id: 'innovators-dilemma',
        title: '혁신기업의 딜레마',
        author: '클레이튼 크리스텐슨',
        coverUrl: '/books/innovators-dilemma.jpg',
        status: 'locked',
        difficulty: '어려움',
        hasReview: false,
        branch: 'A',
        keyTakeaways: [
          '파괴적 혁신의 개념',
          '대기업이 실패하는 이유',
          '신시장 창출 전략',
          '가치 네트워크의 중요성',
          '기술 변화 대응 방법'
        ],
        position: { x: 450, y: 30 },
        price: 23000,
        usedPrice: 11500,
        rating: 4.6,
        reviewCount: 6234,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=17828901',
        isbn: '9788990247872',
        prerequisiteIds: ['ai-superpowers']
      },
      // 분기 B: 투자 심리
      {
        id: 'thinking-fast-slow',
        title: '생각에 관한 생각',
        author: '대니얼 카너먼',
        coverUrl: '/books/thinking-fast-slow.jpg',
        status: 'locked',
        difficulty: '어려움',
        hasReview: false,
        branch: 'B',
        keyTakeaways: [
          '시스템 1(빠른) vs 시스템 2(느린) 사고',
          '인지 편향이 투자 결정에 미치는 영향',
          '손실 회피가 리스크 평가에 미치는 영향',
          '예측에 대한 과신',
          '이해의 착각'
        ],
        position: { x: 300, y: 170 },
        price: 26000,
        usedPrice: 13500,
        rating: 4.7,
        reviewCount: 15234,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=15573932',
        isbn: '9788934953685',
        prerequisiteIds: ['zero-to-one']
      },
      {
        id: 'psychology-of-money',
        title: '돈의 심리학',
        author: '모건 하우절',
        coverUrl: '/books/psychology-of-money.jpg',
        status: 'locked',
        difficulty: '쉬움',
        hasReview: false,
        branch: 'B',
        keyTakeaways: [
          '돈에 대한 행동 심리',
          '복리의 마법과 시간의 힘',
          '충분함을 아는 것의 중요성',
          '운과 리스크의 역할',
          '부를 유지하는 것이 버는 것보다 어렵다'
        ],
        position: { x: 450, y: 170 },
        price: 19800,
        usedPrice: 10000,
        rating: 4.8,
        reviewCount: 18234,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=265056269',
        isbn: '9791167370570',
        prerequisiteIds: ['thinking-fast-slow']
      },
      // 공통 마무리
      {
        id: 'rich-dad-poor-dad',
        title: '부자 아빠 가난한 아빠',
        author: '로버트 기요사키',
        coverUrl: '/books/rich-dad.jpg',
        status: 'locked',
        difficulty: '쉬움',
        hasReview: false,
        keyTakeaways: [
          '자산은 주머니에 돈을 넣고, 부채는 돈을 빼간다',
          '금융 교육은 필수지만 학교에서 가르치지 않는다',
          '돈을 벌기 위해서가 아니라 배우기 위해 일하라',
          '자신의 사업에 집중하라',
          '부자는 자산 축적에 집중한다'
        ],
        position: { x: 620, y: 100 },
        price: 18000,
        usedPrice: 8000,
        rating: 4.4,
        reviewCount: 23456,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=263253595',
        isbn: '9791191056495',
        prerequisiteIds: ['innovators-dilemma', 'psychology-of-money']
      }
    ]
  },
  {
    id: 'startup-founder',
    title: '스타트업 창업가',
    description: '성공적인 스타트업을 창업하고 성장시키기 위한 필수 독서 로드맵',
    category: '창업',
    icon: '🚀',
    completionPercentage: 0,
    hasBranches: true,
    branchInfo: {
      branchPoint: 'lean-startup',
      tracks: [
        { id: 'A', name: '리더십', description: 'CEO와 조직 관리에 집중' },
        { id: 'B', name: '성장', description: '스케일업과 성장 전략' },
      ],
    },
    books: [
      {
        id: 'lean-startup',
        title: '린 스타트업',
        author: '에릭 리스',
        coverUrl: '/books/lean-startup.jpg',
        status: 'in-progress',
        difficulty: '보통',
        hasReview: false,
        requiresChoice: true,
        keyTakeaways: [
          'MVP로 빠르게 검증하라',
          '피봇과 지속의 결정 기준',
          '지속적 혁신과 학습',
          '검증된 학습의 중요성',
          '작게 시작하고 빠르게 반복하라'
        ],
        position: { x: 40, y: 90 },
        price: 22000,
        usedPrice: 11000,
        rating: 4.5,
        reviewCount: 9823,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=16444738',
        isbn: '9788962605556'
      },
      // 분기 A: 리더십
      {
        id: 'hard-thing',
        title: '하드씽',
        author: '벤 호로위츠',
        coverUrl: '/books/hard-thing.jpg',
        status: 'locked',
        difficulty: '어려움',
        hasReview: false,
        branch: 'A',
        keyTakeaways: [
          '어려운 결정을 내리는 방법',
          'CEO의 외로움과 리더십',
          '해고와 강등의 기술',
          '기업 문화 구축하기',
          '스타트업의 생존 전략'
        ],
        position: { x: 200, y: 20 },
        price: 24000,
        usedPrice: 12500,
        rating: 4.7,
        reviewCount: 7654,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=40181891',
        isbn: '9788997575671',
        prerequisiteIds: ['lean-startup']
      },
      {
        id: 'good-to-great',
        title: '좋은 기업을 넘어 위대한 기업으로',
        author: '짐 콜린스',
        coverUrl: '/books/good-to-great.jpg',
        status: 'locked',
        difficulty: '보통',
        hasReview: false,
        branch: 'A',
        keyTakeaways: [
          '레벨 5 리더십',
          '고슴도치 개념',
          '사람 먼저, 방향 나중',
          '규율의 문화',
          '기술 가속 페달'
        ],
        position: { x: 360, y: 20 },
        price: 20000,
        usedPrice: 9500,
        rating: 4.6,
        reviewCount: 8901,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=227364',
        isbn: '9788934920090',
        prerequisiteIds: ['hard-thing']
      },
      // 분기 B: 성장
      {
        id: 'blitzscaling',
        title: '블리츠스케일링',
        author: '리드 호프만',
        coverUrl: '/books/blitzscaling.jpg',
        status: 'locked',
        difficulty: '어려움',
        hasReview: false,
        branch: 'B',
        keyTakeaways: [
          '초고속 성장의 기술',
          '불확실성 속 스케일링',
          '네트워크 효과 활용',
          '조직 성장 단계별 전략',
          '속도 vs 효율성 트레이드오프'
        ],
        position: { x: 200, y: 160 },
        price: 25000,
        usedPrice: 13000,
        rating: 4.4,
        reviewCount: 4521,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=187824589',
        isbn: '9791160509779',
        prerequisiteIds: ['lean-startup']
      },
      {
        id: 'crossing-chasm',
        title: '캐즘 마케팅',
        author: '제프리 무어',
        coverUrl: '/books/crossing-chasm.jpg',
        status: 'locked',
        difficulty: '보통',
        hasReview: false,
        branch: 'B',
        keyTakeaways: [
          '기술 수용 주기 이해',
          '캐즘을 넘는 전략',
          '볼링 핀 전략',
          '완전 제품 개념',
          '포지셔닝의 중요성'
        ],
        position: { x: 360, y: 160 },
        price: 22000,
        usedPrice: 11000,
        rating: 4.5,
        reviewCount: 5678,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=267537',
        isbn: '9788925567044',
        prerequisiteIds: ['blitzscaling']
      },
      // 공통 마무리
      {
        id: 'measure-what-matters',
        title: 'OKR',
        author: '존 도어',
        coverUrl: '/books/okr.jpg',
        status: 'locked',
        difficulty: '보통',
        hasReview: false,
        keyTakeaways: [
          'OKR 프레임워크 이해',
          '목표 설정의 기술',
          '실리콘밸리의 목표 관리',
          '투명성과 책임감',
          '연속적 성과 관리'
        ],
        position: { x: 540, y: 90 },
        price: 21000,
        usedPrice: 10500,
        rating: 4.5,
        reviewCount: 6789,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=156880642',
        isbn: '9788934987543',
        prerequisiteIds: ['good-to-great', 'crossing-chasm']
      }
    ]
  },
  {
    id: 'personal-finance',
    title: '개인 재정 마스터',
    description: '개인 재정 관리와 돈에 대한 올바른 마인드셋을 기르는 로드맵',
    category: '재테크',
    icon: '💰',
    completionPercentage: 0,
    books: [
      {
        id: 'money-master',
        title: '돈의 심리학',
        author: '모건 하우절',
        coverUrl: '/books/money-master.jpg',
        status: 'in-progress',
        difficulty: '쉬움',
        hasReview: false,
        keyTakeaways: [
          '돈에 대한 행동 심리',
          '복리의 마법과 시간의 힘',
          '충분함을 아는 것의 중요성',
          '운과 리스크의 역할',
          '부를 유지하는 것이 버는 것보다 어렵다'
        ],
        position: { x: 150, y: 100 },
        price: 19800,
        usedPrice: 10000,
        rating: 4.8,
        reviewCount: 18234,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=265056269',
        isbn: '9791167370570'
      },
      {
        id: 'millionaire-next-door',
        title: '이웃집 백만장자',
        author: '토머스 스탠리',
        coverUrl: '/books/millionaire.jpg',
        status: 'locked',
        difficulty: '쉬움',
        hasReview: false,
        keyTakeaways: [
          '진짜 부자의 생활 습관',
          '소비 vs 축적 마인드셋',
          '경제적 자립의 정의',
          '자녀 교육과 부의 전수',
          '직업 선택과 부의 상관관계'
        ],
        position: { x: 350, y: 200 },
        price: 17000,
        usedPrice: 8500,
        rating: 4.5,
        reviewCount: 11234,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=167328752',
        isbn: '9788934982234',
        prerequisiteIds: ['money-master']
      },
      {
        id: 'richest-man',
        title: '바빌론 부자들의 돈 버는 지혜',
        author: '조지 S. 클레이슨',
        coverUrl: '/books/richest-man.jpg',
        status: 'locked',
        difficulty: '쉬움',
        hasReview: false,
        keyTakeaways: [
          '수입의 10%를 먼저 저축하라',
          '돈이 일하게 하라',
          '현명한 투자 원칙',
          '부채 관리의 중요성',
          '꾸준함이 부를 만든다'
        ],
        position: { x: 550, y: 100 },
        price: 15000,
        usedPrice: 7000,
        rating: 4.6,
        reviewCount: 9876,
        aladinUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=112233',
        isbn: '9788934974567',
        prerequisiteIds: ['millionaire-next-door']
      }
    ]
  }
]

// 샘플 커뮤니티 리뷰 데이터
export const sampleReviews: Review[] = [
  {
    id: 'review-1',
    bookId: 'intelligent-investor',
    bookTitle: '현명한 투자자',
    userId: 'user-1',
    userName: '투자초보',
    userAvatar: '',
    rating: 5,
    content: '가치 투자의 바이블! 처음 읽을 때는 어렵지만, 두 번 세 번 읽을수록 투자에 대한 관점이 완전히 바뀝니다. 특히 "미스터 마켓" 비유가 인상적이었어요.',
    createdAt: new Date('2024-01-15'),
    roadmapId: 'tech-investment-mastery',
    roadmapTitle: '테크 투자 마스터'
  },
  {
    id: 'review-2',
    bookId: 'zero-to-one',
    bookTitle: '제로 투 원',
    userId: 'user-2',
    userName: '스타트업러',
    userAvatar: '',
    rating: 4,
    content: '피터 틸의 독창적인 사고방식을 배울 수 있는 책입니다. 경쟁 대신 독점을 추구하라는 조언이 기존 경영학 상식을 완전히 뒤집어요.',
    createdAt: new Date('2024-01-20'),
    roadmapId: 'tech-investment-mastery',
    roadmapTitle: '테크 투자 마스터'
  },
  {
    id: 'review-3',
    bookId: 'money-master',
    bookTitle: '돈의 심리학',
    userId: 'user-3',
    userName: '재테크왕',
    userAvatar: '',
    rating: 5,
    content: '돈에 대한 생각을 근본적으로 바꿔준 책. 기술적인 투자 방법보다 돈을 대하는 태도와 심리가 더 중요하다는 것을 깨달았습니다.',
    createdAt: new Date('2024-02-01'),
    roadmapId: 'personal-finance',
    roadmapTitle: '개인 재정 마스터'
  }
]

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR').format(price) + '원'
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}
