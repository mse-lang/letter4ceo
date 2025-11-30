/**
 * 뉴스 API 라우트
 */
import { Hono } from 'hono'
import type { Env, NewsItem, ApiResponse, LinkPreviewData } from '../types'
import { createSupabaseAdmin, TABLES } from '../lib/supabase'
import { ValidationError, NotFoundError, validateRequired } from '../lib/errors'

const news = new Hono<{ Bindings: Env }>()

// RSS 피드 URL (벤처스퀘어 및 주요 스타트업 매체)
const RSS_FEEDS: Record<string, { url: string; source: string }> = {
  // 벤처스퀘어
  '뉴스': { url: 'https://www.venturesquare.net/news/feed', source: '벤처스퀘어' },
  '인터뷰': { url: 'https://www.venturesquare.net/interview/feed', source: '벤처스퀘어' },
  '스타트업가이드': { url: 'https://www.venturesquare.net/startup_guide/feed', source: '벤처스퀘어' },
  '트렌드': { url: 'https://www.venturesquare.net/trend/feed', source: '벤처스퀘어' },
  // 플래텀
  '플래텀': { url: 'https://platum.kr/feed', source: '플래텀' },
  // IT 뉴스
  'IT뉴스': { url: 'https://feeds.feedburner.com/HighscalabilityFeed', source: 'High Scalability' },
  // 블로터
  '블로터': { url: 'https://www.bloter.net/feed', source: '블로터' },
}

// 뉴스 목록 조회
news.get('/', async (c) => {
  const supabase = createSupabaseAdmin(c.env)
  const category = c.req.query('category')
  const newsletter_id = c.req.query('newsletter_id')
  const limit = parseInt(c.req.query('limit') || '50')
  const page = parseInt(c.req.query('page') || '1')
  const offset = (page - 1) * limit

  let query = supabase
    .from(TABLES.NEWS_ITEMS)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('category', category)
  }
  if (newsletter_id) {
    query = query.eq('newsletter_id', newsletter_id)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return c.json<ApiResponse>({
    success: true,
    data: {
      news: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  })
})

// RSS 뉴스 수집
news.post('/fetch', async (c) => {
  const { category, limit: maxItems } = await c.req.json<{ category?: string; limit?: number }>()
  const supabase = createSupabaseAdmin(c.env)
  
  const categories = category ? [category] : Object.keys(RSS_FEEDS)
  const results: { category: string; source: string; fetched: number; error?: string }[] = []
  const itemLimit = maxItems || 10

  for (const cat of categories) {
    const feedConfig = RSS_FEEDS[cat]
    if (!feedConfig) continue

    try {
      const response = await fetch(feedConfig.url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (compatible; MorningLetterBot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      })
      
      if (!response.ok) {
        results.push({ category: cat, source: feedConfig.source, fetched: 0, error: `HTTP ${response.status}` })
        continue
      }
      
      const xml = await response.text()
      
      // RSS 파싱
      const items = parseRSS(xml)
      let fetchedCount = 0

      for (const item of items.slice(0, itemLimit)) {
        // URL 정규화 (쿼리스트링 제거 옵션)
        const normalizedUrl = item.link.split('?')[0]
        
        // 중복 체크 (source_url)
        const { data: existing } = await supabase
          .from(TABLES.NEWS_ITEMS)
          .select('id')
          .eq('source_url', normalizedUrl)
          .single()

        if (!existing) {
          // HTML 태그 제거 및 정리
          const cleanDescription = item.description
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim()
            .slice(0, 500)

          await supabase
            .from(TABLES.NEWS_ITEMS)
            .insert({
              source_url: normalizedUrl,
              source_name: feedConfig.source,
              title: item.title,
              original_summary: cleanDescription,
              thumbnail_url: item.thumbnail,
              category: cat,
              published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
            })
          fetchedCount++
        }
      }

      results.push({ category: cat, source: feedConfig.source, fetched: fetchedCount })
    } catch (err) {
      results.push({ category: cat, source: feedConfig.source, fetched: 0, error: String(err) })
    }
  }

  const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0)

  return c.json<ApiResponse>({
    success: true,
    data: { 
      results,
      summary: {
        totalCategories: categories.length,
        totalFetched,
        timestamp: new Date().toISOString()
      }
    },
    message: `뉴스 수집 완료: ${totalFetched}개`
  })
})

// RSS 피드 목록 조회
news.get('/feeds', async (c) => {
  const feeds = Object.entries(RSS_FEEDS).map(([category, config]) => ({
    category,
    source: config.source,
    url: config.url
  }))

  return c.json<ApiResponse>({
    success: true,
    data: { feeds }
  })
})

// 뉴스 삭제
news.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = createSupabaseAdmin(c.env)

  const { error } = await supabase
    .from(TABLES.NEWS_ITEMS)
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return c.json<ApiResponse>({
    success: true,
    message: '뉴스가 삭제되었습니다.'
  })
})

// 뉴스 선택/해제 (뉴스레터에 포함)
news.post('/:id/select', async (c) => {
  const id = c.req.param('id')
  const { newsletter_id, is_selected, display_order } = await c.req.json<{
    newsletter_id: string
    is_selected: boolean
    display_order?: number
  }>()
  const supabase = createSupabaseAdmin(c.env)

  const { data, error } = await supabase
    .from(TABLES.NEWS_ITEMS)
    .update({
      newsletter_id: is_selected ? newsletter_id : null,
      is_selected,
      display_order: display_order || 0
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    throw new NotFoundError('뉴스')
  }

  return c.json<ApiResponse>({
    success: true,
    data: { news: data }
  })
})

// AI 요약 생성
news.post('/:id/summarize', async (c) => {
  const id = c.req.param('id')
  const supabase = createSupabaseAdmin(c.env)

  // 뉴스 조회
  const { data: newsItem, error } = await supabase
    .from(TABLES.NEWS_ITEMS)
    .select('*')
    .eq('id', id)
    .single()

  if (error || !newsItem) {
    throw new NotFoundError('뉴스')
  }

  // AI 요약 생성
  const summary = await generateAISummary(
    newsItem.title,
    newsItem.original_summary || '',
    c.env.GEMINI_API_KEY || c.env.OPENAI_API_KEY || ''
  )

  // 저장
  const { data: updated } = await supabase
    .from(TABLES.NEWS_ITEMS)
    .update({ ai_summary: summary })
    .eq('id', id)
    .select()
    .single()

  return c.json<ApiResponse>({
    success: true,
    data: { news: updated, summary }
  })
})

// 링크 프리뷰
news.post('/link-preview', async (c) => {
  const { url } = await c.req.json<{ url: string }>()
  
  validateRequired(url, 'URL')

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MorningLetterBot/1.0)' }
    })
    const html = await response.text()

    const preview: LinkPreviewData = {
      url,
      title: extractMeta(html, 'og:title') || extractTitle(html),
      description: extractMeta(html, 'og:description') || extractMeta(html, 'description'),
      image: extractMeta(html, 'og:image'),
      siteName: extractMeta(html, 'og:site_name')
    }

    return c.json<ApiResponse>({
      success: true,
      data: preview
    })
  } catch (err) {
    return c.json<ApiResponse>({
      success: false,
      error: '링크 프리뷰를 가져올 수 없습니다.'
    }, 400)
  }
})

// RSS 파싱 헬퍼
function parseRSS(xml: string): Array<{
  title: string
  link: string
  description: string
  thumbnail?: string
  pubDate?: string
}> {
  const items: Array<{
    title: string
    link: string
    description: string
    thumbnail?: string
    pubDate?: string
  }> = []

  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
  
  for (const itemXml of itemMatches) {
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] 
      || itemXml.match(/<title>(.*?)<\/title>/)?.[1] || ''
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || ''
    const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
      || itemXml.match(/<description>(.*?)<\/description>/)?.[1] || ''
    const thumbnail = itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1]
      || itemXml.match(/<enclosure[^>]*url="([^"]+)"/)?.[1]
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]

    if (title && link) {
      items.push({ title, link, description, thumbnail, pubDate })
    }
  }

  return items
}

// 메타 태그 추출 헬퍼
function extractMeta(html: string, property: string): string | null {
  const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')
  const match = html.match(regex)
  if (match) return match[1]

  const regex2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`, 'i')
  const match2 = html.match(regex2)
  return match2 ? match2[1] : null
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : null
}

// AI 요약 생성 헬퍼
async function generateAISummary(title: string, content: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    return content.slice(0, 200) + '...'
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `다음 뉴스 기사를 2-3문장으로 요약해주세요. 핵심 내용만 간결하게 작성해주세요.

제목: ${title}
내용: ${content}

요약:`
            }]
          }]
        })
      }
    )

    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || content.slice(0, 200) + '...'
  } catch {
    return content.slice(0, 200) + '...'
  }
}

export default news
