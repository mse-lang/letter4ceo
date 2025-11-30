'use client'

import { useState } from 'react'
import { subscriberApi } from '@/lib/api'

export function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showNameField, setShowNameField] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setMessage({ type: 'error', text: '이메일을 입력해주세요.' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await subscriberApi.subscribe({
        email,
        name: name || undefined,
        privacy_agreed: true
      })

      if (response.data.success) {
        setMessage({ type: 'success', text: '구독해 주셔서 감사합니다! 환영합니다. 🎉' })
        setEmail('')
        setName('')
        setShowNameField(false)
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '구독 처리 중 오류가 발생했습니다.'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#3A3A3A] placeholder-gray-400 focus:outline-none focus:border-[#8A373F] focus:ring-1 focus:ring-[#8A373F] transition-colors"
            disabled={isLoading}
          />
          
          {showNameField && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 (선택)"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#3A3A3A] placeholder-gray-400 focus:outline-none focus:border-[#8A373F] focus:ring-1 focus:ring-[#8A373F] transition-colors"
              disabled={isLoading}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="h-[50px] px-8 py-3 bg-[#8A373F] text-white font-medium rounded-lg hover:bg-[#722D34] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
        >
          {isLoading ? '처리 중...' : '구독하기'}
        </button>
      </div>

      {!showNameField && (
        <button
          type="button"
          onClick={() => setShowNameField(true)}
          className="text-xs text-[#6B7280] hover:text-[#8A373F] transition-colors flex items-center gap-1 ml-1"
        >
          <span className="text-lg leading-none">+</span> 이름도 함께 등록하기
        </button>
      )}

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
          {message.text}
        </div>
      )}

      <p className="text-xs text-[#A4B0BE] mt-4 ml-1">
        구독 시 <a href="/privacy" className="underline hover:text-[#8A373F]">개인정보처리방침</a>에 동의합니다.
      </p>
    </form>
  )
}
