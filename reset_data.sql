-- [데이터 초기화] 모든 가게 데이터를 깨끗이 삭제합니다.
-- 외래 키 제약 조건을 고려하여 자식 테이블부터 삭제합니다.

DELETE FROM user_reports;
DELETE FROM products;
DELETE FROM stores;
