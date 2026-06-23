import { Module } from '@nestjs/common';
import { CharacterRepository } from './infrastructure/character.repository';
import { ContentModule } from '@modules/content/content.module';
import { AdminCharacterService } from './applications/admin-character.service';
import { AdminCharacterController } from './presentation/admin-character.controller';
import { FileModule } from '@modules/file/file.module';
import { DirectorCharacterController } from './presentation/director-character.controller';
import { DirectorCharacterService } from './applications/director-character.service';

@Module({
  imports: [ContentModule, FileModule],
  controllers: [AdminCharacterController, DirectorCharacterController],
  providers: [CharacterRepository, AdminCharacterService, DirectorCharacterService],
  exports: [CharacterRepository, AdminCharacterService, DirectorCharacterService],
})
export class CharacterModule {}
