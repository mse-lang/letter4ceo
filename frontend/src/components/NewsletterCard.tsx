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
  const preview = newsletter.curator_note || newsletter.letter_body
    ?.replace(/<[^>]+>/g, '') // HTML 태그 제거
    .slice(0, 120) || ''

  return (
    <Link href={`/letter/${newsletter.id}`} className="group h-full block">
      <article className="bg-white rounded-xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer border border-transparent hover:border-[#8A373F]/10 h-full flex flex-col relative top-0 hover:-top-1">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[#8A373F] font-medium tracking-wide font-serif">
            {formattedDate}
          </span>
          {newsletter.status === 'scheduled' && (
            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-100">
              예약됨
            </span>
          )}
        </div>
        
        <h3 className="text-xl md:text-2xl font-serif font-bold text-[#3A3A3A] mb-4 leading-snug group-hover:text-[#8A373F] transition-colors break-keep">
          {newsletter.title.replace(/^\[.*?\]\s*/, '')}
        </h3>
        
        {preview && (
          <p className="text-[#6B7280] text-base leading-relaxed line-clamp-3 mb-6 font-light flex-grow break-keep">
            {preview}...
          </p>
        )}
        
        <div className="flex items-center text-[#8A373F] text-sm font-medium mt-auto pt-4 border-t border-gray-50">
          <span className="font-serif italic group-hover:underline underline-offset-4">Read Letter</span>
          <span className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
        </div>
      </article>
    </Link>
  )
}
