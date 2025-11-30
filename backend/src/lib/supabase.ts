/**
 * Supabase 클라이언트 설정
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../types'

// Supabase 클라이언트 생성 (요청별)
export function createSupabaseClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// 서비스 역할 클라이언트 (관리자 작업용)
export function createSupabaseAdmin(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// 데이터베이스 테이블명
export const TABLES = {
  NEWSLETTERS: 'newsletters',
  NEWS_ITEMS: 'news_items',
  SUBSCRIBERS: 'subscribers'
} as const
