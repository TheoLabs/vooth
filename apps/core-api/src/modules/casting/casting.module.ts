import { Module } from '@nestjs/common';
import { AdminCastingController } from './presentation/admin-casting.controller';
import { CastingRepository } from './infrastructure/casting.repository';
import { AdminCastingService } from './applications/admin-casting.service';
import { ContentModule } from '@modules/content/content.module';
import { CharacterModule } from '@modules/character/character.module';
import { CreatorModule } from '@modules/creator/creator.module';
import { FileModule } from '@modules/file/file.module';

@Module({
  imports: [FileModule, ContentModule, CharacterModule, CreatorModule],
  controllers: [AdminCastingController],
  providers: [CastingRepository, AdminCastingService],
  exports: [CastingRepository, AdminCastingService],
})
export class CastingModule {}
