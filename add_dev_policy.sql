-- RLS 정책 업데이트 (개발 모드 지원)

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Allow dev mode inserts" ON store_posts;

-- 개발 모드용 정책 (더미 UUID 허용)
CREATE POLICY "Allow dev mode inserts"
    ON store_posts FOR INSERT
    WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001');
