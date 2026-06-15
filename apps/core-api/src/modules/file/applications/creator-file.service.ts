import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Transactional } from '@libs/decorators';
import { S3Service } from '@libs/s3';
import { v7 as uuid } from 'uuid';
import { FileRepository } from '../infrastructure/file.repository';
import { File } from '../domain/file.entity';

/** 성우(creator)용 파일 업로드 — admin 과 동일한 presign/commit 흐름(녹음 오디오 등). */
@Injectable()
export class CreatorFileService extends DddService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly s3Service: S3Service
  ) {
    super();
  }

  /**
   * presigned PUT URL 발급 + File 레코드 PENDING(isCommit=false).
   * 프론트는 uploadUrl 로 S3 직접 업로드 후 commit 을 호출한다.
   */
  @Transactional()
  async presign({ originalName, mimeType, size }: { originalName: string; mimeType: string; size: number }) {
    const key = this.buildKey(originalName);

    const file = File.of({ mimeType, originalName, size, key });
    await this.fileRepository.save([file]);

    const { url } = await this.s3Service.createPresignedPutUrl({ key, contentType: mimeType });

    return { fileId: file.id, key, uploadUrl: url, publicUrl: this.s3Service.getPublicUrl(key) };
  }

  /** 업로드 완료된 파일 확정(isCommit=true). */
  @Transactional()
  async commit({ id }: { id: number }) {
    const [file] = await this.fileRepository.find({ ids: [id] });

    if (!file) {
      throw new BadRequestException('존재하지 않는 파일입니다.', { cause: '존재하지 않는 파일입니다.' });
    }

    file.commit();
    await this.fileRepository.save([file]);
  }

  /** uploads/YYYY/MM/uuid.ext 형태의 객체 키 생성. */
  private buildKey(originalName: string): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const ext = originalName.includes('.') ? `.${originalName.split('.').pop()}` : '';
    return `uploads/${yyyy}/${mm}/${uuid()}${ext}`;
  }
}
