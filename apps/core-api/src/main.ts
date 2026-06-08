import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logger } from '@libs/logger';

(async () => {
  const app = await NestFactory.create(AppModule, { logger });

  app.enableCors({ origin: '*' });

  app.listen(3000, () => {
    logger.log('server is running on 3000. 🚀');
  });
})();
