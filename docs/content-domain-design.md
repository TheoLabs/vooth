# 콘텐츠 도메인 설계 (Content Domain)

> DDD + EDA 기반. 계정/역할/권한은 [`domain-design.md`](./domain-design.md), 보이스툰 타임라인/재생은
> [`maker-domain-design.md`](./maker-domain-design.md) 참고.
> 본 문서는 **작품·회차·컷·대사·캐스팅·녹음** 의 애그리게이트 경계와 컬럼 설계를 정의한다.

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
