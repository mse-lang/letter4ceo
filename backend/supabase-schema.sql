-- =============================================
-- 그만의 아침편지 v2 - Supabase 데이터베이스 스키마
-- =============================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. newsletters (뉴스레터)
-- =============================================
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  published_date DATE,
  title TEXT NOT NULL,
  letter_body TEXT,
  curator_note TEXT,
  stibee_campaign_id TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled')),
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_published_date ON newsletters(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_newsletters_scheduled_at ON newsletters(scheduled_at);

-- =============================================
-- 2. news_items (뉴스 아이템)
-- =============================================
CREATE TABLE IF NOT EXISTS news_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  title TEXT NOT NULL,
  original_summary TEXT,
  ai_summary TEXT,
  thumbnail_url TEXT,
  category TEXT DEFAULT '뉴스',
  published_at TIMESTAMPTZ,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE SET NULL,
  is_selected BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- URL + 카테고리 조합 유니크 (같은 뉴스도 다른 카테고리면 별도 저장)
  UNIQUE(source_url, category)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_news_items_newsletter ON news_items(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_news_items_category ON news_items(category);
CREATE INDEX IF NOT EXISTS idx_news_items_created ON news_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_selected ON news_items(is_selected) WHERE is_selected = TRUE;

-- =============================================
-- 3. subscribers (구독자)
-- =============================================
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  stibee_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  privacy_agreed BOOLEAN DEFAULT FALSE,
  privacy_agreed_at TIMESTAMPTZ,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_subscribed ON subscribers(subscribed_at DESC);

-- =============================================
-- 4. 트리거: updated_at 자동 갱신
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER newsletters_updated_at
  BEFORE UPDATE ON newsletters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 5. Row Level Security (RLS) 정책
-- =============================================

-- newsletters: 인증된 사용자만 수정 가능
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read newsletters" ON newsletters
  FOR SELECT USING (status = 'sent');

CREATE POLICY "Authenticated manage newsletters" ON newsletters
  FOR ALL USING (auth.role() = 'authenticated');

-- news_items: 인증된 사용자만 수정 가능
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read news_items" ON news_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated manage news_items" ON news_items
  FOR ALL USING (auth.role() = 'authenticated');

-- subscribers: Service role만 접근 가능
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manage subscribers" ON subscribers
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 6. 뷰: 대시보드 통계
-- =============================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM newsletters) AS total_newsletters,
  (SELECT COUNT(*) FROM newsletters WHERE status = 'draft') AS draft_newsletters,
  (SELECT COUNT(*) FROM newsletters WHERE status = 'sent') AS sent_newsletters,
  (SELECT COUNT(*) FROM newsletters WHERE status = 'scheduled') AS scheduled_newsletters,
  (SELECT COUNT(*) FROM subscribers) AS total_subscribers,
  (SELECT COUNT(*) FROM subscribers WHERE status = 'active') AS active_subscribers,
  (SELECT COUNT(*) FROM news_items) AS total_news;

-- =============================================
-- 7. 함수: 예약 발송 체크
-- =============================================
CREATE OR REPLACE FUNCTION get_pending_scheduled_newsletters()
RETURNS SETOF newsletters AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM newsletters
  WHERE status = 'scheduled'
    AND scheduled_at <= NOW()
  ORDER BY scheduled_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
