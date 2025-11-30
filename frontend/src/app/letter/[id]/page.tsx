import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Newsletter, NewsItem } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getNewsletter(id: string): Promise<{ newsletter: Newsletter; newsItems: NewsItem[] } | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/newsletters/${id}`,
      { next: { revalidate: 60 } }
    )
    
    if (!res.ok) return null
    
    const data = await res.json()
    return {
      newsletter: data.data?.newsletter,
      newsItems: data.data?.newsItems || []
    }
  } catch (error) {
    console.error('Failed to fetch newsletter:', error)
    return null
  }
}

export default async function LetterPage({ params }: PageProps) {
  const { id } = await params
  const data = await getNewsletter(id)

  if (!data) {
    notFound()
  }

  const { newsletter, newsItems } = data
  const date = new Date(newsletter.published_date || newsletter.created_at)
  const formattedDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  return (
    <main className="min-h-screen bg-[#F8F5F0]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E5E5E5] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
             <div className="w-10 opacity-90 group-hover:opacity-100 transition-opacity">
               <img src="https://www.genspark.ai/api/files/s/N36trz0v" alt="그만의 아침편지" className="w-full h-auto" />
             </div>
            <span className="font-serif font-bold text-[#3A3A3A] text-lg tracking-tight mt-1">그만의 아침편지</span>
          </Link>
          <Link
            href="/archive"
            className="text-[#6B7280] hover:text-[#8A373F] text-sm font-medium transition-colors flex items-center gap-1"
          >
            ← <span className="hidden sm:inline">아카이브</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Letter Header */}
        <header className="mb-12 text-center">
          <div className="inline-block px-3 py-1 bg-white rounded-full border border-[#E5E5E5] mb-6">
             <time className="text-sm text-[#8A373F] font-serif font-medium">
              {formattedDate}
            </time>
          </div>
         
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#3A3A3A] leading-tight break-keep">
            {newsletter.title.replace(/^\[.*?\]\s*/, '')}
          </h1>
        </header>

        {/* Letter Body */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 md:p-12 mb-12 border border-gray-100/50">
          <div 
            className="prose prose-lg max-w-none font-serif prose-headings:font-serif prose-headings:text-[#3A3A3A] prose-p:text-[#3A3A3A] prose-p:leading-loose prose-a:text-[#8A373F] prose-blockquote:border-l-[#8A373F] prose-blockquote:bg-[#F8F5F0] prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic"
            dangerouslySetInnerHTML={{ __html: newsletter.letter_body || '' }}
          />

          {/* Curator Note */}
          {newsletter.curator_note && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="bg-[#FDF6F3] rounded-xl p-6 border-l-4 border-[#8A373F]">
                <p className="text-[#8A373F] font-bold text-sm mb-3 flex items-center gap-2">
                  <span className="text-lg">💌</span> 큐레이터의 한마디
                </p>
                <p className="text-[#555] font-serif leading-relaxed">{newsletter.curator_note}</p>
              </div>
            </div>
          )}
        </div>

        {/* News Items */}
        {newsItems.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-2xl font-serif font-bold text-[#3A3A3A]">
                오늘의 스타트업 뉴스
              </h2>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            
            <div className="grid gap-6">
              {newsItems.filter(item => item.is_selected).map((item) => (
                <a
                  key={item.id}
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-[#8A373F]/10"
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    {item.thumbnail_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={item.thumbnail_url}
                          alt=""
                          className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {item.category}
                        </span>
                        <span className="text-xs text-[#8A373F] font-medium">{item.source_name}</span>
                      </div>
                      
                      <h3 className="font-bold text-[#3A3A3A] text-lg mb-3 leading-snug hover:text-[#8A373F] transition-colors break-keep">
                        {item.title}
                      </h3>
                      
                      {item.ai_summary && (
                        <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-2">
                          {item.ai_summary}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Share & Subscribe */}
        <div className="bg-[#3A3A3A] rounded-2xl shadow-lg p-8 md:p-12 text-center text-white">
          <h3 className="text-2xl font-serif font-bold mb-4">
            매일 아침, 성장의 인사이트를 받고 싶으신가요?
          </h3>
          <p className="text-gray-300 mb-8 font-light">
            3,000여 명의 창업가가 이미 하루를 '그만의 아침편지'로 시작하고 있습니다.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-[#8A373F] text-white rounded-lg hover:bg-[#722D34] transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
          >
            무료 구독하기
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E5E5] py-12 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-20 mx-auto opacity-80 grayscale hover:grayscale-0 transition-all duration-300">
             <img src="https://www.genspark.ai/api/files/s/N36trz0v" alt="그만의 아침편지" className="w-full h-auto" />
          </div>
          
          <div className="flex justify-center gap-8 text-sm text-[#6B7280]">
            <Link href="/terms" className="hover:text-[#3A3A3A] transition-colors">이용약관</Link>
            <Link href="/privacy" className="hover:text-[#3A3A3A] transition-colors">개인정보처리방침</Link>
            <Link href="/unsubscribe" className="hover:text-[#3A3A3A] transition-colors">구독취소</Link>
          </div>
          
          <p className="text-[#A4B0BE] text-xs">
            © {new Date().getFullYear()} 그만의 아침편지 by 벤처스퀘어. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}

// 메타데이터 생성
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const data = await getNewsletter(id)
  
  if (!data) {
    return { title: '편지를 찾을 수 없습니다' }
  }

  return {
    title: `${data.newsletter.title} | 그만의 아침편지`,
    description: data.newsletter.curator_note || '스타트업 창업가를 위한 아침 인사이트'
  }
}
