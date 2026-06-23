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
import { DirectorLineController } from './presentation/director-line.controller';
import { DirectorLineService } from './applications/director-line.service';

@Module({
  imports: [FileModule, EpisodeModule, CharacterModule],
  controllers: [AdminCutController, AdminLineController, DirectorCutController, DirectorLineController],
  providers: [CutRepository, AdminCutService, AdminLineService, DirectorCutService, DirectorLineService],
  exports: [CutRepository, AdminCutService, AdminLineService, DirectorCutService, DirectorLineService],
})
export class CutModule {}
