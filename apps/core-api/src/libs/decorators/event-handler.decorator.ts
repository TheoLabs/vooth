import { DddEvent } from '@libs/ddd';
import { EventStoreRegistry } from '@libs/event-store';

export function EventHandler(
  event: new (...args: any[]) => DddEvent,
  options?: { description?: string }
): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    EventStoreRegistry.register({
      eventName: event.name,
      target: target.constructor,
      methodKey: propertyKey,
      description: options?.description,
    });
    return descriptor;
  };
}
