import { Module } from '@nestjs/common';
import { CutRepository } from './infrastructure/cut.repository';
import { AdminCutController } from './presentation/admin-cut.controller';
import { AdminCutService } from './applications/admin-cut.service';
import { EpisodeModule } from '@modules/episode/episode.module';
import { FileModule } from '@modules/file/file.module';

@Module({
  imports: [FileModule, EpisodeModule],
  controllers: [AdminCutController],
  providers: [CutRepository, AdminCutService],
  exports: [CutRepository, AdminCutService],
})
export class CutModule {}
