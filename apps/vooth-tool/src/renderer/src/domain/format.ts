import {
  ANCHOR_EDGE_LABEL,
  ANCHOR_TYPE_LABEL,
  AnchorType,
  EpisodeStatus,
  RecordingStatus,
  RenderStatus,
  type Anchor
} from './types'

/** UTC ISO → 로컬 타임존 표시(YYYY.MM.DD HH:mm). docs/CLAUDE 타임스탬프 룰. */
export function formatLocalDateTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** ms → "1.2초" 형태. */
export function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}초`
}

/** gapBeforeMs 표시(음수=겹침). */
export function formatGap(ms: number): string {
  if (ms === 0) return '0ms'
  return ms < 0 ? `겹침 ${Math.abs(ms)}ms` : `+${ms}ms`
}

/** offsetMs 부호 표시("+200" / "−100" / "0"). */
export function formatOffset(ms: number): string {
  if (ms === 0) return '+0'
  return ms < 0 ? `−${Math.abs(ms)}` : `+${ms}`
}

/**
 * 앵커를 사람이 읽는 문구로. null = 기본(순차/CUT_START).
 * 대상 id → 라벨 매핑은 호출부에서 주입(없으면 #id).
 */
export function formatAnchor(anchor: Anchor | null, targetLabel?: (id: number) => string): string {
  if (!anchor) return '기본(순차)'
  if (anchor.type === AnchorType.CUT_START) {
    return `컷 시작 ${formatOffset(anchor.offsetMs)}ms`
  }
  const tgt =
    anchor.targetId == null
      ? ANCHOR_TYPE_LABEL[anchor.type]
      : (targetLabel?.(anchor.targetId) ?? `#${anchor.targetId}`)
  return `${tgt}.${ANCHOR_EDGE_LABEL[anchor.edge]} ${formatOffset(anchor.offsetMs)}ms`
}

/* ──────────────────────────── 상태 배지 색상 ──────────────────────────── */

interface BadgeStyle {
  color: string
  background: string
}

export const EPISODE_STATUS_BADGE: Record<EpisodeStatus, BadgeStyle> = {
  [EpisodeStatus.DRAFT]: { color: '#475569', background: '#e2e8f0' },
  [EpisodeStatus.READY]: { color: '#0369a1', background: '#e0f2fe' },
  [EpisodeStatus.RECORDING]: { color: '#9a3412', background: '#ffedd5' },
  [EpisodeStatus.REVIEWING]: { color: '#7c3aed', background: '#ede9fe' },
  [EpisodeStatus.APPROVED]: { color: '#15803d', background: '#dcfce7' },
  [EpisodeStatus.SCHEDULED]: { color: '#a16207', background: '#fef9c3' },
  [EpisodeStatus.PUBLISHED]: { color: '#1d4ed8', background: '#dbeafe' }
}

export const RECORDING_STATUS_BADGE: Record<RecordingStatus, BadgeStyle> = {
  [RecordingStatus.RECORDED]: { color: '#475569', background: '#e2e8f0' },
  [RecordingStatus.REVIEW]: { color: '#7c3aed', background: '#ede9fe' },
  [RecordingStatus.APPROVED]: { color: '#15803d', background: '#dcfce7' },
  [RecordingStatus.REJECTED]: { color: '#b91c1c', background: '#fee2e2' }
}

export const RENDER_STATUS_BADGE: Record<RenderStatus, BadgeStyle> = {
  [RenderStatus.QUEUED]: { color: '#475569', background: '#e2e8f0' },
  [RenderStatus.RENDERING]: { color: '#9a3412', background: '#ffedd5' },
  [RenderStatus.DONE]: { color: '#15803d', background: '#dcfce7' },
  [RenderStatus.FAILED]: { color: '#b91c1c', background: '#fee2e2' }
}
