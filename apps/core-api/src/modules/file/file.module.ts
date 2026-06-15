import { Module } from '@nestjs/common';
import { S3Module } from '@libs/s3';
import { AdminFileController } from './presentation/admin-file.controller';
import { FileRepository } from './infrastructure/file.repository';
import { AdminFileService } from './applications/admin-file.service';
import { CreatorFileController } from './presentation/creator-file.controller';
import { CreatorFileService } from './applications/creator-file.service';

@Module({
  imports: [S3Module],
  controllers: [AdminFileController, CreatorFileController],
  providers: [FileRepository, AdminFileService, CreatorFileService],
  exports: [FileRepository, AdminFileService, CreatorFileService],
})
export class FileModule {}
