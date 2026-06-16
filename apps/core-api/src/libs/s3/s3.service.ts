import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigsService } from '@configs';

/** presigned URL 발급 입력. */
export interface PresignPutInput {
  /** S3 객체 키(예: contents/thumbnail/2026/uuid.png). */
  key: string;
  /** 업로드 Content-Type(예: image/png). 지정 시 PUT 요청도 동일 헤더를 보내야 한다. */
  contentType?: string;
  /** 만료(초). 기본 300초. */
  expiresIn?: number;
}

export interface PresignPutResult {
  /** 프론트가 이 URL 로 직접 PUT 업로드한다. */
  url: string;
  /** 업로드 후 엔티티에 저장할 객체 키. */
  key: string;
}

/**
 * S3(LocalStack 호환) 클라이언트 래퍼.
 * - 프론트는 presigned PUT URL 로 S3 에 직접 업로드한다.
 * - 백엔드는 키만 발급/저장하고 바이너리는 다루지 않는다.
 */
@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(private readonly configsService: ConfigsService) {
    const { region, accessKey, secretKey } = this.configsService.aws;
    const { endpoint, bucket } = this.configsService.s3;

    this.bucket = bucket;
    this.endpoint = endpoint;
    this.client = new S3Client({
      region,
      endpoint,
      // LocalStack 및 path-style 접근 호환.
      forcePathStyle: true,
      // AWS SDK v3 의 기본 flexible checksum(CRC32)을 끈다.
      // 켜져 있으면 presigned PUT URL 에 x-amz-checksum-crc32 placeholder 가 박혀
      // 실제 body 와 불일치 → 400. WHEN_REQUIRED 로 두면 presigned 업로드가 정상 동작한다.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });
  }

  get bucketName(): string {
    return this.bucket;
  }

  /** 객체의 공개 접근 URL(path-style). LocalStack: http://localhost:4566/vooth/<key>. */
  getPublicUrl(key: string): string {
    const base = this.endpoint.replace(/\/$/, '');
    return `${base}/${this.bucket}/${key}`;
  }

  /** 업로드용 presigned PUT URL 발급. */
  async createPresignedPutUrl({ key, contentType, expiresIn = 300 }: PresignPutInput): Promise<PresignPutResult> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return { url, key };
  }

  /** 조회용 presigned GET URL 발급(비공개 객체 다운로드/표시용). */
  async createPresignedGetUrl(key: string, expiresIn = 300): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  /** 객체 삭제. */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  /**
   * 객체 존재/메타 확인(HEAD). 업로드 완료 검증(commit-on-attach)에 사용한다.
   * 없으면 null. (presigned PUT 은 서버가 완료 시점을 모르므로 채택 시 서버가 직접 확인)
   */
  async headObject(key: string): Promise<{ size?: number; contentType?: string } | null> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { size: res.ContentLength, contentType: res.ContentType };
    } catch {
      return null;
    }
  }
}
