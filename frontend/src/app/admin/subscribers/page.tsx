'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Subscriber {
  id: string
  email: string
  name: string | null
  company: string | null
  status: 'active' | 'unsubscribed'
  subscribed_at: string
}

interface Stats {
  total: number
  active: number
  unsubscribed: number
}

export default function SubscribersPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    if (auth !== 'true') {
      router.push('/admin')
      return
    }
    setIsAuthenticated(true)
    fetchData()
  }, [router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', '100')

      const [subscribersRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscribers?${params}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscribers/stats`)
      ])

      const [subscribersData, statsData] = await Promise.all([
        subscribersRes.json(),
        statsRes.json()
      ])

      setSubscribers(subscribersData.data?.subscribers || [])
      setStats(statsData.data?.stats || null)
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(fetchData, 300)
      return () => clearTimeout(timer)
    }
  }, [search, statusFilter, isAuthenticated])

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscribers/${id}`, {
        method: 'DELETE'
      })
      fetchData()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleSyncStibee = async () => {
    if (!confirm('Stibee에 모든 구독자를 동기화하시겠습니까?')) return

    setSyncing(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscribers/sync-stibee`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success) {
        alert(`동기화 완료!\n성공: ${data.data.success}명\n업데이트: ${data.data.updated}명\n실패: ${data.data.failed}명`)
      } else {
        alert(data.error || '동기화에 실패했습니다.')
      }
    } catch (error) {
      alert('오류가 발생했습니다.')
    } finally {
      setSyncing(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscribers/export`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `subscribers_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } catch (error) {
      alert('내보내기에 실패했습니다.')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isAuthenticated) {
    return null
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
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              관리자
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 font-medium">구독자 관리</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-500 text-sm">전체 구독자</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-500 text-sm">활성 구독자</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-500 text-sm">구독 취소</p>
              <p className="text-3xl font-bold text-gray-400">{stats.unsubscribed}</p>
            </div>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="이메일, 이름, 회사 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-[#8A373F] focus:border-transparent outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A373F] focus:border-transparent outline-none"
            >
              <option value="all">전체 상태</option>
              <option value="active">활성</option>
              <option value="unsubscribed">구독취소</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncStibee}
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {syncing ? '동기화 중...' : 'Stibee 동기화'}
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              CSV 내보내기
            </button>
          </div>
        </div>

        {/* Subscriber List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-[#8A373F] border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">이메일</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">이름</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">회사</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 w-24">상태</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 w-32">구독일</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 w-20">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscribers.length > 0 ? (
                  subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-800">{subscriber.email}</td>
                      <td className="px-6 py-4 text-gray-600">{subscriber.name || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{subscriber.company || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          subscriber.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {subscriber.status === 'active' ? '활성' : '구독취소'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(subscriber.subscribed_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(subscriber.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      구독자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}
