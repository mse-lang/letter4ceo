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
    if (origin === allowedOrigin || origin?.endsWith('.vercel.app')) {
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

export default {
  fetch: app.fetch,
  
  // 예약 발송 Cron
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log(`[Cron] Triggered at ${new Date().toISOString()}`)
    
    // TODO: 예약된 뉴스레터 발송 로직
    // - status = 'scheduled' AND scheduled_at <= NOW() 인 뉴스레터 조회
    // - Stibee API로 발송
    // - status = 'sent' 로 업데이트
  }
}
