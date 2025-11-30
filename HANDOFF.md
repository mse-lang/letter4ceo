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

## 🌐 배포 정보

### 프로덕션 URL
- **Frontend**: https://letter4ceo.vercel.app (공식 도메인: https://letter4ceo.com)
- **Backend API**: https://backend.mse-fe7.workers.dev
- **GitHub**: https://github.com/mse-lang/letter4ceo

### API 상태 확인
```bash
# Health Check
curl https://backend.mse-fe7.workers.dev/

# 뉴스레터 목록
curl https://backend.mse-fe7.workers.dev/api/newsletters

# 구독자 통계
curl https://backend.mse-fe7.workers.dev/api/subscribers/stats

# Stibee 연동 상태
curl https://backend.mse-fe7.workers.dev/api/newsletters/stibee/status
```

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
│        https://backend.mse-fe7.workers.dev                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Newsletter│ │   News   │ │Subscriber│ │    AI    │       │
│  │   API    │ │   API    │ │   API    │ │   API    │       │
│  └────┬─────┘ └──────────┘ └────┬─────┘ └──────────┘       │
│       │                         │                            │
│       └─────────────────────────┼───► Stibee API             │
└─────────────────────────┬───────┴───────────────────────────┘
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
│   │   ├── routes/             # API 라우트 (~1,700줄)
│   │   │   ├── newsletters.ts  # 뉴스레터 CRUD + Stibee 발송 (~400줄)
│   │   │   ├── news.ts         # 뉴스 관리 (325줄)
│   │   │   ├── subscribers.ts  # 구독자 관리 + Stibee 동기화 (~400줄)
│   │   │   ├── ai.ts           # AI 기능 (245줄)
│   │   │   └── upload.ts       # 이미지 업로드 (118줄)
│   │   ├── lib/                # 유틸리티 (~600줄)
│   │   │   ├── errors.ts       # 에러 처리 (128줄)
│   │   │   ├── stibee.ts       # Stibee 클라이언트 (~400줄) ✅ NEW
│   │   │   └── supabase.ts     # DB 클라이언트 (32줄)
│   │   └── types/
│   │       └── index.ts        # 타입 정의 (~220줄)
│   ├── wrangler.toml           # Cloudflare 설정
│   ├── .dev.vars               # 개발 환경변수
│   ├── supabase-schema.sql     # DB 스키마
│   └── package.json
│
├── frontend/                    # Next.js 16 (Vercel)
│   ├── src/
│   │   ├── app/                # App Router
│   │   │   ├── page.tsx        # 메인 페이지 (148줄)
│   │   │   ├── layout.tsx      # 레이아웃 (39줄)
│   │   │   ├── archive/        # 아카이브 페이지 ✅ NEW
│   │   │   ├── letter/[id]/    # 편지 상세 ✅ NEW
│   │   │   ├── unsubscribe/    # 구독 취소 ✅ NEW
│   │   │   ├── terms/          # 이용약관 ✅ NEW
│   │   │   ├── privacy/        # 개인정보처리방침 ✅ NEW
│   │   │   ├── admin/          # 관리자 대시보드 ✅ NEW
│   │   │   │   ├── page.tsx    # 대시보드
│   │   │   │   ├── subscribers/# 구독자 관리
│   │   │   │   └── editor/[id]/# 뉴스레터 에디터
│   │   │   └── ...
│   │   ├── components/         # UI 컴포넌트
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
- **Backend**: 약 2,150줄 (TypeScript)
- **Frontend**: 약 2,200줄 (TypeScript/React) 
- **총계**: 약 4,350줄

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
  stibee_synced BOOLEAN DEFAULT FALSE,  -- Stibee 동기화 여부
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  privacy_agreed BOOLEAN DEFAULT FALSE,
  privacy_agreed_at TIMESTAMPTZ,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

---

## 🔌 API 엔드포인트

### Base URL
- **개발**: `http://localhost:8787/api`
- **프로덕션**: `https://backend.mse-fe7.workers.dev/api`

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
| POST | `/newsletters/:id/send` | Stibee로 발송 | ✅ 완료 |
| POST | `/newsletters/:id/send-test` | 테스트 발송 | ✅ 완료 |
| GET | `/newsletters/:id/preview` | HTML 미리보기 | ✅ 완료 |
| GET | `/newsletters/stibee/status` | Stibee 설정 상태 | ✅ 완료 |
| GET | `/newsletters/stats/summary` | 통계 | ✅ 완료 |

### Subscribers API

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| GET | `/subscribers` | 목록 조회 | ✅ 완료 |
| POST | `/subscribers` | 구독 등록 (+ Stibee 동기화) | ✅ 완료 |
| DELETE | `/subscribers/:id` | 삭제 (+ Stibee 동기화) | ✅ 완료 |
| POST | `/subscribers/unsubscribe` | 구독 취소 (+ Stibee 동기화) | ✅ 완료 |
| POST | `/subscribers/sync-stibee` | 전체 Stibee 동기화 | ✅ 완료 |
| POST | `/subscribers/import-stibee` | Stibee에서 import | ✅ 완료 |
| GET | `/subscribers/stats` | 통계 | ✅ 완료 |
| GET | `/subscribers/export` | CSV 내보내기 | ✅ 완료 |

### News API / AI API / Upload API
(기존과 동일)

---

## 🔐 환경 변수

### Backend Secrets (Cloudflare)
```bash
# 설정된 9개 Secrets
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
R2_PUBLIC_URL
STIBEE_API_KEY
STIBEE_LIST_ID
STIBEE_SENDER_EMAIL
GEMINI_API_KEY
OPENAI_API_KEY
```

### Frontend (.env.local)
```bash
# API
NEXT_PUBLIC_API_URL=https://backend.mse-fe7.workers.dev

# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=https://kvbksqlpwrypspojehlb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 🚀 완료된 기능

### ✅ 핵심 기능
1. **뉴스레터 관리**
   - CRUD 완료
   - 예약 발송 설정/취소
   - 상태 관리 (draft/scheduled/sent)
   - **Stibee API 발송** ✅ NEW
   - **테스트 발송** ✅ NEW
   - **HTML 미리보기** ✅ NEW

2. **뉴스 관리**
   - CRUD 완료
   - AI 요약 생성 (Gemini/GPT-4o-mini)
   - 카테고리별 분류
   - 뉴스레터 연결

3. **구독자 관리**
   - CRUD 완료
   - 구독/구독 취소
   - **Stibee 자동 동기화** ✅ NEW
   - **Stibee에서 import** ✅ NEW
   - CSV 내보내기

4. **프론트엔드 페이지**
   - `/` - 메인 페이지
   - `/archive` - 아카이브 ✅ NEW
   - `/letter/[id]` - 편지 상세 ✅ NEW
   - `/unsubscribe` - 구독 취소 ✅ NEW
   - `/terms` - 이용약관 ✅ NEW
   - `/privacy` - 개인정보처리방침 ✅ NEW
   - `/admin` - 관리자 대시보드 ✅ NEW
   - `/admin/subscribers` - 구독자 관리 ✅ NEW
   - `/admin/editor/[id]` - 뉴스레터 에디터 ✅ NEW

5. **Stibee 연동** ✅ NEW
   - 구독자 추가/삭제 동기화
   - 뉴스레터 발송
   - 테스트 발송
   - 상태 확인

---

## 🔧 미완료/개선 필요 사항

### ✅ 완료된 중간 우선순위 기능
1. **관리자 인증 강화** ✅ 완료
   - Supabase Auth 기반 로그인
   - 허용된 이메일만 접근 가능 (mse@venturesquare.net, letter4ceo@letter4ceo.com)
   - 보호된 라우트 적용 (/admin/*)

2. **RSS 뉴스 자동 수집** ✅ 완료
   - Cron 트리거 설정 (KST 06:00 수집)
   - 벤처스퀘어, 플래텀 RSS 피드 파싱

3. **WYSIWYG 에디터** ✅ 완료
   - TipTap v3 통합
   - 풀 툴바 (텍스트 스타일, 헤딩, 리스트, 정렬, 링크/이미지, 형광펜, 색상)
   - 에디터/HTML 탭 전환
   - 테스트 발송 버튼

### 🟡 Medium Priority
1. **Stibee AUTO_EMAIL_URL 설정**
   - 테스트 발송 활성화용

### 🟢 Low Priority
1. 이미지 최적화 (WebP 변환)
2. 분석 대시보드
3. Stibee Webhook 수신

---

## 📊 외부 서비스 정보

### Supabase
- **Project ID**: `kvbksqlpwrypspojehlb`
- **URL**: `https://kvbksqlpwrypspojehlb.supabase.co`
- **Region**: Northeast Asia (Seoul)

### Stibee
- **List ID**: `449567`
- **Sender**: `letter4ceo@letter4ceo.com`
- **API Base**: `https://api.stibee.com/v1`

### Cloudflare
- **Worker**: `backend` @ `backend.mse-fe7.workers.dev`
- **R2 Public URL**: `https://pub-64497d68ae64444487a0ced1964ebe68.r2.dev`
- **Cron 트리거**: 
  - `0 21 * * *` - RSS 수집 (KST 06:00)
  - `0 22 * * *` - 예약 발송 (KST 07:00)
  - `0 * * * *` - 시간별 백업 체크

---

## 💡 새 AI에게 요청할 때 예시 프롬프트

```
저는 "그만의 아침편지" v2 프로젝트를 이어서 개발하고 싶습니다.

현재 상태:
- Backend: Hono + Cloudflare Workers + Supabase (약 2,150줄)
- Frontend: Next.js 16 + Tailwind CSS (약 2,200줄)
- 위치: /home/user/morning-letter-v2/

배포됨:
- Backend: https://backend.mse-fe7.workers.dev
- GitHub: https://github.com/mse-lang/letter4ceo

완료된 것:
- API (newsletters, news, subscribers, ai, upload)
- Stibee 연동 (구독자 동기화, 뉴스레터 발송)
- 프론트엔드 전체 페이지 (메인, 아카이브, 상세, 관리자)

요청 사항:
1. [구체적인 기능] 구현해주세요
2. HANDOFF.md 문서를 참고해주세요

환경 변수와 외부 서비스 연동은 이미 완료되어 있습니다.
```

---

## 📞 연락처

- **프로젝트 오너**: 명승은 대표 (mse@venturesquare.net)
- **벤처스퀘어**: https://venturesquare.net
- **이전 버전**: /home/user/webapp/

---

*마지막 업데이트: 2025-11-30*
*배포 완료: Backend (Cloudflare Workers) + Frontend (Vercel)*
*상태: ✅ 운영 중 (Production Live)*
