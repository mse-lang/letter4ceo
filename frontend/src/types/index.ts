/**
 * 프론트엔드 타입 정의
 */

export interface Newsletter {
  id: string
  published_date: string
  title: string
  letter_body: string | null
  curator_note: string | null
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
  status: 'active' | 'unsubscribed' | 'bounced'
  privacy_agreed: boolean
  subscribed_at: string
}

export interface DashboardStats {
  total: number
  draft: number
  sent: number
  scheduled: number
}

export interface SubscriberStats {
  total: number
  active: number
  unsubscribed: number
}

export interface LinkPreview {
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  url: string
}
