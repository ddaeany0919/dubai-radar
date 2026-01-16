-- [에러 해결] 외래 키 제약 조건 때문에 순서대로 삭제해야 합니다.

-- 1. 자식 테이블 데이터 먼저 삭제 (제보 내역, 상품 정보)
DELETE FROM user_reports;
DELETE FROM products;

-- 2. 부모 테이블 삭제 (가게 정보)
DELETE FROM stores;

-- 3. 진짜 맛집 데이터 입력
INSERT INTO stores (name, lat, lng, address, is_open) VALUES
('카타리나 베이커리', 37.3678, 127.1120, '경기 성남시 분당구 느티로69번길 15 1층 102호', true),
('디저트테이블', 37.3665, 127.1080, '경기 성남시 분당구 정자동 17-1 젤존타워 105호', true),
('랑데자뷰 서현점', 37.3850, 127.1230, '경기 성남시 분당구 황새울로360번길 28 3층', true),
('카페 보꾸', 37.3600, 127.1050, '경기 성남시 분당구 정자동 123-4', true),
('오구 (ohgu)', 37.3650, 127.1060, '경기 성남시 분당구 정자일로 123', true),
('달콩', 37.3680, 127.1100, '경기 성남시 분당구 정자동 45-6', true);

-- 4. 상품 정보 연결
INSERT INTO products (store_id, price, status, stock_count)
SELECT id, 0, 'UNKNOWN', 0 FROM stores;
