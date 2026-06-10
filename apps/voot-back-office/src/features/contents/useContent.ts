import { useQuery } from '@tanstack/react-query';
import { fetchContent, type ContentListItem } from '../../api/contents.api';
import { ApiError } from '../../lib/apiClient';

/**
 * 콘텐츠 상세(GET /admins/contents/:id) 조회.
 * 목록에서 넘어온 데이터가 있으면 initialData 로 즉시 표시하고 백그라운드로 최신화한다.
 */
export function useContent(id: number, initialData?: ContentListItem) {
  return useQuery<ContentListItem, ApiError>({
    queryKey: ['content', id],
    queryFn: () => fetchContent(id),
    initialData,
    enabled: Number.isFinite(id),
    retry: false,
  });
}
