import { apiRequest } from '../lib/apiClient'

/** 대사에 달린 내 녹음본(take). isAdopted = 채택본. audioUrl = 재생용 public URL. */
export interface CreatorRecording {
  id: number
  take: number
  isAdopted: boolean
  durationMs: number
  audioUrl: string | null
}

/** 컷 내 대사. isMine = 로그인 성우가 캐스팅된 캐릭터의 대사(내 녹음). recordings = 내 take 목록(≤3). */
export interface CreatorLine {
  id: number
  characterId: number
  script: string
  order: number
  anchorY: number | null
  isMine: boolean
  recordings: CreatorRecording[]
}

/** GET /creators/episodes/:episodeId/cuts 응답의 컷(Cut + lines). */
export interface CreatorCut {
  id: number
  episodeId: number
  order: number
  imageUrl: string
  imageWidth: number
  imageHeight: number
  lines: CreatorLine[]
}

/** 회차에 등장하는 캐릭터. color 는 응답에 없어 프론트에서 부여한다. */
export interface CreatorCharacter {
  id: number
  name: string
  type: string
}

/** GET /creators/episodes/:episodeId/cuts 응답 — 컷(+대사) 목록 + 등장 캐릭터. */
export interface CreatorCutsResponse {
  cuts: CreatorCut[]
  characters: CreatorCharacter[]
}

/** GET /creators/episodes/:episodeId/cuts — 회차의 컷(+대사) + 캐릭터. */
export function fetchCreatorCuts(episodeId: number): Promise<CreatorCutsResponse> {
  return apiRequest<CreatorCutsResponse>(`/creators/episodes/${episodeId}/cuts`)
}
