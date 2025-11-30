/**
 * 이미지 업로드 API 라우트
 * Cloudflare R2 연동
 */
import { Hono } from 'hono'
import type { Env, ApiResponse } from '../types'
import { ValidationError, validateRequired } from '../lib/errors'

const upload = new Hono<{ Bindings: Env }>()

// 이미지 업로드
upload.post('/image', async (c) => {
  const { image, name } = await c.req.json<{ image: string; name?: string }>()
  
  validateRequired(image, '이미지 데이터')
  
  const r2 = c.env.R2
  const r2PublicUrl = c.env.R2_PUBLIC_URL
  
  if (!r2) {
    throw new ValidationError('R2 스토리지가 설정되지 않았습니다.')
  }
  
  // Base64 데이터 추출
  let base64Data = image
  let mimeType = 'image/png'
  
  if (image.includes(',')) {
    const parts = image.split(',')
    const mimeMatch = parts[0].match(/data:([^;]+);/)
    if (mimeMatch) mimeType = mimeMatch[1]
    base64Data = parts[1]
  }
  
  // Base64 디코딩
  let bytes: Uint8Array
  try {
    const binaryString = atob(base64Data)
    bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
  } catch {
    throw new ValidationError('Base64 디코딩에 실패했습니다.')
  }
  
  // 파일 크기 검증 (10MB)
  if (bytes.length > 10 * 1024 * 1024) {
    throw new ValidationError('이미지 크기는 10MB 이하여야 합니다.')
  }
  
  // 파일명 생성
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const timestamp = now.getTime()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const fileName = name 
    ? `${yearMonth}/${name.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')}-${randomStr}.${ext}`
    : `${yearMonth}/${timestamp}-${randomStr}.${ext}`
  
  // R2 업로드
  await r2.put(fileName, bytes, {
    httpMetadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000'
    }
  })
  
  const imageUrl = `${r2PublicUrl}/${fileName}`
  
  return c.json<ApiResponse>({
    success: true,
    data: {
      url: imageUrl,
      key: fileName,
      size: bytes.length,
      mimeType
    }
  })
})

// 이미지 삭제
upload.delete('/image', async (c) => {
  const { key } = await c.req.json<{ key: string }>()
  
  validateRequired(key, '이미지 키')
  
  await c.env.R2.delete(key)
  
  return c.json<ApiResponse>({
    success: true,
    message: '이미지가 삭제되었습니다.'
  })
})

// 이미지 메타데이터 조회
upload.get('/image/:key', async (c) => {
  const key = c.req.param('key')
  
  const object = await c.env.R2.head(key)
  if (!object) {
    throw new ValidationError('이미지를 찾을 수 없습니다.')
  }
  
  return c.json<ApiResponse>({
    success: true,
    data: {
      key,
      url: `${c.env.R2_PUBLIC_URL}/${key}`,
      size: object.size,
      contentType: object.httpMetadata?.contentType,
      uploaded: object.uploaded
    }
  })
})

export default upload
