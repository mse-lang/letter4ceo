/**
 * 그만의 아침편지 API v2 - 타입 정의
 */

// ==========================================
// Cloudflare 바인딩 타입
// ==========================================

export interface Env {
  // Cloudflare R2
  R2: R2Bucket
  R2_PUBLIC_URL: string
  
  // Supabase
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  
  // Stibee
  STIBEE_API_KEY: string
  STIBEE_LIST_ID: string
  STIBEE_SENDER_EMAIL: string
  STIBEE_AUTO_EMAIL_URL?: string
  
  // AI
  GEMINI_API_KEY?: string
  OPENAI_API_KEY?: string
  CLAUDE_API_KEY?: string
  
  // CORS
  CORS_ORIGIN: string
}

// ==========================================
// 데이터베이스 모델 타입
// ==========================================

export interface Newsletter {
  id: string
  published_date: string
  title: string
  letter_body: string | null
  curator_note: string | null
  stibee_campaign_id: string | null
  status: 'draft' | 'sent' | 'scheduled'
  scheduled_at: string | null
  created_at: string
  updated_at: string
}

export interface NewsItem {
  id: string
  source_url: string
  source_name: string
  title: string
  original_summary: string | null
  ai_summary: string | null
  thumbnail_url: string | null
  category: string
  published_at: string | null
  newsletter_id: string | null
  is_selected: boolean
  display_order: number
  created_at: string
}

export interface Subscriber {
  id: string
  email: string
  name: string | null
  phone: string | null
  company: string | null
  position: string | null
  stibee_id: string | null
  status: 'active' | 'unsubscribed' | 'bounced'
  privacy_agreed: boolean
  privacy_agreed_at: string | null
  subscribed_at: string
  updated_at: string | null
}

// ==========================================
// API 응답 타입
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ==========================================
// 요청 바디 타입
// ==========================================

export interface CreateNewsletterBody {
  title: string
  letter_body?: string
  curator_note?: string
  published_date?: string
}

export interface UpdateNewsletterBody {
  title?: string
  letter_body?: string
  curator_note?: string
  status?: 'draft' | 'sent' | 'scheduled'
  scheduled_at?: string
}

export interface CreateSubscriberBody {
  email: string
  name?: string
  phone?: string
  company?: string
  position?: string
  privacy_agreed: boolean
}

export interface FetchNewsBody {
  category?: string
  limit?: number
}

export interface GenerateAIBody {
  prompt?: string
  news_titles?: string[]
}

export interface ImageUploadBody {
  image: string // Base64
  name?: string
}

// ==========================================
// Stibee 타입
// ==========================================

export interface StibeeSubscriber {
  email: string
  name?: string
}

export interface StibeeResponse<T = unknown> {
  Ok: boolean
  Error?: {
    Code: number
    HttpStatusCode: number
    Message: string
  }
  Value?: T
}

// ==========================================
// AI 타입
// ==========================================

export type AIProvider = 'gemini' | 'openai' | 'claude'

export interface AIGeneratedContent {
  title: string
  body: string
  provider?: AIProvider
}

// ==========================================
// 링크 프리뷰 타입
// ==========================================

export interface LinkPreviewData {
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  url: string
}
