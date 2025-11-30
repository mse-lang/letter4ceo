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
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E5E5E5] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-[#8A373F] text-white rounded-md flex items-center justify-center transform rotate-45 group-hover:rotate-0 transition-transform duration-300">
              <span className="text-lg -rotate-45 group-hover:rotate-0 font-serif">M</span>
            </div>
            <span className="font-serif font-bold text-[#3A3A3A] text-lg tracking-tight">그만의 아침편지</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-serif font-bold text-[#3A3A3A] mb-4">Archive</h1>
          <div className="w-12 h-1 bg-[#8A373F] mx-auto mb-6"></div>
          <p className="text-[#6B7280] font-light">
            지나간 아침의 지혜들을 다시 만나보세요.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-8 h-64 animate-pulse shadow-sm">
                <div className="h-4 bg-gray-100 rounded w-24 mb-6"></div>
                <div className="h-8 bg-gray-100 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : newsletters.length > 0 ? (
          <>
            <div className="grid gap-8 md:grid-cols-2 mb-16">
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
                  className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-[#3A3A3A] hover:border-[#8A373F] hover:text-[#8A373F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  이전
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                        currentPage === i + 1
                          ? 'bg-[#8A373F] text-white shadow-md transform -translate-y-0.5'
                          : 'bg-white border border-gray-200 text-[#3A3A3A] hover:border-[#8A373F] hover:text-[#8A373F]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-[#3A3A3A] hover:border-[#8A373F] hover:text-[#8A373F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  다음
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-gray-100/50">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#F8F5F0] rounded-full flex items-center justify-center text-4xl">
              📮
            </div>
            <h3 className="text-xl font-serif font-bold text-[#3A3A3A] mb-2">
              아직 발송된 편지가 없습니다
            </h3>
            <p className="text-[#6B7280] mb-8 font-light">
              첫 번째 아침편지가 곧 도착할 예정입니다.
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-[#8A373F] text-white rounded-lg hover:bg-[#722D34] transition-colors font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              구독하고 기다리기
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E5E5] py-12 px-4 mt-auto">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="text-[#8A373F] font-serif font-bold text-xl">
            그만의 아침편지
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
