'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Newsletter {
  id: string
  title: string
  status: 'draft' | 'sent' | 'scheduled'
  published_date: string
  created_at: string
  scheduled_at: string | null
}

interface Stats {
  newsletters: { total: number; draft: number; sent: number; scheduled: number }
  subscribers: { total: number; active: number; unsubscribed: number }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [stats, setStats] = useState<Stats | null>(null)
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'scheduled'>('all')

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
      fetchData()
    }
    setLoading(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // 간단한 비밀번호 인증 (실제 환경에서는 서버 인증 필요)
    if (password === 'letter4ceo2024') {
      sessionStorage.setItem('admin_auth', 'true')
      setIsAuthenticated(true)
      fetchData()
    } else {
      setError('비밀번호가 올바르지 않습니다.')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth')
    setIsAuthenticated(false)
  }

  const fetchData = async () => {
    try {
      const [newsletterRes, subscriberRes, listRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletters/stats/summary`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscribers/stats`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletters?limit=20`)
      ])

      const [newsletterStats, subscriberStats, newsletterList] = await Promise.all([
        newsletterRes.json(),
        subscriberRes.json(),
        listRes.json()
      ])

      setStats({
        newsletters: newsletterStats.data?.stats || { total: 0, draft: 0, sent: 0, scheduled: 0 },
        subscribers: subscriberStats.data?.stats || { total: 0, active: 0, unsubscribed: 0 }
      })
      setNewsletters(newsletterList.data?.newsletters || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletters/${id}`, {
        method: 'DELETE'
      })
      fetchData()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleSend = async (id: string) => {
    if (!confirm('뉴스레터를 발송하시겠습니까?')) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletters/${id}/send`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success) {
        alert('발송되었습니다!')
        fetchData()
      } else {
        alert(data.error || '발송에 실패했습니다.')
      }
    } catch (error) {
      alert('오류가 발생했습니다.')
    }
  }

  const filteredNewsletters = activeTab === 'all' 
    ? newsletters 
    : newsletters.filter(n => n.status === activeTab)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#8A373F] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <span className="text-4xl">🔐</span>
            <h1 className="text-2xl font-bold text-gray-800 mt-4">관리자 로그인</h1>
            <p className="text-gray-600 mt-2">그만의 아침편지 관리자 페이지</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A373F] focus:border-transparent outline-none"
                placeholder="관리자 비밀번호"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#8A373F] text-white rounded-lg hover:bg-[#722D34] transition-colors"
            >
              로그인
            </button>
          </form>

          <Link href="/" className="block text-center mt-6 text-gray-500 hover:text-gray-700 text-sm">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">☕</span>
              <span className="font-bold text-[#8A373F]">그만의 아침편지</span>
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600 font-medium">관리자</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/subscribers"
              className="text-gray-600 hover:text-gray-900"
            >
              구독자 관리
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-500 text-sm">총 뉴스레터</p>
              <p className="text-3xl font-bold text-gray-800">{stats.newsletters.total}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-500 text-sm">발송 완료</p>
              <p className="text-3xl font-bold text-green-600">{stats.newsletters.sent}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-500 text-sm">임시저장</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.newsletters.draft}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-500 text-sm">활성 구독자</p>
              <p className="text-3xl font-bold text-[#8A373F]">{stats.subscribers.active}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['all', 'draft', 'sent', 'scheduled'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-[#8A373F] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab === 'all' && '전체'}
                {tab === 'draft' && '임시저장'}
                {tab === 'sent' && '발송완료'}
                {tab === 'scheduled' && '예약됨'}
              </button>
            ))}
          </div>
          <Link
            href="/admin/editor/new"
            className="px-6 py-2 bg-[#8A373F] text-white rounded-lg hover:bg-[#722D34] transition-colors"
          >
            + 새 편지 작성
          </Link>
        </div>

        {/* Newsletter List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">제목</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 w-28">상태</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 w-32">날짜</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 w-40">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredNewsletters.length > 0 ? (
                filteredNewsletters.map((newsletter) => (
                  <tr key={newsletter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/editor/${newsletter.id}`}
                        className="text-gray-800 hover:text-[#8A373F] font-medium"
                      >
                        {newsletter.title.replace('[그만의 아침편지] ', '')}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        newsletter.status === 'sent' 
                          ? 'bg-green-100 text-green-800'
                          : newsletter.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {newsletter.status === 'sent' && '발송완료'}
                        {newsletter.status === 'scheduled' && '예약됨'}
                        {newsletter.status === 'draft' && '임시저장'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(newsletter.published_date || newsletter.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/editor/${newsletter.id}`}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          편집
                        </Link>
                        {newsletter.status === 'draft' && (
                          <button
                            onClick={() => handleSend(newsletter.id)}
                            className="text-[#8A373F] hover:text-[#722D34] text-sm"
                          >
                            발송
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(newsletter.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    뉴스레터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
