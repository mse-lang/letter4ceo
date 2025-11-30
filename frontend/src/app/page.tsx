import Link from 'next/link'
import { newsletterApi, subscriberApi } from '@/lib/api'
import { SubscribeForm } from '@/components/SubscribeForm'
import { NewsletterCard } from '@/components/NewsletterCard'
import type { Newsletter } from '@/types'

// 서버 컴포넌트에서 데이터 fetching
async function getHomeData() {
  try {
    const [newslettersRes, statsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletters?status=sent&limit=3`, {
        next: { revalidate: 60 }
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscribers/stats`, {
        next: { revalidate: 60 }
      })
    ])

    const newsletters = await newslettersRes.json()
    const stats = await statsRes.json()

    return {
      newsletters: newsletters.data?.newsletters || [],
      subscriberCount: stats.data?.stats?.active || 0
    }
  } catch (error) {
    console.error('Failed to fetch home data:', error)
    return { newsletters: [], subscriberCount: 0 }
  }
}

export default async function HomePage() {
  const { newsletters, subscriberCount } = await getHomeData()

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#8A373F] to-[#722D34] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center">
            <span className="text-4xl">☕</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            그만의 아침편지
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8">
            매일 아침, 창업가를 위한 따뜻한 인사이트
          </p>
          
          <div className="flex items-center justify-center gap-2 text-white/60 text-sm mb-8">
            <span>👥 {subscriberCount.toLocaleString()}명의 창업가가 구독 중</span>
          </div>

          {/* Subscribe Form */}
          <div className="max-w-md mx-auto">
            <SubscribeForm />
          </div>
        </div>
      </section>

      {/* Recent Letters */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              최근 아침편지
            </h2>
            <Link
              href="/archive"
              className="text-[#8A373F] hover:underline font-medium"
            >
              전체 보기 →
            </Link>
          </div>

          <div className="grid gap-6">
            {newsletters.length > 0 ? (
              newsletters.map((newsletter: Newsletter) => (
                <NewsletterCard key={newsletter.id} newsletter={newsletter} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                아직 발송된 편지가 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-12">
            왜 그만의 아침편지인가요?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#FEF2F2] rounded-full flex items-center justify-center">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="font-bold text-lg mb-2">진정성 있는 편지</h3>
              <p className="text-gray-600 text-sm">
                20년 이상 스타트업 생태계에서 활동한 명승은 대표의 진솔한 이야기
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#FEF2F2] rounded-full flex items-center justify-center">
                <span className="text-2xl">📰</span>
              </div>
              <h3 className="font-bold text-lg mb-2">엄선된 뉴스</h3>
              <p className="text-gray-600 text-sm">
                바쁜 창업가를 위해 꼭 알아야 할 스타트업 뉴스만 선별
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#FEF2F2] rounded-full flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
              <h3 className="font-bold text-lg mb-2">매일 아침 6시</h3>
              <p className="text-gray-600 text-sm">
                하루를 시작하는 아침, 커피 한 잔과 함께 읽는 편지
              </p>
            </div>
          </div>
        </div>
      </section>

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
