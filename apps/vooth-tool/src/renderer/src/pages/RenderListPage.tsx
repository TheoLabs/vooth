import { EpisodeMenuList } from '../components/EpisodeMenuList'

export function RenderListPage(): React.JSX.Element {
  return (
    <EpisodeMenuList
      basePath="/render"
      heading="렌더 / 제작"
      subtitle="검수 승인된 회차를 영상으로 렌더해 업로드합니다."
    />
  )
}
