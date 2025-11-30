/**
 * 뉴스레터 API 라우트
 * Stibee 연동 포함
 */
import { Hono } from 'hono'
import type { Env, Newsletter, ApiResponse, CreateNewsletterBody, UpdateNewsletterBody } from '../types'
import { createSupabaseAdmin, TABLES } from '../lib/supabase'
import { ValidationError, NotFoundError, validateRequired } from '../lib/errors'
import { StibeeClient, sendNewsletterViaStibee } from '../lib/stibee'

const newsletters = new Hono<{ Bindings: Env }>()

// ==========================================
// 뉴스레터 목록 조회
// ==========================================
newsletters.get('/', async (c) => {
  const supabase = createSupabaseAdmin(c.env)
  const status = c.req.query('status')
  const limit = parseInt(c.req.query('limit') || '20')
  const page = parseInt(c.req.query('page') || '1')
  const offset = (page - 1) * limit

  let query = supabase
    .from(TABLES.NEWSLETTERS)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return c.json<ApiResponse>({
    success: true,
    data: {
      newsletters: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  })
})

// ==========================================
// 단일 뉴스레터 조회
// ==========================================
newsletters.get('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = createSupabaseAdmin(c.env)

  const { data, error } = await supabase
    .from(TABLES.NEWSLETTERS)
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new NotFoundError('뉴스레터')
  }

  // 연결된 뉴스 아이템도 함께 조회
  const { data: newsItems } = await supabase
    .from(TABLES.NEWS_ITEMS)
    .select('*')
    .eq('newsletter_id', id)
    .order('display_order', { ascending: true })

  return c.json<ApiResponse>({
    success: true,
    data: {
      newsletter: data,
      newsItems: newsItems || []
    }
  })
})

// ==========================================
// 뉴스레터 생성
// ==========================================
newsletters.post('/', async (c) => {
  const body = await c.req.json<CreateNewsletterBody>()
  const supabase = createSupabaseAdmin(c.env)

  validateRequired(body.title, '제목')

  const { data, error } = await supabase
    .from(TABLES.NEWSLETTERS)
    .insert({
      title: body.title,
      letter_body: body.letter_body || '',
      curator_note: body.curator_note || '',
      published_date: body.published_date || new Date().toISOString().split('T')[0],
      status: 'draft'
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return c.json<ApiResponse>({
    success: true,
    data: { newsletter: data },
    message: '뉴스레터가 생성되었습니다.'
  }, 201)
})

// ==========================================
// 뉴스레터 수정
// ==========================================
newsletters.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<UpdateNewsletterBody>()
  const supabase = createSupabaseAdmin(c.env)

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  if (body.title !== undefined) updateData.title = body.title
  if (body.letter_body !== undefined) updateData.letter_body = body.letter_body
  if (body.curator_note !== undefined) updateData.curator_note = body.curator_note
  if (body.status !== undefined) updateData.status = body.status
  if (body.scheduled_at !== undefined) updateData.scheduled_at = body.scheduled_at

  const { data, error } = await supabase
    .from(TABLES.NEWSLETTERS)
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    throw new NotFoundError('뉴스레터')
  }

  return c.json<ApiResponse>({
    success: true,
    data: { newsletter: data },
    message: '뉴스레터가 수정되었습니다.'
  })
})

// ==========================================
// 뉴스레터 삭제
// ==========================================
newsletters.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = createSupabaseAdmin(c.env)

  // 연결된 뉴스 아이템의 newsletter_id를 null로 설정
  await supabase
    .from(TABLES.NEWS_ITEMS)
    .update({ newsletter_id: null })
    .eq('newsletter_id', id)

  const { error } = await supabase
    .from(TABLES.NEWSLETTERS)
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return c.json<ApiResponse>({
    success: true,
    message: '뉴스레터가 삭제되었습니다.'
  })
})

// ==========================================
// 예약 발송 설정
// ==========================================
newsletters.post('/:id/schedule', async (c) => {
  const id = c.req.param('id')
  const { scheduled_at } = await c.req.json<{ scheduled_at: string }>()
  const supabase = createSupabaseAdmin(c.env)

  validateRequired(scheduled_at, '예약 시간')

  const scheduledDate = new Date(scheduled_at)
  if (scheduledDate <= new Date()) {
    throw new ValidationError('예약 시간은 현재 시간 이후여야 합니다.')
  }

  const { data, error } = await supabase
    .from(TABLES.NEWSLETTERS)
    .update({
      status: 'scheduled',
      scheduled_at,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    throw new NotFoundError('뉴스레터')
  }

  return c.json<ApiResponse>({
    success: true,
    data: { newsletter: data },
    message: `${new Date(scheduled_at).toLocaleString('ko-KR')}에 발송 예약되었습니다.`
  })
})

// ==========================================
// 예약 취소
// ==========================================
newsletters.post('/:id/cancel-schedule', async (c) => {
  const id = c.req.param('id')
  const supabase = createSupabaseAdmin(c.env)

  const { data, error } = await supabase
    .from(TABLES.NEWSLETTERS)
    .update({
      status: 'draft',
      scheduled_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('status', 'scheduled')
    .select()
    .single()

  if (error || !data) {
    throw new NotFoundError('예약된 뉴스레터')
  }

  return c.json<ApiResponse>({
    success: true,
    data: { newsletter: data },
    message: '예약이 취소되었습니다.'
  })
})

// ==========================================
// 뉴스레터 발송 (Stibee 연동)
// ==========================================
newsletters.post('/:id/send', async (c) => {
  const id = c.req.param('id')
  const supabase = createSupabaseAdmin(c.env)
  const stibeeClient = new StibeeClient(c.env)

  // 뉴스레터 조회
  const { data: newsletter, error } = await supabase
    .from(TABLES.NEWSLETTERS)
    .select('*')
    .eq('id', id)
    .single()

  if (error || !newsletter) {
    throw new NotFoundError('뉴스레터')
  }

  if (newsletter.status === 'sent') {
    throw new ValidationError('이미 발송된 뉴스레터입니다.')
  }

  // Stibee API 설정 확인
  if (!stibeeClient.isConfigured()) {
    throw new ValidationError('Stibee API가 설정되지 않았습니다. 환경 변수를 확인해주세요.')
  }

  // 연결된 뉴스 아이템 조회
  const { data: newsItems } = await supabase
    .from(TABLES.NEWS_ITEMS)
    .select('*')
    .eq('newsletter_id', id)
    .eq('is_selected', true)
    .order('display_order', { ascending: true })

  // Stibee로 발송
  console.log(`[Newsletter] Sending newsletter ${id} via Stibee...`)
  
  const sendResult = await sendNewsletterViaStibee(
    c.env,
    {
      title: newsletter.title,
      letter_body: newsletter.letter_body || '',
      curator_note: newsletter.curator_note || undefined
    },
    newsItems?.map(item => ({
      title: item.title,
      source_name: item.source_name,
      ai_summary: item.ai_summary || undefined,
      source_url: item.source_url,
      thumbnail_url: item.thumbnail_url || undefined
    }))
  )

  if (!sendResult.success) {
    throw new Error(`Stibee 발송 실패: ${sendResult.error}`)
  }

  // 상태 업데이트
  const { data: updated } = await supabase
    .from(TABLES.NEWSLETTERS)
    .update({
      status: 'sent',
      stibee_campaign_id: sendResult.emailId,
      scheduled_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  return c.json<ApiResponse>({
    success: true,
    data: { 
      newsletter: updated,
      stibee_email_id: sendResult.emailId
    },
    message: '뉴스레터가 발송되었습니다.'
  })
})

// ==========================================
// 테스트 발송 (특정 이메일로만)
// ==========================================
newsletters.post('/:id/send-test', async (c) => {
  const id = c.req.param('id')
  const { email } = await c.req.json<{ email: string }>()
  const supabase = createSupabaseAdmin(c.env)
  const stibeeClient = new StibeeClient(c.env)

  validateRequired(email, '테스트 이메일')

  // 뉴스레터 조회
  const { data: newsletter, error } = await supabase
    .from(TABLES.NEWSLETTERS)
    .select('*')
    .eq('id', id)
    .single()

  if (error || !newsletter) {
    throw new NotFoundError('뉴스레터')
  }

  if (!stibeeClient.isConfigured()) {
    throw new ValidationError('Stibee API가 설정되지 않았습니다.')
  }

  // 연결된 뉴스 아이템 조회
  const { data: newsItems } = await supabase
    .from(TABLES.NEWS_ITEMS)
    .select('*')
    .eq('newsletter_id', id)
    .eq('is_selected', true)
    .order('display_order', { ascending: true })

  // HTML 생성
  const frontendUrl = c.env.CORS_ORIGIN || 'https://morning-letter.vercel.app'
  const htmlContent = StibeeClient.generateEmailHtml({
    title: newsletter.title,
    letterBody: newsletter.letter_body || '',
    curatorNote: newsletter.curator_note || undefined,
    newsItems: newsItems?.map(item => ({
      title: item.title,
      source_name: item.source_name,
      ai_summary: item.ai_summary || undefined,
      source_url: item.source_url,
      thumbnail_url: item.thumbnail_url || undefined
    })),
    unsubscribeUrl: `${frontendUrl}/unsubscribe`
  })

  // 자동 이메일로 테스트 발송 (자동 이메일 URL이 설정된 경우)
  if (c.env.STIBEE_AUTO_EMAIL_URL) {
    const success = await stibeeClient.sendAutoEmail(
      c.env.STIBEE_AUTO_EMAIL_URL,
      email,
      {
        title: newsletter.title,
        content: htmlContent,
        curator_note: newsletter.curator_note || ''
      }
    )

    if (success) {
      return c.json<ApiResponse>({
        success: true,
        message: `테스트 이메일이 ${email}로 발송되었습니다.`
      })
    }
  }

  // 자동 이메일이 설정되지 않은 경우 HTML만 반환
  return c.json<ApiResponse>({
    success: true,
    message: '테스트 이메일 발송을 위해서는 STIBEE_AUTO_EMAIL_URL 설정이 필요합니다.',
    data: {
      preview_html: htmlContent,
      to: email
    }
  })
})

// ==========================================
// 이메일 미리보기 HTML 생성
// ==========================================
newsletters.get('/:id/preview', async (c) => {
  const id = c.req.param('id')
  const supabase = createSupabaseAdmin(c.env)

  // 뉴스레터 조회
  const { data: newsletter, error } = await supabase
    .from(TABLES.NEWSLETTERS)
    .select('*')
    .eq('id', id)
    .single()

  if (error || !newsletter) {
    throw new NotFoundError('뉴스레터')
  }

  // 연결된 뉴스 아이템 조회
  const { data: newsItems } = await supabase
    .from(TABLES.NEWS_ITEMS)
    .select('*')
    .eq('newsletter_id', id)
    .eq('is_selected', true)
    .order('display_order', { ascending: true })

  const frontendUrl = c.env.CORS_ORIGIN || 'https://morning-letter.vercel.app'

  const htmlContent = StibeeClient.generateEmailHtml({
    title: newsletter.title,
    letterBody: newsletter.letter_body || '',
    curatorNote: newsletter.curator_note || undefined,
    newsItems: newsItems?.map(item => ({
      title: item.title,
      source_name: item.source_name,
      ai_summary: item.ai_summary || undefined,
      source_url: item.source_url,
      thumbnail_url: item.thumbnail_url || undefined
    })),
    unsubscribeUrl: `${frontendUrl}/unsubscribe`
  })

  // HTML로 직접 반환
  return c.html(htmlContent)
})

// ==========================================
// 통계
// ==========================================
newsletters.get('/stats/summary', async (c) => {
  const supabase = createSupabaseAdmin(c.env)

  const { data: all } = await supabase
    .from(TABLES.NEWSLETTERS)
    .select('status')

  const stats = {
    total: all?.length || 0,
    draft: all?.filter(n => n.status === 'draft').length || 0,
    sent: all?.filter(n => n.status === 'sent').length || 0,
    scheduled: all?.filter(n => n.status === 'scheduled').length || 0
  }

  return c.json<ApiResponse>({
    success: true,
    data: { stats }
  })
})

// ==========================================
// Stibee 설정 상태 확인
// ==========================================
newsletters.get('/stibee/status', async (c) => {
  const client = new StibeeClient(c.env)

  return c.json<ApiResponse>({
    success: true,
    data: {
      configured: client.isConfigured(),
      has_api_key: !!c.env.STIBEE_API_KEY,
      has_list_id: !!c.env.STIBEE_LIST_ID,
      has_sender_email: !!c.env.STIBEE_SENDER_EMAIL,
      has_auto_email_url: !!c.env.STIBEE_AUTO_EMAIL_URL
    }
  })
})

export default newsletters
