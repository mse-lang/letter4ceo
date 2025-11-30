# 그만의 아침편지 v2 - Backend Renewal Handoff Document

> 이 문서는 다른 AI나 개발자가 백엔드를 새로 구현할 때 필요한 모든 정보를 담고 있습니다.

## 📋 프로젝트 개요

**프로젝트명**: 그만의 아침편지 (Startup Morning Letter)  
**설명**: 스타트업 창업가를 위한 일일 뉴스레터 플랫폼  
**대상 사용자**: 스타트업 창업자, 예비 창업자, 투자자

### 핵심 가치
- 매일 아침 창업가에게 위로와 영감을 주는 편지
- 스타트업 관련 최신 뉴스 큐레이션
- AI 기반 콘텐츠 생성 지원

---

## 🏗️ 현재 아키텍처 (v2)

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    (Next.js 14 + Vercel)                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │
│  │  메인   │ │ 아카이브 │ │  편지   │ │  관리자 대시보드  │   │
│  │ 페이지  │ │  페이지  │ │ 상세    │ │  + 에디터        │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ API Calls (fetch/axios)
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

---

## 📁 프로젝트 구조

```
morning-letter-v2/
├── backend/                     # Hono API (Cloudflare Workers)
│   ├── src/
│   │   ├── index.ts            # 메인 앱 (114줄)
│   │   ├── routes/             # API 라우트 (1,288줄)
│   │   │   ├── newsletters.ts  # 뉴스레터 CRUD (303줄)
│   │   │   ├── news.ts         # 뉴스 관리 (325줄)
│   │   │   ├── subscribers.ts  # 구독자 관리 (297줄)
│   │   │   ├── ai.ts           # AI 기능 (245줄)
│   │   │   └── upload.ts       # 이미지 업로드 (118줄)
│   │   ├── lib/                # 유틸리티 (160줄)
│   │   │   ├── errors.ts       # 에러 처리 (128줄)
│   │   │   └── supabase.ts     # DB 클라이언트 (32줄)
│   │   └── types/
│   │       └── index.ts        # 타입 정의 (188줄)
│   ├── wrangler.toml           # Cloudflare 설정
│   ├── wrangler.jsonc          # Cloudflare 설정 (주석 지원)
│   ├── supabase-schema.sql     # DB 스키마
│   └── package.json
│
├── frontend/                    # Next.js 14 (Vercel)
│   ├── src/
│   │   ├── app/                # App Router
│   │   │   ├── page.tsx        # 메인 페이지 (148줄)
│   │   │   └── layout.tsx      # 레이아웃 (39줄)
│   │   ├── components/         # UI 컴포넌트
│   │   │   ├── Providers.tsx   # React Query (24줄)
│   │   │   ├── SubscribeForm.tsx   # 구독 폼 (97줄)
│   │   │   └── NewsletterCard.tsx  # 카드 (49줄)
│   │   ├── lib/
│   │   │   ├── api.ts          # API 클라이언트 (132줄)
│   │   │   └── supabase.ts     # Supabase 클라이언트 (11줄)
│   │   └── types/
│   │       └── index.ts        # 타입 정의 (62줄)
│   ├── .env.local              # 환경 변수
│   └── package.json
│
├── HANDOFF.md                   # 이 문서
└── README.md
```

### 총 코드 현황
- **Backend**: 약 1,750줄 (TypeScript)
- **Frontend**: 약 560줄 (TypeScript/React)
- **총계**: 약 2,310줄

---

## 🗃️ 데이터베이스 스키마

### Supabase (PostgreSQL)

```sql
-- 1. newsletters (뉴스레터)
CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  published_date DATE,
  title TEXT NOT NULL,
  letter_body TEXT,           -- HTML 본문
  curator_note TEXT,          -- 큐레이터 노트
  stibee_campaign_id TEXT,    -- Stibee 캠페인 ID
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled')),
  scheduled_at TIMESTAMPTZ,   -- 예약 발송 시간
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. news_items (뉴스 아이템)
CREATE TABLE news_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  title TEXT NOT NULL,
  original_summary TEXT,      -- 원본 요약
  ai_summary TEXT,            -- AI 생성 요약
  thumbnail_url TEXT,
  category TEXT DEFAULT '뉴스',
  published_at TIMESTAMPTZ,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE SET NULL,
  is_selected BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_url, category)
);

-- 3. subscribers (구독자)
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  stibee_id TEXT,             -- Stibee 구독자 ID
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  privacy_agreed BOOLEAN DEFAULT FALSE,
  privacy_agreed_at TIMESTAMPTZ,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

### 인덱스
```sql
-- newsletters
CREATE INDEX idx_newsletters_status ON newsletters(status);
CREATE INDEX idx_newsletters_published_date ON newsletters(published_date DESC);
CREATE INDEX idx_newsletters_scheduled_at ON newsletters(scheduled_at);

-- news_items
CREATE INDEX idx_news_items_newsletter ON news_items(newsletter_id);
CREATE INDEX idx_news_items_category ON news_items(category);
CREATE INDEX idx_news_items_created ON news_items(created_at DESC);
CREATE INDEX idx_news_items_selected ON news_items(is_selected) WHERE is_selected = TRUE;

-- subscribers
CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_status ON subscribers(status);
```

### Row Level Security (RLS)
```sql
-- newsletters: 발송된 뉴스레터만 공개 읽기 가능
CREATE POLICY "Public read newsletters" ON newsletters
  FOR SELECT USING (status = 'sent');

-- news_items: 모두 읽기 가능
CREATE POLICY "Public read news_items" ON news_items
  FOR SELECT USING (true);

-- subscribers: service_role만 접근 가능
CREATE POLICY "Service role manage subscribers" ON subscribers
  FOR ALL USING (auth.role() = 'service_role');
```

---

## 🔌 API 엔드포인트

### Base URL
- **개발**: `http://localhost:8787/api`
- **프로덕션**: `https://{project-name}.workers.dev/api`

### Newsletters API

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| GET | `/newsletters` | 목록 조회 (페이지네이션) | ✅ 완료 |
| GET | `/newsletters/:id` | 단일 조회 | ✅ 완료 |
| POST | `/newsletters` | 생성 | ✅ 완료 |
| PUT | `/newsletters/:id` | 수정 | ✅ 완료 |
| DELETE | `/newsletters/:id` | 삭제 | ✅ 완료 |
| POST | `/newsletters/:id/schedule` | 예약 발송 설정 | ✅ 완료 |
| POST | `/newsletters/:id/cancel-schedule` | 예약 취소 | ✅ 완료 |
| POST | `/newsletters/:id/send` | 즉시 발송 | ⚠️ 기본 구조만 |
| GET | `/newsletters/stats/summary` | 통계 | ✅ 완료 |

### News API

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| GET | `/news` | 목록 조회 | ✅ 완료 |
| GET | `/news/:id` | 단일 조회 | ✅ 완료 |
| POST | `/news` | 생성 | ✅ 완료 |
| PUT | `/news/:id` | 수정 | ✅ 완료 |
| DELETE | `/news/:id` | 삭제 | ✅ 완료 |
| POST | `/news/collect` | RSS 수집 | 🔄 구현 필요 |
| POST | `/news/:id/summarize` | AI 요약 | ✅ 완료 |
| POST | `/news/bulk-summarize` | 일괄 AI 요약 | ✅ 완료 |
| GET | `/news/categories` | 카테고리 목록 | ✅ 완료 |

### Subscribers API

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| GET | `/subscribers` | 목록 조회 | ✅ 완료 |
| GET | `/subscribers/:id` | 단일 조회 | ✅ 완료 |
| POST | `/subscribers` | 구독 등록 | ✅ 완료 |
| PUT | `/subscribers/:id` | 수정 | ✅ 완료 |
| DELETE | `/subscribers/:id` | 삭제 | ✅ 완료 |
| POST | `/subscribers/unsubscribe` | 구독 취소 | ✅ 완료 |
| POST | `/subscribers/sync-stibee` | Stibee 동기화 | 🔄 구현 필요 |
| GET | `/subscribers/stats` | 통계 | ✅ 완료 |

### AI API

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| POST | `/ai/generate-letter` | 아침편지 생성 | ✅ 완료 |
| POST | `/ai/summarize` | 뉴스 요약 | ✅ 완료 |
| POST | `/ai/generate-title` | 제목 생성 | ✅ 완료 |

### Upload API

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| POST | `/upload/image` | 이미지 업로드 | ✅ 완료 |
| DELETE | `/upload/image` | 이미지 삭제 | ✅ 완료 |
| POST | `/upload/optimize-url` | URL 최적화 | 🔄 구현 필요 |

---

## 🔐 환경 변수

### Backend (.dev.vars)
```bash
# Supabase
SUPABASE_URL=https://kvbksqlpwrypspojehlb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Stibee 이메일
STIBEE_API_KEY=your_api_key
STIBEE_LIST_ID=449567
STIBEE_SENDER_EMAIL=mse@venturesquare.net

# AI APIs
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key  # Optional

# Cloudflare R2
R2_PUBLIC_URL=https://pub-64497d68ae64444487a0ced1964ebe68.r2.dev

# Admin
ADMIN_EMAIL=mse@venturesquare.net
ADMIN_PASSWORD=your_password

# CORS
CORS_ORIGIN=https://morning-letter.vercel.app
```

### Frontend (.env.local)
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8787/api

# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=https://kvbksqlpwrypspojehlb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Analytics
NEXT_PUBLIC_GA_ID=G-ZBJW59RT7F
```

---

## 🚀 완료된 기능

### ✅ 핵심 기능
1. **뉴스레터 관리**
   - CRUD 완료
   - 예약 발송 설정/취소
   - 상태 관리 (draft/scheduled/sent)

2. **뉴스 관리**
   - CRUD 완료
   - AI 요약 생성 (Gemini/GPT-4o-mini)
   - 카테고리별 분류
   - 뉴스레터 연결

3. **구독자 관리**
   - CRUD 완료
   - 구독/구독 취소
   - 통계

4. **AI 콘텐츠**
   - 아침편지 자동 생성
   - 뉴스 AI 요약
   - 제목 생성

5. **이미지 업로드**
   - Base64 → R2 업로드
   - 이미지 삭제

6. **에러 처리**
   - 통합 에러 클래스
   - 표준화된 JSON 응답

### ⚠️ 부분 완료
1. **이메일 발송** - 구조만 있음, Stibee 실제 연동 필요
2. **RSS 뉴스 수집** - 구조만 있음, 실제 파싱 필요
3. **인증** - 기본 admin 인증만, OAuth 미구현

---

## 🔧 미완료/개선 필요 사항

### 🔴 High Priority
1. **Stibee 실제 연동**
   - 이메일 발송 API 호출
   - 구독자 동기화

2. **관리자 인증**
   - Supabase Auth 또는 자체 JWT
   - 보호된 라우트

3. **프론트엔드 페이지**
   - `/archive` - 아카이브 페이지
   - `/letter/[id]` - 편지 상세
   - `/admin` - 관리자 대시보드
   - `/admin/editor/[id]` - 에디터

### 🟡 Medium Priority
1. **RSS 뉴스 자동 수집**
   - Cron 트리거 설정
   - RSS 피드 파싱

2. **이미지 최적화**
   - WebP 변환
   - 리사이징

3. **Stibee 양방향 동기화**
   - Webhook 수신
   - 구독 상태 동기화

### 🟢 Low Priority
1. **분석 대시보드**
2. **A/B 테스트**
3. **다국어 지원**

---

## 📊 외부 서비스 정보

### Supabase
- **Project ID**: `kvbksqlpwrypspojehlb`
- **URL**: `https://kvbksqlpwrypspojehlb.supabase.co`
- **Region**: Northeast Asia (Seoul)
- **테이블**: newsletters, news_items, subscribers

### Stibee
- **List ID**: `449567`
- **Sender**: `mse@venturesquare.net`
- **API Docs**: https://help.stibee.com/api

### Cloudflare R2
- **Public URL**: `https://pub-64497d68ae64444487a0ced1964ebe68.r2.dev`
- **Bucket**: 기존 v1 bucket 공유

---

## 🔄 v1 → v2 마이그레이션 노트

### 변경된 점
| 항목 | v1 | v2 |
|------|----|----|
| 아키텍처 | 모놀리식 (Hono + JSX) | 분리 (Backend + Frontend) |
| 데이터베이스 | Cloudflare D1 (SQLite) | Supabase (PostgreSQL) |
| 프론트엔드 | Server-side JSX | Next.js 14 (React) |
| 인증 | 자체 해시 | Supabase Auth (예정) |
| 상태관리 | 없음 | React Query |
| 배포 | Cloudflare Pages | Workers + Vercel |

### 마이그레이션 필요 데이터
- newsletters 테이블 → 수동 마이그레이션 필요
- news_items 테이블 → 수동 마이그레이션 필요
- subscribers 테이블 → Stibee에서 import 권장

---

## 💡 새 AI에게 요청할 때 예시 프롬프트

```
저는 "그만의 아침편지" v2 프로젝트를 이어서 개발하고 싶습니다.

현재 상태:
- Backend: Hono + Cloudflare Workers + Supabase (약 1,750줄)
- Frontend: Next.js 14 + Tailwind CSS (약 560줄)
- 위치: /home/user/morning-letter-v2/

완료된 것:
- 기본 API 구조 (newsletters, news, subscribers, ai, upload)
- Supabase DB 스키마 및 연결
- 기본 프론트엔드 컴포넌트

요청 사항:
1. [구체적인 기능] 구현해주세요
2. HANDOFF.md 문서를 참고해주세요

환경 변수와 Supabase 정보는 이미 설정되어 있습니다.
```

---

## 📞 연락처

- **프로젝트 오너**: 명승은 대표 (mse@venturesquare.net)
- **벤처스퀘어**: https://venturesquare.net
- **이전 버전**: /home/user/webapp/

---

*마지막 업데이트: 2025-11-30*
