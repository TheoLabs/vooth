import { Context } from '@common/context';
import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

export abstract class DddService {
  @InjectEntityManager()
  private readonly entityManager!: EntityManager;

  @Inject()
  private readonly context!: Context;

  @Inject()
  private readonly eventEmitter!: EventEmitter2;
}
