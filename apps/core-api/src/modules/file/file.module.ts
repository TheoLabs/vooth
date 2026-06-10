import { Module } from '@nestjs/common';
import { S3Module } from '@libs/s3';
import { AdminFileController } from './presentation/admin-file.controller';
import { FileRepository } from './infrastructure/file.repository';
import { AdminFileService } from './applications/admin-file.service';

@Module({
  imports: [S3Module],
  controllers: [AdminFileController],
  providers: [FileRepository, AdminFileService],
  exports: [FileRepository, AdminFileService],
})
export class FileModule {}
