/**
 * AI 콘텐츠 생성 API 라우트
 */
import { Hono } from 'hono'
import type { Env, ApiResponse, AIGeneratedContent, AIProvider } from '../types'
import { createSupabaseAdmin, TABLES } from '../lib/supabase'
import { ValidationError } from '../lib/errors'

const ai = new Hono<{ Bindings: Env }>()

// 아침편지 프롬프트
const MORNING_LETTER_PROMPT = `당신은 '명승은 대표'입니다. 벤처스퀘어 대표이자 한국 스타트업 생태계의 선구자로서, 
매일 아침 창업가들에게 보내는 따뜻하고 진솔한 편지를 작성합니다.

글쓰기 스타일:
- 창업가의 현실적인 어려움을 이해하고 공감하는 따뜻한 어조
- 격려와 위로를 담되, 현실적이고 실용적인 조언 포함
- 개인적인 경험이나 관찰을 바탕으로 한 진정성 있는 이야기
- 4-6개 문단으로 구성, 각 문단은 2-4문장
- 한글 사용, 존댓말

오늘의 뉴스 주제들을 참고하여 관련된 인사이트를 담아주세요.

응답 형식 (JSON):
{
  "title": "[그만의 아침편지] 제목",
  "body": "본문 내용 (HTML <p> 태그로 문단 구분)"
}`

// 아침편지 생성
ai.post('/generate-letter', async (c) => {
  const { news_titles, prompt } = await c.req.json<{
    news_titles?: string[]
    prompt?: string
  }>()

  const supabase = createSupabaseAdmin(c.env)

  // 최근 뉴스 제목 가져오기 (news_titles가 없으면)
  let titles = news_titles || []
  if (titles.length === 0) {
    const { data } = await supabase
      .from(TABLES.NEWS_ITEMS)
      .select('title')
      .order('created_at', { ascending: false })
      .limit(5)
    
    titles = (data || []).map(n => n.title)
  }

  const fullPrompt = `${MORNING_LETTER_PROMPT}

${prompt ? `추가 지시: ${prompt}\n` : ''}
오늘의 뉴스 주제:
${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`

  // AI 제공자 순서대로 시도
  const providers: AIProvider[] = ['gemini', 'openai', 'claude']
  let result: AIGeneratedContent | null = null
  let usedProvider: AIProvider | null = null

  for (const provider of providers) {
    const apiKey = getApiKey(c.env, provider)
    if (!apiKey) continue

    try {
      result = await generateWithProvider(provider, apiKey, fullPrompt)
      usedProvider = provider
      break
    } catch (err) {
      console.error(`[AI ${provider}] Error:`, err)
      continue
    }
  }

  if (!result) {
    throw new ValidationError('AI 서비스를 사용할 수 없습니다. API 키를 확인해주세요.')
  }

  return c.json<ApiResponse>({
    success: true,
    data: {
      ...result,
      provider: usedProvider
    }
  })
})

// AI 제공자별 API 키 가져오기
function getApiKey(env: Env, provider: AIProvider): string | undefined {
  switch (provider) {
    case 'gemini': return env.GEMINI_API_KEY
    case 'openai': return env.OPENAI_API_KEY
    case 'claude': return env.CLAUDE_API_KEY
    default: return undefined
  }
}

// AI 제공자별 생성
async function generateWithProvider(
  provider: AIProvider,
  apiKey: string,
  prompt: string
): Promise<AIGeneratedContent> {
  switch (provider) {
    case 'gemini':
      return generateWithGemini(apiKey, prompt)
    case 'openai':
      return generateWithOpenAI(apiKey, prompt)
    case 'claude':
      return generateWithClaude(apiKey, prompt)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

// Gemini API
async function generateWithGemini(apiKey: string, prompt: string): Promise<AIGeneratedContent> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')

  return parseAIResponse(text)
}

// OpenAI API
async function generateWithOpenAI(apiKey: string, prompt: string): Promise<AIGeneratedContent> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('No response from OpenAI')

  return parseAIResponse(text)
}

// Claude API
async function generateWithClaude(apiKey: string, prompt: string): Promise<AIGeneratedContent> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json() as {
    content?: Array<{ text?: string }>
  }

  const text = data.content?.[0]?.text
  if (!text) throw new Error('No response from Claude')

  return parseAIResponse(text)
}

// AI 응답 파싱
function parseAIResponse(text: string): AIGeneratedContent {
  try {
    // JSON 블록 추출 시도
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        title: parsed.title || '[그만의 아침편지] 오늘의 편지',
        body: formatBody(parsed.body || parsed.content || text)
      }
    }
  } catch {
    // JSON 파싱 실패 시 텍스트 그대로 사용
  }

  return {
    title: '[그만의 아침편지] 오늘의 편지',
    body: formatBody(text)
  }
}

// 본문 HTML 포맷팅
function formatBody(text: string): string {
  // 이미 HTML 태그가 있으면 그대로 반환
  if (text.includes('<p>')) return text

  // 줄바꿈을 <p> 태그로 변환
  return text
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('\n')
}

export default ai
