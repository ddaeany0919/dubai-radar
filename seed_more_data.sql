
-- Seed more stores in Gangnam and Hongdae areas
INSERT INTO stores (name, address, lat, lng, is_open) VALUES
('강남 초코하우스', '서울특별시 강남구 테헤란로 123', 37.4979, 127.0276, true),
('홍대 쿠키팩토리', '서울특별시 마포구 어울마당로 45', 37.5512, 126.9227, true),
('신사 디저트랩', '서울특별시 강남구 도산대로 13길 10', 37.5219, 127.0228, true),
('연남동 초코빌리지', '서울특별시 마포구 동교로 242', 37.5612, 126.9245, true),
('역삼 스위트홈', '서울특별시 강남구 논현로 85길 5', 37.5006, 127.0365, true);

-- Add products for these stores with varying stock levels to test dynamic markers
INSERT INTO products (store_id, status, stock_count, price, last_check_time)
SELECT id, 'AVAILABLE', 120, 15000, now() FROM stores WHERE name = '강남 초코하우스';

INSERT INTO products (store_id, status, stock_count, price, last_check_time)
SELECT id, 'AVAILABLE', 35, 12000, now() FROM stores WHERE name = '홍대 쿠키팩토리';

INSERT INTO products (store_id, status, stock_count, price, last_check_time)
SELECT id, 'AVAILABLE', 8, 18000, now() FROM stores WHERE name = '신사 디저트랩';

INSERT INTO products (store_id, status, stock_count, price, last_check_time)
SELECT id, 'SOLD_OUT', 0, 14000, now() FROM stores WHERE name = '연남동 초코빌리지';

INSERT INTO products (store_id, status, stock_count, price, last_check_time)
SELECT id, 'AVAILABLE', 65, 13000, now() FROM stores WHERE name = '역삼 스위트홈';
