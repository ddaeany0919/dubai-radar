# 🍪 Cookie Stock Map (Thermal Hubble)

## 1. 프로젝트 개요 (Project Overview)
이 프로젝트는 사용자가 지도상에서 특정 상품(예: 두바이 초콜릿, 쿠키 등)의 **재고가 있는 가게를 실시간으로 확인**하고, 가게 사장님은 **간편하게 재고를 관리**할 수 있는 위치 기반 웹 서비스입니다.

## 2. 기술 스택 (Tech Stack)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand (`useStore`)
- **Database**: Supabase (PostgreSQL)
- **Map API**: Naver Maps API (Web Dynamic Map)
- **Styling**: Inline Styles (currently) & Tailwind CSS
- **Icons**: Lucide React

## 3. 핵심 기능 및 구현 현황 (Key Features & Implementation)

### 🗺️ 지도 및 마커 (Map & Markers)
- **구현 파일**: `src/components/RawNaverMap.tsx`, `src/components/MainMap.tsx`
- **내용**:
    - `react-naver-maps` 라이브러리 이슈로 인해 **Raw HTML/Script 방식**으로 네이버 지도를 직접 로드하여 구현.
    - **커스텀 마커**: 배경이 투명한 쿠키 캐릭터 이미지를 사용하여 시인성 확보.
    - **클러스터링/줌**: 기본 줌 레벨 및 위치 설정 완료.

### 🏪 가게 상세 및 재고 확인 (Store Detail & Stock)
- **구현 파일**: `src/components/StoreBottomSheet.tsx`
- **내용**:
    - 마커 클릭 시 하단에서 올라오는 **Bottom Sheet** 모달.
    - **재고 상태 표시**: "재고 있음(수량 포함)" / "품절" / "정보 없음".
    - **사용자 기능**: 즐겨찾기(Heart), 입고 알림 받기(Bell).

### 👑 사장님 인증 및 관리 (Owner System)
- **구현 파일**: `src/components/OwnerOnboarding.tsx`, `src/components/StoreBottomSheet.tsx`
- **내용**:
    - **접근 제어**: 일반 유저는 보기만 가능, 사장님은 로그인 후 수정 가능.
    - **입점 신청 프로세스 (자동화)**:
        1. 소셜 로그인 (카카오/네이버/구글) - *현재 UI 시뮬레이션*
        2. 사업자 정보 입력 (사업자번호, 대표자명, 개업일자)
        3. **국세청 API 인증 시뮬레이션**: 입력 정보 확인 후 즉시 권한 부여.
    - **재고 관리**: 사장님 권한 획득 시, "입고 처리(수량 입력)" 및 "품절 처리" 버튼 활성화.
    - **개발자 모드**: 테스트를 위해 강제로 사장님 권한을 얻는 `(Dev Mode)` 버튼 숨김 처리.

### 🗄️ 데이터베이스 (Supabase)
- **Products Table**: `store_id`, `status` ('AVAILABLE', 'SOLD_OUT'), `stock_count`, `owner_id`, `last_check_time`.
- **Store Posts Table**: `store_id`, `owner_id`, `content`, `photos` (array), `created_at` - 사장님 소식/사진 포스팅.
- **Storage**: Supabase Storage를 이용한 사진 업로드 (`store-photos` bucket).
- **로직**: 재고 업데이트 시, 해당 가게의 레코드가 없으면 `INSERT`, 있으면 `UPDATE` (Upsert 로직 적용).

### 📸 사장님 포스트 기능 (Owner Posts)
- **구현 파일**: `src/components/OwnerPostEditor.tsx`, `src/components/StorePostsGallery.tsx`
- **내용**:
    - **포스트 작성**: 사장님이 텍스트와 사진(최대 5장)을 업로드하여 소식 전달.
    - **사진 갤러리**: 가로 스크롤 방식의 작은 썸네일(48x48px)로 여러 장 표시.
    - **최신 포스트만 유지**: 새 포스트 작성 시 이전 포스트 자동 삭제 (1개만 유지).
    - **실시간 업데이트**: 포스트 등록 시 갤러리가 즉시 새로고침.
    - **개발 모드**: 인증 없이도 테스트 가능한 Dev Mode 지원.

### 🎯 향상된 UI/UX
- **구현 파일**: `src/components/StoreList.tsx`, `src/components/StoreBottomSheet.tsx`, `src/components/RawNaverMap.tsx`
- **내용**:
    - **재고 개수 뱃지**:
        - 목록: 초록색 그라데이션 뱃지 "🍪 120개 남음"
        - 지도: 마커 오른쪽 상단(1-2시 방향)에 큰 숫자 뱃지
    - **네이버 플레이스 링크**: 가게 정보에서 바로 네이버 지도로 이동 가능한 버튼.
    - **목록 클릭 → 지도 이동**: 목록에서 가게 클릭 시 지도로 전환하며 해당 위치로 이동 + 팝업 자동 열림.
    - **모달 스타일**: 회색 블러 배경, 가운데 정렬 방식으로 변경.
    - **재고별 마커 이미지** (준비됨):
        - 재고 50개 이상: `cookie-marker-happy.png` (행복)
        - 재고 20-49개: `cookie-marker-normal.png` (평범)
        - 재고 1-19개: `cookie-marker-worried.png` (걱정)
        - 품절/0개: `cookie-marker-sad.png` (슬픔)


---

## 4. 앞으로 해야 할 일 (Future Roadmap)

### 🔍 1. 검색 및 필터링 기능 강화
- [ ] **지역/카페 검색**: 특정 동네나 카페 이름을 검색하면 해당 위치로 부드럽게 이동하는 기능.
- [ ] **재고 필터**: "지금 바로 살 수 있는 곳(재고 1개 이상)"만 지도에 표시하는 필터 토글.

### 📱 2. 사용자 편의 기능 (UX)
- [ ] **내 위치 찾기**: GPS를 이용해 현재 내 주변 카페와 재고를 바로 확인하는 버튼 추가.
- [ ] **즐겨찾기 목록 뷰**: 지도를 보지 않고도 찜한 카페들의 재고 상태를 리스트로 한눈에 보는 전용 페이지.

### 📢 3. 실시간 알림 시스템
- [ ] **재고 입고 알림**: 찜해둔 카페의 재고가 0에서 다시 채워졌을 때 FCM 푸시 알림 발송.
- [ ] **사장님 공지 알림**: 사장님이 새 포스트를 올렸을 때 단골 손님에게 알림 전송.

### 🎨 4. 디자인 폴리싱 및 최적화
- [ ] **로딩 애니메이션**: 지도 로딩 시 쿠키가 구워지는 듯한 인터랙티브 로딩 바 추가.
- [ ] **다크 모드 지원**: 야간 사용자를 위한 지도 테마 및 UI 다크 모드 구현.
- [ ] **Tailwind 리팩토링**: 현재 인라인 스타일로 되어 있는 코드를 Tailwind CSS로 전면 전환.

---

## 5. AI를 위한 컨텍스트 (Context for AI)
*이 프로젝트를 이어받는 AI는 다음 사항을 유의하세요.*

1. **지도 로딩 방식**: `MainMap.tsx`는 `RawNaverMap`을 Dynamic Import 합니다. 이는 `window.naver` 객체 접근 시점 문제를 해결하기 위함입니다.
2. **스타일링**: `StoreBottomSheet.tsx`는 모달의 복잡한 렌더링 이슈(z-index 등)를 피하기 위해 **Inline Style**을 주로 사용했습니다. 수정 시 주의가 필요합니다.
3. **사장님 권한**: `isOwner` 상태값에 따라 UI가 분기됩니다. 테스트 시 하단의 `(Dev Mode)` 버튼을 활용하세요.
4. **에러 핸들링**: `handleUpdateStock` 함수에 Supabase 에러를 잡아서 Alert으로 띄워주는 로직이 포함되어 있습니다.

---
*Last Updated: 2026-01-16*
