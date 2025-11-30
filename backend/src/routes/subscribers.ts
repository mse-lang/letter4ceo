/**
 * 구독자 API 라우트
 */
import { Hono } from 'hono'
import type { Env, Subscriber, ApiResponse, CreateSubscriberBody } from '../types'
import { createSupabaseAdmin, TABLES } from '../lib/supabase'
import { ValidationError, NotFoundError, validateRequired, validateEmail } from '../lib/errors'

const subscribers = new Hono<{ Bindings: Env }>()

// 구독자 목록 조회
subscribers.get('/', async (c) => {
  const supabase = createSupabaseAdmin(c.env)
  const status = c.req.query('status')
  const search = c.req.query('search')
  const limit = parseInt(c.req.query('limit') || '50')
  const page = parseInt(c.req.query('page') || '1')
  const offset = (page - 1) * limit

  let query = supabase
    .from(TABLES.SUBSCRIBERS)
    .select('*', { count: 'exact' })
    .order('subscribed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }
  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,company.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return c.json<ApiResponse>({
    success: true,
    data: {
      subscribers: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  })
})

// 구독 (퍼블릭)
subscribers.post('/subscribe', async (c) => {
  const body = await c.req.json<CreateSubscriberBody>()
  const supabase = createSupabaseAdmin(c.env)

  validateRequired(body.email, '이메일')
  validateEmail(body.email)

  // 기존 구독자 확인
  const { data: existing } = await supabase
    .from(TABLES.SUBSCRIBERS)
    .select('*')
    .eq('email', body.email)
    .single()

  if (existing) {
    if (existing.status === 'active') {
      throw new ValidationError('이미 구독 중인 이메일입니다.')
    }
    // 재구독
    const { data } = await supabase
      .from(TABLES.SUBSCRIBERS)
      .update({
        status: 'active',
        name: body.name || existing.name,
        phone: body.phone || existing.phone,
        company: body.company || existing.company,
        position: body.position || existing.position,
        privacy_agreed: body.privacy_agreed,
        privacy_agreed_at: body.privacy_agreed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()

    // Stibee 동기화
    await syncToStibee(c.env, body.email, body.name)

    return c.json<ApiResponse>({
      success: true,
      data: { subscriber: data },
      message: '다시 구독해 주셔서 감사합니다!'
    })
  }

  // 신규 구독
  const { data, error } = await supabase
    .from(TABLES.SUBSCRIBERS)
    .insert({
      email: body.email,
      name: body.name,
      phone: body.phone,
      company: body.company,
      position: body.position,
      status: 'active',
      privacy_agreed: body.privacy_agreed,
      privacy_agreed_at: body.privacy_agreed ? new Date().toISOString() : null
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // unique violation
      throw new ValidationError('이미 구독 중인 이메일입니다.')
    }
    throw new Error(`Database error: ${error.message}`)
  }

  // Stibee 동기화
  await syncToStibee(c.env, body.email, body.name)

  return c.json<ApiResponse>({
    success: true,
    data: { subscriber: data },
    message: '구독해 주셔서 감사합니다!'
  }, 201)
})

// 구독 취소 (퍼블릭)
subscribers.post('/unsubscribe', async (c) => {
  const { email } = await c.req.json<{ email: string }>()
  const supabase = createSupabaseAdmin(c.env)

  validateRequired(email, '이메일')
  validateEmail(email)

  const { data, error } = await supabase
    .from(TABLES.SUBSCRIBERS)
    .update({
      status: 'unsubscribed',
      updated_at: new Date().toISOString()
    })
    .eq('email', email)
    .select()
    .single()

  if (error || !data) {
    throw new NotFoundError('구독자')
  }

  // Stibee에서도 구독 취소
  await unsubscribeFromStibee(c.env, email)

  return c.json<ApiResponse>({
    success: true,
    message: '구독이 취소되었습니다.'
  })
})

// 구독자 추가 (관리자)
subscribers.post('/', async (c) => {
  const body = await c.req.json<CreateSubscriberBody>()
  const supabase = createSupabaseAdmin(c.env)

  validateRequired(body.email, '이메일')
  validateEmail(body.email)

  const { data, error } = await supabase
    .from(TABLES.SUBSCRIBERS)
    .insert({
      email: body.email,
      name: body.name,
      phone: body.phone,
      company: body.company,
      position: body.position,
      status: 'active',
      privacy_agreed: body.privacy_agreed || false
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ValidationError('이미 등록된 이메일입니다.')
    }
    throw new Error(`Database error: ${error.message}`)
  }

  return c.json<ApiResponse>({
    success: true,
    data: { subscriber: data },
    message: '구독자가 추가되었습니다.'
  }, 201)
})

// 구독자 삭제
subscribers.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = createSupabaseAdmin(c.env)

  const { error } = await supabase
    .from(TABLES.SUBSCRIBERS)
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return c.json<ApiResponse>({
    success: true,
    message: '구독자가 삭제되었습니다.'
  })
})

// CSV 내보내기
subscribers.get('/export', async (c) => {
  const supabase = createSupabaseAdmin(c.env)

  const { data } = await supabase
    .from(TABLES.SUBSCRIBERS)
    .select('*')
    .order('subscribed_at', { ascending: false })

  const headers = ['email', 'name', 'phone', 'company', 'position', 'status', 'subscribed_at']
  const csv = [
    headers.join(','),
    ...(data || []).map(s => headers.map(h => `"${(s as Record<string, unknown>)[h] || ''}"`).join(','))
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="subscribers_${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
})

// 통계
subscribers.get('/stats', async (c) => {
  const supabase = createSupabaseAdmin(c.env)

  const { data: all } = await supabase
    .from(TABLES.SUBSCRIBERS)
    .select('status')

  const stats = {
    total: all?.length || 0,
    active: all?.filter(s => s.status === 'active').length || 0,
    unsubscribed: all?.filter(s => s.status === 'unsubscribed').length || 0
  }

  return c.json<ApiResponse>({
    success: true,
    data: { stats }
  })
})

// Stibee 동기화 헬퍼
async function syncToStibee(env: Env, email: string, name?: string | null): Promise<void> {
  if (!env.STIBEE_API_KEY || !env.STIBEE_LIST_ID) return

  try {
    await fetch(`https://api.stibee.com/v1/lists/${env.STIBEE_LIST_ID}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessToken': env.STIBEE_API_KEY
      },
      body: JSON.stringify({
        subscribers: [{ email, name: name || '' }]
      })
    })
  } catch (err) {
    console.error('[Stibee Sync Error]', err)
  }
}

async function unsubscribeFromStibee(env: Env, email: string): Promise<void> {
  if (!env.STIBEE_API_KEY || !env.STIBEE_LIST_ID) return

  try {
    await fetch(`https://api.stibee.com/v1/lists/${env.STIBEE_LIST_ID}/subscribers/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        'AccessToken': env.STIBEE_API_KEY
      }
    })
  } catch (err) {
    console.error('[Stibee Unsubscribe Error]', err)
  }
}

export default subscribers
