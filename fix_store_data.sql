-- 가게 이름 및 주소 수정
-- 크롤러가 '쿠폰', '예약', '배달' 같은 뱃지 텍스트까지 이름으로 가져온 것을 수정합니다.

UPDATE stores 
SET name = '카타리나 베이커리',
    address = '경기 성남시 분당구 느티로69번길 15 1층 102호'
WHERE name LIKE '%카타리나%';

UPDATE stores 
SET name = '디저트테이블',
    address = '경기 성남시 분당구 정자동 17-1 젤존타워 105호'
WHERE name LIKE '%디저트테이블%';
