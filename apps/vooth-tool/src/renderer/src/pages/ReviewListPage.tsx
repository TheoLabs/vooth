import { EpisodeMenuList } from '../components/EpisodeMenuList'

export function ReviewListPage(): React.JSX.Element {
  return (
    <EpisodeMenuList
      basePath="/review"
      heading="검수"
      subtitle="회차를 골라 최종 영상(캐스트)을 재생·검수하고 승인/반려합니다."
    />
  )
}
