export interface EventHandlerRegistration {
  /** 도메인 이벤트 클래스명. DddEvent.eventType(= constructor.name)과 매칭된다. */
  eventName: string;
  /** 핸들러가 정의된 클래스(생성자). 부트스트랩 시 DI 컨테이너에서 인스턴스를 해석한다. */
  target: object;
  /** 핸들러 메서드명. */
  methodKey: string | symbol;
  /** 문서화용 설명. */
  description?: string;
}

/**
 * @EventHandler 데코레이터가 클래스 로드 시점에 핸들러 메타데이터를 등록하는 전역 레지스트리.
 * 모든 이벤트는 ddd_events 단일 토픽으로 들어오므로 eventName 만으로 라우팅한다.
 */
export class EventStoreRegistry {
  private static readonly registrations: EventHandlerRegistration[] = [];

  static register(registration: EventHandlerRegistration) {
    this.registrations.push(registration);
  }

  static getRegistrations(): readonly EventHandlerRegistration[] {
    return this.registrations;
  }

  /** 특정 이벤트명에 매칭되는 핸들러들. */
  static getHandlers(eventName: string): EventHandlerRegistration[] {
    return this.registrations.filter((r) => r.eventName === eventName);
  }
}
