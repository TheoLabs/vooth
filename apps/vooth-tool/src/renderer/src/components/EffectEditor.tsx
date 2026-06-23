import {
  ANCHOR_EDGE_LABEL,
  ANCHOR_TYPE_LABEL,
  AnchorEdge,
  AnchorType,
  CUT_EFFECT_COLOR,
  CUT_EFFECT_TYPE_LABEL,
  CutEffectType,
  SOUND_EFFECT_COLOR,
  defaultCutEffectDuration,
  defaultCutEffectParams,
  type Anchor,
  type Cut,
  type CutEffect,
  type Line,
  type SoundEffect
} from '../domain/types'
import { formatAnchor } from '../domain/format'

/**
 * 컷의 효과음(SoundEffect)·시각효과(CutEffect)를 추가/편집/삭제/순서변경 한다.
 * docs/domains/cut/index.html §03 + playback §04. 모두 컷 owned child(공용·앵커).
 *
 * 앵커 편집: type(CUT_START|LINE|SOUND_EFFECT|CUT_EFFECT) + target(같은 컷 형제) +
 * edge(START|END) + offsetMs. 풀 앵커라 효과를 대사 시작/끝에 동기화하거나 겹칠 수 있다.
 * MOCK — 저장은 로컬 state. 실제: directors/cuts/:cutId/sound-effects · cut-effects.
 */

interface EffectEditorProps {
  cut: Cut
  /** 앵커 target picker 용 같은 컷 라인(라벨 위해 캐릭터명 필요). */
  lineLabel: (line: Line) => string
  onChangeSoundEffects: (next: SoundEffect[]) => void
  onChangeCutEffects: (next: CutEffect[]) => void
}

/** 앵커 대상 후보(같은 컷 내 형제 요소). docs: same-cut soft ref. */
interface AnchorTargetOption {
  type: AnchorType
  id: number
  label: string
}

function buildTargetOptions(
  cut: Cut,
  lineLabel: (line: Line) => string,
  selfId: number
): AnchorTargetOption[] {
  const opts: AnchorTargetOption[] = []
  for (const l of [...cut.lines].sort((a, b) => a.position - b.position)) {
    opts.push({ type: AnchorType.LINE, id: l.id, label: `대사: ${lineLabel(l)}` })
  }
  for (const s of [...cut.soundEffects].sort((a, b) => a.order - b.order)) {
    if (s.id === selfId) continue
    opts.push({ type: AnchorType.SOUND_EFFECT, id: s.id, label: `효과음: ${s.label ?? '효과음'}` })
  }
  for (const e of [...cut.cutEffects].sort((a, b) => a.order - b.order)) {
    if (e.id === selfId) continue
    opts.push({ type: AnchorType.CUT_EFFECT, id: e.id, label: `시각효과: ${CUT_EFFECT_TYPE_LABEL[e.type]}` })
  }
  return opts
}

/** 공통 앵커 편집 UI(효과음/시각효과 공유). */
function AnchorControls({
  anchor,
  targets,
  onChange
}: {
  anchor: Anchor | null
  targets: AnchorTargetOption[]
  onChange: (next: Anchor | null) => void
}): React.JSX.Element {
  // null = 기본(CUT_START +0) 으로 표시하되, 토글 시 명시 앵커 생성.
  const effective: Anchor = anchor ?? {
    type: AnchorType.CUT_START,
    targetId: null,
    edge: AnchorEdge.START,
    offsetMs: 0
  }
  const isCutStart = effective.type === AnchorType.CUT_START

  const setType = (type: AnchorType): void => {
    if (type === AnchorType.CUT_START) {
      onChange({ type, targetId: null, edge: AnchorEdge.START, offsetMs: effective.offsetMs })
    } else {
      // 첫 일치 대상 자동 선택.
      const first = targets.find((t) => t.type === type) ?? targets[0]
      onChange({
        type: first ? first.type : type,
        targetId: first ? first.id : null,
        edge: AnchorEdge.END,
        offsetMs: effective.offsetMs
      })
    }
  }

  return (
    <div className="ed-fx-anchor">
      <div className="tool-field">
        <span className="tool-field__label">앵커 기준</span>
        <select
          className="tool-select tool-select--sm"
          value={isCutStart ? AnchorType.CUT_START : 'target'}
          onChange={(e) =>
            setType(e.target.value === AnchorType.CUT_START ? AnchorType.CUT_START : AnchorType.LINE)
          }
        >
          <option value={AnchorType.CUT_START}>{ANCHOR_TYPE_LABEL[AnchorType.CUT_START]}</option>
          <option value="target">다른 요소에 동기화</option>
        </select>
      </div>

      {!isCutStart && (
        <>
          <div className="tool-field">
            <span className="tool-field__label">대상 요소</span>
            <select
              className="tool-select tool-select--sm"
              value={effective.targetId == null ? '' : `${effective.type}:${effective.targetId}`}
              onChange={(e) => {
                const [t, id] = e.target.value.split(':')
                onChange({ ...effective, type: t as AnchorType, targetId: Number(id) })
              }}
            >
              {targets.length === 0 && <option value="">(대상 없음)</option>}
              {targets.map((t) => (
                <option key={`${t.type}:${t.id}`} value={`${t.type}:${t.id}`}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="tool-field">
            <span className="tool-field__label">시점</span>
            <select
              className="tool-select tool-select--sm"
              value={effective.edge}
              onChange={(e) => onChange({ ...effective, edge: e.target.value as AnchorEdge })}
            >
              {Object.values(AnchorEdge).map((ed) => (
                <option key={ed} value={ed}>
                  {ANCHOR_EDGE_LABEL[ed]}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="tool-field">
        <span className="tool-field__label">offset (ms, ±)</span>
        <input
          type="number"
          className="tool-input tool-input--sm"
          step={50}
          value={effective.offsetMs}
          onChange={(e) => onChange({ ...effective, offsetMs: Number(e.target.value) })}
        />
      </div>
    </div>
  )
}

export function EffectEditor({
  cut,
  lineLabel,
  onChangeSoundEffects,
  onChangeCutEffects
}: EffectEditorProps): React.JSX.Element {
  const sfx = [...cut.soundEffects].sort((a, b) => a.order - b.order)
  const fx = [...cut.cutEffects].sort((a, b) => a.order - b.order)

  const targetLabel = (id: number): string => {
    const l = cut.lines.find((x) => x.id === id)
    if (l) return lineLabel(l)
    const s = cut.soundEffects.find((x) => x.id === id)
    if (s) return s.label ?? '효과음'
    const e = cut.cutEffects.find((x) => x.id === id)
    if (e) return CUT_EFFECT_TYPE_LABEL[e.type]
    return `#${id}`
  }

  /* ── SoundEffect 조작 ── */
  const addSfx = (): void => {
    const nextId = Math.max(0, ...cut.soundEffects.map((s) => s.id), ...cut.cutEffects.map((e) => e.id)) + 1
    const order = sfx.length ? Math.max(...sfx.map((s) => s.order)) + 1 : 1
    const created: SoundEffect = {
      id: nextId,
      cutId: cut.id,
      audioFileId: 0,
      audioUrl: 'mock-audio://sfx/new',
      audioDuration: 500,
      label: '새 효과음',
      volume: 1.0,
      anchor: null, // CUT_START +0 기본
      order
    }
    onChangeSoundEffects([...cut.soundEffects, created])
  }
  const patchSfx = (id: number, patch: Partial<SoundEffect>): void =>
    onChangeSoundEffects(cut.soundEffects.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const removeSfx = (id: number): void =>
    onChangeSoundEffects(cut.soundEffects.filter((s) => s.id !== id))
  const moveSfx = (id: number, dir: -1 | 1): void => onChangeSoundEffects(reorder(cut.soundEffects, id, dir))

  /* ── CutEffect 조작 ── */
  const addFx = (): void => {
    const nextId = Math.max(0, ...cut.soundEffects.map((s) => s.id), ...cut.cutEffects.map((e) => e.id)) + 1
    const order = fx.length ? Math.max(...fx.map((e) => e.order)) + 1 : 1
    const type = CutEffectType.SHAKE
    const created: CutEffect = {
      id: nextId,
      cutId: cut.id,
      type,
      params: defaultCutEffectParams(type),
      duration: defaultCutEffectDuration(type),
      anchor: null,
      order
    }
    onChangeCutEffects([...cut.cutEffects, created])
  }
  const patchFx = (id: number, patch: Partial<CutEffect>): void =>
    onChangeCutEffects(cut.cutEffects.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  const removeFx = (id: number): void => onChangeCutEffects(cut.cutEffects.filter((e) => e.id !== id))
  const moveFx = (id: number, dir: -1 | 1): void => onChangeCutEffects(reorder(cut.cutEffects, id, dir))

  return (
    <div className="ed-fx">
      {/* 효과음 */}
      <div className="ed-fx-group">
        <div className="ed-fx-group__head">
          <span className="ed-fx-group__title" style={{ color: SOUND_EFFECT_COLOR }}>
            🔊 효과음 ({sfx.length})
          </span>
          <button className="tool-btn tool-btn--sm" onClick={addSfx}>
            + 효과음 추가
          </button>
        </div>
        {sfx.length === 0 && <div className="ed-fx-empty">효과음 없음</div>}
        {sfx.map((s, i) => {
          const targets = buildTargetOptions(cut, lineLabel, s.id)
          return (
            <div key={s.id} className="ed-fx-item ed-fx-item--sound">
              <div className="ed-fx-item__row">
                <span className="ed-fx-badge" style={{ background: SOUND_EFFECT_COLOR }}>
                  SFX
                </span>
                <input
                  className="tool-input tool-input--sm ed-fx-label"
                  value={s.label ?? ''}
                  placeholder="라벨(두둥!)"
                  onChange={(e) => patchSfx(s.id, { label: e.target.value || null })}
                />
                <div className="ed-fx-order">
                  <button className="tool-btn tool-btn--sm tool-btn--ghost" disabled={i === 0} onClick={() => moveSfx(s.id, -1)} title="위로">
                    ↑
                  </button>
                  <button
                    className="tool-btn tool-btn--sm tool-btn--ghost"
                    disabled={i === sfx.length - 1}
                    onClick={() => moveSfx(s.id, 1)}
                    title="아래로"
                  >
                    ↓
                  </button>
                  <button className="tool-btn tool-btn--sm tool-btn--danger" onClick={() => removeSfx(s.id)} title="삭제">
                    ✕
                  </button>
                </div>
              </div>
              <div className="ed-fx-item__row ed-fx-item__params">
                <div className="tool-field">
                  <span className="tool-field__label">길이 (ms)</span>
                  <input
                    type="number"
                    className="tool-input tool-input--sm"
                    step={50}
                    min={0}
                    value={s.audioDuration}
                    onChange={(e) => patchSfx(s.id, { audioDuration: Number(e.target.value) })}
                  />
                </div>
                <div className="tool-field">
                  <span className="tool-field__label">음량 (0~1)</span>
                  <input
                    type="number"
                    className="tool-input tool-input--sm"
                    step={0.1}
                    min={0}
                    max={1}
                    value={s.volume}
                    onChange={(e) => patchSfx(s.id, { volume: Number(e.target.value) })}
                  />
                </div>
                <AnchorControls
                  anchor={s.anchor}
                  targets={targets}
                  onChange={(next) => patchSfx(s.id, { anchor: next })}
                />
              </div>
              <div className="ed-fx-resolved">앵커: {formatAnchor(s.anchor, targetLabel)}</div>
            </div>
          )
        })}
      </div>

      {/* 시각효과 */}
      <div className="ed-fx-group">
        <div className="ed-fx-group__head">
          <span className="ed-fx-group__title" style={{ color: CUT_EFFECT_COLOR }}>
            ✦ 시각효과 ({fx.length})
          </span>
          <button className="tool-btn tool-btn--sm" onClick={addFx}>
            + 시각효과 추가
          </button>
        </div>
        {fx.length === 0 && <div className="ed-fx-empty">시각효과 없음</div>}
        {fx.map((e, i) => {
          const targets = buildTargetOptions(cut, lineLabel, e.id)
          return (
            <div key={e.id} className="ed-fx-item ed-fx-item--cut">
              <div className="ed-fx-item__row">
                <span className="ed-fx-badge" style={{ background: CUT_EFFECT_COLOR }}>
                  FX
                </span>
                <select
                  className="tool-select tool-select--sm ed-fx-label"
                  value={e.type}
                  onChange={(ev) => {
                    const type = ev.target.value as CutEffectType
                    // 타입 바꾸면 params/duration 도 기본값으로 갱신.
                    patchFx(e.id, {
                      type,
                      params: defaultCutEffectParams(type),
                      duration: defaultCutEffectDuration(type)
                    })
                  }}
                >
                  {Object.values(CutEffectType).map((t) => (
                    <option key={t} value={t}>
                      {CUT_EFFECT_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
                <div className="ed-fx-order">
                  <button className="tool-btn tool-btn--sm tool-btn--ghost" disabled={i === 0} onClick={() => moveFx(e.id, -1)} title="위로">
                    ↑
                  </button>
                  <button
                    className="tool-btn tool-btn--sm tool-btn--ghost"
                    disabled={i === fx.length - 1}
                    onClick={() => moveFx(e.id, 1)}
                    title="아래로"
                  >
                    ↓
                  </button>
                  <button className="tool-btn tool-btn--sm tool-btn--danger" onClick={() => removeFx(e.id)} title="삭제">
                    ✕
                  </button>
                </div>
              </div>
              <div className="ed-fx-item__row ed-fx-item__params">
                <div className="tool-field">
                  <span className="tool-field__label">지속 (ms)</span>
                  <input
                    type="number"
                    className="tool-input tool-input--sm"
                    step={50}
                    min={0}
                    value={e.duration}
                    onChange={(ev) => patchFx(e.id, { duration: Number(ev.target.value) })}
                  />
                </div>
                <FxParams effect={e} onChange={(params) => patchFx(e.id, { params })} />
                <AnchorControls
                  anchor={e.anchor}
                  targets={targets}
                  onChange={(next) => patchFx(e.id, { anchor: next })}
                />
              </div>
              <div className="ed-fx-resolved">앵커: {formatAnchor(e.anchor, targetLabel)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** type 별 params 컨트롤(강도/방향/배율). docs: 효과별 파라미터(json). */
function FxParams({
  effect,
  onChange
}: {
  effect: CutEffect
  onChange: (params: CutEffect['params']) => void
}): React.JSX.Element {
  const p = effect.params ?? {}
  const set = (patch: Partial<NonNullable<CutEffect['params']>>): void => onChange({ ...p, ...patch })

  const hasIntensity =
    effect.type === CutEffectType.SHAKE ||
    effect.type === CutEffectType.FLASH ||
    effect.type === CutEffectType.BLUR
  const hasDirection = effect.type === CutEffectType.SHAKE || effect.type === CutEffectType.PAN
  const hasScale = effect.type === CutEffectType.ZOOM

  return (
    <>
      {hasIntensity && (
        <div className="tool-field">
          <span className="tool-field__label">강도 (0~1)</span>
          <input
            type="number"
            className="tool-input tool-input--sm"
            step={0.1}
            min={0}
            max={1}
            value={p.intensity ?? 0.5}
            onChange={(e) => set({ intensity: Number(e.target.value) })}
          />
        </div>
      )}
      {hasScale && (
        <div className="tool-field">
          <span className="tool-field__label">배율 (scale)</span>
          <input
            type="number"
            className="tool-input tool-input--sm"
            step={0.05}
            min={0.1}
            value={p.scale ?? 1.2}
            onChange={(e) => set({ scale: Number(e.target.value) })}
          />
        </div>
      )}
      {hasDirection && (
        <div className="tool-field">
          <span className="tool-field__label">방향</span>
          <select
            className="tool-select tool-select--sm"
            value={p.direction ?? (effect.type === CutEffectType.SHAKE ? 'horizontal' : 'right')}
            onChange={(e) => set({ direction: e.target.value as NonNullable<CutEffect['params']>['direction'] })}
          >
            {effect.type === CutEffectType.SHAKE ? (
              <>
                <option value="horizontal">수평</option>
                <option value="vertical">수직</option>
              </>
            ) : (
              <>
                <option value="left">←</option>
                <option value="right">→</option>
                <option value="up">↑</option>
                <option value="down">↓</option>
              </>
            )}
          </select>
        </div>
      )}
      {!hasIntensity && !hasScale && !hasDirection && (
        <div className="ed-fx-noparam">파라미터 없음</div>
      )}
    </>
  )
}

/** order 기준 인접 교환 후 order 재부여(공용). */
function reorder<T extends { id: number; order: number }>(items: T[], id: number, dir: -1 | 1): T[] {
  const sorted = [...items].sort((a, b) => a.order - b.order)
  const idx = sorted.findIndex((x) => x.id === id)
  const swap = idx + dir
  if (idx < 0 || swap < 0 || swap >= sorted.length) return items
  ;[sorted[idx], sorted[swap]] = [sorted[swap], sorted[idx]]
  return sorted.map((x, i) => ({ ...x, order: i + 1 }))
}
