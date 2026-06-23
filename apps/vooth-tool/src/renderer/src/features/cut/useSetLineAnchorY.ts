import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { saveLineAnchorY, type LineAnchorYItem } from '../../api/cut.api'
import { ApiError } from '../../lib/apiClient'

/**
 * POST /directors/episodes/:episodeId/lines — 대사 anchorY 일괄 저장 뮤테이션.
 * 성공 시 해당 회차 컷 목록 쿼리를 무효화해 서버 값과 동기화한다.
 */
export function useSetLineAnchorY(
  episodeId: number
): UseMutationResult<unknown, ApiError, LineAnchorYItem[]> {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, LineAnchorYItem[]>({
    mutationFn: (anchorYItems) => saveLineAnchorY(episodeId, anchorYItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['director-cuts', episodeId] })
    }
  })
}
