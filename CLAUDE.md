# CLAUDE.md

pnpm + Turborepo 모노레포. `apps/` 에 4개 애플리케이션, 공유 코드는 `packages/`.

| 앱 | 스택 | 비고 |
|----|------|------|
| `apps/core-api` | NestJS 11 | 백엔드 API |
| `apps/vooth-maker` | React 19 + TS + Vite + Electron | 성우 **녹음** 데스크톱 앱 |
| `apps/vooth-tool` | React 19 + TS + Vite + Electron | **연출·제작** 데스크톱 앱(anchorY/gap/hold 연출, 채택, 연속 스크롤 미리보기, 렌더) |
| `apps/vooth-back-office` | React 19 + TS + Vite | 사내 백오피스 웹(콘텐츠·컷/대사 **등록**·관리). 연출 UI는 두지 않음 |

> 화면 경계: back-office=등록/관리, vooth-tool=연출/제작, vooth-maker=녹음. 데이터 모델(anchorY/gap/hold/cropBox)은 core-api에 둔다. 상세는 `docs/content-domain-design.md` §15.

## API 표면(네임스페이스) 규칙 (중요)

각 프론트 앱은 **고정된 API 네임스페이스**만 호출한다. core-api 컨트롤러도 이 네임스페이스로 분리한다.

| 앱 | 네임스페이스 | 인증 가드 | 계정 |
|----|------|------|------|
| `vooth-back-office` | `admins/*` | `AdminGuard` | ADMIN |
| `vooth-maker` | `creators/*` | `CreatorGuard` | CREATOR |
| `vooth-tool` | `directors/*` | `DirectorGuard` | ADMIN(연출자/검수자 = 내부 관리자) |

- **vooth-tool 은 무조건 `directors/*` 만 호출한다**(`admins/*`/`creators/*` 직접 호출 금지). `DirectorGuard` 는 `AdminGuard` 와 동일하게 ADMIN 계정+역할을 검증한다.
- 로그인: back-office=웹 idToken(`admins/auth/login/google`), maker/tool=데스크톱 PKCE(`creators|directors/auth/login/google/desktop`). 데스크톱 앱은 웹 idToken 로그인 엔드포인트를 만들지 않는다.

## 작업 권한 규칙 (중요)

- **`apps/core-api` — 구현 금지, 사전 허락 필수.**
  - core-api는 사용자가 전적으로 직접 구현한다.
  - 이 디렉토리의 코드를 작성/수정하기 전에는 **반드시 사용자에게 먼저 허락을 받는다.**
  - 질문 답변, 코드 설명, 리뷰, 분석은 허락 없이 해도 되지만, **파일 편집은 명시적 승인 없이 하지 않는다.**

- **`apps/vooth-maker`, `apps/vooth-tool`, `apps/vooth-back-office` (프론트엔드) — 자율 진행.**
  - 구현 방향과 세부 사항은 Claude가 스스로 판단해서 진행한다.
  - 매번 허락을 받을 필요 없이 작업하되, 큰 구조 변경이나 의존성 추가는 결과를 명확히 보고한다.

- `packages/` 공유 코드가 core-api에서 사용되는 경우, core-api 쪽 연결 작업은 위 core-api 규칙을 따른다.

## core-api 컨벤션

- **목록 조회용 Query DTO는 항상 `PaginationDto`(`@libs/utils`)를 상속받는다.** 페이지네이션(page/limit/sort/order)을 일관되게 제공하기 위함. (예: `AccountQueryDto`, `RoleQueryDto` → `extends PaginationDto`)
- 페이지네이션 목록 응답은 `{ items, total }` 형태로 반환한다.

## vooth-back-office 컨벤션

- **레이아웃 룰: main content(테이블 영역)에는 바깥 스크롤을 만들지 않는다.** 화면은 항상 뷰포트에 꽉 차고, 스크롤은 **테이블 내부 body** 에만 생긴다.
  - `AppLayout`의 Content 는 `.bo-content`(높이 고정 + `overflow: hidden`).
  - 모든 리스트/테이블 페이지의 루트는 `.bo-page`(flex 컬럼, `height: 100%`).
  - 테이블은 `<FullHeightTable>`(`components/FullHeightTable.tsx`)을 쓴다 — 남은 높이를 채우고 내부 body 스크롤 높이를 계산한다. 일반 `<Table>` 을 직접 쓰지 않는다.
  - 관련 클래스는 `src/index.css` 에 정의돼 있다.
- **필터 배치 룰: 목록 필터는 `TableToolbar` 의 `filters` prop 으로 넘긴다.** 개수에 따라 위치가 자동 결정된다 — **3개 이하면 검색창 바로 오른쪽(인라인), 3개 초과면 검색창 아래 필터 바**. 이 분기는 `TableToolbar` 가 처리하므로 페이지는 `filters={[{ label, control }]}` 만 넘기면 된다(페이지에서 `FilterBar` 를 직접 쓰지 않는다).
  - 각 필터는 `{ label, control }`(`ToolbarFilter`) 형태. 내부적으로 `<FilterField label="...">`(`components/FilterBar.tsx`)로 감싸 **form-label 은 컨트롤 상단**에 온다.
  - 인라인/하단 임계값은 `TableToolbar.tsx` 의 `INLINE_FILTER_MAX`(=3).
- **API 통신 룰: axios 인스턴스(`src/lib/apiClient.ts`) + 인터셉터로 일원화한다.** 개별 API 함수에서 쿼리스트링/헤더를 수동 조립하지 않는다.
  - 배열 쿼리 파라미터는 **반복 파라미터(`?a=1&a=2`)** 로 직렬화한다 — axios `paramsSerializer` 에서 일괄 처리(브래킷 `a[]` 금지).
  - 요청 인터셉터에서 Bearer 토큰 첨부, 응답 인터셉터에서 `{ data }` 언랩 + `ApiError`(status/message) 정규화.
- **목록 총 건수 룰: 테이블 기반 목록 조회 화면은 항상 총 건수(`총 N건`)를 표시한다.** 서버 응답 `{ items, total }` 의 `total` 을 사용하며, `<FullHeightTable>` 에서 일괄 렌더링하므로 페이지마다 따로 붙이지 않는다.
- **부분 수정 룰: 수정(PUT/PATCH) 요청은 변경된 필드만 보낸다.** 폼 제출 시 원본과 비교해 **달라진 필드만** 페이로드에 포함하고, 바뀐 게 없으면 요청을 보내지 않는다(예: `변경된 내용이 없습니다.` 안내 후 종료). 배열(예: `tagIds`)은 순서 무관 집합 비교로 변경 여부를 판단한다. (적용 예: 태그 수정, 콘텐츠 기본 정보 수정)
- **타임스탬프 룰: 서버의 `createdAt`/`updatedAt` 등은 항상 UTC(ISO) 기준이다.** 화면에는 **로컬 타임존으로 변환해 표시**한다(`new Date(iso)` 로 파싱 후 `getFullYear/getHours…` 등 로컬 getter 사용). `toISOString().slice(...)` 로 그대로 잘라 쓰면 UTC 날짜가 노출되니 주의.
- **다이얼로그 닫힘 룰: 모든 `<Modal>`/`<Drawer>` 는 `maskClosable={false}` 로 둔다.** 바깥(mask) 클릭으로 실수로 닫히지 않게 하고, 닫기는 X/취소/확인 버튼으로만. (antd `ConfigProvider` 가 `maskClosable` 전역 설정을 지원하지 않아 컴포넌트마다 prop 으로 지정한다.)

## 작업 방식 규칙

- **프론트 앱(`apps/vooth-maker`, `apps/vooth-tool`, `apps/vooth-back-office`)은 항상 서로 다른 에이전트로 작업한다.**
  - 여러 앱과 관련된 작업이 함께 들어오면, 각 앱마다 별도의 서브에이전트를 띄워 **병렬로** 진행한다 (한 에이전트가 둘 이상을 같이 건드리지 않는다).
  - 각 에이전트는 자기 앱 디렉토리 밖(다른 프론트 앱, core-api)을 수정하지 않는다.
  - 한쪽 앱만 작업하는 경우에는 해당 앱 에이전트 하나만 띄우면 된다.
  - 단, `packages/` 공유 코드 추출처럼 본질적으로 여러 앱에 걸치는 작업은 예외로 한 에이전트가 진행할 수 있다.

## 명령어

```bash
pnpm install                          # 워크스페이스 전체 설치
pnpm dev                              # 전체 dev (turbo)
pnpm build                            # 전체 빌드
pnpm --filter <앱이름> <스크립트>      # 개별 앱 실행
```

## 인프라

로컬 인프라(kafka, mysql, debezium, kafka-ui, localstack)는 `docker-compose.yml`로 띄운다. 상세 가이드는 `infra.md` 참고.
