'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Newsletter {
  id: string
  title: string
  letter_body: string
  curator_note: string
  status: 'draft' | 'sent' | 'scheduled'
  published_date: string
  scheduled_at: string | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditorPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const isNew = id === 'new'

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [title, setTitle] = useState('')
  const [letterBody, setLetterBody] = useState('')
  const [curatorNote, setCuratorNote] = useState('')
  const [publishedDate, setPublishedDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState<'draft' | 'sent' | 'scheduled'>('draft')

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    if (auth !== 'true') {
      router.push('/admin')
      return
    }
    setIsAuthenticated(true)

    if (!isNew) {
      fetchNewsletter()
    } else {
      setLoading(false)
    }
  }, [id, isNew, router])

  const fetchNewsletter = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletters/${id}`)
      const data = await res.json()

      if (data.success && data.data?.newsletter) {
        const newsletter = data.data.newsletter
        setTitle(newsletter.title.replace('[그만의 아침편지] ', ''))
        setLetterBody(newsletter.letter_body || '')
        setCuratorNote(newsletter.curator_note || '')
        setPublishedDate(newsletter.published_date || new Date().toISOString().split('T')[0])
        setStatus(newsletter.status)
      }
    } catch (error) {
      console.error('Failed to fetch newsletter:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const fullTitle = title.startsWith('[그만의 아침편지]') ? title : `[그만의 아침편지] ${title}`
      
      const body = {
        title: fullTitle,
        letter_body: letterBody,
        curator_note: curatorNote,
        published_date: publishedDate
      }

      let res
      if (isNew) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      } else {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletters/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      }

      const data = await res.json()

      if (data.success) {
        if (isNew && data.data?.newsletter?.id) {
          router.push(`/admin/editor/${data.data.newsletter.id}`)
        }
        alert('저장되었습니다.')
      } else {
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      alert('오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!confirm('AI로 아침편지를 생성하시겠습니까?')) return

    setGenerating(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await res.json()

      if (data.success && data.data) {
        if (data.data.title) setTitle(data.data.title)
        if (data.data.body) setLetterBody(data.data.body)
        alert('AI 편지가 생성되었습니다!')
      } else {
        alert(data.error || 'AI 생성에 실패했습니다.')
      }
    } catch (error) {
      alert('오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSend = async () => {
    if (isNew) {
      alert('먼저 저장해주세요.')
      return
    }

    if (!confirm('뉴스레터를 발송하시겠습니까?\n발송 후에는 수정할 수 없습니다.')) return

    try {
      // 먼저 저장
      await handleSave()

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletters/${id}/send`, {
        method: 'POST'
      })

      const data = await res.json()

      if (data.success) {
        alert('발송되었습니다!')
        setStatus('sent')
      } else {
        alert(data.error || '발송에 실패했습니다.')
      }
    } catch (error) {
      alert('오류가 발생했습니다.')
    }
  }

  const handlePreview = () => {
    if (isNew) {
      alert('먼저 저장해주세요.')
      return
    }
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletters/${id}/preview`, '_blank')
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#8A373F] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700">
              ← 목록으로
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-800 font-medium">
              {isNew ? '새 편지 작성' : '편지 수정'}
            </span>
            {status !== 'draft' && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                status === 'sent' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {status === 'sent' ? '발송완료' : '예약됨'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAI}
              disabled={generating || status === 'sent'}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {generating ? 'AI 생성 중...' : '✨ AI 생성'}
            </button>
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              미리보기
            </button>
            <button
              onClick={handleSave}
              disabled={saving || status === 'sent'}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={handleSend}
              disabled={status === 'sent'}
              className="px-4 py-2 bg-[#8A373F] text-white rounded-lg hover:bg-[#722D34] transition-colors disabled:opacity-50"
            >
              발송하기
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Meta Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                발행일
              </label>
              <input
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                disabled={status === 'sent'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A373F] focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">[그만의 아침편지]</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="오늘의 편지 제목"
                disabled={status === 'sent'}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-xl font-bold focus:ring-2 focus:ring-[#8A373F] focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Body */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              본문 (HTML 지원)
            </label>
            <textarea
              value={letterBody}
              onChange={(e) => setLetterBody(e.target.value)}
              placeholder="<p>안녕하세요, 창업가 여러분.</p>

<p>오늘 아침은 어떠신가요?</p>

<p>...</p>"
              disabled={status === 'sent'}
              className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#8A373F] focus:border-transparent outline-none resize-y disabled:bg-gray-100"
            />
            <p className="mt-2 text-sm text-gray-500">
              HTML 태그를 사용할 수 있습니다. (예: &lt;p&gt;, &lt;strong&gt;, &lt;a href="..."&gt;)
            </p>
          </div>

          {/* Curator Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              큐레이터의 한마디 (선택)
            </label>
            <textarea
              value={curatorNote}
              onChange={(e) => setCuratorNote(e.target.value)}
              placeholder="오늘 편지에 대한 간단한 코멘트를 남겨보세요..."
              disabled={status === 'sent'}
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A373F] focus:border-transparent outline-none resize-y disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6">
          <h3 className="font-bold text-blue-800 mb-2">💡 작성 팁</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>AI 생성</strong> 버튼으로 초안을 만들고 수정해보세요.</li>
            <li>• <strong>미리보기</strong>로 실제 이메일 모습을 확인할 수 있습니다.</li>
            <li>• <strong>저장</strong> 후에 <strong>발송하기</strong>를 눌러야 구독자에게 발송됩니다.</li>
            <li>• 발송된 편지는 수정할 수 없으니 미리보기로 꼭 확인해주세요.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
