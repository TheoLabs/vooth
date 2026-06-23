import { Module } from '@nestjs/common';
import { CutRepository } from './infrastructure/cut.repository';
import { AdminCutController } from './presentation/admin-cut.controller';
import { AdminLineController } from './presentation/admin-line.controller';
import { AdminCutService } from './applications/admin-cut.service';
import { AdminLineService } from './applications/admin-line.service';
import { EpisodeModule } from '@modules/episode/episode.module';
import { FileModule } from '@modules/file/file.module';
import { CharacterModule } from '@modules/character/character.module';
import { DirectorCutController } from './presentation/director-cut.controller';
import { DirectorCutService } from './applications/director-cut.service';

@Module({
  imports: [FileModule, EpisodeModule, CharacterModule],
  controllers: [AdminCutController, AdminLineController, DirectorCutController],
  providers: [CutRepository, AdminCutService, AdminLineService, DirectorCutService],
  exports: [CutRepository, AdminCutService, AdminLineService, DirectorCutService],
})
export class CutModule {}
