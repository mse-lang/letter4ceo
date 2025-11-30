/**
 * Stibee API 클라이언트
 * 
 * Stibee API v1 기반 구독자 관리 및 이메일 발송 통합
 * API 문서: https://developers.stibee.com/
 */

import type { Env } from '../types'

// ==========================================
// 타입 정의
// ==========================================

export interface StibeeSubscriber {
  email: string
  name?: string
  phone?: string
  company?: string
  position?: string
  [key: string]: string | undefined  // 커스텀 필드
}

export interface StibeeAddSubscriberRequest {
  subscribers: StibeeSubscriber[]
  eventOccurredBy?: 'SUBSCRIBER' | 'MANUAL'  // 구독 경로
}

export interface StibeeApiResponse<T = unknown> {
  Ok: boolean
  Error?: {
    Code: string
    Message: string
    HttpStatusCode: number
  }
  Value?: T
}

export interface StibeeSubscriberResponse {
  success: StibeeSubscriber[]
  fail: Array<{
    email: string
    failReason: string
  }>
  update: StibeeSubscriber[]
}

export interface StibeeSendEmailRequest {
  subscriber: string  // 수신자 이메일
  [key: string]: string  // 개인화 변수 (key1: value1, ...)
}

export interface StibeeEmailStats {
  sent: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
}

// ==========================================
// Stibee 클라이언트 클래스
// ==========================================

export class StibeeClient {
  private readonly apiKey: string
  private readonly listId: string
  private readonly senderEmail: string
  private readonly autoEmailUrl?: string
  private readonly baseUrl = 'https://api.stibee.com/v1'

  constructor(env: Env) {
    this.apiKey = env.STIBEE_API_KEY || ''
    this.listId = env.STIBEE_LIST_ID || ''
    this.senderEmail = env.STIBEE_SENDER_EMAIL || ''
    this.autoEmailUrl = env.STIBEE_AUTO_EMAIL_URL
  }

  // API 키가 설정되었는지 확인
  isConfigured(): boolean {
    return !!(this.apiKey && this.listId)
  }

  // ==========================================
  // 구독자 관리 API
  // ==========================================

  /**
   * 구독자 추가/업데이트
   * 이미 존재하는 이메일은 정보가 업데이트됨
   */
  async addSubscribers(subscribers: StibeeSubscriber[]): Promise<StibeeSubscriberResponse> {
    if (!this.isConfigured()) {
      console.warn('[Stibee] API not configured, skipping addSubscribers')
      return { success: subscribers, fail: [], update: [] }
    }

    const response = await fetch(`${this.baseUrl}/lists/${this.listId}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessToken': this.apiKey
      },
      body: JSON.stringify({
        subscribers,
        eventOccurredBy: 'SUBSCRIBER'
      } as StibeeAddSubscriberRequest)
    })

    const result = await response.json() as StibeeApiResponse<StibeeSubscriberResponse>

    if (!result.Ok) {
      console.error('[Stibee] addSubscribers error:', result.Error)
      throw new Error(`Stibee API Error: ${result.Error?.Message || 'Unknown error'}`)
    }

    console.log('[Stibee] addSubscribers success:', {
      success: result.Value?.success?.length || 0,
      fail: result.Value?.fail?.length || 0,
      update: result.Value?.update?.length || 0
    })

    return result.Value || { success: [], fail: [], update: [] }
  }

  /**
   * 단일 구독자 추가
   */
  async addSubscriber(subscriber: StibeeSubscriber): Promise<boolean> {
    const result = await this.addSubscribers([subscriber])
    return result.success.length > 0 || result.update.length > 0
  }

  /**
   * 구독자 삭제 (구독 취소)
   */
  async deleteSubscriber(email: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('[Stibee] API not configured, skipping deleteSubscriber')
      return true
    }

    const response = await fetch(
      `${this.baseUrl}/lists/${this.listId}/subscribers/${encodeURIComponent(email)}`,
      {
        method: 'DELETE',
        headers: {
          'AccessToken': this.apiKey
        }
      }
    )

    if (!response.ok) {
      console.error('[Stibee] deleteSubscriber error:', response.status)
      return false
    }

    console.log('[Stibee] deleteSubscriber success:', email)
    return true
  }

  /**
   * 구독자 목록 조회
   */
  async getSubscribers(offset = 0, limit = 100): Promise<StibeeSubscriber[]> {
    if (!this.isConfigured()) {
      return []
    }

    const response = await fetch(
      `${this.baseUrl}/lists/${this.listId}/subscribers?offset=${offset}&limit=${limit}`,
      {
        headers: {
          'AccessToken': this.apiKey
        }
      }
    )

    const result = await response.json() as StibeeApiResponse<StibeeSubscriber[]>

    if (!result.Ok) {
      console.error('[Stibee] getSubscribers error:', result.Error)
      return []
    }

    return result.Value || []
  }

  /**
   * 단일 구독자 조회
   */
  async getSubscriber(email: string): Promise<StibeeSubscriber | null> {
    if (!this.isConfigured()) {
      return null
    }

    const response = await fetch(
      `${this.baseUrl}/lists/${this.listId}/subscribers/${encodeURIComponent(email)}`,
      {
        headers: {
          'AccessToken': this.apiKey
        }
      }
    )

    const result = await response.json() as StibeeApiResponse<StibeeSubscriber>

    if (!result.Ok) {
      return null
    }

    return result.Value || null
  }

  // ==========================================
  // 자동 이메일 발송 API
  // ==========================================

  /**
   * 자동 이메일 발송 (개별 발송)
   * 
   * Stibee 자동 이메일을 사용하여 개별 구독자에게 이메일 발송
   * 자동 이메일 URL은 Stibee 대시보드에서 확인 가능
   * 
   * @param autoEmailUrl - 자동 이메일 API URL (예: https://stibee.com/api/v1.0/auto/xxxxx)
   * @param email - 수신자 이메일
   * @param variables - 개인화 변수 (이메일 템플릿에서 $%key%$ 형태로 사용)
   */
  async sendAutoEmail(
    autoEmailUrl: string,
    email: string,
    variables?: Record<string, string>
  ): Promise<boolean> {
    const body: StibeeSendEmailRequest = {
      subscriber: email,
      ...variables
    }

    try {
      const response = await fetch(autoEmailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        console.error('[Stibee] sendAutoEmail error:', response.status, await response.text())
        return false
      }

      console.log('[Stibee] sendAutoEmail success:', email)
      return true
    } catch (error) {
      console.error('[Stibee] sendAutoEmail exception:', error)
      return false
    }
  }

  /**
   * 뉴스레터 발송 (전체 구독자)
   * 
   * Stibee의 자동 이메일 기능을 활용하여 뉴스레터 발송
   * 대량 발송의 경우 일반 이메일 API 사용 권장
   */
  async sendNewsletter(
    title: string,
    content: string,
    curatorNote?: string
  ): Promise<{ success: boolean; sentCount: number; failedEmails: string[] }> {
    if (!this.autoEmailUrl) {
      console.error('[Stibee] Auto email URL not configured')
      return { success: false, sentCount: 0, failedEmails: [] }
    }

    // 구독자 목록 조회
    const subscribers = await this.getSubscribers(0, 10000)  // 최대 10,000명
    
    if (subscribers.length === 0) {
      console.warn('[Stibee] No subscribers found')
      return { success: true, sentCount: 0, failedEmails: [] }
    }

    console.log(`[Stibee] Sending newsletter to ${subscribers.length} subscribers`)

    const failedEmails: string[] = []
    let sentCount = 0

    // 개별 발송 (자동 이메일은 개별 발송에 최적화)
    // 대량 발송 시 rate limit 고려하여 순차 처리
    for (const subscriber of subscribers) {
      const variables: Record<string, string> = {
        title,
        content,
        curator_note: curatorNote || '',
        subscriber_name: subscriber.name || '구독자',
        unsubscribe_url: `https://morning-letter.vercel.app/unsubscribe?email=${encodeURIComponent(subscriber.email)}`
      }

      const success = await this.sendAutoEmail(this.autoEmailUrl, subscriber.email, variables)
      
      if (success) {
        sentCount++
      } else {
        failedEmails.push(subscriber.email)
      }

      // Rate limiting: 100ms 간격
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`[Stibee] Newsletter sent: ${sentCount}/${subscribers.length}`)

    return {
      success: failedEmails.length === 0,
      sentCount,
      failedEmails
    }
  }

  // ==========================================
  // 이메일 API (v2) - 일반 이메일 발송
  // ==========================================

  /**
   * 이메일 생성 및 발송
   * API v2 사용 - 대량 발송에 적합
   */
  async createAndSendEmail(params: {
    subject: string
    content: string
    previewText?: string
  }): Promise<{ emailId: string | null; success: boolean }> {
    if (!this.isConfigured()) {
      return { emailId: null, success: false }
    }

    // 1. 이메일 생성
    const createResponse = await fetch('https://api.stibee.com/v2/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessToken': this.apiKey
      },
      body: JSON.stringify({
        listId: parseInt(this.listId),
        subject: params.subject,
        previewText: params.previewText || '',
        content: params.content,
        senderEmail: this.senderEmail,
        senderName: '그만의 아침편지'
      })
    })

    const createResult = await createResponse.json() as StibeeApiResponse<{ id: string }>

    if (!createResult.Ok || !createResult.Value?.id) {
      console.error('[Stibee] createEmail error:', createResult.Error)
      return { emailId: null, success: false }
    }

    const emailId = createResult.Value.id
    console.log('[Stibee] Email created:', emailId)

    // 2. 이메일 발송
    const sendResponse = await fetch(`https://api.stibee.com/v2/emails/${emailId}/send`, {
      method: 'POST',
      headers: {
        'AccessToken': this.apiKey
      }
    })

    const sendResult = await sendResponse.json() as StibeeApiResponse

    if (!sendResult.Ok) {
      console.error('[Stibee] sendEmail error:', sendResult.Error)
      return { emailId, success: false }
    }

    console.log('[Stibee] Email sent:', emailId)
    return { emailId, success: true }
  }

  // ==========================================
  // 유틸리티 함수
  // ==========================================

  /**
   * HTML 이메일 템플릿 생성
   */
  static generateEmailHtml(params: {
    title: string
    letterBody: string
    curatorNote?: string
    newsItems?: Array<{
      title: string
      source_name: string
      ai_summary?: string
      source_url: string
      thumbnail_url?: string
    }>
    unsubscribeUrl: string
  }): string {
    const { title, letterBody, curatorNote, newsItems, unsubscribeUrl } = params

    const newsSection = newsItems && newsItems.length > 0 ? `
      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
        <h2 style="color: #8A373F; font-size: 20px; margin-bottom: 24px;">📰 오늘의 스타트업 뉴스</h2>
        ${newsItems.map(item => `
          <div style="margin-bottom: 24px; padding: 20px; background: #f8f8f8; border-radius: 8px;">
            ${item.thumbnail_url ? `<img src="${item.thumbnail_url}" alt="" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 12px;">` : ''}
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">
              <a href="${item.source_url}" style="color: #333; text-decoration: none;">${item.title}</a>
            </h3>
            <p style="color: #666; font-size: 12px; margin: 0 0 8px 0;">${item.source_name}</p>
            ${item.ai_summary ? `<p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0;">${item.ai_summary}</p>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F0; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #8A373F; font-size: 24px; margin: 0;">그만의 아침편지</h1>
      <p style="color: #666; font-size: 14px; margin-top: 8px;">스타트업 창업가를 위한 아침 인사</p>
    </div>
    
    <!-- Main Content -->
    <div style="background: #fff; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h2 style="color: #333; font-size: 22px; margin: 0 0 24px 0; line-height: 1.4;">${title}</h2>
      
      <div style="color: #444; font-size: 16px; line-height: 1.8;">
        ${letterBody}
      </div>
      
      ${curatorNote ? `
        <div style="margin-top: 32px; padding: 20px; background: linear-gradient(135deg, #FDF6F3 0%, #F8F5F0 100%); border-radius: 12px; border-left: 4px solid #8A373F;">
          <p style="color: #8A373F; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">💌 큐레이터의 한마디</p>
          <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0;">${curatorNote}</p>
        </div>
      ` : ''}
      
      ${newsSection}
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; color: #888; font-size: 12px;">
      <p>본 메일은 구독에 동의하신 분께 발송됩니다.</p>
      <p>
        <a href="${unsubscribeUrl}" style="color: #888; text-decoration: underline;">구독 취소</a>
      </p>
      <p style="margin-top: 16px;">© ${new Date().getFullYear()} 그만의 아침편지. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }
}

// ==========================================
// 헬퍼 함수 (기존 코드 호환)
// ==========================================

/**
 * Stibee에 구독자 동기화 (기존 코드 호환용)
 */
export async function syncToStibee(
  env: Env,
  email: string,
  name?: string | null,
  additionalFields?: Record<string, string>
): Promise<boolean> {
  const client = new StibeeClient(env)
  
  if (!client.isConfigured()) {
    return true  // 설정되지 않은 경우 성공으로 처리
  }

  try {
    return await client.addSubscriber({
      email,
      name: name || undefined,
      ...additionalFields
    })
  } catch (error) {
    console.error('[Stibee] syncToStibee error:', error)
    return false
  }
}

/**
 * Stibee에서 구독자 삭제 (기존 코드 호환용)
 */
export async function unsubscribeFromStibee(env: Env, email: string): Promise<boolean> {
  const client = new StibeeClient(env)
  
  if (!client.isConfigured()) {
    return true
  }

  try {
    return await client.deleteSubscriber(email)
  } catch (error) {
    console.error('[Stibee] unsubscribeFromStibee error:', error)
    return false
  }
}

/**
 * 뉴스레터 발송 (Stibee v2 API 사용)
 */
export async function sendNewsletterViaStibee(
  env: Env,
  newsletter: {
    title: string
    letter_body: string
    curator_note?: string
  },
  newsItems?: Array<{
    title: string
    source_name: string
    ai_summary?: string
    source_url: string
    thumbnail_url?: string
  }>
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const client = new StibeeClient(env)

  if (!client.isConfigured()) {
    return { success: false, error: 'Stibee API not configured' }
  }

  const frontendUrl = env.CORS_ORIGIN || 'https://morning-letter.vercel.app'
  const unsubscribeUrl = `${frontendUrl}/unsubscribe`

  const htmlContent = StibeeClient.generateEmailHtml({
    title: newsletter.title,
    letterBody: newsletter.letter_body,
    curatorNote: newsletter.curator_note,
    newsItems,
    unsubscribeUrl
  })

  try {
    const result = await client.createAndSendEmail({
      subject: `[그만의 아침편지] ${newsletter.title}`,
      content: htmlContent,
      previewText: newsletter.curator_note || '오늘의 아침편지가 도착했습니다.'
    })

    return {
      success: result.success,
      emailId: result.emailId || undefined,
      error: result.success ? undefined : 'Failed to send email'
    }
  } catch (error) {
    console.error('[Stibee] sendNewsletterViaStibee error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export default StibeeClient
