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
      <article className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100/50 h-full flex flex-col">
        <div className="mb-4">
          <span className="text-sm text-[#8A373F] font-medium tracking-wide font-serif">
            {formattedDate}
          </span>
          {newsletter.status === 'scheduled' && (
            <span className="ml-2 px-2 py-0.5 bg-[#F8F5F0] text-[#8A373F] text-xs rounded-full border border-[#8A373F]/20">
              예약됨
            </span>
          )}
        </div>
        
        <h3 className="text-2xl font-serif font-bold text-[#3A3A3A] mb-4 leading-snug group-hover:text-[#8A373F] transition-colors">
          {newsletter.title.replace('[그만의 아침편지] ', '')}
        </h3>
        
        {preview && (
          <p className="text-[#6B7280] text-base leading-relaxed line-clamp-3 mb-6 font-light flex-grow">
            {preview}...
          </p>
        )}
        
        <div className="flex items-center text-[#8A373F] text-sm font-medium mt-auto pt-4 border-t border-gray-50">
          <span className="font-serif italic">Read more</span>
          <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </article>
    </Link>
  )
}
