import Link from 'next/link'
import type { Newsletter } from '@/types'

interface NewsletterCardProps {
  newsletter: Newsletter
}

export function NewsletterCard({ newsletter }: NewsletterCardProps) {
  const date = new Date(newsletter.published_date || newsletter.created_at)
  const formattedDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // 본문에서 첫 번째 문단 추출 (미리보기용)
  const preview = newsletter.letter_body
    ?.replace(/<[^>]+>/g, '') // HTML 태그 제거
    .slice(0, 150) || ''

  return (
    <Link href={`/letter/${newsletter.id}`}>
      <article className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm text-gray-500">{formattedDate}</span>
          {newsletter.status === 'scheduled' && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              예약됨
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
          {newsletter.title.replace('[그만의 아침편지] ', '')}
        </h3>
        
        {preview && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {preview}...
          </p>
        )}
        
        <div className="flex items-center text-[#8A373F] text-sm font-medium">
          읽어보기 →
        </div>
      </article>
    </Link>
  )
}
