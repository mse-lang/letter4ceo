import Link from 'next/link'
import { SubscribeForm } from '@/components/SubscribeForm'
import { NewsletterCard } from '@/components/NewsletterCard'
import type { Newsletter } from '@/types'

// 서버 컴포넌트에서 데이터 fetching
async function getHomeData() {
  try {
    const [newslettersRes, statsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletters?status=sent&limit=4`, {
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
    <main className="min-h-screen font-sans text-[#3A3A3A]">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 transform scale-105" 
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80')",
            filter: "brightness(0.8)"
          }}
        ></div>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 z-10"></div>
        
        {/* Content */}
        <div className="relative z-20 text-center text-white space-y-8 px-4 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="relative w-48 mx-auto mb-10 drop-shadow-2xl">
            <img 
              src="/images/main-logo.png" 
              alt="그만의 아침편지" 
              className="w-full h-auto transform hover:scale-105 transition-transform duration-500"
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-playfair font-bold tracking-wide leading-tight drop-shadow-lg">
            You Think Big,<br />You Get Big.
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 font-light font-serif leading-relaxed drop-shadow-md">
            오늘도 고독한 결단을 내리는 당신께,<br className="hidden md:block" />
            새벽의 지혜를 전합니다.
          </p>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="relative -mt-20 z-30 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 md:p-12 border border-[#8A373F]/10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-semibold text-[#8A373F] mb-3">
              매일 아침, 성장의 인사이트를 받아보세요.
            </h2>
            <p className="text-[#6B7280] text-sm">
              현재 <span className="font-bold text-[#8A373F]">{subscriberCount.toLocaleString()}</span>명의 창업가가 함께하고 있습니다.
            </p>
          </div>
          
          <SubscribeForm />
          
          <p className="text-xs text-center text-[#A4B0BE] mt-6">
            * 스팸은 발송하지 않습니다. 언제든 구독 취소할 수 있습니다.
          </p>
        </div>
      </section>

      {/* Recent Letters Section */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif font-bold text-[#3A3A3A] mb-4">
            Recent Letters
          </h2>
          <div className="w-12 h-1 bg-[#8A373F] mx-auto"></div>
          <p className="text-[#6B7280] mt-4 font-light">
            지나간 편지들도 여전히 따뜻합니다.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {newsletters.length > 0 ? (
            newsletters.map((newsletter: Newsletter) => (
              <NewsletterCard key={newsletter.id} newsletter={newsletter} />
            ))
          ) : (
            <div className="col-span-2 text-center py-12 text-[#A4B0BE] font-serif italic bg-white rounded-xl shadow-sm border border-gray-100">
              아직 발송된 편지가 없습니다.
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/archive"
            className="inline-block border-b border-[#8A373F] text-[#8A373F] hover:text-[#722D34] hover:border-[#722D34] pb-1 transition-colors font-serif italic"
          >
            View all archive →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E5E5] py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-center gap-2 opacity-80">
            <div className="w-6 h-6 bg-[#8A373F] transform rotate-45"></div>
            <span className="font-serif font-bold text-[#8A373F] text-lg">그만의 아침편지</span>
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
