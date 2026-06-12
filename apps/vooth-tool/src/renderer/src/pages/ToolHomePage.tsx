import { useNavigate } from 'react-router-dom'
import { MOCK_DIR_EPISODES } from '../mocks/direction.mock'
import './ToolHomePage.css'

/**
 * vooth-tool 연출·제작 홈 — 연출할 회차 목록(mock).
 * 컷/대사는 back-office 등록, 녹음은 vooth-maker. 이 도구는 연출/제작.
 */
export function ToolHomePage(): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="th">
      <div className="th__intro">
        <h2 className="th__heading">연출 · 제작</h2>
        <p className="th__subtitle">회차를 골라 대사 위치·간격·머무름을 연출하고 연속 스크롤로 미리봅니다.</p>
      </div>

      <p className="th__note">⚠️ mock — 회차/컷/대사는 샘플입니다. 실 API(회차 조회·연출 저장)는 추후 연동.</p>

      <div className="th__grid">
        {MOCK_DIR_EPISODES.map((ep) => (
          <button key={ep.id} type="button" className="th-card" onClick={() => navigate(`/episodes/${ep.id}`)}>
            <span className="th-card__content">{ep.contentTitle}</span>
            <span className="th-card__title">
              <span className="th-card__chapter">{ep.chapter}화</span>
              {ep.title}
            </span>
            <span className="th-card__meta">컷 {ep.cuts.length}개</span>
          </button>
        ))}
      </div>
    </div>
  )
}
