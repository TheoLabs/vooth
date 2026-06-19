import { EpisodeStatus, RecordingStatus, RenderStatus } from './types'

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
