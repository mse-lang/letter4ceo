# 그만의 아침편지 v2

> 스타트업 창업가를 위한 일일 뉴스레터 플랫폼 (리뉴얼 버전)

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    (Next.js + Vercel)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │
│  │  메인   │ │ 아카이브 │ │  편지   │ │  관리자 대시보드  │   │
│  │ 페이지  │ │  페이지  │ │ 상세    │ │  + 에디터        │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ API Calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│                (Hono + Cloudflare Workers)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Newsletter│ │   News   │ │Subscriber│ │    AI    │       │
│  │   API    │ │   API    │ │   API    │ │   API    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase   │  │ Cloudflare   │  │   Stibee     │
│  (PostgreSQL │  │     R2       │  │  (이메일)    │
│   + Auth)    │  │  (이미지)    │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

## ✅ 완료된 기능

### Stibee 이메일 연동 (2025-11-30)
- **구독자 관리**
  - 신규 구독 시 자동 Stibee 동기화
  - 구독 취소 시 Stibee 연동
  - `/api/subscribers/sync-stibee` - 전체 구독자 일괄 동기화
  - `/api/subscribers/import-stibee` - Stibee에서 구독자 가져오기

- **뉴스레터 발송**
  - `POST /api/newsletters/:id/send` - Stibee API로 뉴스레터 발송
  - `POST /api/newsletters/:id/send-test` - 테스트 이메일 발송
  - `GET /api/newsletters/:id/preview` - 이메일 HTML 미리보기
  - `GET /api/newsletters/stibee/status` - Stibee 설정 상태 확인

- **이메일 템플릿**
  - 반응형 HTML 이메일 템플릿
  - 뉴스 아이템 포함 레이아웃
  - 큐레이터 노트 섹션
  - 구독 취소 링크

## 📁 프로젝트 구조

```
morning-letter-v2/
├── backend/                 # Hono API (Cloudflare Workers)
│   ├── src/
│   │   ├── index.ts        # 메인 앱
│   │   ├── routes/         # API 라우트
│   │   │   ├── newsletters.ts  # 뉴스레터 API + Stibee 발송
│   │   │   ├── subscribers.ts  # 구독자 API + Stibee 동기화
│   │   │   ├── news.ts         # 뉴스 API
│   │   │   ├── ai.ts           # AI 콘텐츠 생성
│   │   │   └── upload.ts       # 이미지 업로드
│   │   ├── lib/            # 유틸리티
│   │   │   ├── stibee.ts       # Stibee API 클라이언트 ✨
│   │   │   ├── supabase.ts     # Supabase 클라이언트
│   │   │   └── errors.ts       # 에러 처리
│   │   └── types/          # 타입 정의
│   ├── wrangler.toml
│   └── package.json
│
├── frontend/               # Next.js (Vercel)
│   ├── src/
│   │   ├── app/           # App Router
│   │   ├── components/    # UI 컴포넌트
│   │   └── lib/           # 유틸리티
│   └── package.json
│
├── HANDOFF.md              # 백엔드 리뉴얼 핸드오프 문서
└── README.md
```

## 🛠️ 기술 스택

### Backend
- **Framework**: Hono (TypeScript)
- **Runtime**: Cloudflare Workers
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2
- **Email**: Stibee API ✨
- **AI**: Gemini / OpenAI / Claude

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: React Query (TanStack Query)
- **Auth**: Supabase Auth
- **Deployment**: Vercel

## 🔐 환경 변수

### Backend (.dev.vars)
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Stibee ✨
STIBEE_API_KEY=your-api-key
STIBEE_LIST_ID=449567
STIBEE_SENDER_EMAIL=letter4ceo@letter4ceo.com
# STIBEE_AUTO_EMAIL_URL=https://stibee.com/api/v1.0/auto/YOUR_ID (선택)

# AI
GEMINI_API_KEY=your-key
OPENAI_API_KEY=your-key

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🚀 개발 시작

### Backend
```bash
cd backend
npm install
npm run dev
# http://localhost:8787
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

## 📡 API 엔드포인트

### 뉴스레터 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/newsletters` | 목록 조회 |
| GET | `/api/newsletters/:id` | 상세 조회 |
| POST | `/api/newsletters` | 생성 |
| PUT | `/api/newsletters/:id` | 수정 |
| DELETE | `/api/newsletters/:id` | 삭제 |
| POST | `/api/newsletters/:id/send` | **Stibee로 발송** ✨ |
| POST | `/api/newsletters/:id/send-test` | 테스트 발송 |
| GET | `/api/newsletters/:id/preview` | HTML 미리보기 |
| POST | `/api/newsletters/:id/schedule` | 예약 발송 |
| GET | `/api/newsletters/stibee/status` | Stibee 상태 확인 |

### 구독자 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/subscribers` | 목록 조회 |
| POST | `/api/subscribers/subscribe` | 구독 (+ Stibee 동기화) ✨ |
| POST | `/api/subscribers/unsubscribe` | 구독 취소 (+ Stibee) ✨ |
| POST | `/api/subscribers/sync-stibee` | **전체 Stibee 동기화** ✨ |
| POST | `/api/subscribers/import-stibee` | Stibee에서 가져오기 |
| GET | `/api/subscribers/stats` | 통계 |

### 뉴스 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/news` | 목록 조회 |
| POST | `/api/news` | 생성 |
| POST | `/api/news/:id/summarize` | AI 요약 |

### AI API
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/ai/generate-letter` | 아침편지 생성 |
| POST | `/api/ai/summarize` | 뉴스 요약 |

## 🔗 URLs

- **Supabase**: https://kvbksqlpwrypspojehlb.supabase.co
- **Stibee List ID**: 449567
- **Sender Email**: letter4ceo@letter4ceo.com

## 📋 다음 단계

1. [ ] 프론트엔드 추가 페이지 구현 (`/archive`, `/letter/[id]`, `/admin`)
2. [ ] Supabase Auth 연동
3. [ ] Cloudflare Workers 배포
4. [ ] Vercel 프론트엔드 배포
5. [ ] 자동 이메일 URL 설정 (STIBEE_AUTO_EMAIL_URL)

---

*마지막 업데이트: 2025-11-30*
