import { Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule as NestTypeOrmModule } from '@nestjs/typeorm';
import { ConfigsService } from '@configs';
import entities from './entities';
import { DataSource } from 'typeorm';
import { TraceIdSubscriber } from './subscribers/trace-id.subscriber';

@Module({
  imports: [
    NestTypeOrmModule.forRootAsync({
      inject: [ConfigsService],
      useFactory: (configsService: ConfigsService) => ({
        ...configsService.mysql,
        entities,
        synchronize: true,
        logging: false,
        timezone: 'Z',
      }),
    }),
  ],
  providers: [TraceIdSubscriber],
})
export class TypeOrmModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TypeOrmModule.name);

  constructor(private readonly datasource: DataSource) {}

  onModuleInit() {
    if (this.datasource.isInitialized) {
      this.logger.log('Database connection is ready.');
    }
  }

  onModuleDestroy() {
    this.datasource.destroy();
    this.logger.log('Database connection is closing.');
  }
}
