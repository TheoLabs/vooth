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
import { CreatorCutController } from './presentation/creator-cut.controller';
import { CreatorCutService } from './applications/creator-cut.service';
import { CastingModule } from '@modules/casting/casting.module';
import { RecordingRepository } from '@modules/recording/infrastructure/recording.repository';

@Module({
  imports: [FileModule, EpisodeModule, CharacterModule, CastingModule],
  controllers: [
    AdminCutController,
    AdminLineController,
    DirectorCutController,
    DirectorLineController,
    CreatorCutController,
  ],
  providers: [
    CutRepository,
    AdminCutService,
    AdminLineService,
    DirectorCutService,
    DirectorLineService,
    CreatorCutService,
    RecordingRepository,
  ],
  exports: [
    CutRepository,
    AdminCutService,
    AdminLineService,
    DirectorCutService,
    DirectorLineService,
    CreatorCutService,
  ],
})
export class CutModule {}
