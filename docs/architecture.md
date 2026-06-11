# 아키텍처 (DDD + EDA)

> core-api(NestJS)의 도메인 주도 설계(DDD) + 이벤트 기반 아키텍처(EDA) 정리.
> 도메인별 설계는 [`domain-design.md`](./domain-design.md)(계정/역할/권한),
> [`content-domain-design.md`](./content-domain-design.md)(콘텐츠/태그/캐릭터/파일/EDA 신뢰성),
> [`maker-domain-design.md`](./maker-domain-design.md)(보이스툰 타임라인) 참고.

## 1. 한눈에
```
[HTTP 요청]
  → 미들웨어(ALS 스토어 open + traceId)
  → Controller(presentation)  ── AdminGuard 인가 ──┐
  → Service(applications) @Transactional           │  하나의 DB 트랜잭션
       ├─ Repository.find/save (= Context의 tx EntityManager)
       ├─ Aggregate 메서드 → aggregate.publishEvent(DomainEvent)
       └─ Repository.save() → 애그리게이트 + ddd_events 행을 **같은 트랜잭션**에 적재 (아웃박스)
  → commit
        │
        ▼  (트랜잭셔널 아웃박스)
   ddd_events 테이블 ──[Debezium CDC]──▶ Kafka(dbserver1.vooth.ddd_events)
                                              │
                                              ▼
                                   EventStore 컨슈머
                                     - eventType(=클래스명)으로 @EventHandler 라우팅
                                     - 핸들러를 ALS 컨텍스트 안에서 실행(@Transactional 가능)
                                     - 바운디드 재시도(3회) → 소진 시 DLQ(<topic>.dlq)
                                              │
                                              ▼
                                   @EventHandler 메서드 (다운스트림 도메인, 멱등)
```
핵심: **명령(command) 트랜잭션 안에서 도메인 이벤트를 아웃박스 테이블에 같이 저장**하고,
그 테이블 변경을 **CDC로 Kafka에 흘려** 다른 애그리게이트/컨텍스트가 **비동기로 반응**한다.

## 2. 모듈 & 레이어
`apps/core-api/src/modules/<domain>/` 4계층:
```
modules/<domain>/
  presentation/   Controller + DTO        (@Controller, @UseGuards(AdminGuard), { data } 응답)
  applications/   Service                 (DddService 상속, @Transactional, @EventHandler)
  domain/         Entity(=Aggregate), Events
  infrastructure/ Repository              (DddRepository 상속)
  <domain>.module.ts
```
- 도메인 모듈은 `modules/domain.module.ts`에 등록.
- 공용 인프라: `libs/`(ddd, event-store, s3, decorators, filters, intercepters, pipes, logger, utils), `common/`(context, guards, jwt).

## 3. DDD 빌딩블록
| 요소 | 위치 | 역할 |
|---|---|---|
| **DddAggregate** | `libs/ddd/ddd-aggregate.ts` | 애그리게이트 루트 베이스. 공통 컬럼(`createdAt/updatedAt`, `createdBy/updatedBy`(select:false), **`deletedAt`=소프트삭제**), `publishEvent()/getPublishedEvents()`, `setTraceId()`, `stripUnchanged()`(변경분만), `toInstance(dto)` |
| **DddEvent** | `libs/ddd/ddd-event.ts` | `@Entity('ddd_events')` = **아웃박스 테이블**. `eventType = constructor.name`, `payload`(JSON text), `eventStatus(PENDING/PROCESSED/FAILED)`, `traceId`, `occurredAt`. `fromEvent()`로 직렬화 |
| **DddRepository<T>** | `libs/ddd/ddd-repository.ts` | `entityManager` = **Context의 tx 매니저 ?? DataSource.manager**. `save()` = 엔티티 저장 + **이벤트 아웃박스 저장(같은 트랜잭션)**. `softRemove()` |
| **DddService** | `libs/ddd/ddd-service.ts` | `entityManager`/`context` 주입(private). 서비스 베이스 |
| **@Transactional** | `libs/decorators/transactional.decorator.ts` | 트랜잭션 경계 + Context에 tx 매니저 주입 |
| **Context** | `common/context/context.service.ts` | AsyncLocalStorage 기반 요청/실행 컨텍스트 |
| **@EventHandler** | `libs/decorators/event-handler.decorator.ts` | 이벤트 핸들러 등록(클래스명 키) |
| **TraceIdSubscriber** | `databases/typeorm/subscribers/trace-id.subscriber.ts` | 모든 DddAggregate 의 `createdBy/updatedBy`를 traceId(Context TXID)로 채움. **cascade 로 생성/수정되는 하위 엔티티(컷·대사 등)** 의 감사 컬럼 누락 보완 |
| **decimalTransformer** | `libs/utils/orm.ts` | DECIMAL 컬럼(예: `position`)을 number 로 정규화(mysql 은 문자열 반환) |

## 4. 트랜잭션 & 컨텍스트 (AsyncLocalStorage)
- `Context`는 `AsyncLocalStorage<Map>` 위에 키-값(`ContextKey`: `ENTITY_MANAGER`, `DDD_EVENTS`, `TXID`, `ACCOUNT`, `ROLE`, …).
- **스토어를 여는 주체**:
  - HTTP: 요청 미들웨어가 `asyncLocalStorage.run(new Map(), next)`로 열고 `TXID`(traceId) 주입.
  - **Kafka 컨슈머**: `EventStore`가 핸들러마다 `asyncLocalStorage.run(new Map())`로 연다(없으면 `Context.set`이 `There is no context store` throw).
- **`@Transactional` 동작**:
  ```
  entityManager.transaction(txEm => {
    context.set(ENTITY_MANAGER, txEm)   // 이후 Repository가 이 tx 매니저 사용
    await 원본메서드()
  }) // commit/rollback
  ```
  도메인 이벤트 전파는 `Repository.save()` 의 아웃박스 적재(같은 트랜잭션)뿐 — 별도 in-memory emit 경로는 없다.
- `DddRepository.entityManager`는 `context.get(ENTITY_MANAGER) || datasource.manager` → 트랜잭션 안이면 자동으로 tx 매니저, 밖이면 기본 매니저(조회 등).

## 5. 트랜잭셔널 아웃박스
- 애그리게이트가 `this.publishEvent(new SomeEvent(...))` 로 이벤트를 모은다.
- `repository.save([aggregate])`:
  1. `entityManager.save(entities)` — 애그리게이트 저장
  2. `DddEvent.fromEvent(e)` → `entityManager.save(dddEvents)` — **`ddd_events`에 같은 트랜잭션으로 적재**
  → 애그리게이트 변경과 이벤트 기록이 **원자적**(아웃박스 패턴). 메시지 유실/이중기록 없음.
- `eventType`은 **이벤트 클래스명**(`constructor.name`). 라우팅 키와 동일.

## 6. EDA 파이프라인 (CDC → Kafka → 컨슈머)
```
ddd_events(INSERT) → Debezium(connectors/mysql.json) → Kafka topic: dbserver1.vooth.ddd_events
   → EventStore(libs/event-store/event-store.service.ts)
       parseRecord(Debezium after-image) → eventType 으로 @EventHandler 라우팅
```
- **@EventHandler 등록**: `EventStoreRegistry`(전역) — 데코레이터가 `eventName = EventClass.name`, `target`, `methodKey` 등록. 라우팅은 `record.eventType === eventName`.
- **컨슈머 실행**: 핸들러를 ALS 스토어 안에서 실행 → 핸들러도 `@Transactional` 사용 가능. `record.payload`(역직렬화) + `record`(메타) 전달.
- **신뢰성(재시도 + DLQ)**:
  - 핸들러 실패 시 **바운디드 재시도 3회**(백오프 0.5s→2s).
  - 소진 시 **DLQ 토픽 `<topic>.dlq`**(예: `dbserver1.vooth.ddd_events.dlq`)로 메타(eventId/eventType/handler/attempts/error/원본) 전송 후 continue → 파티션 head-of-line blocking 방지.
  - 핸들러별 독립(하나 실패가 다른 핸들러 안 막음).
- **멱등성은 핸들러 책임**: Kafka는 at-least-once. 중복/replay 대비(예: usageCount는 증분이 아니라 **재계산 set**, 1:1 생성은 존재 시 skip).

## 7. 애그리게이트 간 일관성
- **원칙: 1 트랜잭션 = 1 애그리게이트.**
- 여러 애그리게이트가 엮이는 흐름은 **도메인 이벤트 사가**(결과적 일관성):
  - 예) 콘텐츠 태그 변경 → `ContentSetTagEvent` → Tag.usageCount 재계산.
  - 예) 계정 승인 → `AccountApproved` → Creator 생성(멱등).
  - 예) 검수 승인 → `RecordingApproved` → Episode 최종 take 선택.
- 교차 참조는 **id(소프트 참조)** 로만(하드 FK로 애그리게이트를 묶지 않음). 커맨드 시 존재/소속 검증.

## 8. 인가 & 식별
- **AdminGuard**(`common/guards`): `roleId`/`status`로 관리자 접근 게이트 + Context에 `ACCOUNT`/`ROLE` 주입(`@InjectDataSource` 직접 조회, 전역 의존).
- JWT: `@common/jwt` `TokenService`(CommonModule 전역). 인증 미들웨어/가드에서 Bearer 검증.

## 9. 인프라 (docker-compose)
| 서비스 | 역할 |
|---|---|
| **Kafka**(KRaft, `cp-kafka`) | 이벤트 백본. `auto.create.topics.enable=true`(DLQ 자동생성) |
| **MySQL 8** | 도메인 DB(`vooth`) + 아웃박스(`ddd_events`). binlog=CDC 소스 |
| **Debezium**(connect 3.0) | MySQL binlog → Kafka. `topic.prefix.DB.table` = `dbserver1.vooth.ddd_events` |
| **kafka-ui** | 토픽/메시지 확인 |
| **LocalStack S3** | 파일 스토리지(버킷 `vooth`). presigned 업로드 |

## 10. 컨벤션 (요약 — 상세는 CLAUDE.md)
- 목록 Query DTO 는 `PaginationDto` 상속, 응답 `{ items, total }`.
- 컨트롤러 응답은 `{ data }` 봉투(인터셉터/프론트 언랩).
- 배열 쿼리 = 반복 파라미터(`?a=1&a=2`).
- 바이너리는 S3(키만 저장), presigned 업로드 + File 도메인 commit.
- (프론트) 부분 수정 = 변경 필드만, 타임스탬프 = UTC 저장 → 로컬 표시.

## 11. 알아둘 점 / 한계
- 도메인 이벤트 전파는 **아웃박스(ddd_events) → CDC → Kafka** 단일 경로. (과거의 `eventEmitter.emit('ddd-event.created')` in-memory 훅은 **제거됨** — 구독자 없는 죽은 코드였음)
- 컨슈머 신뢰성은 재시도+DLQ까지. **DLQ 소비/알림(재처리·슬랙)** 은 다음 단계.
- 멱등성은 각 핸들러가 보장해야 함(프레임워크가 강제 X).
- `ddd_events.eventStatus(PENDING/PROCESSED/FAILED)`/`scheduledAt` 컬럼은 있으나, 상태 갱신/지연 재처리는 아직 적극 활용 X(향후 아웃박스 상태추적/스케줄 재처리 여지).
- 멀티서비스 분리 로드맵: 알림·인코딩 등은 Kafka를 백본으로 별도 서비스로 분리 예정. 다운스트림 서비스 내부에서만 BullMQ 하이브리드(필요 시).
