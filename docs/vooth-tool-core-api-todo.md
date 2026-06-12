# vooth-tool 을 위한 core-api 작업 TODO

vooth-tool(연출·제작 데스크톱) 이 실제로 동작하려면 core-api 에 필요한 작업 분류.
현재 tool 의 연출 에디터/미리보기는 **mock** 으로 완성돼 있고, 아래 엔드포인트가 생기면 mock→실데이터로 교체한다.

- 범위 경계: **back-office=등록**(컷 이미지+cropBox, 대사 script+character), **vooth-maker=녹음**, **vooth-tool=연출/제작**. 데이터 모델은 core-api.
- 원칙: 목록은 `PaginationDto` + `{ items, total }`, 변경은 DDD outbox 이벤트, 부분수정은 변경 필드만.
- 상세 설계: `docs/content-domain-design.md` §15.

> ⚠️ core-api 는 사용자 직접 구현 영역(사전 허락 필수). 이 문서는 작업 분류용이며, 각 항목 착수 전 승인 필요.

---

## 이미 되어 있는 것 (전제)

- [x] `Cut`: `imageUrl`(원본), `imageWidth`/`imageHeight`, `cropBox(json)`, `holdMs`
- [x] `Line`: `characterId`, `position`, `script`, `anchorY`, `gapBeforeMs`
- [x] `Recording` 엔티티: `lineId`/`episodeId`/`creatorId`/`audioUrl`/`durationMs`/`status`/`take`/`rejectReason`/`phase`
- [x] `RecordingStatus`(@vooth/shared, 숫자 enum) + 전이
- [x] admin `uploadScript`(컷/대사 + 연출 필드 포함 전체 교체), admin episode 상세 조회
- [x] creator 콘텐츠 목록 / creator 회차 목록

---

## P0 — 연출 에디터 실연동 (가장 먼저)

tool 이 회차를 **읽고 연출값(anchorY/gap/hold)을 저장**할 수 있게 하는 최소 세트.

### A. 인증 / 권한
- [ ] **연출자 역할 결정** — creator 로 묶을지, 신규 role(예: `DIRECTOR`)을 둘지.
- [ ] tool 용 `/me` (creators/me 재사용 vs 신규) + Guard 결정.
- [ ] 아래 연출 엔드포인트에 적용할 권한 정의.

### B. 연출용 회차 조회 API
- [ ] **회차 상세 조회(연출용)** — 컷/대사를 **연출 필드 포함**으로 반환: `cropBox`/`imageWidth`/`imageHeight`/`holdMs`(cut), `anchorY`/`gapBeforeMs`/`script`/`characterId`(line) + **캐릭터 이름**(조인).
  - 옵션: 기존 admin 상세(`GET /admins/contents/:cid/episodes/:id`)를 tool 권한으로 열기 vs 전용 엔드포인트(`GET /directors/...`).
- [ ] **연출 대상 회차 목록** — 연출 가능한 회차(예: 콘텐츠 `RECORDING` 상태) 선택 화면용. 페이지네이션.

### C. 연출 저장 (부분 수정) — ⭐ 핵심
- [ ] **연출 전용 저장 엔드포인트** — 스크립트 전체 교체(`uploadScript`)가 아니라 **anchorY/gapBeforeMs/holdMs 만** 갱신.
  - 예: `PATCH /.../episodes/:id/direction` body `{ cuts: [{ id, holdMs?, lines: [{ id, anchorY?, gapBeforeMs? }] }] }`.
  - 변경 필드만 반영(부분 수정 룰).
- [ ] **클로버 방지** — back-office `uploadScript`(스크립트 재업로드)가 **기존 연출값(anchorY/gap/hold)을 덮어쓰지 않도록** 보장.
  - `uploadCut`/`Line.update`/`Cut.update` 에서 연출 필드가 payload 에 없으면 **기존 값 보존**(undefined→무시) 동작 확인/수정.
  - 결론: 등록(back-office)과 연출(tool)이 같은 회차를 만져도 서로 안 깨지게.

---

## P1 — 채택 + 실 오디오 미리보기

미리보기/렌더의 라인 길이를 placeholder 가 아니라 **실제 채택 take 의 durationMs** 로 쓰려면 필요.

### D. 녹음(Recording) API
- [ ] **녹음 생성** — 성우(maker)가 take 업로드(presigned S3 → commit). `audioUrl`/`durationMs`/`take`/`status=RECORDED`.
  - (maker 측 작업이지만 core-api 엔드포인트 필요. 현재 maker 녹음은 세션 로컬 mock.)
- [ ] **라인/회차별 녹음 목록 조회** — tool 이 라인별 take 들을 로드(creator/상태/`audioUrl`/`durationMs`).
  - `EpisodeRepository.findLines` 패턴 참고(루트 거치지 않는 하위 조회).
- [ ] **녹음 상태 전이** — REVIEW→APPROVED/REJECTED 등(`canTransitionRecording`), 검수 주체 권한.

### E. 채택 (LineTake) — §13.3
- [ ] **`LineTake` 엔티티** — (line × creator) → recording 채택. `UNIQUE(lineId, creatorId)`.
- [ ] **채택 / 해제 API** — tool 에서 라인별 최종 take 선택.
- [ ] **검증** — recording 이 해당 line 소속 + (정책상) APPROVED 인지.
- [ ] 길이 유도: 채택 take 의 `durationMs` → 컷/회차 길이 산정(저장 X, 유도).

---

## P2 — 제작(Render)

실제 mp4 산출. core-api 는 **잡과 결과만**, 렌더는 **별도 인코딩 서비스**(알림·인코딩 분리 로드맵과 정합).

### F. Render 도메인
- [ ] **`Render` AR** — `episodeId`/`status`(QUEUED→RENDERING→DONE/FAILED)/`params(json: width,fps,scrollMode,easing,viewport)`/`source(json: 채택·타임라인 스냅샷)`/`outputUrl?`/`durationMs?`/`error?`.
- [ ] **렌더 요청 엔드포인트** — tool 에서 호출 → `Render(QUEUED)` 저장 + `RenderRequested`(source 스냅샷) outbox 이벤트.
- [ ] **결과 소비** — 인코딩 서비스의 `RenderCompleted{outputUrl,durationMs}` / `RenderFailed{reason}` 이벤트 소비 → `Render` 갱신.
- [ ] **렌더 목록/상세 조회** — tool 진행 상태 표시.

### G. 오디오/미디어 파이프라인 (인코딩 서비스 영역)
- [ ] 오디오 합성 = 채택 take 순서대로 concat + 라인 `gapBeforeMs` 무음 + 컷 `holdMs` 무음.
- [ ] 연속 캔버스 스크롤(원본 세로 스티칭 + anchorY 키프레임) 렌더.
- [ ] (선택) 파형 `phase.waveformUrl` 생성.

---

## 연출 전역 설정 (스크롤 속도/이징) — 시점 미정

미리보기/렌더의 스크롤 페이싱 조절값. 어디 저장할지 결정 필요(전역 vs Render 파라미터).
- [ ] `scrollMode`('anchor'|'constant'), `transitionMs`(τ) 또는 `scrollSpeed`(px/s), `scrollEasing`.
- [ ] 1차는 **Render 요청 파라미터**(장기 저장 X)로 두는 것이 깔끔(§15.3).

---

## 미해결 결정
- [ ] 연출자 역할/권한 모델 (creator vs DIRECTOR vs admin).
- [ ] 연출 읽기/저장을 admin 표면 재사용 vs `directors/` 신규 표면.
- [ ] 채택이 안 된 라인의 렌더 처리(placeholder 무음+균등 길이 vs 렌더 차단).
- [ ] `viewportH`(렌더 세로 가시영역) 기준값.

---

## 권장 순서
**P0(A→B→C)** 로 tool 연출을 실데이터로 세우고 → **P1(D→E)** 로 채택·실오디오 → **P2(F→G)** 렌더.
P0-C 의 클로버 방지는 back-office 와 동시 운용 전 **반드시** 먼저.
