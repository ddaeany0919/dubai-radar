-- Update addresses for specific stores
UPDATE stores 
SET address = '경기 성남시 분당구 느티로69번길 15 1층 102호' 
WHERE name = '카타리나 쿠폰 베이커리' OR name LIKE '%카타리나%';

UPDATE stores 
SET address = '경기 성남시 분당구 정자동 17-1 젤존타워 105호' 
WHERE name = '디저트테이블 예약 배달 카페' OR name LIKE '%디저트테이블%';
