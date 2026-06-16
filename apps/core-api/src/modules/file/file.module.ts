import { Module } from '@nestjs/common';
import { S3Module } from '@libs/s3';
import { FileRepository } from './infrastructure/file.repository';
import { AdminFileService } from './applications/admin-file.service';
import { AdminFileController } from './presentation/admin-file.controller';

@Module({
  imports: [S3Module],
  controllers: [AdminFileController],
  providers: [FileRepository, AdminFileService],
  exports: [AdminFileService],
})
export class FileModule {}
