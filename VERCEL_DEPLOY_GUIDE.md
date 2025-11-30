# Vercel 배포 가이드 - 그만의 아침편지 v2 프론트엔드

## 🚀 빠른 배포 (GitHub 연동)

### 1단계: Vercel 대시보드에서 프로젝트 생성
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. **"Add New..."** → **"Project"** 클릭
3. **"Import Git Repository"** 선택
4. GitHub에서 `mse-lang/letter4ceo` 선택
5. **Configure Project** 설정:
   - **Framework Preset**: `Next.js` (자동 감지됨)
   - **Root Directory**: `frontend` ← ⚠️ 중요!
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)

### 2단계: 환경변수 설정
**Environment Variables** 섹션에서 다음 변수 추가:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://backend.mse-fe7.workers.dev` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kvbksqlpwrypspojehlb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2YmtzcWxwd3J5cHNwb2plaGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzAwMjIsImV4cCI6MjA4MDAwNjAyMn0.ayYILrX-y7FvAxEwZH58Suym1RqmNlAeP25d-MnlL-Q` |

### 3단계: 배포
1. **"Deploy"** 버튼 클릭
2. 빌드 완료 대기 (약 1-2분)
3. 배포된 URL 확인: `https://letter4ceo.vercel.app` 또는 자동 생성된 URL

---

## 🔧 배포 후 설정

### 커스텀 도메인 연결 (선택사항)
1. Project Settings → Domains
2. `morning-letter.vercel.app` 또는 커스텀 도메인 추가

### 백엔드 CORS 업데이트
프론트엔드 URL이 확정되면 백엔드의 CORS 설정 업데이트:
```bash
# Cloudflare Workers 환경변수 업데이트
cd backend
npx wrangler secret put CORS_ORIGIN
# 입력: https://your-frontend-url.vercel.app
```

---

## 📋 배포 체크리스트

- [ ] GitHub 저장소 연결: `mse-lang/letter4ceo`
- [ ] Root Directory: `frontend`
- [ ] 환경변수 3개 설정
- [ ] 빌드 성공 확인
- [ ] 메인 페이지 접속 테스트
- [ ] API 연동 테스트 (/api/newsletters)
- [ ] 관리자 로그인 테스트 (/admin/login)

---

## 🔗 관련 URL

- **GitHub**: https://github.com/mse-lang/letter4ceo
- **Backend API**: https://backend.mse-fe7.workers.dev
- **Supabase**: https://supabase.com/dashboard/project/kvbksqlpwrypspojehlb
- **Cloudflare**: https://dash.cloudflare.com

---

## ⚠️ 주의사항

1. **Root Directory 설정 필수**: 모노레포 구조이므로 `frontend` 폴더를 Root로 지정해야 합니다.
2. **환경변수 필수**: 3개의 `NEXT_PUBLIC_*` 환경변수가 모두 설정되어야 API 연동이 작동합니다.
3. **CORS 설정**: 배포 후 백엔드 CORS_ORIGIN을 프론트엔드 URL로 업데이트하세요.

---

*Last Updated: 2025-11-30*
