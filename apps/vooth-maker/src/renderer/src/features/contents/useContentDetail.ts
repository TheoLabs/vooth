import { useQuery } from '@tanstack/react-query'
import { fetchContentDetail } from '../../api/contents.api'
import { fetchEpisodes } from '../../api/episodes.api'
import { useAuth } from '../../auth/AuthContext'

/** 콘텐츠 상세 1건. */
export function useContentDetail(id: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['content', id],
    queryFn: () => fetchContentDetail(id as string),
    enabled: Boolean(user && id),
    retry: false
  })
}

/** 콘텐츠의 회차 목록. */
export function useEpisodes(contentId: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['episodes', contentId],
    queryFn: () => fetchEpisodes(contentId as string),
    enabled: Boolean(user && contentId),
    retry: false
  })
}
