import { randomUUID } from 'crypto';
import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Transactional } from '@libs/decorators';
import { S3Service } from '@libs/s3';
import { FileRepository } from '../infrastructure/file.repository';
import { File } from '../domain/file.entity';

@Injectable()
export class FileService extends DddService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly s3Service: S3Service
  ) {
    super();
  }

  /**
   * presigned PUT URL 발급 + File(미커밋) 적재.
   * 프론트는 `uploadUrl` 로 S3 에 직접 PUT(Content-Type = mimeType 동일) 후, 받은 `fileId` 를
   * 소유 도메인(예: creator.avatarFileId)에 넘긴다. 커밋은 그 도메인 저장 시점에 일어난다.
   */
  @Transactional()
  async presign({
    originalName,
    mimeType,
    size,
    prefix,
  }: {
    originalName: string;
    mimeType: string;
    size: number;
    prefix?: string;
  }) {
    const key = this.buildKey(prefix, originalName);
    const file = File.of({ key, originalName, mimeType, size });
    await this.fileRepository.save([file]);

    const { url } = await this.s3Service.createPresignedPutUrl({ key, contentType: mimeType });

    return { fileId: file.id, key, uploadUrl: url, publicUrl: this.s3Service.getPublicUrl(key) };
  }

  /**
   * 채택 확정(commit-on-attach). **소유 도메인이 파일을 참조하며 저장하는 트랜잭션 안에서 호출한다.**
   * - S3 HEAD 로 실제 업로드를 서버가 직접 검증(클라 commit 신뢰하지 않음).
   * - `mimePrefix` 로 형식 제한(예: 아바타 = `image/`).
   * - 멱등: 이미 커밋이면 그대로 통과.
   *
   * NOTE: 일부러 `@Transactional` 을 붙이지 않는다. 이 데코레이터는 전파(join)를 지원하지 않아
   *       중첩 시 별도 트랜잭션이 열리고 finally 가 Context.ENTITY_MANAGER 를 비워 바깥 트랜잭션을 깨뜨린다.
   *       repository 가 Context.ENTITY_MANAGER 를 읽으므로, 호출자의 `@Transactional` 트랜잭션에 그대로 합성된다.
   *       (단독 호출 시엔 오토커밋 — 단일 행 플립이라 안전)
   */
  async commit(fileId: number, options?: { mimePrefix?: string }): Promise<File> {
    const [file] = await this.fileRepository.find({ ids: [fileId] });

    if (!file) {
      throw new BadRequestException('존재하지 않는 파일입니다.', { cause: '존재하지 않는 파일입니다.' });
    }

    if (options?.mimePrefix && !file.mimeType.startsWith(options.mimePrefix)) {
      throw new BadRequestException('허용되지 않은 파일 형식입니다.', { cause: '허용되지 않은 파일 형식입니다.' });
    }

    const head = await this.s3Service.headObject(file.key);
    if (!head) {
      throw new BadRequestException('업로드되지 않은 파일입니다.', { cause: '업로드되지 않은 파일입니다.' });
    }

    file.commit();
    await this.fileRepository.save([file]);

    return file;
  }

  /**
   * 단일 fileId → 표시용 public URL. 없거나(null/undefined) 파일이 없으면 null.
   * 단건 enrich 용 — 호출부의 `id ? (map.get(id) ?? null) : null` 보일러플레이트를 대체한다.
   *
   * @example
   * dto.avatarUrl = await this.fileService.resolvePublicUrl(creator.avatarFileId);
   */
  async resolvePublicUrl(fileId?: number | null): Promise<string | null> {
    if (!fileId) {
      return null;
    }

    const urls = await this.resolvePublicUrls([fileId]);
    return urls.get(fileId) ?? null;
  }

  /**
   * fileId 들 → 표시용 public URL 맵(일괄, 단일 쿼리 — 목록 enrich 의 N+1 회피).
   * null/undefined/중복은 무시하고, 존재하지 않는 id 는 결과에서 빠진다.
   *
   * @example
   * const urls = await this.fileService.resolvePublicUrls(items.map((i) => i.thumbnailFileId));
   * items.map((i) => ({ ...i, thumbnailUrl: urls.get(i.thumbnailFileId) ?? null }));
   */
  async resolvePublicUrls(ids: (number | null | undefined)[]): Promise<Map<number, string>> {
    const validIds = [...new Set(ids.filter((id): id is number => id != null))];
    if (!validIds.length) {
      return new Map();
    }

    const files = await this.fileRepository.find({ ids: validIds });
    return new Map(files.map((file) => [file.id, this.s3Service.getPublicUrl(file.key)]));
  }

  /** `<prefix>/<year>/<uuid><ext>` 형태의 키 생성. prefix 미지정/부적합 시 `uploads`. */
  private buildKey(prefix: string | undefined, originalName: string): string {
    const safePrefix =
      prefix && /^[a-z0-9][a-z0-9/_-]*$/.test(prefix) && !prefix.includes('..')
        ? prefix.replace(/\/+$/, '')
        : 'uploads';
    const year = new Date().getFullYear();
    return `${safePrefix}/${year}/${randomUUID()}${this.extensionOf(originalName)}`;
  }

  private extensionOf(originalName: string): string {
    const dot = originalName.lastIndexOf('.');
    return dot >= 0 ? originalName.slice(dot).toLowerCase() : '';
  }
}
