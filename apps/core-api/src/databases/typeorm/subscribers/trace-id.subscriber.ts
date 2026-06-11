import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { Context, ContextKey } from '@common/context';
import { DddAggregate } from '@libs/ddd';

/** createdBy/updatedBy 는 DddAggregate 의 private 필드라 세팅 시 구조적 타입으로 캐스팅한다. */
type Auditable = { createdBy?: string; updatedBy?: string };

/**
 * DddAggregate 를 상속한 모든 엔티티의 createdBy/updatedBy 를 traceId(Context TXID)로 채운다.
 *
 * DddRepository.save 의 `setTraceId` 는 save() 에 직접 넘긴 최상위 엔티티에만 적용되므로,
 * cascade 로 생성/수정되는 하위 엔티티(컷·대사 등)는 감사 컬럼이 비어버린다.
 * 이 subscriber 가 insert/update 직전에 일괄로 채워 그 누락을 메운다.
 *
 * 컨텍스트(traceId)가 없으면(요청 밖 작업 등) 건너뛴다 — Context.get 은 no-store 시 undefined.
 */
@Injectable()
@EventSubscriber()
export class TraceIdSubscriber implements EntitySubscriberInterface<DddAggregate> {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly context: Context
  ) {
    this.dataSource.subscribers.push(this);
  }

  // DddAggregate 를 상속받은 모든 엔티티를 감시
  listenTo() {
    return DddAggregate;
  }

  beforeInsert(event: InsertEvent<DddAggregate>) {
    const traceId = this.context.get<string>(ContextKey.TXID);
    if (!traceId || !event.entity) {
      return;
    }

    // createdAt 세팅 타이밍에 의존하지 않도록 무조건 채운다.
    const entity = event.entity as unknown as Auditable;
    entity.createdBy = traceId;
    entity.updatedBy = traceId;
  }

  beforeUpdate(event: UpdateEvent<DddAggregate>) {
    const traceId = this.context.get<string>(ContextKey.TXID);
    if (!traceId || !event.entity) {
      return;
    }

    (event.entity as unknown as Auditable).updatedBy = traceId;
  }
}
