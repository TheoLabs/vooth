import { AdminCastingService } from '@modules/casting/applications/admin-casting.service';
import { CastingRepository } from '@modules/casting/infrastructure/casting.repository';
import { AdminCastingController } from '@modules/casting/presentation/admin-casting.controller';
import { CharacterModule } from '@modules/character/character.module';
import { ContentModule } from '@modules/content/content.module';
import { CreatorModule } from '@modules/creator/creator.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [CharacterModule, CreatorModule, ContentModule],
  controllers: [AdminCastingController],
  providers: [CastingRepository, AdminCastingService],
  exports: [CastingRepository, AdminCastingService],
})
export class CastingModule {}
