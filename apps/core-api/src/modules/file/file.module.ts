import { Module } from '@nestjs/common';
import { S3Module } from '@libs/s3';
import { FileRepository } from './infrastructure/file.repository';
import { FileService } from './applications/file.service';
import { AdminFileController } from './presentation/admin-file.controller';
import { CreatorFileController } from './presentation/creator-file.controller';

@Module({
  imports: [S3Module],
  controllers: [AdminFileController, CreatorFileController],
  providers: [FileRepository, FileService],
  exports: [FileService],
})
export class FileModule {}
