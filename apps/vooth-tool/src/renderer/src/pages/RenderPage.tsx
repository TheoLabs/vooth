import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMockEpisode } from '../mocks/director.mock'
import './RenderPage.css'

type RenderStatus = 'idle' | 'rendering' | 'done'

/**
 * 렌더/제작 화면(mock) — 검수 승인본의 캐스트로 영상 렌더·업로드.
 * 실제 렌더는 Electron 로컬(Remotion/ffmpeg) 다음 단계. 여기선 UI/UX + 진행 시뮬레이션.
 */
export function RenderPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const ep = useMemo(() => getMockEpisode(Number(id)), [id])

  // 승인 캐스트 요약(mock): 캐릭터별 첫 후보 성우.
  const cast = useMemo(() => {
    if (!ep) return [] as { character: string; creator: string }[]
    const nameById = new Map(ep.characters.map((c) => [c.id, c.name]))
    const byChar = new Map<number, string>()
    for (const cut of ep.cuts) {
      for (const l of cut.lines) {
        if (!byChar.has(l.characterId) && l.takes[0]) byChar.set(l.characterId, l.takes[0].creatorName)
      }
    }
    return [...byChar.entries()].map(([cid, creator]) => ({ character: nameById.get(cid) ?? `캐릭터 #${cid}`, creator }))
  }, [ep])

  const [status, setStatus] = useState<RenderStatus>('idle')
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<number | null>(null)
  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current) }, [])

  const startRender = (): void => {
    setStatus('rendering')
    setProgress(0)
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        const next = p + 4
        if (next >= 100) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          setStatus('done')
          return 100
        }
        return next
      })
    }, 120)
  }

  if (!ep) {
    return (
      <div className="rd-empty">
        <p>회차를 찾을 수 없습니다.</p>
        <button type="button" onClick={() => navigate('/render')}>
          렌더 목록으로
        </button>
      </div>
    )
  }

  return (
    <div className="rd">
      <header className="rd__header">
        <button type="button" className="rd__back" onClick={() => navigate('/render')}>
          ← 렌더 목록
        </button>
        <span className="rd__content">{ep.contentTitle}</span>
        <h2 className="rd__title">
          <span className="rd__chapter">{ep.chapter}화</span>
          {ep.title}
          <span className="rd__approved">검수 승인됨</span>
        </h2>
      </header>

      <div className="rd__cols">
        <section className="rd-card">
          <span className="rd-card__title">캐스트(출력)</span>
          <ul className="rd-cast">
            {cast.map((c) => (
              <li key={c.character} className="rd-cast__row">
                <span className="rd-cast__char">{c.character}</span>
                <span className="rd-cast__creator">{c.creator}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rd-card">
          <span className="rd-card__title">출력 설정</span>
          <dl className="rd-spec">
            <div><dt>해상도</dt><dd>720 × 1280 (세로)</dd></div>
            <div><dt>프레임</dt><dd>30 fps</dd></div>
            <div><dt>형식</dt><dd>MP4 (H.264 + AAC)</dd></div>
            <div><dt>컷 · 대사</dt><dd>{ep.cuts.length}컷 · {ep.cuts.reduce((s, c) => s + c.lines.length, 0)}대사</dd></div>
          </dl>
        </section>
      </div>

      <section className="rd-render">
        {status === 'idle' && (
          <button type="button" className="rd-render__start" onClick={startRender}>
            ⬇ 렌더 시작
          </button>
        )}
        {status === 'rendering' && (
          <div className="rd-render__progress">
            <div className="rd-render__bar">
              <div className="rd-render__bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="rd-render__pct">렌더 중… {progress}%</span>
          </div>
        )}
        {status === 'done' && (
          <div className="rd-render__done">
            <span className="rd-render__ok">✓ 렌더 완료</span>
            <button type="button" className="rd-render__btn" disabled title="업로드 연동 예정">
              다운로드
            </button>
            <button type="button" className="rd-render__btn" disabled title="업로드 연동 예정">
              업로드
            </button>
            <button type="button" className="rd-render__again" onClick={() => setStatus('idle')}>
              다시 렌더
            </button>
          </div>
        )}
      </section>

      <p className="rd__note">
        ⚠️ mock — 실제 렌더는 Electron 로컬(Remotion으로 연속 스크롤 컴포지션 → mp4)로 구현 예정. 진행률은 시뮬레이션.
      </p>
    </div>
  )
}
