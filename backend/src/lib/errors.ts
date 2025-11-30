/**
 * 에러 처리 유틸리티
 */
import { Context } from 'hono'
import type { Env, ApiResponse } from '../types'

// 에러 코드
export const ErrorCode = {
  // 클라이언트 에러
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // 서버 에러
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  AI_ERROR: 'AI_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR'
} as const

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode]

// HTTP 상태 코드 매핑
const statusCodeMap: Record<ErrorCodeType, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  DATABASE_ERROR: 500,
  EXTERNAL_API_ERROR: 502,
  AI_ERROR: 500,
  EMAIL_ERROR: 500,
  UPLOAD_ERROR: 500
}

// 커스텀 에러 클래스
export class AppError extends Error {
  public readonly code: ErrorCodeType
  public readonly statusCode: number
  public readonly details?: Record<string, unknown>

  constructor(message: string, code: ErrorCodeType, details?: Record<string, unknown>) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCodeMap[code]
    this.details = details
  }
}

// 편의 에러 클래스
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION_ERROR, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}을(를) 찾을 수 없습니다.`, ErrorCode.NOT_FOUND)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다.') {
    super(message, ErrorCode.UNAUTHORIZED)
    this.name = 'UnauthorizedError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.DATABASE_ERROR, details)
    this.name = 'DatabaseError'
  }
}

export class ExternalApiError extends AppError {
  constructor(service: string, message: string) {
    super(`${service} API 오류: ${message}`, ErrorCode.EXTERNAL_API_ERROR, { service })
    this.name = 'ExternalApiError'
  }
}

// 유효성 검사 헬퍼
export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName}: 필수 항목입니다.`, { field: fieldName })
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('올바른 이메일 형식이 아닙니다.', { field: 'email' })
  }
}

// 에러 응답 생성
export function errorResponse(c: Context<{ Bindings: Env }>, error: unknown): Response {
  if (error instanceof AppError) {
    return c.json<ApiResponse>({
      success: false,
      error: error.message,
      code: error.code
    }, error.statusCode)
  }

  console.error('[Unhandled Error]', error)
  
  return c.json<ApiResponse>({
    success: false,
    error: '서버 오류가 발생했습니다.',
    code: ErrorCode.INTERNAL_ERROR
  }, 500)
}
