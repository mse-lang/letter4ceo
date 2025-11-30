/**
 * 그만의 아침편지 API v2
 * 
 * 순수 JSON API 서버 (프론트엔드 분리)
 * Hono + Cloudflare Workers + Supabase
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { Env, ApiResponse } from './types'
import { errorResponse, NotFoundError } from './lib/errors'

// 라우트 임포트
import newsletters from './routes/newsletters'
import news from './routes/news'
import subscribers from './routes/subscribers'
import ai from './routes/ai'
import upload from './routes/upload'

const app = new Hono<{ Bindings: Env }>()

// ==========================================
// 미들웨어
// ==========================================

// 로거
app.use('*', logger())

// CORS 설정
app.use('*', cors({
  origin: (origin, c) => {
    // 개발 환경 허용
    if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
      return origin
    }
    // 프로덕션 환경
    const allowedOrigin = c.env.CORS_ORIGIN || 'https://morning-letter.vercel.app'
    const allowedDomains = [
      'https://letter4ceo.com', 
      'https://www.letter4ceo.com', 
      'https://letter4ceo.vercel.app'
    ]
    
    if (
      origin === allowedOrigin || 
      origin?.endsWith('.vercel.app') || 
      (origin && allowedDomains.includes(origin))
    ) {
      return origin
    }
    return allowedOrigin
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true
}))

// ==========================================
// API 라우트
// ==========================================

// 헬스 체크
app.get('/', (c) => {
  return c.json<ApiResponse>({
    success: true,
    data: {
      name: '그만의 아침편지 API',
      version: '2.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  })
})

// API 버전 프리픽스
const api = new Hono<{ Bindings: Env }>()

api.route('/newsletters', newsletters)
api.route('/news', news)
api.route('/subscribers', subscribers)
api.route('/ai', ai)
api.route('/upload', upload)

// /api 경로에 마운트
app.route('/api', api)

// ==========================================
// 에러 핸들링
// ==========================================

// 404 핸들러
app.notFound((c) => {
  return c.json<ApiResponse>({
    success: false,
    error: '요청한 리소스를 찾을 수 없습니다.',
    code: 'NOT_FOUND'
  }, 404)
})

// 전역 에러 핸들러
app.onError((err, c) => {
  console.error('[API Error]', err)
  return errorResponse(c, err)
})

// ==========================================
// Scheduled Events (Cron)
// ==========================================

import { createSupabaseAdmin, TABLES } from './lib/supabase'
import { sendNewsletterViaStibee } from './lib/stibee'

// RSS 피드 설정
const RSS_FEEDS: Record<string, { url: string; source: string }> = {
  '뉴스': { url: 'https://www.venturesquare.net/news/feed', source: '벤처스퀘어' },
  '인터뷰': { url: 'https://www.venturesquare.net/interview/feed', source: '벤처스퀘어' },
  '스타트업가이드': { url: 'https://www.venturesquare.net/startup_guide/feed', source: '벤처스퀘어' },
  '트렌드': { url: 'https://www.venturesquare.net/trend/feed', source: '벤처스퀘어' },
  '플래텀': { url: 'https://platum.kr/feed', source: '플래텀' },
}

// RSS 파싱 헬퍼 (간소화)
function parseRSSItems(xml: string): Array<{
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

// Cron Job: RSS 뉴스 수집
async function fetchRSSNews(env: Env): Promise<{ totalFetched: number; errors: string[] }> {
  const supabase = createSupabaseAdmin(env)
  const errors: string[] = []
  let totalFetched = 0

  console.log('[Cron RSS] Starting RSS fetch...')

  for (const [category, feedConfig] of Object.entries(RSS_FEEDS)) {
    try {
      const response = await fetch(feedConfig.url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (compatible; MorningLetterBot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      })
      
      if (!response.ok) {
        errors.push(`${category}: HTTP ${response.status}`)
        continue
      }
      
      const xml = await response.text()
      const items = parseRSSItems(xml)

      for (const item of items.slice(0, 10)) { // 카테고리당 최대 10개
        const normalizedUrl = item.link.split('?')[0]
        
        // 중복 체크
        const { data: existing } = await supabase
          .from(TABLES.NEWS_ITEMS)
          .select('id')
          .eq('source_url', normalizedUrl)
          .single()

        if (!existing) {
          // HTML 태그 제거
          const cleanDescription = item.description
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim()
            .slice(0, 500)

          const { error } = await supabase
            .from(TABLES.NEWS_ITEMS)
            .insert({
              source_url: normalizedUrl,
              source_name: feedConfig.source,
              title: item.title,
              original_summary: cleanDescription,
              thumbnail_url: item.thumbnail,
              category,
              published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
            })
          
          if (!error) totalFetched++
        }
      }

      console.log(`[Cron RSS] ${category}: fetched items`)
    } catch (err) {
      errors.push(`${category}: ${String(err)}`)
    }
  }

  console.log(`[Cron RSS] Completed: ${totalFetched} new items, ${errors.length} errors`)
  return { totalFetched, errors }
}

// Cron Job: 예약된 뉴스레터 발송
async function sendScheduledNewsletters(env: Env): Promise<{ sent: number; errors: string[] }> {
  const supabase = createSupabaseAdmin(env)
  const errors: string[] = []
  let sent = 0

  console.log('[Cron Send] Checking scheduled newsletters...')

  // 예약 발송 대기 중인 뉴스레터 조회 (현재 시간 이전에 예약된 것)
  const now = new Date().toISOString()
  const { data: newsletters, error } = await supabase
    .from(TABLES.NEWSLETTERS)
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })

  if (error) {
    console.error('[Cron Send] Query error:', error)
    return { sent: 0, errors: [error.message] }
  }

  if (!newsletters || newsletters.length === 0) {
    console.log('[Cron Send] No scheduled newsletters found')
    return { sent: 0, errors: [] }
  }

  console.log(`[Cron Send] Found ${newsletters.length} scheduled newsletters`)

  for (const newsletter of newsletters) {
    try {
      // 해당 뉴스레터에 선택된 뉴스 조회
      const { data: newsItems } = await supabase
        .from(TABLES.NEWS_ITEMS)
        .select('title, source_name, ai_summary, source_url, thumbnail_url')
        .eq('newsletter_id', newsletter.id)
        .eq('is_selected', true)
        .order('display_order', { ascending: true })

      // Stibee로 발송
      const result = await sendNewsletterViaStibee(
        env,
        {
          title: newsletter.title,
          letter_body: newsletter.letter_body || '',
          curator_note: newsletter.curator_note
        },
        newsItems || []
      )

      if (result.success) {
        // 발송 완료로 상태 업데이트
        await supabase
          .from(TABLES.NEWSLETTERS)
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            stibee_email_id: result.emailId
          })
          .eq('id', newsletter.id)

        sent++
        console.log(`[Cron Send] Sent newsletter: ${newsletter.id}`)
      } else {
        errors.push(`${newsletter.id}: ${result.error}`)
        console.error(`[Cron Send] Failed to send: ${newsletter.id}`, result.error)
      }
    } catch (err) {
      errors.push(`${newsletter.id}: ${String(err)}`)
      console.error(`[Cron Send] Error sending: ${newsletter.id}`, err)
    }
  }

  console.log(`[Cron Send] Completed: ${sent} sent, ${errors.length} errors`)
  return { sent, errors }
}

export default {
  fetch: app.fetch,
  
  // 예약 발송 Cron
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const triggerTime = new Date()
    const hour = triggerTime.getUTCHours()
    
    console.log(`[Cron] Triggered at ${triggerTime.toISOString()} (UTC hour: ${hour})`)

    // Cron 작업 처리
    // UTC 21:00 (KST 06:00) - RSS 뉴스 수집
    if (hour === 21) {
      console.log('[Cron] Running RSS fetch job...')
      const result = await fetchRSSNews(env)
      console.log('[Cron] RSS fetch result:', result)
    }
    
    // UTC 22:00 (KST 07:00) 또는 매시 정각 - 예약 발송 체크
    // 매시 정각에 예약 발송 체크하여 정확한 시간에 발송
    console.log('[Cron] Running scheduled newsletter check...')
    const sendResult = await sendScheduledNewsletters(env)
    console.log('[Cron] Send result:', sendResult)
    
    console.log('[Cron] All jobs completed')
  }
}
