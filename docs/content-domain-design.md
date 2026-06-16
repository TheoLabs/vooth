# 콘텐츠 도메인 설계 (Content Domain)

> DDD + EDA 기반. 계정/역할/권한은 [`domain-design.md`](./domain-design.md), 보이스툰 타임라인/재생은
> [`maker-domain-design.md`](./maker-domain-design.md) 참고.
> 본 문서는 **작품·회차·컷·대사·캐스팅·녹음** 의 애그리게이트 경계와 컬럼 설계를 정의한다.
>
> ⚠️ **1~10절은 초기 초안**(Webtoon/ULID/fractional position 기준)이며 실제 구현과 일부 다르다.
>
> 🟥 **2026-06-16 대규모 리셋됨.** 아래 §4~15는 **리셋 전 설계·구현 기록(코드엔 현재 없음, 재구축 참고용)** 이다.
> **현재 코드 상태와 최신 확정 설계는 [16절(현재 기준)](#16-리셋--현재-기준-2026-06-16) 을 먼저 보라.**

## 1. 바운디드 컨텍스트
| BC | 책임 | 주 사용처 |
|----|------|-----------|
| **Content** | 작품·회차·컷·대사·캐스팅 등록/편집/게시 | voot-back-office (CONTENT_MANAGER) |
| **Recording** | 성우 녹음 + 검수(최종 take/상태) | vooth-maker |
| Identity | 계정·역할·권한 | voot-back-office |

> Recording 은 오디오 산출물이 생기고 추후 **인코딩**이 붙을 수 있어, 멀티서비스 분리 로드맵(인코딩 별도 서버)과
> 연결된다. 지금은 core-api 안의 **별도 모듈/애그리게이트**로 두고, 나중에 분리 가능하게 설계한다.

## 2. 애그리게이트 경계 (원칙: 1 트랜잭션 = 1 애그리게이트)
| 애그리게이트(루트) | 내부 엔티티/VO | 외부 참조(id only) |
|---|---|---|
| **Webtoon**(작품) | Character[](등장인물) + 캐스팅 | — |
| **Episode**(회차) | Cut[] · Line[] (순서/gap/hold/최종선택) | webtoonId |
| **Recording**(녹음) | audio(audioKey/durationMs), status | episodeId, lineId, voiceActorId |

**근거**
- **Episode 가 Cut/Line 포함**: 컷 순서·대사 순서·gap/hold·최종 take 선택은 "회차 편집"의 일관성 단위.
- **Recording 분리**: 성우 여러 명이 독립·빈번히 생성 → Episode 에 넣으면 비대/경합. `lineId` 로 참조만.
- **편집(arrangement)** = `selectedRecordingId`/`gapBeforeMs`/`holdMs` → Episode. **녹음 파일/상태** → Recording.

## 3. 확정된 설계 결정(디폴트)
1. **id 전략 = ULID**(정렬·CDC 친화). 모든 PK/참조 컬럼 동일.
2. **순서 컬럼 = fractional `position`(decimal)** — 두 행 사이 삽입/이동이 1건 update(드래그 재정렬 최적).
3. **`selected_recording_id` = 소프트 참조**(하드 FK 없음, 교차 AR). 커맨드 시 소속 검증.
4. **소프트 삭제(`deleted_at`) + 감사 컬럼(`created_by`,`updated_by`)** 둠.
5. **`line.episode_id` 비정규화** — 컷 경유 없이 회차 단위 질의.
6. **캐스팅 = 조인 테이블**(`character_casting`).
7. **타임라인(start/end) 저장 안 함** — `duration_ms + position + gap + hold` 로 읽기모델/플레이어에서 유도.

> 공통 컬럼(`DddAggregate`): `id`(ULID), `created_at`, `updated_at` + 위 4의 `deleted_at`/`created_by`/`updated_by`.

## 4. 컬럼 설계

### webtoon (작품) — AR
| 컬럼 | 타입 | null | 기본 | 비고 |
|---|---|---|---|---|
| title | varchar(200) | N | | |
| description | text | Y | | |
| thumbnail_key | varchar(512) | Y | | S3 키 |
| status | enum(DRAFT,ACTIVE,ARCHIVED) | N | DRAFT | |
- idx: `status`, `title`

### webtoon_character (등장인물) — Webtoon AR 내부
| 컬럼 | 타입 | null | 비고 |
|---|---|---|---|
| webtoon_id | char(26) | N | FK→webtoon (idx) |
| name | varchar(100) | N | |
| color | char(7) | Y | UI 표시색 #RRGGBB |
| display_order | decimal(20,10) | N | fractional 순서 |

### character_casting (캐스팅, 멀티캐스팅) — 조인
| 컬럼 | 타입 | null | 비고 |
|---|---|---|---|
| character_id | char(26) | N | FK→webtoon_character |
| account_id | char(26) | N | 성우(CREATOR) |
- PK `(character_id, account_id)`

### episode (회차) — AR
| 컬럼 | 타입 | null | 기본 | 비고 |
|---|---|---|---|---|
| webtoon_id | char(26) | N | | FK→webtoon (idx) |
| episode_no | int | N | | |
| title | varchar(200) | N | | |
| status | enum(DRAFT,OPEN,RECORDING,REVIEW,PUBLISHED) | N | DRAFT | |
- uniq: `(webtoon_id, episode_no)`

### cut (컷) — Episode AR 내부
| 컬럼 | 타입 | null | 기본 | 비고 |
|---|---|---|---|---|
| episode_id | char(26) | N | | FK→episode (idx) |
| position | decimal(20,10) | N | | 회차 내 순서 |
| image_key | varchar(512) | Y | | S3 |
| hold_ms | int | N | 0 | 대사 후 유지 |
| transition | varchar(50) | Y | | (선택) |

### line (대사) — Episode AR 내부(컷 하위)
| 컬럼 | 타입 | null | 기본 | 비고 |
|---|---|---|---|---|
| cut_id | char(26) | N | | FK→cut (idx) |
| episode_id | char(26) | N | | 비정규화(idx) |
| position | decimal(20,10) | N | | 컷 내 순서 |
| text | text | N | | 대사 |
| character_id | char(26) | Y | | FK→webtoon_character(화자) |
| gap_before_ms | int(signed) | N | 0 | **음수=겹침** |
| selected_recording_id | char(26) | Y | | recording.id **소프트 참조** |

### recording (녹음) — 별도 AR
| 컬럼 | 타입 | null | 기본 | 비고 |
|---|---|---|---|---|
| episode_id | char(26) | N | | idx |
| line_id | char(26) | N | | idx |
| voice_actor_id | char(26) | N | | account(CREATOR) |
| audio_key | varchar(512) | N | | S3 |
| duration_ms | int | N | | 타임라인 원천 |
| status | enum(RECORDED,REVIEW,APPROVED,REJECTED) | N | RECORDED | |
| reject_reason | varchar(500) | Y | | |
- idx: `line_id`, `voice_actor_id`, `(episode_id, status)`
- **start/end 컬럼 없음**(유도).

## 5. 불변식(invariants)
- Webtoon: `episode_no` 는 작품 내 유일.
- Episode: Cut.position / Line.position 은 각 부모 안에서 유일(또는 정렬 가능). `selected_recording_id` 는 같은 line 의 recording 이어야 함(커맨드 검증, 결과적 일관성).
- Line.character_id 는 같은 webtoon 의 character 여야 함.
- Recording: `(line_id, voice_actor_id)` 당 활성 take 정책은 추후(현재 멀티 take 허용).

## 6. 라이프사이클
- **Episode**: `DRAFT(편집) → OPEN(녹음 게시) → RECORDING → REVIEW → PUBLISHED`
- **Recording**: `RECORDED(제출) → REVIEW → APPROVED(=DONE) / REJECTED`
- Episode `OPEN` 시 → 이벤트로 maker "내 작업 목록"에 노출.

## 7. 커맨드 & 도메인 이벤트 (outbox `ddd_events` → Debezium → Kafka)
- **Webtoon**: Created/Updated, CharacterAdded/Removed, CastingChanged
- **Episode**: Created, CutAdded/Reordered/Removed, LineAdded/Updated/Reordered/Removed, **Opened**→`EpisodeOpenedForRecording`(maker 소비), Published, `FinalTakeSelected`
- **Recording**: Submitted→`RecordingSubmitted`(검수 큐), Approved→`RecordingApproved`, Rejected→`RecordingRejected`

## 8. 교차 애그리게이트 흐름 — 검수 승인 (이벤트 사가)
검수자 take 승인 = ① Recording APPROVED + ② Episode 최종 take 선택. 두 애그리게이트.
```
Recording.approve(txn1) → RecordingApproved → 핸들러 → Episode.selectFinalTake(txn2) → FinalTakeSelected
```
1 트랜잭션 = 1 애그리게이트 원칙 준수, EDA 에 부합. **최종 take 선택 주체는 검수자.**

## 9. 저장/업로드
- 바이너리는 **S3**, 애그리게이트엔 **키만**(`thumbnail_key`/`image_key`/`audio_key`).
- back-office 업로드: core-api 에서 **presigned URL** 발급 → S3 직접 업로드 → 키를 커맨드로 등록.

## 10. 조회(Query) 컨벤션
- 목록 Query DTO 는 `PaginationDto` 상속, 응답은 `{ items, total }` (core-api 컨벤션).
- 타임라인/진행률 등 파생값은 읽기모델/프로젝션에서 계산(저장 X).

---

## 11. 구현 현황 & 오늘 확정 (2026-06-10)

> 1~10절 초안 대비 실제 구현 차이: 네이밍 **Content**(=작품), id = **auto-increment number**(ULID 아님),
> fractional position 미적용(현재 단순). 아래가 실제 코드/결정 기준.

### 11.1 구현된 모듈 (core-api)
- **Content**(작품), **Tag**, **Character**, **File**, **`libs/s3`** — 구현됨.
- **Creator**(성우) — 신설 결정(11.4).
- **Recording / Episode·Cut·Line** — 아직(maker 쪽 mock 으로 UX 선행).

### 11.2 Tag (태그) — N:M with Content
- `tag { id, name, color(TagColor), usageCount }`. **Content ↔ Tag N:M** (`content_tag`, owning=Content).
- **`TagColor` enum = `@vooth/shared`**(의미 키 RED/…/GRAY). 백엔드 `@IsEnum` 검증·저장, **렌더 색은 FE 매핑**(`TAG_COLOR_ANTD`). UI 라이브러리 비종속.
- **usageCount = 이벤트 기반 재계산**: `ContentSetTagEvent(addedTagIds, removedTagIds)` → `@EventHandler` 가 영향 태그를 `content_tag` 기준 **COUNT 로 set**(증분 아님 → 멱등/무drift). 활성 콘텐츠(soft-delete 제외) 기준. (리포: `countTagUsage(tagId)` = `count(Content, { tags: { id } })`)
- **태그 삭제 = 하드삭제** → `content_tag` FK `ON DELETE CASCADE` 로 연결 자동 정리(의도). FE 삭제 시 "연결 N개 작품에서 제거" 경고 + 변경 필드만 PUT.

### 11.3 Character (등장인물) & 캐스팅
- 컨트롤러 **분리**: `@Controller('admins/contents/:contentId/characters')` — Content↔Character **순환 DI 회피**(Character→Content 단방향, ContentRepository 사용). forwardRef 불필요.
- `character { id, contentId, name, type(CharacterType: MAIN/SUB/EXTRA), color }`, uniq `(contentId, name)`, idx `contentId`.
- **캐스팅 = Character ↔ Creator N:M** (`character_creator`, owning=Character). (성우=Creator 참조)
- `@ManyToMany(cascade:true)` → **cascade 제거 권장**(기존 Creator attach 면 upsert 위험). join row 삭제는 **DB FK CASCADE** 소관: **하드삭제만 자동**, 소프트삭제면 앱 레벨 처리(사용중 거부 or detach 후 삭제).
- API: **create/list 만** 구현. 수정·삭제·캐스팅 API 미구현 → FE 캐스팅은 mock.

### 11.4 Creator (성우) 도메인 — 신설 결정
- 정산 등 제작/정산 고유 개념이 붙으므로 **Creator 애그리게이트 신설**. **Account 와 1:1**(`accountId` 유니크). **name/email 복제 금지**(Account 에서 조회).
- **생성 시점 = 계정 "승인"**(생성 아님): `Account.approve()` 시 **`AccountApproved`(accountId, type) 이벤트** 발행 → `@EventHandler` 가 `type===CREATOR` 면 Creator 생성.
  - **멱등 필수**(승인 재호출·at-least-once): `accountId` 로 이미 있으면 skip(또는 unique).
  - 반려/대기 계정엔 Creator 안 생김.
- **정산 = 별도 Settlement 애그리게이트**(creatorId 참조). Creator 에 정산 로직 몰지 않음.
- 이벤트 명: **범용 `AccountApproved`(type 포함) 추천**(다른 반응도 구독) vs 전용 `CreatorApproved` — 미확정.

### 11.5 File / S3 업로드 (presigned)
- **`libs/s3` `S3Service`**: `createPresignedPutUrl`/`createPresignedGetUrl`/`deleteObject`/`getPublicUrl`. `forcePathStyle:true`, **`requestChecksumCalculation:'WHEN_REQUIRED'`**(SDK v3 기본 CRC32 가 presigned PUT 을 400 으로 깨뜨리는 것 회피). 버킷 = **`vooth`**(LocalStack, CORS 설정).
- **File 도메인**: `file { id, mimeType, originalName, size, key, isCommit }`. 흐름:
  1. `POST /admins/files/presign { originalName, mimeType, size }` → File(PENDING, isCommit=false) + `{ fileId, key, uploadUrl, publicUrl }`
  2. FE 가 `uploadUrl` 로 **S3 직접 PUT**(Content-Type = mimeType 동일해야 서명 일치)
  3. `PUT /admins/files/:id/commit` → `isCommit=true`
- **고아 정리(cron)** = 추후(미구현 PENDING + 오래된 것 정리).
- FE: `useFileUpload`(presign→upload→commit, publicUrl 반환), `ThumbnailUpload`(폼 컨트롤). 콘텐츠 등록/수정 썸네일 연동.

### 11.6 EDA 신뢰성 — 재시도 + DLQ
- `EventStore` 핸들러: **바운디드 재시도 3회**(백오프 0.5s→2s) → 소진 시 **DLQ 토픽 `<topic>.dlq`** 로 메타(eventId/eventType/handler/attempts/error/원본) 전송 후 continue(파티션 head-of-line blocking 방지). 핸들러별 독립, **멱등성은 핸들러 책임**(at-least-once).
  - 예: 메인 `dbserver1.vooth.ddd_events` → DLQ `dbserver1.vooth.ddd_events.dlq`. 브로커 `auto.create.topics.enable=true` 라 첫 전송 시 자동 생성(운영은 사전 생성 필요).
- 핸들러는 **AsyncLocalStorage 컨텍스트** 안에서 실행(컨슈머가 `Context.run` 대신 `asyncLocalStorage.run(new Map())` 으로 열어줌 — `@Transactional` 의존).
- DLQ 소비/알림(재처리·슬랙) = 다음 단계. (선택: 부트스트랩에서 admin `createTopics` 로 환경 무관 보장)

### 11.7 프론트 룰 (CLAUDE.md › voot-back-office 컨벤션 반영)
- **부분 수정 룰**: PUT/PATCH 는 **변경된 필드만**(원본 비교, 배열은 순서무관 집합 비교, 변경 없으면 미전송).
- **타임스탬프 룰**: `createdAt/updatedAt` = UTC(ISO) → 화면은 **로컬 변환** 표시(`new Date(iso)` + 로컬 getter; `toISOString().slice` 금지).

### 11.8 다음 할 일 (집에서 이어서)
- [ ] Creator 도메인: 엔티티(+`accountId` unique) + 모듈 + `@EventHandler(AccountApproved)` **멱등** 생성.
- [ ] Account 승인 로직에서 **`AccountApproved` 이벤트 발행**.
- [ ] 캐스팅(`character_creator`) API: 연결/해제 + (선택) 명시적 `Casting` 엔티티로 승격 + 정합 이벤트.
- [ ] Character: `cascade:true` 제거, 삭제 정책(soft 기준 사용중 거부 or detach).
- [ ] 성우(CREATOR) 목록 조회 API → FE 캐스팅 피커 실연동(현재 mock).
- [ ] File 고아 정리 cron, DLQ 소비/알림.

---

## 12. 구현 현황 (2026-06-11)

> §11(2026-06-10) 이후 진행분. 이전 "다음 할 일" 상당수 완료.

### 12.1 모듈/엔드포인트 맵 (core-api admin 표면)
| 모듈 | 엔드포인트 |
|---|---|
| account | `GET` 목록, `PUT :id/approve`·`reject`·`exit` |
| role/permission | role CRUD, permission 목록 |
| content | `POST`/`GET`/`GET :id`/`PUT :id` |
| tag | CRUD (+ usageCount 이벤트 재계산) |
| character | `POST`/`GET` (콘텐츠 하위) |
| casting | `POST`/`GET`/`DELETE :id` (콘텐츠 하위) |
| episode | `POST`/`GET`/`GET :id`/`PUT :id`/`PUT :id/script` |
| creator | `GET` 목록 |
| file | `POST presign`/`PUT :id/commit` |

### 12.2 Episode → Cut → Line (스크립트 애그리게이트)
- **계층**: Episode(루트) → **Cut**(`episodeId`, `position`, `imageUrl`) → **Line**(`cutId`, `episodeId`(비정규화), `characterId`, `position`, `script`). 모두 Episode 애그리게이트 내부 엔티티.
- **순서 `position`** = `decimal(20,10)` + **`decimalTransformer`**(mysql DECIMAL=문자열 → number). 저장 시 FE가 화면 순서대로 `index+1` 부여.
- **연쇄 삭제**: `Episode.cuts`/`Cut.lines` `@OneToMany({ cascade, orphanedRowAction: 'delete' })` + FK `onDelete: 'CASCADE'`(line→cut, cut→episode) → 교체/삭제 시 하위 자동 정리.
- **스크립트 저장 `PUT :id/script`** → `episode.uploadCut(cutItems)`:
  - **DRAFT 상태에서만** 허용(`assertEditable` 성격의 가드).
  - **id 기반 upsert(reconcile)**: cut/line `id` 매칭 → 변경분만 update(**id·createdAt 유지**), 미매칭/무id → 신규, payload에 없는 기존 → orphan 삭제. (전체 교체 X → 녹음이 `lineId` 참조해도 안전)
  - **캐릭터 검증**: lineItem.characterId 가 **이 콘텐츠의 캐릭터인지**(존재+소속) 확인.
  - 중첩 검증 DTO(`@ValidateNested`+`@Type`), cut/line `id?` 옵셔널.
- **상세 응답에 cuts/lines 포함**: `EpisodeResponseDto`에 `CutResponseDto`/`LineResponseDto`(@Expose+@Type), retrieve가 `relations: { cuts: { lines: true } }` 로드. (목록은 미로드 → 가벼움)
- **FE 에디터**(EpisodeEditPage): 컷/대사 추가·삭제·순서·이미지(presign)·캐릭터 지정, 기존 스크립트 로드(position 정렬), 저장(검증+position 부여), **변경 없으면 저장 비활성**, `serverId`로 upsert.

### 12.3 상태 enum & 전이
- **`EpisodeStatus` = `@vooth/shared` 숫자 enum**: DRAFT 10 · READY 20 · RECORDING 30 · REVIEW 40 · APPROVED 50 · PUBLISHED 60. 컬럼 `smallint`.
- **`EPISODE_STATUS_TRANSITIONS`/`canTransitionEpisode`**(shared) — 허용 전이 화이트리스트, **반려**(REVIEW→RECORDING) 포함.
- **서버 전이 검증**: `episode.transitionTo(next)` 가 `canTransitionEpisode` 로 검증(임의 점프 차단). `update`의 status는 이 메서드 경유. FE는 허용 전이 버튼만 노출.
- **`CharacterType` 도 숫자 enum**(MAIN 10 / SUB 20 / EXTRA 30, smallint) — 정렬용.

### 12.4 캐스팅 / Creator (완료)
- **Casting** = Character ↔ Creator N:M(콘텐츠 하위). create/list/delete API + FE(삭제 경고 다이얼로그, 캐릭터별 캐스팅).
- **Creator 도메인 완료**: Account 1:1(`accountId`). **`AccountApproved` 이벤트 → `@EventHandler` 가 CREATOR+ACTIVE & Creator 없을 때만 생성**(멱등). 캐스팅 피커는 실제 Creator 목록 사용.

### 12.5 감사 컬럼 보완 — TraceIdSubscriber
- **`createdBy/updatedBy`**: `DddRepository.save`의 `setTraceId`는 최상위 엔티티만 → cascade 하위(컷·대사)는 누락.
- **`TraceIdSubscriber`**(TypeORM EntitySubscriber, `databases/typeorm/subscribers`)가 모든 DddAggregate insert/update 직전에 traceId(Context TXID)로 일괄 채움. TypeOrmModule provider 등록(생성자에서 `dataSource.subscribers.push`).

### 12.6 EDA 정리
- `@Transactional`의 **in-memory `eventEmitter` 경로 제거** → 전파는 아웃박스→CDC 단일화(architecture.md 참고).

### 12.7 다음 할 일
- [ ] **Recording 도메인**(vooth-maker 핵심): line별 녹음 제출 → 검수 → 최종 take 선택(`line.selectedRecordingId`). Recording AR(lineId·creatorId·audioKey·durationMs·status) + 제출/승인/반려 이벤트.
- [ ] **Settlement(정산)** 도메인(creatorId 참조, 별도 AR).
- [ ] (cut/line 폴리시) 조회 서버 정렬(`ORDER BY position`), `EpisodeScriptUploaded` 이벤트, 드래그 정렬 UX.
- [ ] 타임라인 컬럼(`cut.holdMs`/`line.gapBeforeMs`/`transition`) — 타임라인/플레이어 붙일 때.
- [ ] File 고아 정리 cron, DLQ 소비/알림.

---

## 13. Recording 도메인 설계 (멀티캐스팅)

> **별도 애그리게이트**(line·creator를 id로 소프트 참조, 대량·독립 생성).
> 이전 §2/§4 의 recording 스케치와 §12 의 `line.selectedRecordingId` 가정을 **이 절이 갱신**한다.

### 13.1 모델 — 멀티캐스팅 + 성우별 채택
한 **대사(Line)** 를 **여러 성우가 각자 녹음**하고, **채택은 (Line × 성우)별로 1개**.
```
Line (대사)
 └─ 캐스팅된 성우 A, B, C …        (character ↔ creator N:M = 멀티캐스팅)
     각 성우마다 Recording 여러 take
       (Line, 성우)별 "채택본" 1개
```
- 채택은 **(lineId, creatorId) 단위 1개** → 라인 하나에 **성우 수만큼 채택본**.
- 재생/타임라인은 **성우(캐스트) 단위**: "이 성우 버전" = 그 성우의 라인별 채택본을 이어 재생.
- → **라인당 단일 최종 take 가정(`line.selectedRecordingId`) 폐기.**

### 13.2 Recording (take 그 자체)
| 컬럼 | 타입 | null | MVP | 비고 |
|---|---|---|---|---|
| `lineId` | int(소프트참조) | N | ✅ | idx |
| `episodeId` | int(비정규화) | N | ✅ | `(episodeId,status)` idx |
| `creatorId` | int(소프트참조) | N | ✅ | 성우. idx |
| `audioKey` | varchar(512) | N | ✅ | 원본 오디오 S3 키 |
| `durationMs` | int | N | ✅ | **타임라인 길이 원천**(line/cut엔 미저장) |
| `status` | smallint(enum) | N | ✅ | RECORDED→REVIEW→APPROVED/REJECTED |
| `take` | int | N=1 | ⏳ | (line,creator)별 테이크 번호 |
| `rejectReason` | varchar(500) | Y | ⏳ | 반려 사유 |
| `reviewerId`/`reviewedAt` | int/datetime | Y | ⏳ | 검수 추적 |
| `mimeType`/`fileSize`/`waveformKey` | varchar/int/varchar | Y | ⏳ | 포맷/크기/파형UI |
- idx: `(lineId, creatorId)`, `(episodeId, status)`.
- **`isSelected` 안 둠** — 채택은 `LineTake`가 단일 출처.

### 13.3 LineTake (채택) — (line × creator) → recording
| 컬럼 | 타입 | null | 비고 |
|---|---|---|---|
| `lineId` | int | N | idx |
| `creatorId` | int | N | 성우 |
| `recordingId` | int | N | 채택된 take |
| `episodeId` | int | N | 비정규화(조회) |
- **UNIQUE (lineId, creatorId)** ← "라인×성우당 채택 1개" 불변식을 스키마로 강제.
- 채택 변경 = 그 행의 `recordingId` 만 update(형제 플립 불필요, 이전 자동 해제).
- "이 라인에서 이 성우 채택본?" = 1행 조회.

### 13.4 상태 enum (shared, 숫자 enum)
```ts
export enum RecordingStatus {
  RECORDED = 10,   // 성우 제출
  REVIEW = 20,     // 검수 대기
  APPROVED = 30,   // 검수 통과(채택 가능)
  REJECTED = 40,   // 반려(재녹음)
}
```
+ `RECORDING_STATUS_TRANSITIONS`/`canTransitionRecording` (EpisodeStatus 패턴).

### 13.5 채택 흐름 / 불변식
- 채택 = `LineTake` upsert(`lineId,creatorId` → recordingId). **APPROVED take만** 채택 가능.
- 캐스팅 검증: `recording.creatorId` 가 그 line 의 character 에 **캐스팅된 성우**인지(casting 조회).
- 소프트 참조(lineId/creatorId) — 하드 FK 로 다른 애그리게이트(Episode 내부 Line, Creator) 안 묶음. 커맨드 시 존재/소속 검증.
- 멀티테이크 허용: 같은 (lineId, creatorId)에 Recording 여럿.

### 13.6 이벤트 (사가)
- `RecordingSubmitted`(RECORDED) → 검수 큐/대시보드.
- `RecordingApproved` / `RecordingRejected`.
- `TakeSelected`(lineId, creatorId, recordingId) → 캐스트별 타임라인/완성도 갱신.
- (선택) 어떤 성우 캐스트의 **모든 라인 채택 완료** → 그 캐스트 "완성"/Episode 전이 트리거.

### 13.7 타임라인 (캐스트별 유도, 저장 X)
선택 성우의 라인별 **LineTake → Recording.durationMs** + `line.gapBeforeMs` + `cut.holdMs` 로 start/end 계산.

### 13.8 MVP vs 추후
- **MVP**: Recording(`lineId/episodeId/creatorId/audioKey/durationMs/status`) 제출·조회.
- **검수**: `rejectReason/reviewerId/reviewedAt`, 상태 전이, `LineTake` 채택(+ APPROVED 가드).
- **UX/인코딩**: `take/waveformKey/mimeType/fileSize`, 추후 `encodedAudioKey`(인코딩 별도 서버 로드맵과 연결).

---

## 14. 콘텐츠 상태 lifecycle (2026-06-12)

`ContentStatus`(@vooth/shared) 5상태 + 전이.

| 상태 | 라벨 | 의미 |
|---|---|---|
| `PENDING` | 편집중 | 작성/편집 단계 |
| `RECORDING` | 녹음 대기 | 녹음 공개(성우 작업 대상) |
| `SCHEDULED` | 발행 예정 | 발행 예정일 예약됨 |
| `PUBLISHED` | 발행 | 사용자 공개 |
| `ARCHIVED` | 아카이브 | 보관(비공개) |

### 전이 (`CONTENT_STATUS_TRANSITIONS` / `canTransitionContent`)
```
PENDING  ⇄  RECORDING        (수동 양방향)
RECORDING →  SCHEDULED        (자동: 발행 예정 날짜가 채워질 때)
SCHEDULED →  RECORDING        (수동: 예약 취소)
SCHEDULED →  PUBLISHED        (자동: 예정일 도달 → 스케줄러)
PUBLISHED ⇄  ARCHIVED         (수동 양방향)
```
- **수동(back-office 버튼)**: PENDING↔RECORDING, SCHEDULED→RECORDING(취소), PUBLISHED↔ARCHIVED.
- **자동**: RECORDING→SCHEDULED(발행 예정 날짜 입력 시), SCHEDULED→PUBLISHED(스케줄러).

### 필요한 백엔드 (예정)
- **`scheduledPublishAt`(datetime nullable) 컬럼** 추가. 이 값이 채워지면 도메인에서 `RECORDING→SCHEDULED` 자동 전이(+값 비우면 SCHEDULED→RECORDING).
- **상태 변경 엔드포인트**: `content.transitionTo(next)` + `canTransitionContent` 검증(episode 패턴). 예: `PUT /admins/contents/:id/status { status }`.
- **스케줄러**: `scheduledPublishAt <= now` 인 SCHEDULED 콘텐츠를 PUBLISHED 로 전이(주기 잡 or 예약 잡).

### FE (back-office 콘텐츠 상세)
- "상태 & 발행" 카드: 현재 상태 + **허용 수동 전이 버튼** + **발행 예정 날짜(DatePicker)**. 날짜 설정/해제로 SCHEDULED 자동 전이를 트리거.

## 15. 영상화 / 연출 (Composition & Render) 설계 (2026-06-12)

웹툰식 **연속 세로 스크롤 영상**을 만들기 위한 설계. 핵심은 **3계층 분리**다.

| 계층 | 의미 | 소유 | 비고 |
|---|---|---|---|
| **소스(Source)** | 컷/대사/녹음 — 진실 공급원 | Episode·Cut·Line·Recording | 이미 존재 |
| **연출(Direction)** | 표현 방법(위치·페이싱·전환) | 소스 엔티티의 연출 필드(+필요 시 Composition) | anchorY 등 |
| **산출물(Render)** | 실제 mp4 | Render 잡(별도 AR) | 인코딩 서비스가 생성 |

원칙: **컷/회차 길이는 저장하지 않고 녹음 `durationMs`에서 유도**한다. 저장하는 건 사람이 정하는 연출값과 영상 산출물뿐.

### 15.1 이미 확정된 것 (1~3단계)
- **Cut.imageUrl = 원본**, **Cut.imageWidth/imageHeight**(연속 캔버스용), **Cut.cropBox**(표시용 16:10 = focal, 저장 모델 B). 16:10 별도 파일 미저장 — 표시는 원본+박스 CSS 유도.
- **Line.anchorY**(0~1, nullable): 그 대사가 "발화되는 지점"의 컷 내 세로 위치. back-office에서 마커 드래그로 저작, 미지정이면 균등 분배 폴백.
- **채택**: `LineTake`(§13.3, (line × creator) → recording). 렌더 오디오·길이는 채택 take 기준.

### 15.2 연속 스크롤 모델 (anchorY 소비)
컷 원본을 **실제 높이(imageHeight)** 비율로 세로로 이어 붙인 하나의 캔버스를 스크롤한다.

- 렌더 폭 `W`로 정규화 → 컷 i의 렌더 높이 `Hi = W * imageHeight_i / imageWidth_i`, 캔버스 상단 오프셋 `top_i = Σ_{j<i} Hj`, 총 높이 `Htotal = Σ Hi`.
- 라인 L(컷 i)의 **앵커 픽셀** = `top_i + anchorY_L * Hi`.
- **타임라인**: 라인을 순서대로 이어 붙임. 라인 길이 = 채택 take `durationMs`(+ 앞 `gapBeforeMs`), 컷 끝에 `holdMs`. → 각 라인 시작 시각 `s_L`.
- **스크롤 키프레임**: 시각 `s_L`에 `scrollCenter = anchorPixel_L` (뷰포트 중앙에 앵커가 오게 `scrollY = anchorPixel_L - viewportH/2`).
- 키프레임 사이는 **이징 보간** → 라인에 머무는 동안 천천히/정지, 다음 앵커로 스르륵. `scrollY`는 `[0, Htotal - viewportH]`로 클램프.

> 현재 maker `ScrollPreview`는 "컷 통째 hold → 다음 컷"의 단순화 버전. 이 모델로 올리면 **대사 단위(anchorY) 스크롤**이 된다. 길이는 지금도 `durationMs`에서 유도 중이라 그대로 재사용.

### 15.3 연출 필드 — 어디에 둘까 (MVP: 엔티티에 직접)
LineLayout 같은 별도 레이어 없이, `position`/`anchorY`처럼 **소스 엔티티에 연출 필드를 직접** 둔다(YAGNI). 멀티 연출 버전이 실제로 필요해지면 그때 Composition 스냅샷으로 추출.

- **Line**: `anchorY`(완료), `gapBeforeMs`(앞 간격/겹침, 페이싱) — 추가 예정.
- **Cut**: `holdMs`(마지막 대사 뒤 머무는 시간) — 추가 예정. (전환 효과 `transition`은 슬라이드 모드용이라 연속 스크롤 MVP엔 불필요.)
- **에피소드 전역 렌더 설정**(폭/fps/scrollMode/easing/viewport)은 **장기 저장보다 Render 요청 파라미터**로 보는 게 깔끔 → Render 잡 스냅샷에 포함.

### 15.4 Render 도메인 (신설 AR) — 산출물
영상 mp4를 굽는 무거운 작업. core-api는 **잡과 결과만** 들고, 실제 렌더는 **별도 인코딩 서비스**가 한다(메모리의 *알림·인코딩 분리 로드맵*과 정합).

```
Render (AR)
  id
  episodeId
  status            // QUEUED → RENDERING → DONE / FAILED
  params (json)     // { width, fps, scrollMode, easing, viewportRatio } 요청 스냅샷
  source (json)     // 채택/타임라인 스냅샷(렌더 재현용): line별 recordingId·durationMs·anchorY·gap, cut별 hold
  outputUrl?        // 완료 시 mp4 (S3)
  durationMs?       // 산출 영상 길이
  error?            // 실패 사유
```

- `source` 스냅샷을 박아두는 이유: 렌더 시점의 채택/대본을 **불변 캡처** → 이후 소스가 바뀌어도 그 영상은 재현 가능, 인코딩 서비스가 core-api를 역참조하지 않아도 됨.

### 15.5 EDA 흐름 (렌더)
```
[back-office 연출자] 렌더 요청
  → core-api: Render(QUEUED) 저장 + RenderRequested(source 스냅샷) outbox
  → Kafka → [인코딩 서비스] 소비: ffmpeg/Remotion 으로 캔버스 스크롤 + 오디오 합성 → S3 업로드
  → RenderCompleted{ renderId, outputUrl, durationMs } (or RenderFailed{ reason })
  → core-api 소비: Render(DONE/FAILED) 갱신
```
- 오디오 합성 = **채택 take 오디오를 순서대로 concat** + 라인 `gapBeforeMs` 무음 + 컷 `holdMs` 무음. 총 길이 = 스크롤 타임라인 길이(일치 보장).
- core-api는 진실 공급원, 인코딩 서비스는 소비자(역방향 호출 없음).

### 15.6 화면 분리 — 녹음 ↔ 연출
역할·시점·도메인 계층이 달라 **분리**한다(공통 ScrollPreview만 공유).

| 작업 | 앱 | 행위자 | 내용 |
|---|---|---|---|
| **녹음** | vooth-maker | 성우 | 컷/대사별 take 녹음·제출. ScrollPreview는 **읽기전용**(내 take가 어떻게 얹히나) |
| **연출** | voot-back-office | 연출자/관리자 | 채택(LineTake) + anchorY/gap/hold + 전역 렌더 설정 + **편집형 ScrollPreview** + 렌더 요청 |

### 15.7 저장 vs 유도 경계
| 항목 | 처리 |
|---|---|
| 컷/회차 **길이** | 저장 X — 채택 take `durationMs`에서 유도 |
| 컷 원본 **크기(w/h)**, **cropBox** | 저장(Cut) |
| 라인 **anchorY**, **gapBeforeMs** | 저장(Line) |
| 컷 **holdMs** | 저장(Cut) |
| **채택**(line×creator→recording) | 저장(LineTake) |
| 전역 렌더 설정(폭/fps/scrollMode) | Render 잡 파라미터(요청 스냅샷) |
| **mp4 산출물** | 저장(Render.outputUrl, 인코딩 서비스 생성) |

### 15.8 MVP vs 추후
- **MVP**: Line.`gapBeforeMs` + Cut.`holdMs` 추가 → maker/연출 **ScrollPreview를 anchorY 기반 연속 스크롤로 업그레이드**(클라 미리보기, mp4 없음). 실제 영상감을 먼저 확정.
- **추후**: Render AR + 인코딩 서비스(ffmpeg/Remotion) + 연출 페이지(채택·전역설정·렌더 요청). 슬라이드/전환 모드, 가로형 영상(=cropBox 재사용)도 이 단계.

### 15.9 미해결/결정 필요
- `viewportH`(미리보기/렌더 세로 가시 영역) 기준값 — 렌더 폭 대비 비율로 둘지(예 16:10), 별도 설정할지.
- 키프레임 이징 종류(선형/smoothstep)와 컷 진입 시 "스크롤 vs 컷전환" 기본 모드.
- 채택이 안 된 라인의 렌더 처리(placeholder 무음 + 균등 길이 vs 렌더 차단).

---

## 16. 리셋 & 현재 기준 (2026-06-16)

> §4~15 는 **리셋 전 설계/구현 기록**이다(코드엔 현재 없음, 재구축 참고용). 이 절이 **현재 코드 상태 + 최신 확정 설계**다.

### 16.1 현재 코드 상태 (리셋 결과)
account/role/admin(+role이 의존하는 permission) **만 남기고 전부 삭제**했다. mock UI로 화면을 다시 시작하는 게 목표.

- **core-api**: `account / role / permission / auth(admin) / me(admin)` 만. 삭제: `casting, character, content, creator, episode, file, line-take, recording, review, tag`.
  - auth: `admins/auth/login/google`(웹 idToken) + `admins/me` 만. creator/director auth·me·guard 삭제(`AdminGuard`만 유지).
  - `entities.ts` = DddEvent/Account/Role/Permission. `domain.module` = account/role/permission/auth/me.
- **@vooth/shared**: `account`(AccountStatus·AccountType) / `role`(RoleType) / `permission`(PermissionCategory) 만. 삭제: episode/review/recording/content(+TagColor)/character/type(CalendarDate).
- **프론트 3앱**: 모두 **로그인 + 인증 게이트 + 빈 셸**로 리셋(각 `AppLayout` 최소화, `HomePage`/PlaceholderPage).
  - ⚠️ maker/tool 로그인은 삭제된 `creators|directors/auth/.../desktop`·`creators|directors/me` 를 호출 → **런타임 미동작(인증 정책 재설계 필요)**. back-office(admin 웹)만 정상.
- **back-office 메뉴 IA(신규)**: `대시보드 · 컨텐츠 · 크리에이터 · 검수 · 정산 · 마케팅 · 분석 · 계정관리 · 고객지원 · 설정`. (`layouts/menu.ts` 단일 정의 → 사이드바·라우팅 공유, 화면은 PlaceholderPage부터 채움.)

### 16.2 회차 상태 (EpisodeStatus) — 확정안 (재구축 기준)
`@vooth/shared`(리셋으로 현재 삭제됨, 재도입 시 이 정의):
```
DRAFT=10 → READY=20 → RECORDING=30 → REVIEWING=40 → PUBLISHED=60   (50=과거 APPROVED, 제거/공백)
전이: DRAFT→READY→RECORDING→REVIEWING→PUBLISHED, REVIEWING→RECORDING(역방향)
```
- **회차 단위 APPROVED 없음.** 승인은 (회차×성우) 검수 단위(§16.3)에만 존재. `REVIEWING` = "한 캐스팅이라도 검수요청됨" 롤업.
- `validRecordable` = `READY|RECORDING|REVIEWING` 허용(한 성우 검수요청 후에도 다른 성우는 계속 녹음/채택 가능).
- 자동전이: 첫 녹음 생성 시 `READY→RECORDING`(RecordingCreatedEvent 핸들러, await + 멱등).

### 16.3 검수 = (회차 × 성우 캐스팅) 단위 — Review(EpisodeReview) 도메인 (확정안)
검수는 회차 전체가 아니라 **(회차 × 성우)** 단위다. 성우마다 완료 시점이 달라, **성우가 직접 검수 요청**한다. ([[project_episode-review-per-casting]] 메모리 참조)

- 엔티티 `Review`: `id, contentId, episodeId, creatorId, status, reviewerId?, rejectReason?, reviewedOn?` + `UNIQUE(episodeId, creatorId)`.
- `ReviewStatus`(shared): `REQUESTED=10 / APPROVED=20 / REJECTED=30`. 전이: `REQUESTED→APPROVED|REJECTED`, `REJECTED→REQUESTED`(재요청).
- **완성 판정(성우별)**: 그 성우가 캐스팅된 캐릭터의 라인 수 == 그 성우의 LineTake 수 (Casting→characterIds→라인 필터 후 채택 카운트 비교). 단위는 (episode×creator) — 한 성우가 여러 캐릭터 맡으면 묶어서 한 번 검수.
- **엔드포인트**: `POST /creators/reviews`(최초 요청, 기존 행 있으면 거부) · `GET /creators/reviews/episodes/:id`(내 검수상태; 미요청 시 현재 400 → **200+null 로 개선 권장**). 예정: 재검토 요청(REJECTED 전용, 분리), directors 승인/반려 + 회차의 캐스팅별 검수 목록.
- **롤업**: Review REQUESTED 발생/소멸 → episode `RECORDING↔REVIEWING`(이벤트 기반 권장, 순환의존 회피).

### 16.4 녹음/채택 (Recording / LineTake) — 확정 규칙
- `Recording`: (line × creator), `take`는 **서버 부여**(해당 (line,creator) max take+1). 프론트는 take 안 보냄.
- `LineTake`: `UNIQUE(lineId, creatorId) → recordingId`. 성우 본인이 채택.
- **녹음 삭제**: `DELETE /creators/recordings/:id` — 소유권(creatorId) 검증, **그 recording을 가리키는 LineTake만** 해제(`remove({lineId,creatorId,recordingId})`로 정확히 1행), `softRemove`, `@Transactional`(순차 실행). (S3 오디오 정리·마지막 녹음 삭제 시 상태 롤백은 `RecordingDeletedEvent` 비동기로 — 예정.)

### 16.5 콘텐츠 상태 lifecycle (ContentStatus) — 확정안 (2026-06-16)
§14를 대체. 콘텐츠 7상태 풀 파이프라인. (값은 문자열 enum 컨벤션 유지: `draft/recording/reviewing/approved/scheduled/published/archived`)

| 상태 | 라벨 | 의미 |
|---|---|---|
| `DRAFT` | 초안 | 생성 직후, 편집 단계 |
| `RECORDING` | 녹음 중 | 성우 녹음/채택 진행 |
| `REVIEWING` | 검수 중 | 검수 진행(회차 검수와 연동) |
| `APPROVED` | 검수 완료 | 전 회차 검수 통과 |
| `SCHEDULED` | 발행 대기 | 발행 예정일 예약됨 |
| `PUBLISHED` | 발행 | 사용자 공개 |
| `ARCHIVED` | 보관 | 보관(비공개) |

**전이 화이트리스트 + 트리거** (`CONTENT_STATUS_TRANSITIONS` / `canTransitionContent`) — 2026-06-16 확정:

| from → to | 트리거 |
|---|---|
| `DRAFT → RECORDING` | **자동**: 콘텐츠의 회차 하나라도 RECORDING 진입 시 |
| `RECORDING → REVIEWING` | **자동**: 모든 회차 검수 완료 시(콘텐츠 단위 검수 게이트 오픈) |
| `REVIEWING → RECORDING` | **자동**: 회차가 다시 검수 미완으로 회귀 시 |
| `REVIEWING → APPROVED` | **수동**: 검수자가 콘텐츠 검수 완료 처리 |
| `APPROVED → REVIEWING` | 되돌리기(재검수) — 허용 |
| `APPROVED → SCHEDULED` | **수동**: 검수자가 발행 예정일(`scheduledPublishAt`) 설정 시 |
| `SCHEDULED → APPROVED` | **자동**: 발행 예정일이 비워지면 |
| `SCHEDULED → PUBLISHED` | **자동**: 스케줄러가 예정일 도달 시 |
| `PUBLISHED ⇄ ARCHIVED` | **수동**: 관리자 |

```
DRAFT → RECORDING → REVIEWING → APPROVED → SCHEDULED → PUBLISHED ⇄ ARCHIVED
                       ⇅(회귀)              ⇅(예약취소)
                    RECORDING             APPROVED
   (APPROVED → REVIEWING 재검수 가능)
```

**🔒 핵심 불변식 — 발행 후 회귀 금지**: `PUBLISHED` 도달 이후에는 **발행 이전 상태(DRAFT~SCHEDULED)로 절대 회귀하지 않는다.** 화이트리스트가 `PUBLISHED→ARCHIVED`/`ARCHIVED→PUBLISHED`만 허용해 구조적으로 막고, **모든 자동 롤업 핸들러는 "현재 상태가 발행 이전일 때만" 작동**하도록 가드한다(연재 중 회차 문제가 생겨도 콘텐츠 상태는 회귀 X — 별도 운영으로 관리).

**2단계 검수 구조(해석)**: 회차(EpisodeReview, (회차×성우)) 검수가 모두 끝나면 → 콘텐츠가 `REVIEWING`(콘텐츠 단위 최종 검수 게이트) 진입 → 검수자가 수동으로 `APPROVED`. "모든 회차 검수 완료"의 정확한 정의(전 회차의 전 캐스팅 EpisodeReview APPROVED 등)는 episode 모델(§16.2~16.3)과 맞춰 확정.

**발행 예정일 연동**: `scheduledPublishAt`(datetime nullable) — 설정 시 `APPROVED→SCHEDULED`, 비우면 `SCHEDULED→APPROVED`. 스케줄러가 `scheduledPublishAt <= now` 인 SCHEDULED 콘텐츠를 `PUBLISHED`로.

**필요 백엔드**: `scheduledPublishAt` 컬럼, `content.transitionTo(next)`+`canTransitionContent`(발행 후 회귀 차단 포함), `PUT /admins/contents/:id/status`(수동 전이: REVIEWING→APPROVED, APPROVED→REVIEWING, PUBLISHED⇄ARCHIVED), 발행 예정일 설정 엔드포인트, 스케줄러, 회차 검수 롤업 **이벤트 핸들러**(DRAFT→RECORDING / RECORDING↔REVIEWING, 발행 이전 가드 포함).

### 16.6 다음 작업 후보
1. 인증 정책 재설계(maker/tool 로그인 — admin 통일 vs creator/director 데스크톱 재도입).
2. back-office 화면 mock부터 재구축(메뉴별 PlaceholderPage 채우기). 계정관리는 현존 account/role/permission 도메인 기준으로 우선 구현 가능.
3. content/episode/recording/review 도메인 재도입 시 §16.2~16.5 기준 적용.
