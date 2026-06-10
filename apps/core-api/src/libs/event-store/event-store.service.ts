import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { ConfigsService } from '@configs';
import { asyncLocalStorage, ContextKey } from '@common/context';
import { EventStoreRegistry } from './event-store.registry';

interface DddEventRecord {
  id: string;
  traceId: string;
  eventType: string;
  payload: unknown;
  [key: string]: unknown;
}

type Handler = Record<string | symbol, (...args: any[]) => unknown>;

/**
 * Debezium CDC 가 ddd_events 테이블 변경을 Kafka 단일 토픽으로 흘려보내면,
 * 이 서비스가 토픽을 구독해 메시지를 파싱하고 @EventHandler 로 등록된 핸들러로 라우팅한다.
 *
 * 흐름: ddd_events(outbox) → Debezium → Kafka(ddd_events 토픽) → EventStore → @EventHandler 메서드
 */
@Injectable()
export class EventStore implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(EventStore.name);
  private consumer?: Consumer;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly configsService: ConfigsService
  ) {}

  async onApplicationBootstrap() {
    if (EventStoreRegistry.getRegistrations().length === 0) {
      this.logger.log('등록된 @EventHandler 가 없어 Kafka consumer 를 시작하지 않습니다.');
      return;
    }

    const { clientId, brokers, groupId, topic } = this.configsService.kafka;
    const kafka = new Kafka({ clientId, brokers });
    this.consumer = kafka.consumer({
      groupId,
      sessionTimeout: 6000,
      heartbeatInterval: 2000,
      rebalanceTimeout: 10000,
      maxWaitTimeInMs: 1000,
    });

    await this.consumer.connect();
    await this.consumer.subscribe({ topic, fromBeginning: false });
    await this.consumer.run({ eachMessage: (payload) => this.handleMessage(payload) });

    this.logger.log(`Kafka consumer 시작 (groupId=${groupId}) — topic: ${topic}`);
  }

  private async handleMessage({ message }: EachMessagePayload) {
    const raw = message.value?.toString();
    if (!raw) return;

    const record = this.parseRecord(raw);
    if (!record) return;

    const handlers = EventStoreRegistry.getHandlers(record.eventType);
    for (const registration of handlers) {
      try {
        // @Transactional 등이 의존하는 AsyncLocalStorage 컨텍스트 스토어를 핸들러마다 연다.
        await asyncLocalStorage.run(new Map<string, unknown>(), async () => {
          asyncLocalStorage.getStore()?.set(ContextKey.TXID, record.traceId);
          const instance = this.moduleRef.get<Handler>(registration.target as never, { strict: false });
          await instance[registration.methodKey](record.payload, record);
        });
      } catch (error) {
        this.logger.error(
          `EventHandler 실행 실패 [${record.eventType}#${String(registration.methodKey)}] - ${record.id}\n${error instanceof Error ? error.stack : String(error)}`
        );
      }
    }
  }

  /**
   * Debezium 메시지(value)를 파싱해 ddd_events 행(after-image)과 payload 를 복원한다.
   * schemas.enable=true 면 { schema, payload } 래퍼가, false 면 envelope 자체가 들어온다.
   * 삭제(op='d')는 after 가 없어 스킵한다.
   */
  private parseRecord(raw: string): DddEventRecord | null {
    let envelope: any;
    try {
      envelope = JSON.parse(raw);
    } catch {
      this.logger.warn('Kafka 메시지 JSON 파싱 실패 — 스킵');
      return null;
    }

    const change = envelope?.payload ?? envelope;
    const after = change?.after;
    if (!after || !after.eventType) return null;

    return { ...after, payload: this.parsePayload(after.payload) };
  }

  private parsePayload(payload: unknown): unknown {
    if (typeof payload !== 'string') return payload;
    try {
      return JSON.parse(payload);
    } catch {
      return payload;
    }
  }

  async onModuleDestroy() {
    await this.consumer?.disconnect();
  }
}
