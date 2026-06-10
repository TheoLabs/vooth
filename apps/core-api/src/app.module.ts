import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ConfigsModule } from '@configs';
import { DatabasesModule } from '@databases';
import { CommonModule } from './common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ExceptionFilter } from '@libs/filters';
import { RequestLoggerInterceptor } from '@libs/intercepters';
import { ContextMiddleware, UUIDMiddleware } from './middlewares';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventStoreModule } from '@libs/event-store';
import { S3Module } from '@libs/s3';
import { DomainModule } from './modules/domain.module';

@Module({
  imports: [
    CommonModule,
    ConfigsModule,
    DatabasesModule,
    EventEmitterModule.forRoot(),
    EventStoreModule,
    S3Module,
    DomainModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware, UUIDMiddleware).forRoutes('*');
  }
}
