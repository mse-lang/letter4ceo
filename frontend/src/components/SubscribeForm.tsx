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
        setMessage({ type: 'success', text: '구독해 주셔서 감사합니다! 🎉' })
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-white text-[#8A373F] font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isLoading ? '구독 중...' : '무료 구독'}
        </button>
      </div>

      {showNameField && (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 (선택)"
          className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
          disabled={isLoading}
        />
      )}

      {!showNameField && (
        <button
          type="button"
          onClick={() => setShowNameField(true)}
          className="text-sm text-white/60 hover:text-white/80"
        >
          + 이름 추가하기
        </button>
      )}

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
          {message.text}
        </p>
      )}

      <p className="text-xs text-white/50">
        구독 시 <a href="/privacy" className="underline">개인정보처리방침</a>에 동의합니다.
      </p>
    </form>
  )
}
