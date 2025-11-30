'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

function UnsubscribeForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setMessage('이메일을 입력해주세요.')
      setStatus('error')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscribers/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (data.success) {
        setStatus('success')
        setMessage('구독이 취소되었습니다. 그동안 함께해 주셔서 감사합니다.')
      } else {
        setStatus('error')
        setMessage(data.error || '구독 취소에 실패했습니다.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">👋</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          구독이 취소되었습니다
        </h1>
        <p className="text-gray-600 mb-6">
          그동안 함께해 주셔서 감사합니다.<br />
          언제든 다시 돌아오시면 환영하겠습니다.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#8A373F] text-white rounded-lg hover:bg-[#722D34] transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#FEF2F2] rounded-full flex items-center justify-center">
          <span className="text-2xl">😢</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          구독을 취소하시겠어요?
        </h1>
        <p className="text-gray-600">
          정말 떠나시는 건가요?<br />
          매일 아침 편지를 더 이상 받지 않게 됩니다.
        </p>
      </div>

      <form onSubmit={handleUnsubscribe}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            구독 이메일
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A373F] focus:border-transparent outline-none"
            required
          />
        </div>

        {status === 'error' && message && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {status === 'loading' ? '처리 중...' : '구독 취소하기'}
        </button>

        <Link
          href="/"
          className="block text-center text-[#8A373F] hover:underline text-sm"
        >
          아니요, 계속 구독할게요 →
        </Link>
      </form>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
      <div className="animate-pulse">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full"></div>
        <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <main className="min-h-screen bg-[#F8F5F0] flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E5E5E5] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 relative transition-transform duration-300 group-hover:scale-105">
              <img src="/images/main-logo.png" alt="그만의 아침편지" className="w-full h-full object-contain" />
            </div>
            <span className="font-serif font-bold text-[#3A3A3A] text-lg tracking-tight mt-1">그만의 아침편지</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">
          <Suspense fallback={<LoadingFallback />}>
            <UnsubscribeForm />
          </Suspense>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  )
}
