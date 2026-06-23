import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchDirectorCharacters, type DirectorCharacter } from '../../api/character.api'
import { type Paginated } from '../../api/episode.api'
import { ApiError } from '../../lib/apiClient'

/** GET /directors/contents/:contentId/characters 캐릭터 목록 조회 훅. */
export function useDirectorCharacters(
  contentId: number
): UseQueryResult<Paginated<DirectorCharacter>, ApiError> {
  return useQuery<Paginated<DirectorCharacter>, ApiError>({
    queryKey: ['director-characters', contentId],
    queryFn: () => fetchDirectorCharacters(contentId),
    enabled: Number.isFinite(contentId),
    refetchOnWindowFocus: false,
    retry: false
  })
}
