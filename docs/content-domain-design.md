# 콘텐츠 도메인 설계 (Content Domain)

> DDD + EDA 기반. 계정/역할/권한은 [`domain-design.md`](./domain-design.md), 보이스툰 타임라인/재생은
> [`maker-domain-design.md`](./maker-domain-design.md) 참고.
> 본 문서는 **작품·회차·컷·대사·캐스팅·녹음** 의 애그리게이트 경계와 컬럼 설계를 정의한다.
>
> ⚠️ **1~10절은 초기 초안**(Webtoon/ULID/fractional position 기준)이며 실제 구현과 일부 다르다.
> **실제 구현 현황·확정 사항은 [11절](#11-구현-현황--오늘-확정-2026-06-10) 참고.**

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
