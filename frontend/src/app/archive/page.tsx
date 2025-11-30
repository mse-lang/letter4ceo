'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { NewsletterCard } from '@/components/NewsletterCard'
import type { Newsletter } from '@/types'

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ArchivePage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchNewsletters(currentPage)
  }, [currentPage])

  const fetchNewsletters = async (page: number) => {
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/newsletters?status=sent&page=${page}&limit=10`
      )
      const data = await res.json()
      setNewsletters(data.data?.newsletters || [])
      setPagination(data.data?.pagination || null)
    } catch (error) {
      console.error('Failed to fetch newsletters:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0]">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">☕</span>
            <span className="font-bold text-[#8A373F]">그만의 아침편지</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">아카이브</h1>
          <p className="text-gray-600">
            지금까지 발송된 모든 아침편지를 모아보세요.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : newsletters.length > 0 ? (
          <>
            <div className="grid gap-6 mb-8">
              {newsletters.map((newsletter) => (
                <NewsletterCard key={newsletter.id} newsletter={newsletter} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  이전
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-lg ${
                        currentPage === i + 1
                          ? 'bg-[#8A373F] text-white'
                          : 'bg-white border hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  다음
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">📭</span>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              아직 발송된 편지가 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              첫 번째 아침편지를 기다려주세요!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#8A373F] text-white rounded-lg hover:bg-[#722D34] transition-colors"
            >
              구독하기
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white mt-auto">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} 그만의 아침편지 by 벤처스퀘어
          </p>
        </div>
      </footer>
    </main>
  )
}
