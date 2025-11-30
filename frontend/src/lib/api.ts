/**
 * API 클라이언트
 */
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || '오류가 발생했습니다.'
    console.error('[API Error]', message)
    return Promise.reject(error)
  }
)

// API 타입
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedData<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 뉴스레터 API
export const newsletterApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/newsletters', { params }),
  
  get: (id: string) =>
    api.get(`/newsletters/${id}`),
  
  create: (data: { title: string; letter_body?: string; curator_note?: string }) =>
    api.post('/newsletters', data),
  
  update: (id: string, data: Partial<{ title: string; letter_body: string; curator_note: string; status: string }>) =>
    api.put(`/newsletters/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/newsletters/${id}`),
  
  schedule: (id: string, scheduled_at: string) =>
    api.post(`/newsletters/${id}/schedule`, { scheduled_at }),
  
  cancelSchedule: (id: string) =>
    api.post(`/newsletters/${id}/cancel-schedule`),
  
  send: (id: string) =>
    api.post(`/newsletters/${id}/send`),
  
  stats: () =>
    api.get('/newsletters/stats/summary')
}

// 뉴스 API
export const newsApi = {
  list: (params?: { category?: string; newsletter_id?: string; page?: number; limit?: number }) =>
    api.get('/news', { params }),
  
  fetch: (category?: string) =>
    api.post('/news/fetch', { category }),
  
  delete: (id: string) =>
    api.delete(`/news/${id}`),
  
  select: (id: string, data: { newsletter_id: string; is_selected: boolean; display_order?: number }) =>
    api.post(`/news/${id}/select`, data),
  
  summarize: (id: string) =>
    api.post(`/news/${id}/summarize`),
  
  linkPreview: (url: string) =>
    api.post('/news/link-preview', { url })
}

// 구독자 API
export const subscriberApi = {
  list: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/subscribers', { params }),
  
  subscribe: (data: { email: string; name?: string; privacy_agreed: boolean }) =>
    api.post('/subscribers/subscribe', data),
  
  unsubscribe: (email: string) =>
    api.post('/subscribers/unsubscribe', { email }),
  
  add: (data: { email: string; name?: string; company?: string; position?: string }) =>
    api.post('/subscribers', data),
  
  delete: (id: string) =>
    api.delete(`/subscribers/${id}`),
  
  export: () =>
    api.get('/subscribers/export', { responseType: 'blob' }),
  
  stats: () =>
    api.get('/subscribers/stats')
}

// AI API
export const aiApi = {
  generateLetter: (data?: { news_titles?: string[]; prompt?: string }) =>
    api.post('/ai/generate-letter', data || {})
}

// 업로드 API
export const uploadApi = {
  image: (image: string, name?: string) =>
    api.post('/upload/image', { image, name }),
  
  deleteImage: (key: string) =>
    api.delete('/upload/image', { data: { key } })
}
