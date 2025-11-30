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
    <main className="min-h-screen font-sans text-[#3A3A3A] bg-[#F8F5F0]">
      {/* Frosted Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/main-logo.png" alt="그만의 아침편지" className="w-8 h-8 object-contain opacity-90" />
            <span className="font-serif font-bold text-white text-lg tracking-wide drop-shadow-sm">그만의 아침편지</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-white/90">
            <Link href="/archive" className="hover:text-white transition-colors">지난 편지</Link>
            <Link href="/about" className="hover:text-white transition-colors">소개</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[800px] flex items-center justify-center overflow-hidden pb-32">
        {/* Background Image with improved overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 transform scale-105 animate-slow-zoom" 
          style={{ 
            backgroundImage: "url('/images/hero-bg.jpg')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-10"></div>
        
        {/* Content */}
        <div className="relative z-20 text-center text-white space-y-10 px-4 max-w-4xl mx-auto mt-0">
          {/* Logo - Main */}
          <div className="relative w-40 md:w-56 mx-auto mb-6 animate-fade-in-up">
            <img 
              src="/images/main-logo.png" 
              alt="그만의 아침편지" 
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>

          <div className="space-y-6 animate-fade-in-up delay-200">
            <h1 className="text-5xl md:text-7xl font-playfair font-bold tracking-tight leading-tight drop-shadow-lg">
              You Think Big,<br />
              <span className="text-[#e0c097]">You Get Big.</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-white/90 font-light font-serif leading-relaxed drop-shadow-md max-w-2xl mx-auto">
              매일 아침, 고독한 결단을 내리는 당신께<br className="hidden md:block" />
              새벽의 지혜와 깊이 있는 통찰을 전합니다.
            </p>
          </div>
        </div>
        
        {/* Scroll Down Indicator */}
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20 animate-bounce text-white/50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Subscription Section - Modern Minimal */}
      <section className="relative -mt-24 z-30 px-4 mb-24">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-10 md:p-14 border border-gray-100 backdrop-blur-sm">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-serif font-bold text-[#3A3A3A] mb-4">
              성장을 위한 아침 루틴
            </h2>
            <p className="text-[#6B7280] text-base font-light">
              이미 <span className="font-bold text-[#8A373F] border-b border-[#8A373F]/30">{subscriberCount.toLocaleString()}</span>명의 리더들이 매일 아침 인사이트를 얻고 있습니다.
            </p>
          </div>
          
          <div className="max-w-xl mx-auto">
            <SubscribeForm />
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[#A4B0BE] font-light">
            <span className="flex items-center gap-1">✓ 평생 무료</span>
            <span className="flex items-center gap-1">✓ 스팸 없는 청정 구역</span>
            <span className="flex items-center gap-1">✓ 언제든 구독 취소</span>
          </div>
        </div>
      </section>

      {/* Recent Letters Section - Magazine Style */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-[#8A373F]/20 pb-6">
          <div>
            <h2 className="text-4xl font-serif font-bold text-[#3A3A3A] mb-3">
              지난 편지들
            </h2>
            <p className="text-[#6B7280] font-light text-lg">
              수많은 CEO들에게 영감을 준 편지들을 만나보세요.
            </p>
          </div>
          <Link
            href="/archive"
            className="hidden md:inline-flex items-center gap-2 text-[#8A373F] font-medium hover:text-[#722D34] transition-colors group"
          >
            모든 편지 보기 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {newsletters.length > 0 ? (
            newsletters.map((newsletter: Newsletter) => (
              <NewsletterCard key={newsletter.id} newsletter={newsletter} />
            ))
          ) : (
            <div className="col-span-2 py-20 text-center bg-white rounded-lg border border-dashed border-gray-300 text-[#A4B0BE] font-serif italic">
              발행된 편지가 없습니다.
            </div>
          )}
        </div>

        <div className="text-center mt-12 md:hidden">
          <Link
            href="/archive"
            className="inline-block border-b border-[#8A373F] text-[#8A373F] pb-1 font-serif italic"
          >
            View all archive →
          </Link>
        </div>
      </section>

      {/* Footer - Clean & Sophisticated */}
      <footer className="bg-[#3A3A3A] text-white/80 py-16 px-4 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
          <div className="text-center md:text-left space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <img src="/images/main-logo.png" alt="Logo" className="w-10 h-10 brightness-0 invert opacity-90" />
              <span className="font-serif font-bold text-2xl text-white">그만의 아침편지</span>
            </div>
            <p className="text-sm text-white/60 font-light max-w-xs leading-relaxed">
              스타트업 창업가를 위한 깊이 있는 시선과<br/>
              따뜻한 위로를 매일 아침 전합니다.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-8 text-sm font-medium text-white/90">
              <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
              <Link href="/unsubscribe" className="hover:text-white transition-colors">구독취소</Link>
            </div>
            <p className="text-white/40 text-xs font-light mt-4">
              © {new Date().getFullYear()} 그만의 아침편지 by 벤처스퀘어. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
