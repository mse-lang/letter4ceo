/**
 * 뉴스레터 API 라우트
 */
import { Hono } from 'hono'
import type { Env, Newsletter, ApiResponse, CreateNewsletterBody, UpdateNewsletterBody } from '../types'
import { createSupabaseAdmin, TABLES } from '../lib/supabase'
import { ValidationError, NotFoundError, validateRequired } from '../lib/errors'

const newsletters = new Hono<{ Bindings: Env }>()

// 뉴스레터 목록 조회
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

// 단일 뉴스레터 조회
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

// 뉴스레터 생성
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

// 뉴스레터 수정
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

// 뉴스레터 삭제
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

// 예약 발송 설정
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

// 예약 취소
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

// 뉴스레터 발송 (Stibee)
newsletters.post('/:id/send', async (c) => {
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

  if (newsletter.status === 'sent') {
    throw new ValidationError('이미 발송된 뉴스레터입니다.')
  }

  // 연결된 뉴스 아이템 조회
  const { data: newsItems } = await supabase
    .from(TABLES.NEWS_ITEMS)
    .select('*')
    .eq('newsletter_id', id)
    .eq('is_selected', true)
    .order('display_order', { ascending: true })

  // TODO: Stibee API로 실제 발송 구현
  // 현재는 상태만 업데이트
  
  const { data: updated } = await supabase
    .from(TABLES.NEWSLETTERS)
    .update({
      status: 'sent',
      scheduled_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  return c.json<ApiResponse>({
    success: true,
    data: { newsletter: updated },
    message: '뉴스레터가 발송되었습니다.'
  })
})

// 통계
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

export default newsletters
