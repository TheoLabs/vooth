import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MOCK_CASTS, MOCK_EPISODES, getEpisodeDetail } from '../domain/mockData'
import {
  RENDER_STATUS_LABEL,
  RenderStatus,
  type RenderJob,
  type RenderParams,
  type ScrollMode
} from '../domain/types'
import { buildTimeline } from '../domain/timeline'
import { Badge } from '../components/Badge'
import { MockNote } from '../components/MockNote'
import { RENDER_STATUS_BADGE, formatLocalDateTime, formatMs } from '../domain/format'
import './tool.css'

let jobSeq = 1

/**
 * 렌더 페이지. docs §15.4~15.5.
 * 옵션(폭/fps/scrollMode/뷰포트/캐스트) 선택 → "렌더 시작" → mock 잡 진행
 * (QUEUED → RENDERING → DONE) + 결과 placeholder. 실제로는 RenderRequested 이벤트.
 */
export function RenderPage(): React.JSX.Element {
  const { episodeId } = useParams()
  const [selectedEpisode, setSelectedEpisode] = useState<number>(
    episodeId ? Number(episodeId) : MOCK_EPISODES[0].id
  )

  const [params, setParams] = useState<RenderParams>({
    width: 1080,
    fps: 30,
    scrollMode: 'continuous',
    viewportRatio: 1.6,
    castCreatorId: MOCK_CASTS[0].creatorId
  })

  const [jobs, setJobs] = useState<RenderJob[]>([])
  const timers = useRef<ReturnType<typeof setInterval>[]>([])

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearInterval(t))
    }
  }, [])

  const startRender = (): void => {
    const detail = getEpisodeDetail(selectedEpisode)
    const tl = buildTimeline(detail.cuts)
    const job: RenderJob = {
      id: jobSeq++,
      episodeId: selectedEpisode,
      status: RenderStatus.QUEUED,
      params: { ...params },
      progress: 0,
      createdAt: new Date().toISOString()
    }
    setJobs((prev) => [job, ...prev])

    // mock 진행: QUEUED → RENDERING(진행률) → DONE
    let progress = 0
    const interval = setInterval(() => {
      progress += 7 + Math.random() * 12
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== job.id) return j
          if (progress >= 100) {
            clearInterval(interval)
            return {
              ...j,
              status: RenderStatus.DONE,
              progress: 100,
              outputUrl: `mock://render/${job.id}/output.mp4`,
              durationMs: tl.totalMs
            }
          }
          return {
            ...j,
            status: RenderStatus.RENDERING,
            progress: Math.round(progress)
          }
        })
      )
    }, 500)
    timers.current.push(interval)
  }

  const setParam = <K extends keyof RenderParams>(k: K, v: RenderParams[K]): void =>
    setParams((p) => ({ ...p, [k]: v }))

  return (
    <div className="tool-page">
      <div className="tool-page__head">
        <div>
          <h2 className="tool-page__title">렌더</h2>
          <p className="tool-page__desc">
            연출 결과를 영상(mp4)으로 굽습니다. 실제 인코딩은 별도 서비스가 수행(여기선 mock 진행).
          </p>
        </div>
        <MockNote text="MOCK 렌더 — RenderRequested 이벤트 미배선" />
      </div>

      <div className="tool-card">
        <strong style={{ fontSize: 13 }}>렌더 옵션</strong>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
            marginTop: 14
          }}
        >
          <div className="tool-field">
            <span className="tool-field__label">회차</span>
            <select
              className="tool-select"
              value={selectedEpisode}
              onChange={(e) => setSelectedEpisode(Number(e.target.value))}
            >
              {MOCK_EPISODES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.contentTitle} {e.episodeNo}화 · {e.title}
                </option>
              ))}
            </select>
          </div>
          <div className="tool-field">
            <span className="tool-field__label">캐스트(성우)</span>
            <select
              className="tool-select"
              value={params.castCreatorId}
              onChange={(e) => setParam('castCreatorId', Number(e.target.value))}
            >
              {MOCK_CASTS.map((c) => (
                <option key={c.creatorId} value={c.creatorId}>
                  {c.creatorName}
                </option>
              ))}
            </select>
          </div>
          <div className="tool-field">
            <span className="tool-field__label">폭(px)</span>
            <select
              className="tool-select"
              value={params.width}
              onChange={(e) => setParam('width', Number(e.target.value))}
            >
              {[720, 1080, 1440].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div className="tool-field">
            <span className="tool-field__label">fps</span>
            <select
              className="tool-select"
              value={params.fps}
              onChange={(e) => setParam('fps', Number(e.target.value))}
            >
              {[24, 30, 60].map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="tool-field">
            <span className="tool-field__label">스크롤 모드</span>
            <select
              className="tool-select"
              value={params.scrollMode}
              onChange={(e) => setParam('scrollMode', e.target.value as ScrollMode)}
            >
              <option value="continuous">연속 스크롤</option>
              <option value="slide">슬라이드(컷 전환)</option>
            </select>
          </div>
          <div className="tool-field">
            <span className="tool-field__label">뷰포트 비율(세로/가로)</span>
            <input
              type="number"
              className="tool-input"
              step={0.1}
              min={0.5}
              value={params.viewportRatio}
              onChange={(e) => setParam('viewportRatio', Number(e.target.value))}
            />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="tool-btn tool-btn--primary" onClick={startRender}>
            렌더 시작
          </button>
        </div>
      </div>

      <div className="tool-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px' }}>
          <strong style={{ fontSize: 13 }}>렌더 잡</strong>
        </div>
        <table className="tool-table">
          <thead>
            <tr>
              <th>잡 #</th>
              <th>회차</th>
              <th>옵션</th>
              <th>상태</th>
              <th>진행</th>
              <th>결과</th>
              <th>요청 시각</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const ep = MOCK_EPISODES.find((e) => e.id === j.episodeId)
              const cast = MOCK_CASTS.find((c) => c.creatorId === j.params.castCreatorId)
              const badge = RENDER_STATUS_BADGE[j.status]
              return (
                <tr key={j.id}>
                  <td style={{ fontWeight: 700 }}>#{j.id}</td>
                  <td>
                    {ep ? `${ep.contentTitle} ${ep.episodeNo}화` : j.episodeId}
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{cast?.creatorName}</div>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    {j.params.width}px · {j.params.fps}fps ·{' '}
                    {j.params.scrollMode === 'continuous' ? '연속' : '슬라이드'}
                  </td>
                  <td>
                    <Badge label={RENDER_STATUS_LABEL[j.status]} {...badge} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="tool-progress tool-progress--mini">
                        <span className="tool-progress__fill" style={{ width: `${j.progress}%` }} />
                      </span>
                      <span style={{ fontSize: 12, color: '#475569' }}>{j.progress}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {j.status === RenderStatus.DONE ? (
                      <button
                        className="tool-btn tool-btn--sm"
                        onClick={() => window.alert(`결과(mock): ${j.outputUrl}`)}
                      >
                        ▶ {j.durationMs ? formatMs(j.durationMs) : 'mp4'}
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>
                    {formatLocalDateTime(j.createdAt)}
                  </td>
                </tr>
              )
            })}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
                  아직 렌더 잡이 없습니다. 옵션을 선택하고 “렌더 시작”을 눌러주세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
