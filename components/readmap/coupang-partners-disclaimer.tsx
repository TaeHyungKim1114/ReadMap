import { cn } from '@/lib/utils'

/** 쿠팡 파트너스(공정위 고지) 문구 — 표기 통일용 */
export const COUPANG_PARTNERS_DISCLAIMER_KR =
  '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'

type CoupangPartnersDisclaimerProps = {
  className?: string
  align?: 'center' | 'left'
}

/**
 * 한글 단어/음절 단독 줄바꿈을 줄이기 위해 keep-all + pretty wrap 사용.
 */
export function CoupangPartnersDisclaimer({
  className,
  align = 'center',
}: CoupangPartnersDisclaimerProps) {
  return (
    <p
      lang="ko"
      className={cn(
        'text-xs leading-relaxed text-muted-foreground [word-break:keep-all] [text-wrap:pretty]',
        align === 'center' ? 'text-center' : 'text-left',
        className
      )}
    >
      {COUPANG_PARTNERS_DISCLAIMER_KR}
    </p>
  )
}
