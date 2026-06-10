import { Module } from '@nestjs/common';
import { CharacterRepository } from './infrastructure/character.repository';
import { AdminCharacterService } from './applications/admin-character.service';
import { ContentModule } from '@modules/content/content.module';
import { AdminCharacterController } from './presentation/admin-character.controller';

@Module({
  imports: [ContentModule],
  controllers: [AdminCharacterController],
  providers: [CharacterRepository, AdminCharacterService],
  exports: [CharacterRepository, AdminCharacterService],
})
export class CharacterModule {}
