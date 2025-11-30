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
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">☕</span>
            <span className="font-bold text-[#8A373F]">그만의 아침편지</span>
          </Link>
          <Link
            href="/archive"
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← 아카이브로 돌아가기
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 py-8">
        {/* Letter Header */}
        <header className="mb-8 text-center">
          <time className="text-sm text-gray-500 block mb-4">
            {formattedDate}
          </time>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
            {newsletter.title.replace('[그만의 아침편지] ', '')}
          </h1>
        </header>

        {/* Letter Body */}
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 mb-8">
          <div 
            className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-[#8A373F]"
            dangerouslySetInnerHTML={{ __html: newsletter.letter_body || '' }}
          />

          {/* Curator Note */}
          {newsletter.curator_note && (
            <div className="mt-10 pt-8 border-t">
              <div className="bg-gradient-to-r from-[#FDF6F3] to-[#F8F5F0] rounded-xl p-6 border-l-4 border-[#8A373F]">
                <p className="text-[#8A373F] font-bold text-sm mb-2">💌 큐레이터의 한마디</p>
                <p className="text-gray-700 leading-relaxed">{newsletter.curator_note}</p>
              </div>
            </div>
          )}
        </div>

        {/* News Items */}
        {newsItems.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>📰</span> 오늘의 스타트업 뉴스
            </h2>
            <div className="grid gap-4">
              {newsItems.filter(item => item.is_selected).map((item) => (
                <a
                  key={item.id}
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {item.thumbnail_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={item.thumbnail_url}
                          alt=""
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">{item.source_name}</p>
                      <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      {item.ai_summary && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.ai_summary}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 self-center">
                      <span className="text-gray-400">→</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Share & Subscribe */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            이 편지가 마음에 드셨나요?
          </h3>
          <p className="text-gray-600 mb-6">
            매일 아침 6시, 창업가를 위한 따뜻한 인사이트를 받아보세요.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-[#8A373F] text-white rounded-lg hover:bg-[#722D34] transition-colors font-medium"
          >
            구독하기
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 text-sm mb-4">
            © {new Date().getFullYear()} 그만의 아침편지 by 벤처스퀘어
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-white">이용약관</Link>
            <Link href="/privacy" className="hover:text-white">개인정보처리방침</Link>
            <Link href="/unsubscribe" className="hover:text-white">구독취소</Link>
          </div>
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
