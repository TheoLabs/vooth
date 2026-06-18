import { Module } from '@nestjs/common';
import { CharacterRepository } from './infrastructure/character.repository';
import { ContentModule } from '@modules/content/content.module';
import { AdminCharacterService } from './applications/admin-character.service';
import { AdminCharacterController } from './presentation/admin-character.controller';
import { FileModule } from '@modules/file/file.module';

@Module({
  imports: [ContentModule, FileModule],
  controllers: [AdminCharacterController],
  providers: [CharacterRepository, AdminCharacterService],
  exports: [CharacterRepository, AdminCharacterService],
})
export class CharacterModule {}
