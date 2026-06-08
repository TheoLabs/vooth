import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigsModule } from '@configs';
import { DatabasesModule } from '@databases';

@Module({
  imports: [ConfigsModule, DatabasesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
