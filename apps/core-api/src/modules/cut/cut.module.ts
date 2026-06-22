import { Module } from '@nestjs/common';
import { CutRepository } from './infrastructure/cut.repository';
import { AdminCutController } from './presentation/admin-cut.controller';
import { AdminLineController } from './presentation/admin-line.controller';
import { AdminCutService } from './applications/admin-cut.service';
import { AdminLineService } from './applications/admin-line.service';
import { EpisodeModule } from '@modules/episode/episode.module';
import { FileModule } from '@modules/file/file.module';
import { CharacterModule } from '@modules/character/character.module';

@Module({
  imports: [FileModule, EpisodeModule, CharacterModule],
  controllers: [AdminCutController, AdminLineController],
  providers: [CutRepository, AdminCutService, AdminLineService],
  exports: [CutRepository, AdminCutService],
})
export class CutModule {}
