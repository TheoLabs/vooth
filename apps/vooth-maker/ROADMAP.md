# vooth-maker 로드맵

사내 직원/성우가 **웹툰 대사에 성우 목소리를 녹음**하는 데스크톱 앱(Electron).

## 도메인 개요
```
작품(Webtoon)
  └─ 회차(Episode)
       └─ 컷(Cut, 이미지)
            └─ 대사(Line)
                 └─ 녹음(Recording)   ← 대사 1개에 성우 여러 명 = 멀티캐스팅 (Line 1:N Recording)
```
- **Recording** = `{ lineId, 성우(accountId), audioUrl, status }` — 한 대사에 성우별로 여러 녹음.
- **status** 예시: `대기(PENDING) → 녹음됨(RECORDED) → 검수중(REVIEW) → 완료(DONE) / 반려(REJECTED)`
- 화면의 중심: **회차를 열면 → 컷 이미지 + 컷별 대사 + 대사별 캐스팅(성우별) 녹음 상태**.

## 현재까지 (Foundation) ✅
- 데스크톱 Google 로그인 (시스템 브라우저 + loopback + PKCE) → core-api `/creators/auth/login/google/desktop`
- 승인 게이트 (`/creators/me`): 첫 로그인=가입(CREATOR PENDING) → 관리자 승인 후 이용
- 인증/토큰/승인대기 화면

## 우선순위

### 1. 앱 셸 + 네비게이션  ← (현재 진행)
- 인증·승인 통과 후의 메인 레이아웃: 사이드바(네비) + 헤더(로그인 사용자/로그아웃) + 콘텐츠 영역.
- 라우팅 골격: `작업 목록`(기본) 외 향후 섹션 자리.
- 산출물: `AppLayout`, 네비게이션, 라우트 구성. 데이터는 mock.

### 2. 도메인 타입 + mock 데이터
- `Webtoon / Episode / Cut / Line / Recording` 타입 정의(maker 또는 `@vooth/shared`).
- 샘플 mock: 작품 몇 개 · 회차 · 컷(placeholder 이미지) · 대사 · 멀티캐스팅 녹음 상태.

### 3. 작업 목록 화면
- 성우가 "내가 녹음할 회차/대사"를 보는 진입 화면 — 회차 카드/리스트 + 진행률(녹음 완료 n/총 m).
- 정렬/필터(상태별), 회차 클릭 → 4번 뷰어로.

### 4. 회차 뷰어 (읽기 전용)  ← 녹음 기능의 무대
- 컷 이미지를 순서대로 표시 + 컷별 대사 목록.
- 대사마다 **멀티캐스팅 상태**: 어떤 성우가 녹음했는지 / 대기인지, 내 녹음 상태 하이라이트.
- 대사 선택/스크롤 동기화 등 인터랙션 토대.

### 5. 대사별 녹음(편집)  ← 핵심 기능 (추후)
- 선택한 대사에 대해 녹음/재생/재녹음/제출. (마이크 권한, 파형, 업로드 등)

### 6. 검수·제출·알림 등 (추후)
- 녹음 제출 → 검수 흐름, 상태 변경 알림, 재녹음 요청 등.

## 비고
- 백엔드(작품/회차/대사/녹음) API는 아직 없음 → **mock 기반**으로 UI 먼저, 이후 연동.
- 컷 이미지는 placeholder 샘플로 진행.
- 렌더러는 HashRouter(Electron file://) + 기존 fetch apiClient 유지.
