import { useMutation } from '@tanstack/react-query';
import { uploadViaPresign, type PresignResult } from '../../api/files.api';

/**
 * 파일 업로드 훅.
 * presign → S3 직접 업로드 → commit 을 한 번에 수행하고 결과(publicUrl 등)를 반환한다.
 * (uploadToS3 는 일반 Error, presign/commit 은 ApiError 를 던질 수 있어 error 타입은 Error)
 */
export function useFileUpload() {
  return useMutation<PresignResult, Error, File>({
    mutationFn: (file) => uploadViaPresign(file),
  });
}
